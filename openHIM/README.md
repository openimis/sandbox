# OpenHIM Deployment Sandbox

This directory contains everything needed to spin up the [OpenHIM](https://openhim.org/) Core, Console, and an Nginx reverse-proxy on a shared external Docker network.

## Repository Structure

```
openHIM/
├── docker/          # OpenHIM Core & Console Docker Compose
│   └── docker-compose.yml
│   └── default.json  # Console configuration override
├── nginx/           # Nginx reverse-proxy configuration
│   ├── docker-compose.yml
│   ├── nginx.conf
│   └── logs/        # (ignored) nginx access & error logs
└── README.md        # (this file)
```

---

## Prerequisites

- **Docker** (v20+) and **Docker Compose** installed on your machine.
- A terminal with network privileges to create Docker networks.

---

## 1. Create the shared Docker network

All services (Core, Console, Nginx) communicate over the same external network.

```bash
# Run once before starting any stack
docker network create openhim-common_default
```

---

## 2. Start OpenHIM Core & Console

Navigate into the `docker/` folder and bring up the OpenHIM services:

```bash
cd openHIM/docker
docker compose up -d
```

- **mongo-db**: MongoDB backing store for Core (port 27017 internal).
- **openhim-core**: Core engine (ports 8080 HTTPS, 5000 HTTP, 5001 admin).
- **openhim-console**: Web-based UI (port 9000 → container’s port 80).

Healthchecks are configured to ensure readiness before Nginx proxies traffic.

---

## 3. Start the Nginx reverse proxy

In a separate terminal, bring up the Nginx service which routes:

- `/` and static assets → **openhim-console**
- All other paths → **openhim-core**

```bash
cd openHIM/nginx
# make sure logs directory exists
mkdir -p logs

docker compose up -d
```

- **nginx-openhim** listens on port 80 on your host.
- Logs are written to `nginx/logs/` (this folder is gitignored).

---

## 4. Verify setup

- **Console**: [http://localhost/](http://localhost/)  (served by Nginx)
- **Core API**: [http://localhost/heartbeat](http://localhost/heartbeat) or [https://localhost:8080/heartbeat](https://localhost:8080/heartbeat)

Examples:

```bash
curl http://localhost/heartbeat
curl -k https://localhost:8080/mediators --user root:openhim-password
```

---

## Notes

- The `default.json` file in `docker/` overrides Console config; you can point `openhimConsoleBaseUrl` there.
- Authentication for Core’s management API (e.g., `/mediators`) requires valid credentials (default `root:openhim-password`).
- Customize environment variables in `docker-compose.yml` under `openhim-core` for production secret management.

---

Happy testing with OpenHIM! 🎉
