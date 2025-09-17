#!/bin/bash

echo "Configuring PostgreSQL to allow Tailscale connections..."

# Backup the original file
sudo cp /Library/PostgreSQL/17/data/pg_hba.conf /Library/PostgreSQL/17/data/pg_hba.conf.backup

# Add Tailscale network access rule
echo "" | sudo tee -a /Library/PostgreSQL/17/data/pg_hba.conf
echo "# Allow connections from Tailscale network" | sudo tee -a /Library/PostgreSQL/17/data/pg_hba.conf
echo "host    all             all             100.0.0.0/8            md5" | sudo tee -a /Library/PostgreSQL/17/data/pg_hba.conf

echo "Restarting PostgreSQL..."
# Try different restart methods
sudo /Library/PostgreSQL/17/bin/pg_ctl restart -D /Library/PostgreSQL/17/data || \
sudo brew services restart postgresql@17 || \
sudo launchctl unload /Library/LaunchDaemons/postgresql-17.plist && sudo launchctl load /Library/LaunchDaemons/postgresql-17.plist

echo "PostgreSQL configuration updated!"
echo "Your app should now be accessible at http://100.94.235.84"