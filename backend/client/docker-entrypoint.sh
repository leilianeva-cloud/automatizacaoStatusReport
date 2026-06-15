#!/bin/sh
set -eu

DOMAIN="${LETSENCRYPT_DOMAIN:-localhost}"

LIVE_DIR=/etc/letsencrypt/live/current
REAL_DIR=/etc/letsencrypt/live/$DOMAIN
BOOTSTRAP_DIR=/etc/nginx/bootstrap-certs/$DOMAIN

mkdir -p "$LIVE_DIR" "$REAL_DIR" "$BOOTSTRAP_DIR" /var/www/certbot

use_bootstrap_cert() {
  ln -sf "$BOOTSTRAP_DIR/fullchain.pem" "$LIVE_DIR/fullchain.pem"
  ln -sf "$BOOTSTRAP_DIR/privkey.pem" "$LIVE_DIR/privkey.pem"
}

use_real_cert() {
  ln -sf "$REAL_DIR/fullchain.pem" "$LIVE_DIR/fullchain.pem"
  ln -sf "$REAL_DIR/privkey.pem" "$LIVE_DIR/privkey.pem"
}

if [ ! -f "$BOOTSTRAP_DIR/fullchain.pem" ] || [ ! -f "$BOOTSTRAP_DIR/privkey.pem" ]; then
  openssl req -x509 -nodes -newkey rsa:2048 -days 30 \
    -keyout "$BOOTSTRAP_DIR/privkey.pem" \
    -out "$BOOTSTRAP_DIR/fullchain.pem" \
    -subj "/CN=$DOMAIN" \
    -addext "subjectAltName=DNS:$DOMAIN"
fi

if [ -f "$REAL_DIR/fullchain.pem" ] && [ -f "$REAL_DIR/privkey.pem" ]; then
  use_real_cert
else
  use_bootstrap_cert
fi

nginx -g 'daemon off;' &
NGINX_PID=$!

LAST_CERT_TARGET="$(readlink -f "$LIVE_DIR/fullchain.pem" 2>/dev/null || true)"

while kill -0 "$NGINX_PID" 2>/dev/null; do
  if [ -f "$REAL_DIR/fullchain.pem" ] && [ -f "$REAL_DIR/privkey.pem" ]; then
    CURRENT_CERT_TARGET="$(readlink -f "$LIVE_DIR/fullchain.pem" 2>/dev/null || true)"

    if [ "$CURRENT_CERT_TARGET" != "$(readlink -f "$REAL_DIR/fullchain.pem" 2>/dev/null || true)" ]; then
      use_real_cert
      CURRENT_CERT_TARGET="$(readlink -f "$LIVE_DIR/fullchain.pem" 2>/dev/null || true)"
    fi

    if [ -n "$CURRENT_CERT_TARGET" ] && [ "$CURRENT_CERT_TARGET" != "$LAST_CERT_TARGET" ]; then
      LAST_CERT_TARGET="$CURRENT_CERT_TARGET"
      nginx -s reload
    fi
  fi

  sleep 60 &
  wait $!
done

wait "$NGINX_PID"