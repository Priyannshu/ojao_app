# ojao auth service — EC2 deployment

Self-hosted OTP + auth service that replaced the Firebase Cloud Functions flow.
Runs on AWS EC2 behind Nginx with a Let's Encrypt certificate, delivers OTPs
over the Fast2SMS WhatsApp API, and is managed by pm2.

- **Host:** `ubuntu@98.81.124.180`
- **Public URL:** `https://api.ojao.in` (health check: `GET /health` → `{"ok":true}`)
- **App dir:** `/home/ubuntu/ojao-auth`
- **Process manager:** pm2 (process name `ojao-auth`, survives reboot)

The Flutter client points at this via `AppConstants.apiBaseUrl` in
`lib/core/constants/app_constants.dart`.

---

## Endpoints

All are `POST` with a JSON body; non-200 returns `{ "message": "<user-facing text>" }`.

| Path                   | Body                                          | Purpose                          |
|------------------------|-----------------------------------------------|----------------------------------|
| `/health`              | —                                             | Liveness (`GET`)                 |
| `/auth/send-otp`       | `{ mobile, purpose }` (`register`\|`reset`)   | Send OTP via WhatsApp            |
| `/auth/register`       | `{ mobile, name, email, password, code }`     | Verify OTP + create account      |
| `/auth/reset-password` | `{ mobile, password, code }`                  | Verify OTP + reset password      |

Sign-in itself stays on Firebase Auth client-side (synthetic email
`<digits>@phone.ojao.app`); the server only owns OTP + account provisioning.

---

## Architecture

```
Flutter app ──HTTPS──▶ api.ojao.in (Nginx :443, Let's Encrypt)
                            │ reverse proxy
                            ▼
                    Node/Express :8080  (pm2: ojao-auth)
                       │            │
                 firebase-admin   Fast2SMS WhatsApp API
                 (Auth+Firestore) (OTP delivery)
```

---

## First-time setup (already done — recorded for rebuilds)

### 1. DNS
Cloudflare A record: `api` → `98.81.124.180`, **Proxy status: DNS only (grey
cloud)**. The grey cloud is required so certbot's HTTP-01 challenge reaches EC2.
(You may re-enable the orange proxy after the cert is issued if desired.)

### 2. Server dependencies
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs nginx
sudo npm install -g pm2
```

### 3. App code + secrets
```bash
# from your machine
scp -i /c/keys/default.pem server/{server.js,auth.js,package.json} \
    ubuntu@98.81.124.180:/home/ubuntu/ojao-auth/
scp -i /c/keys/default.pem <firebase-adminsdk>.json \
    ubuntu@98.81.124.180:/home/ubuntu/ojao-auth/serviceAccount.json

# on the server
cd /home/ubuntu/ojao-auth && npm install --omit=dev
chmod 600 serviceAccount.json .env
```

`.env` (chmod 600, never committed):
```
PORT=8080
GOOGLE_APPLICATION_CREDENTIALS=/home/ubuntu/ojao-auth/serviceAccount.json
FAST2SMS_API_KEY=<Fast2SMS Dev API authorization key>
FAST2SMS_PHONE_NUMBER_ID=<WhatsApp sender phone-number ID>
FAST2SMS_TEMPLATE_NAME=<approved utility template name>
FAST2SMS_TEMPLATE_LANG=en_US
```
Get the API key from Fast2SMS **Dashboard -> Dev API**. Get the phone-number ID
and approved utility template name from **Dashboard -> WhatsApp Manager**. The
utility template must contain exactly one body variable (`{{1}}`) for the
six-digit OTP. The API key is sent directly in the `Authorization` header
(without the `Bearer` prefix).

### 4. Nginx reverse proxy
`/etc/nginx/sites-available/api.ojao.in`:
```nginx
server {
    server_name api.ojao.in;
    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 30s;
    }
    listen 80;
}
```
```bash
sudo ln -s /etc/nginx/sites-available/api.ojao.in /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 5. TLS (Let's Encrypt)
```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.ojao.in
```
Certbot rewrites the server block to add the `:443` SSL block and an
HTTP→HTTPS redirect. Cert auto-renews via the packaged systemd timer
(`sudo certbot renew --dry-run` to verify). Current cert expires 2026-10-21.

### 6. Launch under pm2 (with reboot persistence)
```bash
cd /home/ubuntu/ojao-auth
pm2 start server.js --name ojao-auth
pm2 save
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

---

## Day-to-day operations

```bash
ssh -i /c/keys/default.pem ubuntu@98.81.124.180

pm2 status                 # is ojao-auth online?
pm2 logs ojao-auth         # tail logs
pm2 restart ojao-auth      # after .env or code change
curl -s https://api.ojao.in/health   # end-to-end check → {"ok":true}
```

### Deploying a code change
```bash
scp -i /c/keys/default.pem server/auth.js \
    ubuntu@98.81.124.180:/home/ubuntu/ojao-auth/
ssh -i /c/keys/default.pem ubuntu@98.81.124.180 'pm2 restart ojao-auth'
```

---

## Troubleshooting

| Symptom                         | Likely cause / fix                                            |
|---------------------------------|--------------------------------------------------------------|
| `502 Bad Gateway`               | Node not running → `pm2 restart ojao-auth`, check `pm2 logs`  |
| Cleartext / TLS error on client | App must use `https://` — confirm `apiBaseUrl` is HTTPS       |
| certbot challenge fails         | Cloudflare proxy must be **DNS-only** during issuance         |
| OTP never arrives               | Check Fast2SMS API key, balance, template approval, and logs  |
| Cert expiring                   | `sudo certbot renew` (timer usually handles it automatically) |
