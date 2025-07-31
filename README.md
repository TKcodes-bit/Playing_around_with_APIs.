
# 🏥 HOSPITAL LOCATOR — EMERGENCY HEALTHCARE FINDER

## 📍 PROJECT OVERVIEW

Hospital Locator is a real-time, containerized web application that helps users locate nearby hospitals using their current location.  
It uses the Geoapify Places API for location-based data and is deployed on two Dockerized servers (Web-01 and Web-02) behind a HAProxy load balancer for high availability and efficient traffic distribution.

## 🌐 LIVE DEMO

Access the application through the load balancer:

```

[http://localhost:8082](http://localhost:8082)

````

## 🧱 TECH STACK

- Frontend: HTML, CSS, JavaScript (Browser Geolocation API)
- Backend API: [Geoapify Places API](https://apidocs.geoapify.com/)
- Containerization: Docker
- Load Balancer: HAProxy
- Network: `web_infra_lab_lablan`

## 📦 DOCKER IMAGE DETAILS

- Docker Hub: [tkcodes004/hospital-locator](https://hub.docker.com/repositories/tkcodes004)
- Image: `tkcodes004/hospital-locator`
- Tag: `v1`

### Pull the Image

```bash
docker pull tkcodes004/hospital-locator:v1
````

### Build Locally

```bash
docker build -t tkcodes004/hospital-locator:v1 .
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
  tkcodes004/hospital-locator:v1
```

### Web-02

```bash
docker run -d \
  --name app-web02 \
  --restart unless-stopped \
  --network web_infra_lab_lablan \
  --hostname web-02 \
  tkcodes004/hospital-locator:v1
```

## ⚖️ LOAD BALANCING — HAPROXY CONFIGURATION

HAProxy distributes traffic between the app servers using round-robin.

### Configuration File: `/etc/haproxy/haproxy.cfg`

```haproxy
global
        log /dev/log    local0
        log /dev/log    local1 notice
        chroot /var/lib/haproxy
        stats socket /run/haproxy/admin.sock mode 660 level admin
        stats timeout 30s
        user haproxy
        group haproxy
        daemon

        # Default SSL material locations
        ca-base /etc/ssl/certs
        crt-base /etc/ssl/private

        # See: https://ssl-config.mozilla.org/#server=haproxy&server-version=2.0.3&config=intermediate
        ssl-default-bind-ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1>
        ssl-default-bind-ciphersuites TLS_AES_128_GCM_SHA256:TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256
        ssl-default-bind-options ssl-min-ver TLSv1.2 no-tls-tickets

defaults
        log     global
        mode    http
        option  httplog
        option  dontlognull
        timeout connect 5000
        timeout client  50000
        timeout server  50000
        errorfile 400 /etc/haproxy/errors/400.http
        errorfile 403 /etc/haproxy/errors/403.http
        errorfile 408 /etc/haproxy/errors/408.http
        errorfile 500 /etc/haproxy/errors/500.http
        errorfile 502 /etc/haproxy/errors/502.http
        errorfile 503 /etc/haproxy/errors/503.http
        errorfile 504 /etc/haproxy/errors/504.http
frontend http_front
    bind *:80
    default_backend webapps

backend webapps
    balance roundrobin
    server web01 172.20.0.2:8080 check
    server web02 172.20.0.3:8080 check

```

### Reload HAProxy

```bash
haproxy -sf $(pidof haproxy) -f /etc/haproxy/haproxy.cfg
```

## 🧪 TESTING LOAD BALANCING

1. Modify `index.html` in each container with unique headers.
2. Run:

```bash
curl http://localhost:8082
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

📄 LICENSE

This project is licensed under the MIT License.

```

---

Would you like this exported as a downloadable `.md` file or copied directly into your project folder?
```
