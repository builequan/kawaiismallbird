#!/bin/bash

echo "Fixing PostgreSQL configuration in the correct location..."

# Add Tailscale network to the correct pg_hba.conf
echo "Adding Tailscale network to PostgreSQL configuration..."
echo "
# Allow connections from all Tailscale IPs
host    all             all             100.0.0.0/8            md5" | sudo tee -a /Library/PostgreSQL/17/data/pg_hba.conf

echo "Restarting PostgreSQL..."
sudo /Library/PostgreSQL/17/bin/pg_ctl restart -D /Library/PostgreSQL/17/data

echo "PostgreSQL has been configured to accept Tailscale connections!"
echo "Now restart your Dokploy container and it should work."