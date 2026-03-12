# 🚀 PrintDoot — Ubuntu 24.04 LTS Deployment Guide

Complete guide to deploy the PrintDoot e-commerce platform (Django API + React frontend + React admin) on a fresh Ubuntu 24.04 LTS server.

---

## Architecture Overview

```
                        ┌─────────────────────────┐
                        │      Ubuntu 24.04        │
                        │                          │
  printdoot.com ───────►│  Nginx ──► /dist (SPA)   │
  admin.printdoot.com ──│  Nginx ──► /dist (SPA)   │
  api.printdoot.com ────│  Nginx ──► Gunicorn:8000  │
                        │            ↓              │
                        │         Django/DRF        │
                        │            ↓              │
                        │        PostgreSQL         │
                        │            ↓              │
                        │       AWS S3 (media)      │
                        └─────────────────────────┘
```

| Component | Technology | Port |
|-----------|-----------|------|
| Customer Frontend | React + Vite (static files) | 80/443 via Nginx |
| Admin Panel | React + Vite (static files) | 80/443 via Nginx |
| Backend API | Django + Gunicorn | 8000 (proxied) |
| Database | PostgreSQL 16 | 5432 (local) |
| Media Storage | AWS S3 | — |
| Reverse Proxy | Nginx | 80/443 |
| SSL | Let's Encrypt (Certbot) | 443 |

---

## Prerequisites

- **Ubuntu 24.04 LTS** server (VPS/cloud — e.g. DigitalOcean, AWS EC2, Hetzner)
- **Root / sudo access**
- **Domain names** pointing to your server IP:
  - `printdoot.com` → `YOUR_SERVER_IP`
  - `www.printdoot.com` → `YOUR_SERVER_IP`
  - `api.printdoot.com` → `YOUR_SERVER_IP`
  - `admin.printdoot.com` → `YOUR_SERVER_IP`
- Your AWS, Instamojo, Shipmozo, Zakeke credentials ready

---

## Option A: Automated Deployment (Recommended)

### 1. Upload & run the deploy script

```bash
# SSH into your server
ssh root@YOUR_SERVER_IP

# Download the deploy script (or copy it from deploy/deploy.sh)
# If you've pushed to GitHub:
apt update && apt install -y git
git clone https://github.com/shreyansh8722/PrintDoot.git /tmp/printdoot-repo
cp /tmp/printdoot-repo/deploy/deploy.sh /root/deploy.sh
chmod +x /root/deploy.sh

# Run it
bash /root/deploy.sh
```

The script will:
1. Install all system packages (Nginx, PostgreSQL, Node.js 20, Python 3, etc.)
2. Create a `printdoot` system user
3. Set up PostgreSQL database (prompts for password)
4. Clone the repo and set up directory structure
5. Create Python venv, install dependencies
6. Build both React frontends
7. Set up Gunicorn systemd service
8. Configure Nginx for all 3 domains
9. Enable firewall (UFW) + Fail2ban

### 2. Edit the .env file

```bash
sudo nano /home/printdoot/printbackend/backend/.env
```

Fill in your real credentials for:
- Instamojo (API key, auth token, private salt)
- AWS S3 (access key, secret key)
- Shipmozo (public key, private key)
- Zakeke (client ID, secret key)
- Email (Gmail app password)

Then restart:
```bash
sudo systemctl restart printdoot-backend
```

### 3. Set up DNS

Point these A records to your server IP:

| Record | Type | Value |
|--------|------|-------|
| `@` | A | YOUR_SERVER_IP |
| `www` | A | YOUR_SERVER_IP |
| `api` | A | YOUR_SERVER_IP |
| `admin` | A | YOUR_SERVER_IP |

### 4. Get SSL certificates

Once DNS has propagated (check with `dig printdoot.com`):

```bash
sudo certbot --nginx -d api.printdoot.com
sudo certbot --nginx -d printdoot.com -d www.printdoot.com
sudo certbot --nginx -d admin.printdoot.com
```

Then enable SSL redirect in `.env`:
```bash
sudo nano /home/printdoot/printbackend/backend/.env
# Change: SECURE_SSL_REDIRECT=True
sudo systemctl restart printdoot-backend
```

