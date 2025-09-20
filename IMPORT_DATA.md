# Import Data to Your Dokploy Database

## Quick Import (Copy & Paste This)

### Step 1: Open Dokploy Terminal
1. Go to your Dokploy dashboard
2. Find your application container: `webblog-bird-3ynfsd`
3. Click "Terminal" and select `/bin/sh`

### Step 2: Run This Command
Copy and paste this entire block:

```bash
psql $DATABASE_URI -f essential_data.sql && echo "✅ DATA IMPORTED! Refresh your website!"
```

If that doesn't work, try:

```bash
sh force-import.sh
```

## Alternative: Direct Database Connection

If you need to connect directly to the database, use:

```bash
# From inside the application container
DATABASE_URI="postgresql://postgres:2801@webblog-kawaiibirddb-gq00ip:5432/kawaii-bird-db"
psql $DATABASE_URI -f essential_data.sql
```

## Verify Import Success

After import, check if data exists:

```bash
psql $DATABASE_URI -c "SELECT COUNT(*) FROM posts;"
```

You should see "88" posts.

## Troubleshooting

If you get "psql: command not found":
```bash
# The container should have psql installed, but if not:
apk add postgresql-client
```

If you get connection errors:
```bash
# Check your environment
echo $DATABASE_URI
env | grep DB
```

## After Import
1. Exit the container: type `exit`
2. Refresh your website
3. You should see all posts and categories!

---

**Note**: The data includes:
- 88 blog posts about birds
- All categories (セキセイインコ, オカメインコ, etc.)
- Media references
- All content from your local development