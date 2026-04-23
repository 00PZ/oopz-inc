---
name: k8s-deploy
description: Kubernetes deployment patterns for the stack company. Manifests, Helm, rollout, rollback, resource sizing, and common production gotchas.
---

## Purpose

This skill covers deploying workloads to Kubernetes clusters. It applies to any conformant cluster regardless of cloud provider. Use it when writing or reviewing Deployment manifests, configuring rollout strategies, sizing resources, or debugging pod failures.

## Manifest Kinds

| Kind | Role |
|------|------|
| `Deployment` | Manages a ReplicaSet; drives rolling updates and rollbacks |
| `Service` | Stable DNS name and load-balancing across pod replicas |
| `Ingress` | Routes external HTTP/HTTPS traffic to Services |
| `ConfigMap` | Non-sensitive configuration injected as env vars or volume mounts |
| `Secret` | Sensitive data (credentials, tokens); base64-encoded, not encrypted by default |
| `HorizontalPodAutoscaler` | Scales replica count based on CPU, memory, or custom metrics |
| `PodDisruptionBudget` | Guarantees minimum available replicas during voluntary disruptions |

## Minimal Deployment

A working Deployment + Service pair. Replace `<org>`, `<app>`, and `<sha>` with real values.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: <app>
  namespace: default
  annotations:
    deploy/sha: "<sha>"
    deploy/timestamp: "2026-04-23T00:00:00Z"
spec:
  replicas: 2
  selector:
    matchLabels:
      app: <app>
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    metadata:
      labels:
        app: <app>
    spec:
      containers:
        - name: <app>
          image: ghcr.io/<org>/<app>:<sha>
          ports:
            - containerPort: 8080
          envFrom:
            - configMapRef:
                name: <app>-config
          resources:
            requests:
              cpu: "100m"
              memory: "128Mi"
            limits:
              cpu: "500m"
              memory: "256Mi"
          readinessProbe:
            httpGet:
              path: /healthz
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /healthz
              port: 8080
            initialDelaySeconds: 15
            periodSeconds: 20
            failureThreshold: 3
---
apiVersion: v1
kind: Service
metadata:
  name: <app>
  namespace: default
spec:
  selector:
    app: <app>
  ports:
    - port: 80
      targetPort: 8080
  type: ClusterIP
```

## Rollout

```bash
kubectl rollout status deployment/<app> -n <namespace>
```

Blocks until the rollout completes or times out. Use in CI to gate the deploy step.

**Strategies:**

| Strategy | Behaviour | When to use |
|----------|-----------|-------------|
| `RollingUpdate` | Replaces pods incrementally | Default; zero-downtime for stateless apps |
| `Recreate` | Kills all pods, then starts new ones | Required when two versions cannot run simultaneously (e.g., DB schema migrations) |

**`maxSurge` and `maxUnavailable`:**

- `maxSurge: 1` allows one extra pod above `replicas` during the update.
- `maxUnavailable: 0` ensures no pod goes down before a replacement is ready.
- For high-traffic services, prefer `maxUnavailable: 0` to avoid dropped requests.

**Undo a rollout:**

```bash
kubectl rollout undo deployment/<app> -n <namespace>
```

This reverts to the previous ReplicaSet. Kubernetes keeps a configurable history (`revisionHistoryLimit`, default 10).

## Resource Requests + Limits

Always set both `requests` and `limits`. Omitting either causes problems.

```yaml
resources:
  requests:
    cpu: "100m"      # 0.1 vCPU guaranteed
    memory: "128Mi"
  limits:
    cpu: "500m"      # burst ceiling
    memory: "256Mi"
