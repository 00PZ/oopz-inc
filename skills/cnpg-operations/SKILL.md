---
name: cnpg-operations
description: CloudNativePG (CNPG) cluster operations. Covers cluster provisioning, backups, point-in-time recovery, failover, role and schema management, and connection patterns.
---

## Purpose

Operate PostgreSQL clusters on Kubernetes using CloudNativePG. This skill covers the full lifecycle: provisioning, backup, recovery, failover, schema management, migrations, and observability.

All operations assume the `cnpg` kubectl plugin is installed and the CNPG operator is running in the cluster.

---

## Cluster CR

Minimal `Cluster` manifest. Adjust `instances`, `storage.size`, and `initdb` to match the workload.

```yaml
apiVersion: postgresql.cnpg.io/v1
kind: Cluster
metadata:
  name: app-db
  namespace: database
spec:
  instances: 3
  storage:
    size: 20Gi
  bootstrap:
    initdb:
      database: app
      owner: app_user
      secret:
        name: app-db-credentials
  postgresql:
    parameters:
      max_connections: "200"
      shared_buffers: "256MB"
```

Key fields:
- `spec.instances`: total pods (1 primary + N-1 replicas). Use 3 for HA.
- `spec.storage.size`: PVC size per instance. Cannot shrink.
- `spec.bootstrap.initdb.database`: database created on first boot.
- `spec.bootstrap.initdb.owner`: role that owns the database.

Check cluster status:

```bash
kubectl cnpg status app-db -n database
kubectl describe cluster app-db -n database
```

---

## Backups

CNPG uses Barman for continuous WAL archiving and base backups. Both are required for point-in-time recovery.

Add `spec.backup` to the `Cluster` CR:

```yaml
spec:
  backup:
    barmanObjectStore:
      destinationPath: s3://my-bucket/cnpg/app-db
      endpointURL: https://s3.us-east-1.amazonaws.com
      s3Credentials:
        accessKeyId:
          name: backup-creds
          key: ACCESS_KEY_ID
        secretAccessKey:
          name: backup-creds
          key: SECRET_ACCESS_KEY
      wal:
        compression: gzip
      data:
        compression: gzip
    retentionPolicy: "30d"
```

Schedule recurring base backups with a `ScheduledBackup` CR:

```yaml
apiVersion: postgresql.cnpg.io/v1
kind: ScheduledBackup
metadata:
  name: app-db-daily
  namespace: database
spec:
  schedule: "0 2 * * *"
  cluster:
    name: app-db
  backupOwnerReference: self
```

What gets backed up:
- **Base backup**: full data directory snapshot, stored in object storage.
- **WAL segments**: streamed continuously. Required to replay changes between base backups.

```bash
kubectl cnpg backup app-db -n database   # manual trigger
kubectl get backup -n database           # list backups
```

---

## Point-In-Time Recovery

PITR restores a cluster to a specific moment. Use it after accidental data deletion or a bad migration.

Create a new `Cluster` that bootstraps from a backup:

```yaml
spec:
  instances: 1
  storage:
    size: 20Gi
  bootstrap:
    recovery:
      backup:
        name: app-db-backup-20260423
      recoveryTarget:
        targetTime: "2026-04-23 14:30:00"
  externalClusters:
    - name: app-db-backup-20260423
      barmanObjectStore:
        destinationPath: s3://my-bucket/cnpg/app-db
        endpointURL: https://s3.us-east-1.amazonaws.com
        s3Credentials:
          accessKeyId: { name: backup-creds, key: ACCESS_KEY_ID }
          secretAccessKey: { name: backup-creds, key: SECRET_ACCESS_KEY }
```

Steps:
1. Find the backup name: `kubectl get backup -n database`
2. Set `recoveryTarget.targetTime` to just before the mistake (UTC).
3. Apply the new `Cluster` CR. CNPG replays WAL up to the target time.
4. Verify data, then promote or rename the restored cluster.

Do not delete the original cluster until recovery is confirmed.

---

## Failover

**Automatic failover** happens when the primary pod fails and `spec.instances > 1`. CNPG elects a new primary from the replicas. No manual action needed.

**Manual promotion** (planned switchover):

```bash
kubectl cnpg promote app-db app-db-2 -n database
```

This demotes the current primary and promotes `app-db-2`.

