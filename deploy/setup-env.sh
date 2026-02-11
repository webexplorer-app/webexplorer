#!/usr/bin/env bash
set -euo pipefail

if [[ $EUID -ne 0 ]]; then
  echo "Run this script as root (sudo)." >&2
  exit 1
fi

DOMAIN="${WEBEXPLORER_DOMAIN:-www.webexplorer.app}"
WEB_ROOT="${WEBEXPLORER_ROOT:-/var/www/www.webexplorer.app}"
EMAIL="${LETSENCRYPT_EMAIL:-}"
NGINX_SITE="/etc/nginx/sites-available/$DOMAIN"
NGINX_LINK="/etc/nginx/sites-enabled/$DOMAIN"

if [[ -z "$EMAIL" ]]; then
  echo "Set LETSENCRYPT_EMAIL to a valid address before running this script." >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive

echo "Updating apt metadata and installing core packages..."
apt-get update
apt-get install -y --no-install-recommends \
  nginx \
  certbot \
  python3-certbot-nginx \
  git \
  rsync \
  curl \
  gnupg \
  ca-certificates \
  lsb-release

if ! command -v node >/dev/null 2>&1; then
  echo "Installing Node.js 20.x from NodeSource..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y --no-install-recommends nodejs
fi

mkdir -p "$WEB_ROOT"
chown -R www-data:www-data "$WEB_ROOT"

cat > "$NGINX_SITE" <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;

    root $WEB_ROOT;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /socket.io/ {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
    }

    location /api/ {
        proxy_pass http://localhost:8080;
        proxy_set_header Host \$host;
    }
}
EOF

ln -sf "$NGINX_SITE" "$NGINX_LINK"
if [[ -f /etc/nginx/sites-enabled/default ]]; then
  rm /etc/nginx/sites-enabled/default
fi

nginx -t
systemctl enable --now nginx
systemctl reload nginx

certbot --nginx \
  --domain "$DOMAIN" \
  --email "$EMAIL" \
  --non-interactive \
  --agree-tos \
  --redirect \
  --no-eff-email

echo "Environment ready. Place build artifacts in $WEB_ROOT (use deploy/deploy-web.sh)."
