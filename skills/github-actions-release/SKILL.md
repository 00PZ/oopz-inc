---
name: github-actions-release
description: GitHub Actions release workflow patterns for the stack company. Covers lint, test, build, container image publish, and triggered deploys. Stack-specific, uses real workflow YAML.
---

## Purpose

This skill defines the GitHub Actions release pipeline for stack services. It covers the full path from a merged PR to a running container: lint, test, build, image publish to GHCR, and a triggered deploy. Use this as the canonical reference when writing or reviewing `.github/workflows/release.yml`.

## Trigger Matrix

Four trigger patterns cover the full release lifecycle.

**Push to main** runs the full CI pipeline and publishes a `latest` image:

```yaml
on:
  push:
    branches: [main]
```

**Pull request** runs lint and test only, no publish:

```yaml
on:
  pull_request:
    branches: [main]
```

**Tag push** triggers a versioned release and semver-tagged image:

```yaml
on:
  push:
    tags:
      - 'v*'
```

**Manual dispatch** supports rollback and re-deploy without a code change:

```yaml
on:
  workflow_dispatch:
    inputs:
      image_tag:
        description: 'Image tag to deploy (e.g. sha-abc1234 or v1.2.3)'
        required: true
```

## Job Graph

Jobs run in dependency order. `lint` and `test` run in parallel. `build` waits for both. `publish` waits for `build`. `deploy` waits for `publish`.

```yaml
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install --frozen-lockfile
      - run: bun run lint

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install --frozen-lockfile
      - run: bun test

  build:
    needs: [lint, test]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install --frozen-lockfile
      - run: bun run build

  publish:
    needs: build
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
      id-token: write
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v5
        with:
          push: true
          tags: |
            ghcr.io/${{ github.repository }}:sha-${{ github.sha }}
            ghcr.io/${{ github.repository }}:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy:
    needs: publish
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      - run: |
          kubectl set image deployment/app \
            app=ghcr.io/${{ github.repository }}:sha-${{ github.sha }}
        env:
          KUBECONFIG_DATA: ${{ secrets.KUBECONFIG }}
```

## Secrets Handling

Store secrets in GitHub repository or environment settings, never in workflow YAML.

Reference secrets with `${{ secrets.NAME }}`. For environment-scoped secrets (e.g. production), use environment protection rules so the `deploy` job requires a reviewer approval before secrets are exposed.

**Minimal permissions block** (principle of least privilege):

```yaml
permissions:
  contents: read
  packages: write
  id-token: write   # required for OIDC
```

Set `permissions` at the job level, not the workflow level, so each job gets only what it needs.

**OIDC for cloud auth** avoids long-lived credentials. For AWS:

```yaml
- uses: aws-actions/configure-aws-credentials@v4
  with:
    role-to-assume: arn:aws:iam::123456789012:role/github-actions
    aws-region: us-east-1
```

**Avoid secret leakage in logs.** Never `echo` a secret. If a command must receive a secret, pass it via environment variable, not a positional argument. GitHub Actions masks known secret values, but constructed strings (e.g. base64-encoded tokens) may not be masked automatically.

## Caching

Cache dependencies and build artifacts to cut job time.

**Bun lockfile cache:**

```yaml
- uses: actions/cache@v4
  with:
    path: ~/.bun/install/cache
    key: ${{ runner.os }}-bun-${{ hashFiles('**/bun.lockb') }}
    restore-keys: |
      ${{ runner.os }}-bun-
```

**Vite build cache** (cache the `.vite` directory):

```yaml
- uses: actions/cache@v4
  with:
    path: node_modules/.vite
    key: ${{ runner.os }}-vite-${{ hashFiles('**/bun.lockb') }}-${{ hashFiles('src/**') }}
    restore-keys: |
      ${{ runner.os }}-vite-
```

**Docker layer cache via buildx** (already shown in the publish job above):

```yaml
cache-from: type=gha
cache-to: type=gha,mode=max
```

This stores Docker layer cache in the GitHub Actions cache backend. `mode=max` caches all layers, not just the final image.

## Container Image Publish

Images publish to GHCR (GitHub Container Registry) at `ghcr.io/<org>/<repo>`.

Tag strategy:
- `sha-<git-sha>` for every push to main (immutable, traceable)
- `latest` for the most recent main build
- `v<semver>` when a tag like `v1.2.3` is pushed

Use `docker/metadata-action` to generate tags automatically:

```yaml
- uses: docker/metadata-action@v5
  id: meta
  with:
    images: ghcr.io/${{ github.repository }}
    tags: |
      type=sha,prefix=sha-
      type=semver,pattern={{version}}
      type=raw,value=latest,enable=${{ github.ref == 'refs/heads/main' }}

- uses: docker/build-push-action@v5
  with:
    push: true
    tags: ${{ steps.meta.outputs.tags }}
    labels: ${{ steps.meta.outputs.labels }}
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

Auth uses `GITHUB_TOKEN` (no extra secret needed for GHCR within the same org).

## Deploy Trigger

After `publish` succeeds, the `deploy` job applies the new image to the cluster. Two patterns are supported.

**kubectl set image** (direct, works with any kubeconfig):

```yaml
- name: Deploy to cluster
  run: |
    echo "$KUBECONFIG_DATA" | base64 -d > /tmp/kubeconfig
    kubectl --kubeconfig /tmp/kubeconfig set image \
      deployment/app app=ghcr.io/${{ github.repository }}:sha-${{ github.sha }}
    kubectl --kubeconfig /tmp/kubeconfig rollout status deployment/app
  env:
    KUBECONFIG_DATA: ${{ secrets.KUBECONFIG }}
```

**ArgoCD sync** (preferred when ArgoCD manages the cluster):

```yaml
- name: Trigger ArgoCD sync
  run: |
    argocd app set my-app \
      --helm-set image.tag=sha-${{ github.sha }}
    argocd app sync my-app --timeout 120
  env:
    ARGOCD_SERVER: ${{ secrets.ARGOCD_SERVER }}
    ARGOCD_AUTH_TOKEN: ${{ secrets.ARGOCD_AUTH_TOKEN }}
```

The `deploy` job should always use an `environment: production` block so GitHub enforces protection rules (required reviewers, wait timers) before the job runs.

## Rollback

Three rollback paths, in order of preference.

**Re-tag the previous image.** Find the last known-good SHA from the deployment history, then re-run the deploy job with that tag via `workflow_dispatch`:

```yaml
on:
  workflow_dispatch:
    inputs:
      image_tag:
        description: 'Tag to roll back to (e.g. sha-abc1234)'
        required: true

jobs:
  rollback:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      - name: Roll back image
        run: |
          echo "$KUBECONFIG_DATA" | base64 -d > /tmp/kubeconfig
          kubectl --kubeconfig /tmp/kubeconfig set image \
            deployment/app app=ghcr.io/${{ github.repository }}:${{ inputs.image_tag }}
          kubectl --kubeconfig /tmp/kubeconfig rollout status deployment/app
        env:
          KUBECONFIG_DATA: ${{ secrets.KUBECONFIG }}
```

**kubectl rollout undo** (fast, no image re-tag needed):

```bash
kubectl rollout undo deployment/app
```

This reverts to the previous ReplicaSet. Works only if the previous revision is still in cluster history (`revisionHistoryLimit` must be >= 2).

**Re-run the release workflow** on the previous commit. Go to Actions, find the last successful run on `main`, and click "Re-run jobs". This re-publishes the same image and re-deploys it.
