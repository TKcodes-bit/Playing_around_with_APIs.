🏥 Hospital Locator - Emergency Healthcare Finder
A containerized web application that helps users find nearby hospitals using location-based filtering. Deployed using Docker containers across two web servers, load-balanced with HAProxy for 
efficient traffic distribution.

🔗 Live Access via Load Balancer
Access the application via the HAProxy load balancer at:
 http://localhost:8082

📦 Docker Image Details
Docker Hub Repository: https://hub.docker.com/r/tkcodes004/hospital-locator


Image Name: tkcodes004/hospital-locator


Tag: v1


Pull Command:

 docker pull tkcodes004/hospital-locator:v1



🛠️ Build Instructions (Local)
To build the image locally:
docker build -t tkcodes004/hospital-locator:v1 .


🚀 Deployment Instructions
On Web01 & Web02
Run the containers inside the same Docker network (web_infra_lab_lablan):
docker run -d \
  --name app-web01 \
  --restart unless-stopped \
  --network web_infra_lab_lablan \
  --hostname web-01 \
  tkcodes004/hospital-locator:v1

docker run -d \
  --name app-web02 \
  --restart unless-stopped \
  --network web_infra_lab_lablan \
  --hostname web-02 \
  tkcodes004/hospital-locator:v1


⚖️ Load Balancer (HAProxy) Configuration
Location: /etc/haproxy/haproxy.cfg
frontend http_front
    bind *:80
    default_backend webapps

backend webapps
    balance roundrobin
    server web01 web-01:8080 check
    server web02 web-02:8080 check

Reload HAProxy after config change:
haproxy -sf $(pidof haproxy) -f /etc/haproxy/haproxy.cfg


🧪 Testing Load Balancing (Round Robin)
To verify load balancing between web-01 and web-02:
Edit index.html in each container to display slightly different headers (e.g., 🏥 Hospital Locator - Web-01 and 🏥 Hospital Locator - Web-02).


Rebuild containers or live-edit using:

 docker exec -it app-web01 sh
vi index.html


Then, run:

 curl http://localhost:8082


Observe alternating content on successive requests, confirming round-robin behavior.



🔐 Hardening – Managing Secrets (API Keys)
To avoid hardcoding secrets (like API keys), use environment variables when running containers:
docker run -d \
  -e API_KEY=your_key_here \
  --name app-web01 \
  ...

In your script.js, access it via server-side rendering or inject via a templating engine if needed.
Note: This project uses Geoapify Places API for hospital data retrieval.
 📖 Geoapify API Docs

🧩 Challenges & Adaptation
Initially, the idea was to build a music events finder, but after exploring several APIs, most required paid plans. I pivoted to building a Hospital Locator using Geoapify Places API due to its 
robust free tier and location-based data access.

🙏 Credits
Geoapify Places API – for hospital geolocation & details


Docker – for containerization


HAProxy – for load balancing


Inspiration from various online tutorials and documentation.


