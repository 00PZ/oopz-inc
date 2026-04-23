---
name: Stack Team
slug: stack
description: Builds and ships Vite frontend and backend applications to a homelab Kubernetes cluster using GitHub Actions, CloudNativePG, and Tailscale networking.
manager: ../../agents/software-architect/AGENTS.md
includes:
  - ../../agents/software-architect/AGENTS.md
  - ../../agents/senior-developer/AGENTS.md
  - ../../agents/code-reviewer/AGENTS.md
  - ../../agents/devops-engineer/AGENTS.md
  - ../../agents/security-engineer/AGENTS.md
  - ../../agents/technical-writer/AGENTS.md
tags:
  - vite
  - kubernetes
  - cnpg
  - tailscale
  - github-actions
---

The Stack team applies the engineering team's TDD discipline to a concrete toolchain. Senior Developer builds Vite + TypeScript applications. DevOps Engineer packages them as container images via GitHub Actions, deploys to a homelab Kubernetes cluster, and operates CloudNativePG for PostgreSQL. Security Engineer audits ACL policies and network boundaries enforced by Tailscale. Code Reviewer gates every diff. Technical Writer documents deployment runbooks and ADRs. The Stack team serves the company.
