
echo "Creating X startup..."
cat > ~/.xinitrc << 'EOF'
exec openbox-session
EOF

echo "Creating bash profile..."
cat > ~/.bash_profile << 'EOF'
if [ -z "$DISPLAY" ] && [ "$(tty)" = "/dev/tty1" ]; then
    startx
fi
EOF

echo ""
echo "Install complete."
echo ""
echo "Run:"
echo "pm2 startup"
echo ""
echo "Then execute the command it gives you."


