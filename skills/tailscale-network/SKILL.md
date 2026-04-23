---
name: tailscale-network
description: Tailscale patterns for the stack company. Covers MagicDNS, ACL design, tagged service accounts, exit nodes, and connecting Kubernetes services across a private tailnet.
---

## Purpose

This skill covers how to connect services, machines, and CI jobs across a private tailnet. Use it when you need to expose internal services without a public IP, route traffic between Kubernetes clusters, or give CI jobs temporary access to production infrastructure.

## Identity Model

Tailscale has two identity types: users and tagged devices.

**Users** authenticate via SSO (Google, GitHub, etc.) and get personal devices. Avoid using personal user identities for automated workloads.

**Tagged devices** are service accounts. They authenticate with OAuth clients and carry tags instead of user identities. Tags are the right model for servers, CI runners, and Kubernetes operators.

Standard tags for this stack:

| Tag | Purpose |
|-----|---------|
| `tag:prod` | Production servers and services |
| `tag:dev` | Development and staging machines |
| `tag:ci` | Ephemeral CI nodes (GitHub Actions, etc.) |
| `tag:k8s-operator` | Tailscale Operator running in Kubernetes |
| `tag:subnet-router` | Nodes advertising subnet routes |

Principle of least privilege: a `tag:ci` node should only reach what CI jobs actually need, not the full tailnet.

## ACL Design

ACLs live in the Tailscale admin console under "Access Controls". Write them as HuJSON (JSON with comments).

Minimal example for this stack:

```json
{
  "tagOwners": {
    "tag:prod":          ["autogroup:admin"],
    "tag:dev":           ["autogroup:admin"],
    "tag:ci":            ["autogroup:admin"],
    "tag:k8s-operator":  ["autogroup:admin"],
    "tag:subnet-router": ["autogroup:admin"]
  },

  "acls": [
    // Admins reach everything
    {
      "action": "accept",
      "src":    ["autogroup:admin"],
      "dst":    ["*:*"]
    },
    // Prod services talk to each other
    {
      "action": "accept",
      "src":    ["tag:prod"],
      "dst":    ["tag:prod:*"]
    },
    // Dev can reach dev and prod read-only ports
    {
      "action": "accept",
      "src":    ["tag:dev"],
      "dst":    ["tag:dev:*", "tag:prod:443", "tag:prod:8080"]
    },
    // CI can reach specific internal services only
    {
      "action": "accept",
      "src":    ["tag:ci"],
      "dst":    ["tag:prod:5432", "tag:prod:6379"]
    }
  ],

  "ssh": [
    // Admins can SSH into any tagged device
    {
      "action": "accept",
      "src":    ["autogroup:admin"],
      "dst":    ["tag:prod", "tag:dev"],
      "users":  ["autogroup:nonroot"]
    }
  ]
}
```

Keep ACL rules narrow. Add a comment on each rule explaining why it exists. Run `tailscale check --remote` in CI to validate ACL changes before merging.

## MagicDNS

MagicDNS gives every tailnet device a stable hostname. Format: `<device>.<tailnet>.ts.net`.

Enable it in the admin console under DNS. Once on, devices resolve each other by short name within the tailnet (e.g., `postgres-prod` instead of a raw IP).

**Auto-generated TLS certs**: Tailscale can provision HTTPS certs for MagicDNS names. Enable "HTTPS Certificates" in the admin console, then on the device:

```bash
tailscale cert <device>.<tailnet>.ts.net
```

This writes a cert and key to `/var/lib/tailscale/certs/`. Wire your service to use them for internal HTTPS without a public CA.

**Split DNS**: For internal domains (e.g., `internal.example.com`), configure a nameserver in the Tailscale DNS settings. Devices on the tailnet resolve that domain via your internal DNS; everything else goes to the default resolver.

```json
// In Tailscale DNS settings
{
  "routes": {
    "internal.example.com": ["10.0.0.53"]
  }
}
```

## Kubernetes Integration

The Tailscale Operator runs inside a Kubernetes cluster and manages tailnet membership for Services and StatefulSets.

**Install the operator:**

```bash
helm repo add tailscale https://pkgs.tailscale.com/helmcharts
helm repo update

helm install tailscale-operator tailscale/tailscale-operator \
  --namespace tailscale-operator \
  --create-namespace \
  --set oauth.clientId=<CLIENT_ID> \
  --set oauth.clientSecret=<CLIENT_SECRET>
```

The operator authenticates with an OAuth client tagged `tag:k8s-operator`.

**Expose a Service on the tailnet:**

```yaml
apiVersion: v1
kind: Service
metadata:
  name: postgres
  annotations:
    tailscale.com/expose: "true"
    tailscale.com/hostname: "postgres-prod"
    tailscale.com/tags: "tag:prod"
spec:
  selector:
    app: postgres
  ports:
    - port: 5432
```

