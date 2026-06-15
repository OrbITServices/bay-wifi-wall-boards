# Bay WiFi Wall Boards

Bay WiFi Wall Boards is a Raspberry Pi based digital signage and guest information platform designed for holiday parks, guest accommodation, reception areas and waiting rooms.

The system supports two deployment modes:

## Master Mode

Runs:

* Bay WiFi application
* Admin portal
* Database
* File uploads
* Display screen

A Master Wallboard manages all content.

Example:

```text
http://192.168.1.10:3000
```

---

## Display Mode

Runs:

* Raspberry Pi OS
* Falkon Browser
* Kiosk Mode

A Display Wallboard does not run the application locally.

Instead it connects to a Master Wallboard and displays:

```text
http://MASTER-IP:3000/display
```

This allows multiple screens to be managed from a single Master installation.

---

# Recommended Hardware

## Master

Recommended:

* Raspberry Pi 4 (2GB+)
* Synology NAS (Docker)
* VPS
* Linux Server

Minimum:

* Raspberry Pi 3B+

---

## Display

Recommended:

* Raspberry Pi 3B+
* Raspberry Pi 4
* Raspberry Pi Zero 2W

---

# Installation

Install Raspberry Pi OS Legacy.

Enable:

* SSH
* WiFi

Update the system:

```bash
sudo apt update
sudo apt full-upgrade -y
sudo reboot
```

Install Git:

```bash
sudo apt install -y git
```

Clone Repository:

```bash
git clone git@github.com:OrbITServices/bay-wifi-wall-boards.git

cd bay-wifi-wall-boards
```

Run Installer:

```bash
chmod +x install.sh

./install.sh
```

---

# Installation Types

The installer will ask:

```text
1) Master
2) Display Only
```

## Master

Installs:

* Node.js
* PM2
* Bay WiFi Wall Boards
* Admin Portal
* Local Display

## Display Only

Installs:

* X11
* Openbox
* Falkon
* Kiosk Mode

Prompts for:

```text
Master Wallboard Address
```

Example:

```text
192.168.1.10:3000
```

The display will automatically launch:

```text
http://192.168.1.10:3000/display
```

---

# Application URLs

## Admin Portal

```text
http://SERVER-IP:3000/admin
```

## Display

```text
http://SERVER-IP:3000/display
```

## Health Check

```text
http://SERVER-IP:3000/health
```

---

# PM2 Commands

View Status:

```bash
pm2 list
```

Restart:

```bash
pm2 restart baywifi
```

Logs:

```bash
pm2 logs baywifi
```

Save Configuration:

```bash
pm2 save
```

Enable Startup:

```bash
pm2 startup
```

Run the command PM2 provides.

---

# Updating

Update to latest version:

```bash
cd ~/bay-wifi-wall-boards

git pull

npm install

pm2 restart baywifi
```

---

# WiFi Configuration

List Networks:

```bash
nmcli device wifi list
```

Connect:

```bash
sudo nmcli device wifi connect "SSID" password "PASSWORD"
```

Show Current Connection:

```bash
nmcli connection show --active
```

Show IP Address:

```bash
hostname -I
```

---

# Display Settings

Disable Screen Blanking:

```bash
DISPLAY=:0 xset s off
DISPLAY=:0 xset -dpms
DISPLAY=:0 xset s noblank
```

Verify:

```bash
DISPLAY=:0 xset q
```

---

# Git Workflow

Commit Changes:

```bash
git add .

git commit -m "Description"

git push
```

Pull Changes:

```bash
git pull
```

---

# Release Process

Create Release:

```bash
git tag v1.0.0

git push origin v1.0.0
```

---

# Troubleshooting

Application Status:

```bash
pm2 list
```

Memory Usage:

```bash
free -h
```

CPU Usage:

```bash
top
```

Disk Space:

```bash
df -h
```

Network:

```bash
ping google.com
```

---

# Future Roadmap

* Master auto-discovery
* Multiple display groups
* Remote display management
* Synology package
* Docker deployment
* Cloud hosted management
* Automatic updates
* First boot setup wizard

