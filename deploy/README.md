## Deployment Utilities

This directory contains helper scripts for provisioning the Nginx/Let's Encrypt stack that serves https://www.webexplorer.app/ and for pushing the latest frontend assets.

### setup-env.sh

Bootstraps a host by installing Nginx, Certbot, Git, rsync, curl, and (if absent) Node.js 20.x, configuring the `www.webexplorer.app` virtual host, and issuing a Let's Encrypt certificate.

```
sudo env LETSENCRYPT_EMAIL=admin@webexplorer.app deploy/setup-env.sh

# Optional overrides
sudo env \
	LETSENCRYPT_EMAIL=admin@webexplorer.app \
	WEBEXPLORER_DOMAIN=www.webexplorer.app \
	WEBEXPLORER_ROOT=/srv/www/webexplorer \
	deploy/setup-env.sh
```

- Requires root (run via `sudo`).
- `LETSENCRYPT_EMAIL` must be supplied so certificate expiry alerts reach you.
- `WEBEXPLORER_DOMAIN` and `WEBEXPLORER_ROOT` default to `www.webexplorer.app` and `/var/www/www.webexplorer.app`.
- Creates the Nginx site, enables it, restarts Nginx, and runs `certbot --nginx --redirect` so HTTPS becomes the default.
- Before running, ensure the DNS A/AAAA records for the domain already point at this server so the ACME HTTP-01 challenge can succeed.

### deploy-web.sh

Builds `@webexplorer/web` and syncs the `packages/web/dist` folder into the Nginx document root (default `/var/www/www.webexplorer.app`).

```
chmod +x deploy/deploy-web.sh
./deploy/deploy-web.sh                         # default target
./deploy/deploy-web.sh /srv/www/webexplorer    # explicit path
DEPLOY_TARGET=/srv/nginx/webexplorer ./deploy/deploy-web.sh
```

- Installs npm workspaces on first run if `node_modules` is missing.
- Requires `npm` and `rsync`.
- Uses `rsync -av --delete` so the target directory mirrors the latest build.
