#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# PrintDoot — Full Deployment Script for Ubuntu 24.04 LTS
# ═══════════════════════════════════════════════════════════════
# Run as root:  sudo bash deploy.sh
# This script sets up EVERYTHING from a fresh Ubuntu 24.04 server.
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

# ─── Configuration ───
APP_USER="printdoot"
APP_HOME="/home/${APP_USER}"
REPO_URL="https://github.com/shreyansh8722/PrintDoot.git"
DOMAIN_API="api.printdoot.com"
DOMAIN_FRONTEND="printdoot.com"
DOMAIN_ADMIN="admin.printdoot.com"
DB_NAME="printdoot_db"
DB_USER="printdoot"
NODE_VERSION="20"
PYTHON_VERSION="3.12"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err()  { echo -e "${RED}[✗]${NC} $1"; exit 1; }
step() { echo -e "\n${CYAN}══════════════════════════════════════${NC}"; echo -e "${CYAN}  $1${NC}"; echo -e "${CYAN}══════════════════════════════════════${NC}\n"; }

# ─── Sanity checks ───
if [[ $EUID -ne 0 ]]; then
    err "This script must be run as root (sudo bash deploy.sh)"
fi

echo ""
echo "  ╔══════════════════════════════════════════╗"
echo "  ║   PrintDoot — Ubuntu 24.04 Deployment    ║"
echo "  ╚══════════════════════════════════════════╝"
echo ""

# ═══════════════════════════════════════════════════
# 1. SYSTEM UPDATE & BASE PACKAGES
# ═══════════════════════════════════════════════════
step "1/9 — System Update & Base Packages"

apt update && apt upgrade -y
apt install -y \
    build-essential \
    curl \
    git \
    wget \
    unzip \
    software-properties-common \
    ufw \
    fail2ban \
    htop \
    certbot \
    python3-certbot-nginx \
    libpq-dev \
    python3-dev \
    python3-pip \
    python3-venv \
    nginx \
    postgresql \
    postgresql-contrib

log "System packages installed"

# ═══════════════════════════════════════════════════
# 2. INSTALL NODE.JS 20 LTS
# ═══════════════════════════════════════════════════
step "2/9 — Install Node.js ${NODE_VERSION} LTS"

if ! command -v node &>/dev/null || [[ "$(node -v)" != v${NODE_VERSION}* ]]; then
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
    apt install -y nodejs
fi

log "Node.js $(node -v) + npm $(npm -v)"

# ═══════════════════════════════════════════════════
# 3. CREATE APP USER
# ═══════════════════════════════════════════════════
step "3/9 — Create Application User"

if ! id "${APP_USER}" &>/dev/null; then
    adduser --disabled-password --gecos "PrintDoot App" "${APP_USER}"
    usermod -aG www-data "${APP_USER}"
    log "User '${APP_USER}' created"
else
    log "User '${APP_USER}' already exists"
fi

# ═══════════════════════════════════════════════════
# 4. POSTGRESQL DATABASE
# ═══════════════════════════════════════════════════
step "4/9 — PostgreSQL Database Setup"

echo ""
echo "  Enter a strong password for the '${DB_USER}' database user:"
read -sp "  DB Password: " DB_PASSWORD
echo ""
echo ""

sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" | grep -q 1 || {
    sudo -u postgres psql -c "CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';"
    log "DB user '${DB_USER}' created"
}

sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1 || {
    sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};"
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};"
    log "Database '${DB_NAME}' created"
}

log "PostgreSQL ready"

# ═══════════════════════════════════════════════════
# 5. CLONE REPOSITORY
# ═══════════════════════════════════════════════════
step "5/9 — Clone Repository"

if [ ! -d "${APP_HOME}/printbackend" ]; then
    sudo -u "${APP_USER}" git clone "${REPO_URL}" "${APP_HOME}/repo_temp"
    # Move the subdirectories to the right places
    sudo -u "${APP_USER}" mv "${APP_HOME}/repo_temp/printbackend" "${APP_HOME}/printbackend"
    sudo -u "${APP_USER}" mv "${APP_HOME}/repo_temp/printfrontend" "${APP_HOME}/printfrontend"
    rm -rf "${APP_HOME}/repo_temp"
    log "Repository cloned"
else
    warn "Code directories already exist — skipping clone"
    warn "To update: cd ${APP_HOME}/printbackend && git pull"
fi

# ═══════════════════════════════════════════════════
# 6. BACKEND SETUP (Django + Gunicorn)
# ═══════════════════════════════════════════════════
step "6/9 — Backend Setup (Django)"

BACKEND_DIR="${APP_HOME}/printbackend/backend"

# Create Python virtual environment
if [ ! -d "${BACKEND_DIR}/venv" ]; then
    sudo -u "${APP_USER}" python3 -m venv "${BACKEND_DIR}/venv"
    log "Python venv created"
fi

# Install dependencies
sudo -u "${APP_USER}" bash -c "
    source ${BACKEND_DIR}/venv/bin/activate
    pip install --upgrade pip
    pip install -r ${BACKEND_DIR}/requirements.txt
    pip install gunicorn