### 5. Create Django superuser

```bash
cd /home/printdoot/printbackend/backend
source venv/bin/activate
python manage.py createsuperuser
```

---

## Option B: Manual Step-by-Step

### Step 1 — System packages

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential curl git wget unzip \
    software-properties-common ufw fail2ban certbot \
    python3-certbot-nginx libpq-dev python3-dev python3-pip \
    python3-venv nginx postgresql postgresql-contrib
```

### Step 2 — Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt install -y nodejs
node -v  # Should show v20.x
```

### Step 3 — Create app user

```bash
sudo adduser --disabled-password --gecos "PrintDoot" printdoot
sudo usermod -aG www-data printdoot
```

### Step 4 — PostgreSQL

```bash
sudo -u postgres psql
```

```sql
CREATE USER printdoot WITH PASSWORD 'YOUR_STRONG_PASSWORD';
CREATE DATABASE printdoot_db OWNER printdoot;
GRANT ALL PRIVILEGES ON DATABASE printdoot_db TO printdoot;
\q
```

### Step 5 — Clone code

```bash
sudo -u printdoot git clone https://github.com/shreyansh8722/PrintDoot.git /home/printdoot/repo
sudo -u printdoot mv /home/printdoot/repo/printbackend /home/printdoot/printbackend
sudo -u printdoot mv /home/printdoot/repo/printfrontend /home/printdoot/printfrontend
rm -rf /home/printdoot/repo
```

### Step 6 — Backend setup

```bash
# Create venv
sudo -u printdoot python3 -m venv /home/printdoot/printbackend/backend/venv

# Install dependencies
sudo -u printdoot bash -c "
    source /home/printdoot/printbackend/backend/venv/bin/activate
    pip install --upgrade pip
    pip install -r /home/printdoot/printbackend/backend/requirements.txt
    pip install gunicorn
"

# Create .env (copy from deploy/env.production template and fill in values)
sudo nano /home/printdoot/printbackend/backend/.env
sudo chown printdoot:printdoot /home/printdoot/printbackend/backend/.env
sudo chmod 600 /home/printdoot/printbackend/backend/.env

# Create directories
sudo -u printdoot mkdir -p /home/printdoot/printbackend/backend/{media,logs,staticfiles}
sudo mkdir -p /var/log/printdoot
sudo chown printdoot:www-data /var/log/printdoot

# Run migrations + collectstatic
sudo -u printdoot bash -c "
    source /home/printdoot/printbackend/backend/venv/bin/activate
    cd /home/printdoot/printbackend/backend
    python manage.py migrate --noinput
    python manage.py collectstatic --noinput
"
```

### Step 7 — Build frontends

```bash
# Customer frontend
sudo -u printdoot bash -c "
    cd /home/printdoot/printfrontend
    npm ci
    VITE_API_URL=https://api.printdoot.com/api/v1 npm run build
"

# Admin panel
sudo -u printdoot bash -c "
    cd /home/printdoot/printbackend/admin
    npm ci
    npm run build
"
```

### Step 8 — Gunicorn systemd service

```bash
sudo nano /etc/systemd/system/printdoot-backend.service
```

Paste the contents from `deploy/systemd/printdoot-backend.service`, then:

```bash
sudo systemctl daemon-reload
sudo systemctl enable printdoot-backend
sudo systemctl start printdoot-backend
sudo systemctl status printdoot-backend
```

### Step 9 — Nginx

Copy the 3 config files from `deploy/nginx/` to `/etc/nginx/sites-available/`, then:

```bash
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/api.printdoot.com /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/printdoot.com /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/admin.printdoot.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 10 — Firewall

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### Step 11 — SSL (after DNS propagation)

```bash
sudo certbot --nginx -d api.printdoot.com
sudo certbot --nginx -d printdoot.com -d www.printdoot.com
sudo certbot --nginx -d admin.printdoot.com

# Auto-renew test
sudo certbot renew --dry-run
```

---

## 🔄 Updating After Code Changes

After pushing new code to GitHub:

### Quick way (with update script):
```bash
# SSH into server
ssh root@YOUR_SERVER_IP

