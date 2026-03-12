# ─── PrintDoot Backend API ───
# Nginx config for Django + Gunicorn
# Place in /etc/nginx/sites-available/api.printdoot.com

upstream django_backend {
    server 127.0.0.1:8000;
}

server {
    listen 80;
    server_name api.printdoot.com;

    # Redirect HTTP → HTTPS (uncomment after Certbot)
    # return 301 https://$host$request_uri;

    # ── Until SSL is set up, serve directly ──
    client_max_body_size 10M;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Static files (collected by collectstatic, served by Nginx)
    location /static/ {
        alias /home/printdoot/printbackend/backend/staticfiles/;
        expires 30d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Media files (only if USE_S3=False; when S3 is on, media is served from S3)
    location /media/ {
        alias /home/printdoot/printbackend/backend/media/;
        expires 7d;
        add_header Cache-Control "public";
        access_log off;
    }

    # Django admin static
    location /admin/ {
        proxy_pass http://django_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API endpoints
    location /api/ {
        proxy_pass http://django_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
        proxy_connect_timeout 30s;
    }

    # Health check
    location /health {
        proxy_pass http://django_backend;
        proxy_set_header Host $host;
    }

    # Block all other paths
    location / {
        return 404;
    }
}

# ── HTTPS server block (uncomment after running certbot) ──
# server {
#     listen 443 ssl http2;
#     server_name api.printdoot.com;
#
#     ssl_certificate /etc/letsencrypt/live/api.printdoot.com/fullchain.pem;
#     ssl_certificate_key /etc/letsencrypt/live/api.printdoot.com/privkey.pem;
#     include /etc/letsencrypt/options-ssl-nginx.conf;
#     ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
#
#     client_max_body_size 10M;
#
#     add_header X-Frame-Options "DENY" always;
#     add_header X-Content-Type-Options "nosniff" always;
#     add_header X-XSS-Protection "1; mode=block" always;
#     add_header Referrer-Policy "strict-origin-when-cross-origin" always;
#     add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
#
#     location /static/ {
#         alias /home/printdoot/printbackend/backend/staticfiles/;
#         expires 30d;
#         add_header Cache-Control "public, immutable";
#         access_log off;
#     }
#
#     location /media/ {
#         alias /home/printdoot/printbackend/backend/media/;
#         expires 7d;
#         add_header Cache-Control "public";
#         access_log off;
#     }
#
#     location /admin/ {
#         proxy_pass http://django_backend;
#         proxy_set_header Host $host;
#         proxy_set_header X-Real-IP $remote_addr;
#         proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
#         proxy_set_header X-Forwarded-Proto $scheme;
#     }
#
#     location /api/ {
#         proxy_pass http://django_backend;
#         proxy_set_header Host $host;
#         proxy_set_header X-Real-IP $remote_addr;
#         proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
#         proxy_set_header X-Forwarded-Proto $scheme;
#         proxy_read_timeout 120s;
#         proxy_connect_timeout 30s;
#     }
#
#     location /health {
#         proxy_pass http://django_backend;
#         proxy_set_header Host $host;
#     }
#
#     location / {
#         return 404;
#     }
# }
