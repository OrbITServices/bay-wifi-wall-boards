# Bay WiFi Wall Boards

Digital signage and guest WiFi wallboard platform for Raspberry Pi.

## Features

* Guest WiFi display
* QR code generation
* Weather display
* Rotating slides
* Image and video support
* Admin portal
* Multi-page wallboards
* Full-screen kiosk mode
* Raspberry Pi deployment

---

# Recommended Hardware

## Minimum

* Raspberry Pi 3B+
* 16GB SD Card
* Raspberry Pi OS Legacy

## Recommended

* Raspberry Pi 4 2GB+
* 16GB+ SD Card or SSD

---

# Fresh Raspberry Pi Installation

Install:

* Raspberry Pi OS Legacy (32-bit)
* SSH enabled
* WiFi configured

Update system:

```bash
sudo apt update
sudo apt full-upgrade -y
sudo reboot
```

---

# Install Git

```bash
sudo apt install -y git
```

---

# Clone Repository

```bash
git clone git@github.com:OrbITServices/bay-wifi-wall-boards.git

cd bay-wifi-wall-boards
```

---

# Run Installer

```bash
chmod +x install.sh

./install.sh
```

---

# PM2 Startup

Run:

```bash
pm2 startup
```

Copy and run the command PM2 gives you.

Then:

```bash
pm2 save
```

---

# Application URLs

Admin:

```text
http://PI-IP:3000/admin
```

Display:

```text
http://PI-IP:3000/display
```

Health Check:

```text
http://PI-IP:3000/health
```

---

# Updating

```bash
cd ~/bay-wifi-wall-boards

git pull

npm install

pm2 restart baywifi
```

---

# Restart Application

```bash
pm2 restart baywifi
```

---

# Check Application Status

```bash
pm2 list
```

---

# View Logs

```bash
pm2 logs baywifi
```

---

# WiFi Configuration

List WiFi Networks:

```bash
nmcli device wifi list
```

Connect:

```bash
sudo nmcli device wifi connect "SSID" password "PASSWORD"
```

Check Current Connection:

```bash
nmcli connection show --active
```

---

# Git Workflow

Commit Changes:

```bash
git add .

git commit -m "Description of changes"

git push
```

Pull Latest Version:

```bash
git pull
```

---

# Useful Commands

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

GPU Memory:

```bash
vcgencmd get_mem gpu
```

---

# Browser

Current recommended browser:

```text
Falkon
```

Autostart:

```bash
falkon --fullscreen http://localhost:3000/display
```

---

# Backup

Backup WiFi:

```bash
sudo cp -r /etc/NetworkManager/system-connections ~/wifi-backup
```

Backup Environment:

```bash
cp .env .env.backup
```

---

# Release Process

```bash
git add .

git commit -m "Release"

git push

git tag v1.0.0

git push origin v1.0.0
```




