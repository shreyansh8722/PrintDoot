#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════
# PrintDoot — Quick Update Script
# ═══════════════════════════════════════════════════════════
# Run after pushing new code to GitHub.
# Usage: sudo bash update.sh [backend|frontend|admin|all]
# ═══════════════════════════════════════════════════════════

set -euo pipefail

APP_USER="printdoot"
APP_HOME="/home/${APP_USER}"
BACKEND_DIR="${APP_HOME}/printbackend/backend"
FRONTEND_DIR="${APP_HOME}/printfrontend"
ADMIN_DIR="${APP_HOME}/printbackend/admin"
DOMAIN_API="api.printdoot.com"

GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

log() { echo -e "${GREEN}[✓]${NC} $1"; }

TARGET="${1:-all}"

update_backend() {
    echo -e "${CYAN}── Updating Backend ──${NC}"
    sudo -u "${APP_USER}" bash -c "
        source ${BACKEND_DIR}/venv/bin/activate
        cd ${BACKEND_DIR}
        pip install -r requirements.txt
        python manage.py migrate --noinput
        python manage.py collectstatic --noinput
    "
    systemctl restart printdoot-backend
    log "Backend updated & restarted"
}

update_frontend() {
    echo -e "${CYAN}── Updating Frontend ──${NC}"
    sudo -u "${APP_USER}" bash -c "
        cd ${FRONTEND_DIR}
        npm ci
        VITE_API_URL=https://${DOMAIN_API}/api/v1 npm run build
    "
    systemctl reload nginx
    log "Frontend rebuilt & Nginx reloaded"
}

update_admin() {
    echo -e "${CYAN}── Updating Admin Panel ──${NC}"
    sudo -u "${APP_USER}" bash -c "
        cd ${ADMIN_DIR}
        npm ci
        npm run build
    "
    systemctl reload nginx
    log "Admin rebuilt & Nginx reloaded"
}

case "${TARGET}" in
    backend)  update_backend ;;
    frontend) update_frontend ;;
    admin)    update_admin ;;
    all)
        update_backend
        update_frontend
        update_admin
        ;;
    *)
        echo "Usage: sudo bash update.sh [backend|frontend|admin|all]"
        exit 1
        ;;
esac

echo ""
log "Update complete!"
