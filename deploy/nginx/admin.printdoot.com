# ─── PrintDoot Admin Panel ───
# Nginx config for Vite-built React admin SPA
# Place in /etc/nginx/sites-available/admin.printdoot.com

server {
    listen 80;
    server_name admin.printdoot.com;

    # Redirect HTTP → HTTPS (uncomment after Certbot)
    # return 301 https://$host$request_uri;

    root /home/printdoot/printbackend/admin/dist;
    index index.html;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    location ~* \.(ico|png|jpg|jpeg|gif|svg|webp|webmanifest)$ {
        expires 7d;
        add_header Cache-Control "public";
        access_log off;
        try_files $uri =404;
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}

# ── HTTPS (uncomment after certbot) ──
# server {
#     listen 443 ssl http2;
#     server_name admin.printdoot.com;
#
#     ssl_certificate /etc/letsencrypt/live/admin.printdoot.com/fullchain.pem;
#     ssl_certificate_key /etc/letsencrypt/live/admin.printdoot.com/privkey.pem;
#     include /etc/letsencrypt/options-ssl-nginx.conf;
#     ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
#
#     root /home/printdoot/printbackend/admin/dist;
#     index index.html;
#
#     add_header X-Frame-Options "DENY" always;
#     add_header X-Content-Type-Options "nosniff" always;
#     add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
#
#     gzip on;
#     gzip_vary on;
#     gzip_min_length 1024;
#     gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;
#
#     location /assets/ {
#         expires 1y;
#         add_header Cache-Control "public, immutable";
#         access_log off;
#     }
#
#     location ~* \.(ico|png|jpg|jpeg|gif|svg|webp|webmanifest)$ {
#         expires 7d;
#         add_header Cache-Control "public";
#         access_log off;
#         try_files $uri =404;
#     }
#
#     location / {
#         try_files $uri $uri/ /index.html;
#     }
# }
