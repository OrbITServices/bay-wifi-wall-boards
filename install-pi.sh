#!/bin/bash
set -e
cd "$(dirname "$0")"
[ -f .env ] || cp .env.example .env
npm install
sudo npm install -g pm2
pm2 delete baywifi >/dev/null 2>&1 || true
pm2 start server.js --name baywifi
pm2 save
pm2 startup || true
echo "Admin: http://PI-IP:3000/admin"
echo "Display: http://PI-IP:3000/display"
