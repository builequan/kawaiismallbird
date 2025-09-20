# How to Import Your 115 Posts to Dokploy

## Step 1: Get Your Dokploy Database Connection Info

1. **Login to Dokploy Dashboard**
   - Go to your Dokploy admin panel
   - Navigate to your PostgreSQL database service

2. **Find Database Connection Details**
   Look for these in your Dokploy database settings:
   ```
   Internal Connection URL: postgresql://postgres:YOUR_PASSWORD@postgres-service:5432/your-database
   External Connection URL: postgresql://postgres:YOUR_PASSWORD@YOUR_SERVER_IP:EXTERNAL_PORT/your-database
   ```

   From the **External Connection URL**, you need:
   - **Host**: Your server IP or domain (e.g., `123.456.789.0` or `your-server.com`)
   - **Password**: The PostgreSQL password
   - **Port**: Usually `5432` or the external port Dokploy shows
   - **Database**: Your database name (e.g., `kawaii-bird-db`)

## Step 2: Run the Direct Export Script

1. **Edit the export script with your details:**
   ```bash
   cd /Users/builequan/Desktop/web/kawaiismallbird/kawaiitorichan
   nano scripts/export-to-dokploy.sh
   ```

2. **Update these lines with your Dokploy info:**
   ```bash
   # Change these lines:
   DOKPLOY_DB="kawaii-bird-db"              # Your database name
   DOKPLOY_USER="postgres"                   # Usually "postgres"
   DOKPLOY_PASS="your-actual-password"      # Your PostgreSQL password
   DOKPLOY_HOST="123.456.789.0"            # Your server IP or domain
   DOKPLOY_PORT="5432"                      # Port (usually 5432)
   ```

3. **Run the script:**
   ```bash
   bash scripts/export-to-dokploy.sh
   ```

## What the Script Does

The script will:
1. Connect to your LOCAL database (golfer) with your 115 posts
2. Connect to your DOKPLOY database
3. Stream all data directly (no large files created!)
4. Transfer: posts, categories, media, users, and all relationships
5. Show you how many posts were imported

## Example

If your Dokploy shows:
```
External URL: postgresql://postgres:MyPass123@95.217.134.142:5432/birdsite
```

Then update the script to:
```bash
DOKPLOY_DB="birdsite"
DOKPLOY_USER="postgres"
DOKPLOY_PASS="MyPass123"
DOKPLOY_HOST="95.217.134.142"
DOKPLOY_PORT="5432"
```

## Troubleshooting

**"Connection refused" error:**
- Make sure you're using the EXTERNAL connection details, not internal
- Check if PostgreSQL port is open in Dokploy firewall
- Try using your server's IP address instead of domain

**"Authentication failed" error:**
- Double-check the password (copy it exactly from Dokploy)
- Make sure username is correct (usually "postgres")

**"Database does not exist" error:**
- Verify the database name in Dokploy
- Make sure the app has created the database first

## Alternative: Manual Check

You can test the connection first:
```bash
# Test if you can connect (replace with your details)
PGPASSWORD=your-password psql -h your-server-ip -p 5432 -U postgres -d your-database -c "SELECT COUNT(*) FROM posts;"
```

If this works and shows "3 posts", then the export script will work to add all 115 posts!