**Client connection routing:**

CNPG creates two services per cluster:

| Service | DNS | Purpose |
|---------|-----|---------|
| Read-write | `app-db-rw.database.svc` | Always points to the current primary |
| Read-only | `app-db-ro.database.svc` | Load-balances across replicas |

Applications must connect to `app-db-rw` for writes. Read-heavy workloads can use `app-db-ro`. Never hardcode pod names or IP addresses.

After failover, `app-db-rw` automatically resolves to the new primary. Client reconnects handle the rest.

---

## Roles + Schemas

Keep the superuser separate from the application role. The `postgres` superuser is managed by CNPG. Application code never uses it.

Create a dedicated role per service:

```sql
CREATE ROLE svc_payments WITH LOGIN PASSWORD 'changeme';
CREATE SCHEMA payments AUTHORIZATION svc_payments;
GRANT CONNECT ON DATABASE app TO svc_payments;
GRANT USAGE ON SCHEMA payments TO svc_payments;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA payments TO svc_payments;
ALTER DEFAULT PRIVILEGES IN SCHEMA payments
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO svc_payments;
```

One role per service. No shared application credentials.

Store credentials in a Kubernetes `Secret`, not in `.pgpass` files on disk:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: svc-payments-db-creds
type: Opaque
stringData:
  DATABASE_URL: "postgresql://svc_payments:changeme@app-db-rw.database.svc:5432/app"
```

Mount as an env var in the application pod. Rotate by updating the secret and rolling the deployment.

---

## Migrations

Run DDL migrations from a dedicated Kubernetes `Job`, not from the application pod on startup.

Why: startup migrations cause race conditions in multi-replica deployments and make rollbacks harder.

Migration job pattern (stripped):

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: app-db-migrate-v42
spec:
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: migrate
          image: ghcr.io/your-org/app:v42
          command: ["./migrate", "up"]
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef: { name: svc-payments-db-creds, key: DATABASE_URL }
```

For interactive DDL or one-off queries, use the cnpg plugin:

```bash
kubectl cnpg psql app-db -n database -- -c "SELECT count(*) FROM payments.transactions;"
```

Never run `kubectl exec` into a postgres pod and use `psql` directly. Use `kubectl cnpg psql` instead. It handles authentication and targets the correct primary.

---

## Monitoring

CNPG exposes a Prometheus metrics endpoint on port `9187` of each pod.

Scrape via `PodMonitor` targeting label `cnpg.io/cluster: app-db`, port `metrics`.

Key metrics to watch:

| Metric | Alert threshold |
|--------|----------------|
| `cnpg_collector_pg_wal_files_total` | Spike indicates archiving lag |
| `cnpg_collector_pg_replication_lag` | > 30s warrants investigation |
| `cnpg_collector_pg_stat_activity_count` | Near `max_connections` |
| `cnpg_collector_pg_database_size_bytes` | Storage headroom |
| `cnpg_collector_pg_postmaster_start_time` | Unexpected restarts |

Check WAL archiving: `kubectl cnpg status app-db -n database | grep -A5 "WAL"`

---

## Common Failures

**WAL archive full / archiving stuck**

Symptom: `kubectl cnpg status` shows `WAL archiving: failing`. Object storage bucket is full or credentials expired.

Fix: clear space or rotate credentials, then:

```bash
kubectl cnpg reload app-db -n database
```

**Storage full**

Symptom: pod enters `OOMKilled` or postgres logs `no space left on device`. PVCs cannot shrink but can be expanded if the StorageClass supports it.

Fix: expand PVC, then restart the pod. Monitor `cnpg_collector_pg_database_size_bytes`.

**Split-brain prevention**

CNPG uses a fencing mechanism. If a primary loses quorum, it is fenced (STONITH-style) before a new primary is elected. Do not manually delete the fencing annotation without understanding the cluster state.

Check fencing status:

```bash
kubectl get cluster app-db -n database -o jsonpath='{.metadata.annotations}'
```

**Reading cluster events**

```bash
kubectl describe cluster app-db -n database
```

Look at the `Events` section at the bottom. Common messages:
- `Promoting instance app-db-2 to primary`: normal failover.
- `WAL archiving is failing`: backup pipeline broken.
- `Instance app-db-1 is unhealthy`: pod crash or OOM.
