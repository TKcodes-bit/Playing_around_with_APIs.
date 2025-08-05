
# 🏥 HOSPITAL LOCATOR — EMERGENCY HEALTHCARE FINDER

## 📍 PROJECT OVERVIEW

Hospital Locator is a real-time, containerized web application that helps users locate nearby hospitals using their current location.  
It uses the Geoapify Places API for location-based data and is deployed on two Dockerized servers (Web-01 and Web-02) behind a HAProxy load balancer for high availability and efficient traffic distribution.

## 🌐 LIVE DEMO
access demo video

https://www.loom.com/share/e3befa35fd554cefbeed8dbaaa5ff7fc?sid=f9275e13-4990-4e2e-8ef4-3de67935748e


## 🧱 TECH STACK

- Frontend: HTML, CSS, JavaScript (Browser Geolocation API)
- Backend API: [Geoapify Places API](https://apidocs.geoapify.com/)
- Containerization: Docker
- Load Balancer: HAProxy
- Network: `web_infra_lab_lablan`

## 📦 DOCKER IMAGE DETAILS

- Docker Hub: [tkcodes004/hospital-locator](https://hub.docker.com/u/tkcodes004/)

```bash
npm start
```


## 🖥️ DEPLOYMENT — WEB-01 & WEB-02

Ensure both containers are on the `web_infra_lab_lablan` network.

### Web-01

```bash
docker run -d \
  --name app-web01 \
  --restart unless-stopped \
  --network web_infra_lab_lablan \
  --hostname web-01 \
```

### Web-02

```bash
docker run -d \
  --name app-web02 \
  --restart unless-stopped \
  --network web_infra_lab_lablan \
  --hostname web-02 \
```

## ⚖️ LOAD BALANCING — HAPROXY CONFIGURATION

HAProxy distributes traffic between the app servers using round-robin.

### Configuration File: `/etc/haproxy/haproxy.cfg`

```haproxy
global
    daemon
    maxconn 256

defaults
    mode http
    timeout connect 5s
    timeout client  50s
    timeout server  50s

frontend http-in
    bind *:80
    default_backend servers

backend servers
    balance roundrobin
    server web01 172.20.0.11:8080 check
    server web02 172.20.0.12:8080 check
    http-response set-header X-Served-By %[srv_name]

```

### Reload HAProxy

```bash
haproxy -sf $(pidof haproxy) -f /etc/haproxy/haproxy.cfg
```

## 🧪 TESTING LOAD BALANCING

1. Modify `index.html` in each container with unique headers.
2. Run:

```bash
curl http://localhost:8080
```

3. Confirm alternating header content to verify round-robin behavior.

## 🔐 ENVIRONMENT VARIABLES

Use environment variables to inject secrets like API keys:

```bash
docker run -d \
  -e API_KEY=your_api_key \
  ...
```

Access keys securely via server-side rendering or templates.

## 🌍 API INTEGRATION — GEOAPIFY PLACES API

* Purpose: Fetches hospital data based on user location.
* Sample Query:

```
https://api.geoapify.com/v2/places?
  categories=healthcare.hospital&
  filter=circle:<lon>,<lat>,5000&
  limit=10&
  apiKey=YOUR_API_KEY
```

* Docs: [Geoapify API Docs](https://apidocs.geoapify.com/)

## 🧭 PROJECT ORIGINS & ADAPTATION

Originally designed as a music event locator using Ticketmaster API.
Pivoted to a hospital finder app after facing API pricing limits, utilizing Geoapify's robust free tier.

🙏 CREDITS

* Geoapify API — Real-time hospital data
* Docker — Containerization
* HAProxy — Load balancing
* Open-source tutorials and developer community

Requirements:
Express
