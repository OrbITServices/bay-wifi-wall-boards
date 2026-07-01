#!/bin/bash
set -e
cd "$(dirname "$0")"

clear
echo "==================================="
echo " Bay WiFi Wall Boards Installer"
echo "==================================="
echo
echo "1) Master Board"
echo "2) Display Board"
echo "3) Exit"
echo

read -p "Choose an option [1-3]: " choice

chmod +x install-pi.sh install-display.sh install-master.sh

case "$choice" in
  1)
    ./install-pi.sh
    ./install-master.sh
    ;;
  2)
    ./install-display.sh
    ;;
  3)
    exit 0
    ;;
  *)
    echo "Invalid option"
    exit 1
    ;;
esac

echo
read -p "Reboot now? [y/N]: " reboot_now
if [[ "$reboot_now" =~ ^[Yy]$ ]]; then
  sudo reboot
fi
