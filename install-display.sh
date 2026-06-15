#!/bin/bash
set -e

echo "Installing Bay WiFi Display Only..."

sudo apt update
sudo apt install -y xserver-xorg xinit openbox falkon unclutter

read -p "Enter master wallboard address, e.g. 192.168.1.10:3000: " MASTER

if [[ "$MASTER" != http* ]]; then
  MASTER="http://$MASTER"
fi

DISPLAY_URL="$MASTER/display"

mkdir -p ~/.baywifi
echo "$DISPLAY_URL" > ~/.baywifi/display-url.txt

mkdir -p ~/.config/openbox

cat > ~/.config/openbox/autostart <<EOF
xset s off &
xset -dpms &
xset s noblank &

unclutter -idle 0.5 -root &

sleep 15

falkon --fullscreen $DISPLAY_URL
EOF

cat > ~/.xinitrc <<EOF
exec openbox-session
EOF

cat > ~/.bash_profile <<EOF
if [ -z "\$DISPLAY" ] && [ "\$(tty)" = "/dev/tty1" ]; then
    startx
fi
EOF

sudo mkdir -p /etc/systemd/system/getty@tty1.service.d

sudo tee /etc/systemd/system/getty@tty1.service.d/autologin.conf > /dev/null <<EOF
[Service]
ExecStart=
ExecStart=-/sbin/agetty --autologin $USER --noclear %I \$TERM
EOF

sudo systemctl daemon-reload

echo ""
echo "Display-only install complete."
echo "Opening: $DISPLAY_URL"
echo ""
echo "Reboot with:"
echo "sudo reboot"
