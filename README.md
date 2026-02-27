GitHub (public repo) ──push──▶ GitHub Actions CI/CD
                                   │
                         ┌─────────┴─────────┐
                         ▼                   ▼
                   Build Backend        Build Frontend
                   Docker Image         Docker Image
                         │                   │
                         ▼                   ▼
                   Push to GHCR         Push to GHCR
                   (ghcr.io)            (ghcr.io)
                         │                   │
                         └─────────┬─────────┘
                                   ▼
                          Dokploy Webhook
                          (auto-redeploy)
                                   │
                         ┌─────────┴─────────┐
                         ▼                   ▼
                   Backend Container    Frontend Container
                   :5000                :3000
                         │                   │
                         ▼                   ▼
                   MongoDB (existing)   Proxied via Dokploy
                   RabbitMQ (existing)  Traefik/domain routing