"
log "Python dependencies installed"

# Create .env file if not present
if [ ! -f "${BACKEND_DIR}/.env" ]; then
    # Generate a secret key
    SECRET_KEY=$(sudo -u "${APP_USER}" bash -c "source ${BACKEND_DIR}/venv/bin/activate && python -c \"from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())\"")

    cat > "${BACKEND_DIR}/.env" << ENVEOF
# ── Django Core ──
SECRET_KEY=${SECRET_KEY}
DEBUG=False
ALLOWED_HOSTS=${DOMAIN_API},127.0.0.1
CSRF_TRUSTED_ORIGINS=https://${DOMAIN_API},https://${DOMAIN_FRONTEND},https://www.${DOMAIN_FRONTEND},https://${DOMAIN_ADMIN}
SECURE_SSL_REDIRECT=False
ADMIN_URL=admin/

# ── Database ──
DB_NAME=${DB_NAME}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DB_HOST=localhost
DB_PORT=5432

# ── CORS ──
CORS_ALLOWED_ORIGINS=https://${DOMAIN_FRONTEND},https://www.${DOMAIN_FRONTEND},https://${DOMAIN_ADMIN}

# ── Frontend URL ──
FRONTEND_URL=https://${DOMAIN_FRONTEND}

# ── Instamojo (FILL IN YOUR CREDENTIALS) ──
INSTAMOJO_API_KEY=
INSTAMOJO_AUTH_TOKEN=
INSTAMOJO_PRIVATE_SALT=
INSTAMOJO_BASE_URL=https://www.instamojo.com

# ── AWS S3 ──
USE_S3=True
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_STORAGE_BUCKET_NAME=printdoot
AWS_S3_REGION_NAME=ap-south-1

# ── Shipmozo ──
SHIPMOZO_PUBLIC_KEY=
SHIPMOZO_PRIVATE_KEY=
STORE_PINCODE=413512

# ── Zakeke ──
ZAKEKE_CLIENT_ID=
ZAKEKE_SECRET_KEY=
ZAKEKE_WEBHOOK_SECRET=

# ── Email ──
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=
DEFAULT_FROM_EMAIL=PrintDoot <printdootweb@gmail.com>
SUPPORT_EMAIL=printdootweb@gmail.com
ENVEOF

    chown "${APP_USER}:${APP_USER}" "${BACKEND_DIR}/.env"
    chmod 600 "${BACKEND_DIR}/.env"
    warn ".env created — you MUST edit it with your real credentials!"
    warn "  nano ${BACKEND_DIR}/.env"
else
    log ".env already exists"
fi

# Create directories
sudo -u "${APP_USER}" mkdir -p "${BACKEND_DIR}/media" "${BACKEND_DIR}/logs" "${BACKEND_DIR}/staticfiles"
mkdir -p /var/log/printdoot
chown "${APP_USER}:www-data" /var/log/printdoot

# Run migrations & collect static
sudo -u "${APP_USER}" bash -c "
    source ${BACKEND_DIR}/venv/bin/activate
    cd ${BACKEND_DIR}
    python manage.py migrate --noinput
    python manage.py collectstatic --noinput
"
log "Migrations + collectstatic done"

# ═══════════════════════════════════════════════════
# 7. FRONTEND BUILDS (Customer + Admin)
# ═══════════════════════════════════════════════════
step "7/9 — Frontend Builds"

FRONTEND_DIR="${APP_HOME}/printfrontend"
ADMIN_DIR="${APP_HOME}/printbackend/admin"

# Build customer frontend
log "Building customer frontend..."
sudo -u "${APP_USER}" bash -c "
    cd ${FRONTEND_DIR}
    npm ci
    VITE_API_URL=https://${DOMAIN_API}/api/v1 npm run build
"
log "Customer frontend built → ${FRONTEND_DIR}/dist"

# Build admin panel
log "Building admin panel..."
sudo -u "${APP_USER}" bash -c "
    cd ${ADMIN_DIR}
    npm ci
    npm run build
"
log "Admin panel built → ${ADMIN_DIR}/dist"

# ═══════════════════════════════════════════════════
# 8. SYSTEMD + NGINX
# ═══════════════════════════════════════════════════
step "8/9 — Systemd Service + Nginx"

# ── Gunicorn systemd service ──
cat > /etc/systemd/system/printdoot-backend.service << 'SVCEOF'
[Unit]
Description=PrintDoot Django Backend (Gunicorn)
After=network.target postgresql.service
Wants=postgresql.service

[Service]
User=printdoot
Group=www-data
WorkingDirectory=/home/printdoot/printbackend/backend
EnvironmentFile=/home/printdoot/printbackend/backend/.env

ExecStart=/home/printdoot/printbackend/backend/venv/bin/gunicorn \
    shop_project.wsgi:application \
    --bind 127.0.0.1:8000 \
    --workers 3 \
    --timeout 120 \
    --max-requests 1000 \
    --max-requests-jitter 50 \
    --access-logfile /var/log/printdoot/gunicorn-access.log \
    --error-logfile /var/log/printdoot/gunicorn-error.log \
    --log-level info

Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=printdoot-backend

NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
SVCEOF

systemctl daemon-reload
systemctl enable printdoot-backend
systemctl start printdoot-backend
log "Gunicorn service started"

# ── Nginx configs ──
# Remove default site
rm -f /etc/nginx/sites-enabled/default

# API
cat > /etc/nginx/sites-available/${DOMAIN_API} << APIEOF
upstream django_backend {
    server 127.0.0.1:8000;
}

server {
    listen 80;
    server_name ${DOMAIN_API};
    client_max_body_size 10M;

    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    location /static/ {
        alias ${BACKEND_DIR}/staticfiles/;
        expires 30d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    location /media/ {
        alias ${BACKEND_DIR}/media/;
        expires 7d;
        add_header Cache-Control "public";
        access_log off;
    }

    location / {
        proxy_pass http://django_backend;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 120s;
        proxy_connect_timeout 30s;
    }
}
APIEOF

# Frontend
cat > /etc/nginx/sites-available/${DOMAIN_FRONTEND} << FEEOF
server {
    listen 80;
    server_name ${DOMAIN_FRONTEND} www.${DOMAIN_FRONTEND};

    root ${FRONTEND_DIR}/dist;
    index index.html;

    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
FEEOF

# Admin
cat > /etc/nginx/sites-available/${DOMAIN_ADMIN} << ADMEOF
server {
    listen 80;
    server_name ${DOMAIN_ADMIN};

    root ${ADMIN_DIR}/dist;
    index index.html;

    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
ADMEOF

# Enable all sites
ln -sf /etc/nginx/sites-available/${DOMAIN_API} /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/${DOMAIN_FRONTEND} /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/${DOMAIN_ADMIN} /etc/nginx/sites-enabled/

nginx -t && systemctl reload nginx
log "Nginx configured and reloaded"

# ═══════════════════════════════════════════════════
# 9. FIREWALL + SSL
# ═══════════════════════════════════════════════════
step "9/9 — Firewall & SSL"

# UFW firewall
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 'Nginx Full'
ufw --force enable
log "Firewall configured (SSH + Nginx)"

# Fail2ban
systemctl enable fail2ban
systemctl start fail2ban
log "Fail2ban enabled"

echo ""
echo "  ╔══════════════════════════════════════════════════════════════╗"
echo "  ║               🎉  DEPLOYMENT COMPLETE!  🎉                  ║"
echo "  ╠══════════════════════════════════════════════════════════════╣"
echo "  ║                                                              ║"
echo "  ║  IMPORTANT — Complete these steps:                           ║"
echo "  ║                                                              ║"
echo "  ║  1. Edit .env with your real credentials:                    ║"
echo "  ║     nano ${BACKEND_DIR}/.env                                 ║"
echo "  ║                                                              ║"
echo "  ║  2. Point DNS A records to this server's IP:                 ║"
echo "  ║     ${DOMAIN_API}       → YOUR_SERVER_IP                     ║"
echo "  ║     ${DOMAIN_FRONTEND}  → YOUR_SERVER_IP                     ║"
echo "  ║     www.${DOMAIN_FRONTEND} → YOUR_SERVER_IP                  ║"
echo "  ║     ${DOMAIN_ADMIN}     → YOUR_SERVER_IP                     ║"
echo "  ║                                                              ║"
echo "  ║  3. Once DNS propagates, get SSL certificates:               ║"
echo "  ║     sudo certbot --nginx -d ${DOMAIN_API}                    ║"
echo "  ║     sudo certbot --nginx -d ${DOMAIN_FRONTEND} -d www.${DOMAIN_FRONTEND} ║"
echo "  ║     sudo certbot --nginx -d ${DOMAIN_ADMIN}                  ║"
echo "  ║                                                              ║"
echo "  ║  4. After SSL, set in .env:                                  ║"
echo "  ║     SECURE_SSL_REDIRECT=True                                 ║"
echo "  ║                                                              ║"
echo "  ║  5. Restart backend:                                         ║"
echo "  ║     sudo systemctl restart printdoot-backend                 ║"
echo "  ║                                                              ║"
echo "  ║  6. Create Django superuser:                                 ║"
echo "  ║     cd ${BACKEND_DIR}                                        ║"
echo "  ║     source venv/bin/activate                                 ║"
echo "  ║     python manage.py createsuperuser                         ║"
echo "  ║                                                              ║"
echo "  ╚══════════════════════════════════════════════════════════════╝"
echo ""

# ─── Useful commands ───
echo "  Quick Reference:"
echo "  ─────────────────"
echo "  Backend status:    sudo systemctl status printdoot-backend"
echo "  Backend logs:      sudo journalctl -u printdoot-backend -f"
echo "  Restart backend:   sudo systemctl restart printdoot-backend"
echo "  Nginx logs:        sudo tail -f /var/log/nginx/error.log"
echo "  Nginx reload:      sudo nginx -t && sudo systemctl reload nginx"
echo ""
