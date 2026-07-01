#!/bin/bash
set -e

echo "==================================="
echo " Bay WiFi Wall Boards Installer"
echo "==================================="

chmod +x install-pi.sh
chmod +x install-display.sh
chmod +x install-master.sh

./install-pi.sh
./install-display.sh
./install-master.sh

echo
echo "Installation complete!"
echo "Rebooting in 5 seconds..."
sleep 5
sudo reboot
