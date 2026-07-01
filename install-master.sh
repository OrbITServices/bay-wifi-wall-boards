#!/bin/bash
set -e
cd "$(dirname "$0")"

APP_DIR="$(pwd)"
USER_NAME="$(whoami)"

echo "Installing Master Board..."

sudo apt update
sudo apt install -y \
  nodejs npm git curl build-essential \
  xserver-xorg x11-xserver-utils xinit openbox chromium-browser unclutter \
  avahi-daemon avahi-utils

npm install
sudo npm install -g pm2

pm2 delete baywifi >/dev/null 2>&1 || true
pm2 start "$APP_DIR/server.js" --name baywifi
pm2 save

PM2_CMD=$(pm2 startup systemd -u "$USER_NAME" --hp "/home/$USER_NAME" | grep "sudo env" || true)
if [ -n "$PM2_CMD" ]; then
  echo "Running PM2 startup command..."
  eval "$PM2_CMD"
fi

echo "Creating Avahi master broadcast..."
sudo mkdir -p /etc/avahi/services
sudo tee /etc/avahi/services/baywifi.service >/dev/null <<EOF
<?xml version="1.0" standalone='no'?>
<!DOCTYPE service-group SYSTEM "avahi-service.dtd">
<service-group>
  <name>Bay WiFi Wall Boards Master</name>
  <service>
    <type>_baywifi._tcp</type>
    <port>3000</port>
    <txt-record>path=/display</txt-record>
  </service>
</service-group>
EOF

sudo systemctl enable avahi-daemon
sudo systemctl restart avahi-daemon

echo "Setting up master local display kiosk..."
mkdir -p "$HOME/.config/openbox"

cat > "$HOME/.config/openbox/autostart" <<EOF
xset s off
xset -dpms
xset s noblank

unclutter -idle 0.1 &

chromium-browser \\
  --kiosk \\
  --noerrdialogs \\
  --disable-infobars \\
  --disable-session-crashed-bubble \\
  --disable-features=TranslateUI \\
  http://localhost:3000/display &
EOF

cat > "$HOME/.bash_profile" <<'EOF'
if [ -z "$DISPLAY" ] && [ "$(tty)" = "/dev/tty1" ]; then
    startx
fi
EOF

echo
echo "Master install/update complete."
echo "Admin:   http://$(hostname -I | awk '{print $1}'):3000/admin"
echo "Display: http://$(hostname -I | awk '{print $1}'):3000/display"
echo
echo "IMPORTANT: run sudo raspi-config and enable:"
echo "System Options > Boot / Auto Login > Console Autologin"
echo
read -p "Reboot now? [y/N]: " rb
[[ "$rb" =~ ^[Yy]$ ]] && sudo reboot