# Pull latest code
cd /home/printdoot/printbackend && sudo -u printdoot git pull
cd /home/printdoot/printfrontend && sudo -u printdoot git pull

# Run update script
sudo bash /home/printdoot/deploy/update.sh all
# Or update individually:
# sudo bash update.sh backend
# sudo bash update.sh frontend
# sudo bash update.sh admin
```

### Manual way:
```bash
# Backend
cd /home/printdoot/printbackend/backend
sudo -u printdoot bash -c "
    source venv/bin/activate
    pip install -r requirements.txt
    python manage.py migrate --noinput
    python manage.py collectstatic --noinput
"
sudo systemctl restart printdoot-backend

# Frontend
cd /home/printdoot/printfrontend
sudo -u printdoot bash -c "
    npm ci
    VITE_API_URL=https://api.printdoot.com/api/v1 npm run build
"
sudo systemctl reload nginx
```

---

## 🔍 Troubleshooting

### Check service status
```bash
sudo systemctl status printdoot-backend
sudo systemctl status nginx
sudo systemctl status postgresql
```

### View logs
```bash
# Gunicorn logs
sudo journalctl -u printdoot-backend -f --no-pager -n 50
sudo tail -f /var/log/printdoot/gunicorn-error.log

# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-16-main.log
```

### Common issues

| Issue | Solution |
|-------|----------|
| 502 Bad Gateway | Gunicorn not running: `sudo systemctl restart printdoot-backend` |
| Static files 404 | Run `collectstatic`: `source venv/bin/activate && python manage.py collectstatic` |
| DB connection error | Check .env DB credentials, check PostgreSQL is running: `sudo systemctl status postgresql` |
| Permission denied | Fix ownership: `sudo chown -R printdoot:www-data /home/printdoot/` |
| CORS errors | Check `CORS_ALLOWED_ORIGINS` in .env matches your actual domains |
| SSL cert expired | Renew: `sudo certbot renew` |

### Restart everything
```bash
sudo systemctl restart postgresql
sudo systemctl restart printdoot-backend
sudo systemctl reload nginx
```

---

## 📁 Server File Layout

```
/home/printdoot/
├── printbackend/
│   ├── admin/
│   │   ├── dist/          ← Admin panel build (served by Nginx)
│   │   ├── src/
│   │   └── package.json
│   └── backend/
│       ├── .env           ← Production secrets (chmod 600)
│       ├── venv/          ← Python virtual environment
│       ├── staticfiles/   ← Django collectstatic output
│       ├── media/         ← Local media (if S3 disabled)
│       ├── logs/          ← Django logs
│       ├── manage.py
│       ├── requirements.txt
│       └── shop_project/
└── printfrontend/
    ├── dist/              ← Customer frontend build (served by Nginx)
    ├── src/
    └── package.json

/etc/nginx/sites-available/
├── api.printdoot.com
├── printdoot.com
└── admin.printdoot.com

/etc/systemd/system/
└── printdoot-backend.service

/var/log/printdoot/
├── gunicorn-access.log
└── gunicorn-error.log
```

---

## 🔐 Security Checklist

- [x] UFW firewall (only SSH + HTTP/HTTPS)
- [x] Fail2ban for SSH brute-force protection
- [x] `.env` file is `chmod 600` (only owner can read)
- [x] Django `DEBUG=False` in production
- [x] HTTPS with Let's Encrypt auto-renewal
- [x] HSTS headers enabled
- [x] CORS restricted to specific domains
- [x] Rate limiting via DRF throttles
- [x] Security middleware (brute force, suspicious activity)
- [ ] Set up automated backups for PostgreSQL
- [ ] Set up server monitoring (e.g. UptimeRobot)

### PostgreSQL backup (recommended)
```bash
# Add to crontab: sudo crontab -e
0 3 * * * sudo -u printdoot pg_dump printdoot_db | gzip > /home/printdoot/backups/db-$(date +\%Y\%m\%d).sql.gz
```

```bash
# Create backups directory
sudo -u printdoot mkdir -p /home/printdoot/backups
```