```

**OOMKilled diagnosis:** `kubectl describe pod <pod-name> -n <namespace>` shows `Last State: OOMKilled` (exit code 137). Increase `memory.limits` or find the leak.

**QoS classes:**

- `Guaranteed`: requests == limits. Most stable; scheduled on best nodes.
- `Burstable`: requests < limits. Evicted before Guaranteed under pressure.
- `BestEffort`: no requests/limits. Evicted first. Never use in production.

Set requests == limits for critical workloads to get `Guaranteed` QoS.

## Probes

Three probe types, each serving a different purpose:

| Probe | Failure action | Purpose |
|-------|---------------|---------|
| `readinessProbe` | Remove pod from Service endpoints | App not ready to serve traffic yet |
| `livenessProbe` | Restart the container | App is stuck and cannot recover |
| `startupProbe` | Restart the container | Slow-starting apps; disables liveness until startup succeeds |

**Key fields:**

```yaml
readinessProbe:
  httpGet:
    path: /ready
    port: 8080
  initialDelaySeconds: 5   # wait before first check
  periodSeconds: 10
  failureThreshold: 3      # fail 3 times before marking unready

livenessProbe:
  httpGet:
    path: /healthz
    port: 8080
  initialDelaySeconds: 15  # must be > startup time
  periodSeconds: 20
  failureThreshold: 3

startupProbe:
  httpGet:
    path: /healthz
    port: 8080
  failureThreshold: 30     # 30 * periodSeconds = max startup window
  periodSeconds: 10
```

**The liveness trap:** A liveness probe that hits a slow endpoint (database query, external call) will restart healthy pods under load. Point liveness at a trivial in-process check only. Reserve the heavier check for readiness.

## Secrets

Never put real secret values in committed YAML. The base64 in a `Secret` manifest is not encryption.

**Preferred approaches:**

1. **External Secrets Operator** pulls secrets from a vault (Vault, AWS Secrets Manager, etc.) and creates `Secret` objects in-cluster. The manifest only references the external path.

```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: <app>-db-creds
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: vault-backend
    kind: ClusterSecretStore
  target:
    name: <app>-db-creds
  data:
    - secretKey: DATABASE_URL
      remoteRef:
        key: secret/data/<app>/db
        property: url
```

2. **Sealed Secrets** encrypts the `Secret` with a cluster-specific key so the sealed YAML is safe to commit.

```bash
kubeseal --format yaml < secret.yaml > sealed-secret.yaml
# Commit sealed-secret.yaml. Never commit secret.yaml.
```

Reference a secret in a pod:

```yaml
env:
  - name: DATABASE_URL
    valueFrom:
      secretKeyRef:
        name: <app>-db-creds
        key: DATABASE_URL
```

## Ingress + Service Discovery

**Internal traffic** between pods uses the cluster DNS pattern:

```
<service>.<namespace>.svc.cluster.local
```

Short form `<service>` works within the same namespace.

**External traffic** needs an Ingress resource and a running ingress controller (nginx, Traefik, etc.).

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: <app>
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  ingressClassName: nginx
  rules:
    - host: app.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: <app>
                port:
                  number: 80
  tls:
    - hosts:
        - app.example.com
      secretName: <app>-tls
```

**Tailscale integration:** For internal-only services, pair with the `tailscale-network` skill. The Tailscale operator can expose a `Service` directly on the tailnet without a public ingress controller. Set `type: LoadBalancer` and annotate with `tailscale.com/expose: "true"`.

## Rollback

Two approaches depending on the situation:

**`kubectl rollout undo` (fast, in-cluster):**

```bash
kubectl rollout history deployment/<app> -n <namespace>
kubectl rollout undo deployment/<app> -n <namespace>
kubectl rollout undo deployment/<app> --to-revision=3 -n <namespace>
```

Use when the previous image is still valid and you need to recover immediately.

**Re-deploy a previous image tag (preferred for traceability):**

```bash
kubectl set image deployment/<app> <app>=ghcr.io/<org>/<app>:<previous-sha> -n <namespace>
```

Or trigger CI with the previous SHA. This creates a new rollout entry and keeps the audit trail clean.

| Situation | Approach |
|-----------|---------|
| Production incident, need recovery in seconds | `rollout undo` |
| Planned revert with audit trail | Re-deploy previous tag via CI |
| Config change caused the failure | Update ConfigMap/Secret, then `rollout restart` |

```bash
kubectl rollout restart deployment/<app> -n <namespace>
```