The operator creates a tailnet device named `postgres-prod`. Other tailnet members reach it at `postgres-prod.<tailnet>.ts.net:5432` without any public exposure.

**Subnet router fallback**: If the operator isn't available, run a subnet router pod that advertises the cluster's pod CIDR:

```bash
tailscale up \
  --advertise-routes=10.244.0.0/16 \
  --accept-dns=false \
  --hostname=k8s-subnet-router
```

Approve the advertised routes in the admin console under "Machines".

## Exit Nodes + Subnet Routers

These are different tools for different problems.

**Subnet router**: Advertises a CIDR range (e.g., a VPC or cluster network) to the tailnet. Other devices route traffic to that range through the router. Use this to reach services that aren't running Tailscale themselves.

**Exit node**: Routes all internet traffic from a device through another tailnet node. Use this for egress control (e.g., all CI traffic exits through a fixed IP).

**Setting up a subnet router:**

```bash
# On the router node, enable IP forwarding
echo 'net.ipv4.ip_forward = 1' | sudo tee -a /etc/sysctl.d/99-tailscale.conf
echo 'net.ipv6.conf.all.forwarding = 1' | sudo tee -a /etc/sysctl.d/99-tailscale.conf
sudo sysctl -p /etc/sysctl.d/99-tailscale.conf

# Advertise routes
tailscale up --advertise-routes=192.168.1.0/24
```

Then approve the routes in the admin console. Unapproved routes are ignored.

**Setting up an exit node:**

```bash
tailscale up --advertise-exit-node
```

Clients opt in explicitly:

```bash
tailscale up --exit-node=<exit-node-hostname>
```

## SSH Over Tailscale

Tailscale SSH replaces traditional SSH key management for tailnet devices. Authentication goes through the tailnet identity; no long-lived SSH keys needed.

Enable on a device:

```bash
tailscale up --ssh
```

Connect from any tailnet member:

```bash
tailscale ssh user@<device>
```

The ACL `ssh` block controls who can SSH where (see the ACL Design section above).

**Disable port 22** on servers that use Tailscale SSH exclusively:

```bash
# In /etc/ssh/sshd_config
Port 0   # or remove the sshd service entirely
```

Or use a firewall rule to block port 22 from non-tailnet interfaces while keeping Tailscale SSH working through the tailnet interface (`tailscale0`).

## CI + GitHub Actions

Use the `tailscale/github-action` to connect ephemeral CI nodes to the tailnet. The node gets a `tag:ci` identity and is removed when the job ends.

**Prerequisites**: Create an OAuth client in the Tailscale admin console with the `tag:ci` tag. Store `TAILSCALE_OAUTH_CLIENT_ID` and `TAILSCALE_OAUTH_CLIENT_SECRET` as GitHub Actions secrets.

```yaml
jobs:
  integration-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Connect to tailnet
        uses: tailscale/github-action@v2
        with:
          oauth-client-id: ${{ secrets.TAILSCALE_OAUTH_CLIENT_ID }}
          oauth-secret: ${{ secrets.TAILSCALE_OAUTH_CLIENT_SECRET }}
          tags: tag:ci
          ephemeral: true

      - name: Run tests against internal DB
        run: |
          # postgres-prod is now reachable via MagicDNS
          psql "postgresql://user@postgres-prod:5432/testdb" -c "SELECT 1"
```

The `ephemeral: true` flag ensures the node is removed from the tailnet when the job finishes. No cleanup step needed.

Scope the `tag:ci` ACL rules to only the ports CI actually needs (see ACL Design above).

## Hardening

**Key expiry**: By default, device keys expire after 180 days. For tagged service accounts (servers, operators), disable expiry in the admin console or via the API. For user devices, keep expiry on.

**Device approval gate**: Enable "Device approval" in the admin console. New devices must be approved before joining the tailnet. This prevents rogue nodes from connecting.

**ACL tests**: Add `tests:` blocks to your ACL file to assert expected behavior:

```json
{
  "tests": [
    {
      "src":    "tag:ci",
      "dst":    "tag:prod:5432",
      "expect": "accept"
    },
    {
      "src":    "tag:ci",
      "dst":    "tag:prod:22",
      "expect": "deny"
    }
  ]
}
```

Run `tailscale check --remote` in CI to validate ACL changes before they reach production.

**Audit logs**: Tailscale logs all network events. Export them to your SIEM via the Tailscale Logging API or the admin console's log streaming feature.

**Rotate OAuth secrets** when team members leave. OAuth clients are scoped to tags, so rotating one client doesn't affect others.
