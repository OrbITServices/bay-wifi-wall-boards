#!/bin/bash
set -e
cd "$(dirname "$0")"

echo "Installing Display Board..."

sudo apt update
sudo apt install -y \
  xserver-xorg x11-xserver-utils xinit openbox chromium-browser unclutter \
  avahi-daemon avahi-utils curl

sudo systemctl enable avahi-daemon
sudo systemctl restart avahi-daemon

mkdir -p "$HOME/.config/openbox"
mkdir -p "$HOME/bin"

cat > "$HOME/bin/baywifi-find-master.sh" <<'EOF'
#!/bin/bash

SERVICE="_baywifi._tcp"
FALLBACK_FILE="$HOME/.baywifi-master"

while true; do
  FOUND=$(avahi-browse -rt "$SERVICE" 2>/dev/null | awk -F';' '/=;.*IPv4/ {print $8 ":" $9; exit}')

  if [ -n "$FOUND" ]; then
    echo "$FOUND" > "$FALLBACK_FILE"
    echo "Found master: $FOUND"
    echo "http://$FOUND/display"
    exit 0
  fi

  if [ -f "$FALLBACK_FILE" ]; then
    OLD=$(cat "$FALLBACK_FILE")
    if [ -n "$OLD" ]; then
      echo "Using previous master: $OLD"
      echo "http://$OLD/display"
      exit 0
    fi
  fi

  echo "Waiting for Bay WiFi master..."
  sleep 5
done
EOF

chmod +x "$HOME/bin/baywifi-find-master.sh"

cat > "$HOME/.config/openbox/autostart" <<'EOF'
xset s off
xset -dpms
xset s noblank

unclutter -idle 0.1 &

while true; do
  URL="$($HOME/bin/baywifi-find-master.sh | tail -n 1)"

  chromium-browser \
    --kiosk \
    --noerrdialogs \
    --disable-infobars \
    --disable-session-crashed-bubble \
    --disable-features=TranslateUI \
    "$URL"

  sleep 5
done &
EOF

cat > "$HOME/.bash_profile" <<'EOF'
if [ -z "$DISPLAY" ] && [ "$(tty)" = "/dev/tty1" ]; then
    startx
fi
EOF

echo
echo "Display install/update complete."
echo "It will auto-discover the master using mDNS/Avahi."
echo
echo "IMPORTANT: run sudo raspi-config and enable:"
echo "System Options > Boot / Auto Login > Console Autologin"
echo
read -p "Reboot now? [y/N]: " rb
[[ "$rb" =~ ^[Yy]$ ]] && sudo reboot
