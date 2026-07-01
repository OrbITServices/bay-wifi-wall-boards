#!/bin/bash
set -e
cd "$(dirname "$0")"

clear
echo "==================================="
echo " Bay WiFi Wall Boards Installer"
echo "==================================="
echo
echo "1) Install / Update Master Board"
echo "2) Install / Update Display Board"
echo "3) Exit"
echo

read -p "Choose an option [1-3]: " choice

chmod +x install-master.sh install-display.sh install-pi.sh

case "$choice" in
  1)
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
