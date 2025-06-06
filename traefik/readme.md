
# Traefik Reverse Proxy Setup

This guide explains how to deploy a Traefik instance using Docker Compose to enable subdomain-based reverse proxy. It also highlights a known issue with `podman-compose` not attaching containers properly to custom networks and provides the commands needed to bridge Traefik to virtual machines on the same host.

---

## Table of Contents

1. [Prerequisites](#prerequisites)  
2. [File Structure](#file-structure)  
3. [Deploying Traefik with Docker Compose](#deploying-traefik-with-docker-compose)  
4. [Podman-Compose Network Caveat](#podman-compose-network-caveat)  
5. [Network Bridging & NAT Setup](#network-bridging--nat-setup)  
6. [Verification](#verification)  

---

## Prerequisites

- A Linux host with podman engine.  
- Two backend virtual machines on the same server, e.g.:  
  - VM 1: `192.168.11.192` (service1)  
  - VM 2: `192.168.11.230` (service2)  
- DNS records pointing your subdomains (e.g., `service1.example.org`, `service2.example.org`) to the Traefik host’s public IP.  
- Basic familiarity with Docker Compose v2 (`docker compose`).  

---

## File Structure

Store these two files in a directory, for example `/opt/traefik/`:

```
/opt/traefik/
├── docker-compose.yml
├── dynamic.yml
└── data/
    └── letsencrypt/
        └── acme.json
```

- `docker-compose.yml` – Defines the Traefik container, entry points, and volumes.  
- `dynamic.yml`        – Defines routers and services for subdomains.  
- `data/letsencrypt/acme.json` – Stores Let’s Encrypt certificates (must be created before starting).  


## Podman-Compose Network Caveat

If you use **Podman-Compose** instead of Docker Compose, Traefik may end up attached to the default `podman` network rather than `traefik_traefik_bridge`. To fix that:

```bash
podman-compose up -d
podman network connect traefik_traefik_bridge traefik
podman network disconnect podman traefik
```

---

## Network Bridging & NAT Setup

Enable IP forwarding and NAT so that container traffic can reach backend VMs:

```bash
sysctl -w net.ipv4.ip_forward=1

sudo iptables -t nat -A POSTROUTING \
  -s 10.89.0.0/24 \
  -d 192.168.11.0/24 \
  -j MASQUERADE

sudo iptables -I FORWARD \
  -s 10.89.0.0/24 \
  -d 192.168.11.0/24 \
  -j ACCEPT

sudo iptables -I FORWARD \
  -s 192.168.11.0/24 \
  -d 10.89.0.0/24 \
  -j ACCEPT
```

---

## Verification

- `curl -I https://service1.example.org` → should show HTTP 200
- `docker exec -it traefik sh` → should be able to `wget` the VMs
