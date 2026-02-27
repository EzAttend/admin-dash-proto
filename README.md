# EzAttend Admin Dashboard

Monorepo containing the backend API (Express/Bun) and frontend (Next.js/Bun) for the EzAttend admin panel.

## Table of Contents

- [Architecture](#architecture)
- [Repository Structure](#repository-structure)
- [Local Development](#local-development)
- [Docker Images](#docker-images)
- [CI/CD Pipeline](#cicd-pipeline)
- [Dokploy Deployment](#dokploy-deployment)
- [GitHub Secrets Reference](#github-secrets-reference)
- [Troubleshooting](#troubleshooting)

---

## Architecture

```
                         git push (PEP branch)
                                |
                                v
                  +----------------------------+
                  |     GitHub Actions CI/CD    |
                  |  .github/workflows/deploy  |
                  +----------------------------+
                       |                |
                       v                v
              +----------------+  +----------------+
              | Build Backend  |  | Build Frontend |
              | (multi-arch)   |  | (multi-arch)   |
              | amd64 + arm64  |  | amd64 + arm64  |
              +----------------+  +----------------+
                       |                |
                       v                v
              +----------------+  +----------------+
              |   Push to GHCR |  |   Push to GHCR |
              |   ghcr.io/     |  |   ghcr.io/     |
              |   ezattend/    |  |   ezattend/    |
              |   .../backend  |  |   .../frontend |
              +----------------+  +----------------+
                       |                |
                       v                v
              +----------------+  +----------------+
              | Dokploy        |  | Dokploy        |
              | Webhook POST   |  | Webhook POST   |
              | (auto-redeploy)|  | (auto-redeploy)|
              +----------------+  +----------------+
                       |                |
                       v                v
              +----------------+  +----------------+
              | Backend        |  | Frontend       |
              | Container      |  | Container      |
              | :5000          |  | :3000          |
              +----------------+  +----------------+
                       |                |
            +----------+----------+     |
            |                     |     |
            v                     v     v
     +-----------+         +-----------+-----------+
     |  MongoDB  |         |  RabbitMQ  | Traefik  |
     | (external)|         | (external) | (SSL)    |
     +-----------+         +-----------+-----------+
```

**Request flow in production:**

```
Browser --> admin.ezattend.xyz (Traefik :443)
              |
              v
        Frontend (:3000)
              |
              |--> /api/auth/* (Next.js rewrite proxy)
              |         |
              |         v
              |    api.ezattend.xyz (Traefik :443)
              |         |
              |         v
              |    Backend (:5000) /api/auth/*
              |
              |--> /api/* (client-side fetch)
                        |
                        v
                   api.ezattend.xyz (Traefik :443)
                        |
                        v
                   Backend (:5000)
                        |
                   +----+----+
                   |         |
                   v         v
                MongoDB   RabbitMQ
```

---

## Repository Structure

```
admin-dashboard/
  .github/workflows/
    deploy.yml              # CI/CD pipeline definition
  backend/
    Dockerfile              # Multi-stage Bun build
    .dockerignore
    .env                    # Local/production env (gitignored)
    .env.example            # Template for env vars
    src/                    # Express API source
    data/                   # SQLite auth.db (gitignored)
  frontend/
    Dockerfile              # Multi-stage Next.js standalone build
    .dockerignore
    .env                    # Local env (gitignored)
    src/                    # Next.js app source
    middleware.ts           # Auth middleware
  docker-compose.yml        # Local dev compose (no infra services)
```

---

## Local Development

### Prerequisites

- [Bun](https://bun.sh) >= 1.0
- Self-hosted MongoDB (replica set) and RabbitMQ accessible from local machine

### Backend

```sh
cd backend
cp .env.example .env    # fill in your credentials
bun install
bun dev                 # starts on http://localhost:5000
```

### Frontend

```sh
cd frontend
echo 'NEXT_PUBLIC_API_URL=http://localhost:5000/api' > .env
echo 'NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:5000' >> .env
bun install
bun dev                 # starts on http://localhost:3000
```

### Docker Compose (local)

Runs both services in containers. MongoDB and RabbitMQ must be reachable from the host network (credentials from `backend/.env`).

```sh
docker compose up --build
```

- Backend: http://localhost:5000/api/health
- Frontend: http://localhost:3000

---

## Docker Images

### Backend Dockerfile

Three-stage build:

1. **deps** -- Installs all dependencies including native modules (`better-sqlite3` requires python3, make, g++).
2. **builder** -- Runs `bun build src/app.ts --outdir ./dist --target bun` to produce a bundled output.
3. **runner** -- `oven/bun:1-slim` with only `node_modules`, `dist/`, and a `/app/data` volume for the SQLite auth database.

Exposes port `5000`. Entry point: `bun dist/app.js`.

### Frontend Dockerfile

Three-stage build:

1. **deps** -- Installs all dependencies.
2. **builder** -- Runs `bun --bun next build` with `NEXT_PUBLIC_*` build args baked in. Requires `output: "standalone"` in `next.config.ts`.
3. **runner** -- `oven/bun:1-slim` with standalone output, static assets, and public directory. Runs as non-root user `nextjs`.

Exposes port `3000`. Entry point: `bun server.js`.

### Building locally

```sh
# Backend
docker build -t ezattend-backend ./backend

# Frontend (build args required -- these get baked into the JS bundle)
docker build \
  --build-arg NEXT_PUBLIC_API_URL=https://api.ezattend.xyz/api \
  --build-arg NEXT_PUBLIC_BETTER_AUTH_URL=https://api.ezattend.xyz \
  -t ezattend-frontend ./frontend
```

---

## CI/CD Pipeline

Defined in `.github/workflows/deploy.yml`.

### Trigger

Pushes to the `PEP` branch that modify files in:
- `backend/**`
- `frontend/**`
- `.github/workflows/deploy.yml`

### Pipeline stages

```
push to PEP
    |
    v
[changes] -- dorny/paths-filter detects which directories changed
    |
    +-- backend/** changed? --> [build-backend]
    |                               |
    |                               +--> Checkout
    |                               +--> Login to GHCR (GITHUB_TOKEN)
    |                               +--> Setup QEMU (ARM64 emulation)
    |                               +--> Setup Buildx
    |                               +--> Build multi-arch image (amd64 + arm64)
    |                               +--> Push to ghcr.io/ezattend/admin_dashboard/backend
    |                               +--> POST to DOKPLOY_BACKEND_WEBHOOK
    |
    +-- frontend/** changed? --> [build-frontend]
                                    |
                                    +--> Checkout
                                    +--> Login to GHCR (GITHUB_TOKEN)
                                    +--> Setup QEMU (ARM64 emulation)
                                    +--> Setup Buildx
                                    +--> Build multi-arch image with build-args
                                    |       NEXT_PUBLIC_API_URL (from secret)
                                    |       NEXT_PUBLIC_BETTER_AUTH_URL (from secret)
                                    +--> Push to ghcr.io/ezattend/admin_dashboard/frontend
                                    +--> POST to DOKPLOY_FRONTEND_WEBHOOK
```

### Selective builds

Only changed services are rebuilt. If you only modify `frontend/src/app/page.tsx`, only the frontend image is rebuilt and redeployed. The backend remains untouched.

### Image tagging

Each push produces two tags per image:
- `:latest` -- always points to the most recent build
- `:<commit-sha>` -- immutable reference for rollbacks

### Build caching

GitHub Actions cache (`type=gha`) is used per service scope. Subsequent builds reuse cached layers, significantly reducing build time.

---

## Dokploy Deployment

### Prerequisites

- Dokploy instance running on your server
- DNS records pointing to the server:
  - `api.ezattend.xyz` -> server IP
  - `admin.ezattend.xyz` -> server IP
- Self-hosted MongoDB and RabbitMQ accessible from the server

### Step 1: Create a GitHub Personal Access Token

Required for Dokploy to pull private GHCR images.

1. Navigate to https://github.com/settings/tokens/new (Classic token).
2. Set the note to `dokploy-ghcr-read`.
3. Select the `read:packages` scope only.
4. Generate the token and copy it.

### Step 2: Create Backend Service

1. In Dokploy, create a project (or use an existing one).
2. Create Service --> Application. Name: `Admin-Backend`.
3. General tab --> Provider section:

   | Field        | Value                                              |
   |--------------|----------------------------------------------------|
   | Provider     | Docker                                             |
   | Docker Image | `ghcr.io/ezattend/admin_dashboard/backend:latest`  |
   | Registry URL | `https://ghcr.io`                                  |
   | Username     | Your GitHub username                               |
   | Password     | The PAT from Step 1                                |

   Click Save.

4. Environment tab -- add all variables:

   ```
   PORT=5000
   NODE_ENV=production
   FRONTEND_URL=https://admin.ezattend.xyz
   MONGODB_URI=<your-mongodb-connection-string>
   RABBITMQ_URI=<your-rabbitmq-connection-string>
   BETTER_AUTH_SECRET=<your-auth-secret>
   BETTER_AUTH_URL=https://api.ezattend.xyz
   AUTH_DB_PATH=/app/data/auth.db
   ```

5. Advanced tab --> Volumes --> Add Volume:

   | Field       | Value                  |
   |-------------|------------------------|
   | Mount Type  | Volume                 |
   | Volume Name | `ezattend-backend-data`|
   | Mount Path  | `/app/data`            |

   This persists the SQLite auth database across container restarts and redeploys.

6. Domains tab --> Add domain:

   | Field          | Value              |
   |----------------|--------------------|
   | Host           | `api.ezattend.xyz` |
   | Container Port | `5000`             |
   | HTTPS          | Enabled            |

7. Click Deploy.

### Step 3: Create Frontend Service

1. Create Service --> Application. Name: `Admin-Frontend`.
2. General tab --> Provider section:

   | Field        | Value                                               |
   |--------------|-----------------------------------------------------|
   | Provider     | Docker                                              |
   | Docker Image | `ghcr.io/ezattend/admin_dashboard/frontend:latest`  |
   | Registry URL | `https://ghcr.io`                                   |
   | Username     | Your GitHub username                                |
   | Password     | The PAT from Step 1                                 |

   Click Save.

3. Environment tab -- add:

   ```
   NEXT_PUBLIC_BETTER_AUTH_URL=https://api.ezattend.xyz
   ```

   Note: `NEXT_PUBLIC_API_URL` is baked into the image at build time via GitHub Actions build args. The runtime env var `NEXT_PUBLIC_BETTER_AUTH_URL` is used by `next.config.ts` for the auth rewrite proxy during SSR.

4. Domains tab --> Add domain:

   | Field          | Value                |
   |----------------|----------------------|
   | Host           | `admin.ezattend.xyz` |
   | Container Port | `3000`               |
   | HTTPS          | Enabled              |

5. Click Deploy.

### Step 4: Configure Webhooks

After both services are deployed:

1. Go to each service's Deployments tab in Dokploy.
2. Copy the Webhook URL.
3. Add them as GitHub repository secrets (see next section).

Dokploy will automatically redeploy the service when it receives a POST to the webhook URL.

---

## GitHub Secrets Reference

Navigate to: GitHub repo --> Settings --> Secrets and variables --> Actions --> New repository secret.

| Secret Name                    | Purpose                                    | Example Value                         |
|--------------------------------|--------------------------------------------|---------------------------------------|
| `NEXT_PUBLIC_API_URL`          | Frontend build arg: backend API base URL   | `https://api.ezattend.xyz/api`        |
| `NEXT_PUBLIC_BETTER_AUTH_URL`  | Frontend build arg: auth proxy target      | `https://api.ezattend.xyz`            |
| `DOKPLOY_BACKEND_WEBHOOK`     | Webhook URL to trigger backend redeploy    | `https://dokploy.example.com/api/...` |
| `DOKPLOY_FRONTEND_WEBHOOK`    | Webhook URL to trigger frontend redeploy   | `https://dokploy.example.com/api/...` |

`GITHUB_TOKEN` is automatically provided by GitHub Actions and does not need to be created manually. It is used to authenticate with GHCR for pushing images.

---

## Troubleshooting

### Pipeline skipped both builds

The workflow uses `dorny/paths-filter` to detect changes. If only `.github/workflows/deploy.yml` changed, neither `build-backend` nor `build-frontend` will run. To force both builds:

```sh
echo "" >> backend/package.json
echo "" >> frontend/package.json
git add -A && git commit -m "ci: trigger full build" && git push origin PEP
```

### Dokploy: "no matching manifest for linux/arm64/v8"

The images must be built with `platforms: linux/amd64,linux/arm64`. This is already configured in the workflow using QEMU emulation. If you see this error, the images were built before the multi-platform fix was added. Trigger a new build.

### Dokploy: "unauthorized" when pulling from GHCR

GHCR packages default to private. Either:

- **Option A**: Make packages public at `https://github.com/orgs/EzAttend/packages` --> Package settings --> Change visibility --> Public.
- **Option B**: Add GHCR credentials (GitHub username + PAT with `read:packages`) in each Dokploy service's General tab.

### Backend: better-sqlite3 build fails in Docker

The `deps` stage installs `python3`, `make`, and `g++` which are required for `better-sqlite3` native compilation. If the build fails, ensure these are present in the Dockerfile's deps stage.

### Frontend: NEXT_PUBLIC_* vars not working

`NEXT_PUBLIC_*` variables are inlined into the JavaScript bundle at build time by Next.js. They cannot be changed at runtime. If you change these values:

1. Update the corresponding GitHub secret.
2. Push a change to `frontend/` to trigger a rebuild.
3. The new image will have the updated values baked in.

### Rollback

Each image is tagged with the commit SHA. To rollback in Dokploy, change the image tag from `:latest` to the specific commit SHA:

```
ghcr.io/ezattend/admin_dashboard/backend:<commit-sha>
```

Then redeploy.
                   RabbitMQ (existing)  Traefik/domain routing