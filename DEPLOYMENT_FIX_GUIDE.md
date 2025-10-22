# Deployment Fix Guide - Bird Articles with Hero Images

## Problem Summary

Your deployment is using old SQL data (`production-data-366-posts-fixed.sql.gz`) instead of your fresh bird articles from `F:\blog\articles\workspace\bird`. This causes:

1. ❌ Articles don't show hero images (wrong media IDs)
2. ❌ Admin panel may not be accessible
3. ❌ Fresh content not deployed

## Root Causes

1. **Data Mismatch**: Dockerfile copies old SQL dump, ignores fresh markdown files
2. **Missing Import**: Import scripts exist but never run during deployment
3. **Media ID Confusion**: Old dump has different media IDs than fresh imports

## Complete Solution

### Step 1: Export Fresh Bird Articles to Production SQL

Run this command to import all 366 bird articles and export to production-ready SQL:

```bash
cd f:/blog/kawaiismallbird/kawaiitorichan
pnpm tsx scripts/export-bird-to-production.ts
```

This will:
- ✅ Import all 366 markdown files from `F:\blog\articles\workspace\bird`
- ✅ Upload all hero and section images with correct IDs
- ✅ Create Lexical content with embedded images
- ✅ Assign proper categories
- ✅ Export to `production-data-fresh-bird.sql.gz`

### Step 2: Update Dockerfile to Use Fresh Data

Edit `kawaiitorichan/Dockerfile` line 68:

**Before:**
```dockerfile
COPY --from=builder /app/production-data-366-posts-fixed.sql.gz ./
```

**After:**
```dockerfile
COPY --from=builder /app/production-data-fresh-bird.sql.gz ./
```

### Step 3: Update force-clean-import.sh

Edit `kawaiitorichan/force-clean-import.sh` line 61:

**Before:**
```bash
if [ -f production-data-366-posts-fixed.sql.gz ]; then
```

**After:**
```bash
if [ -f production-data-fresh-bird.sql.gz ]; then
  gunzip -c production-data-fresh-bird.sql.gz | psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" 2>&1 | grep -v "NOTICE"
```

### Step 4: Update Cache Busting in Dockerfile

Edit `kawaiitorichan/Dockerfile` line 12:

```dockerfile
ARG REBUILD_TIMESTAMP=2025-01-22-FRESH-BIRD-ARTICLES-366
```

This forces a complete rebuild.

### Step 5: Commit and Deploy

```bash
# Add the new SQL file to git
git add kawaiitorichan/production-data-fresh-bird.sql.gz

# Commit changes
git add kawaiitorichan/Dockerfile kawaiitorichan/force-clean-import.sh
git commit -m "FIX: Use fresh bird articles with correct hero images"

# Push to trigger Dokploy rebuild
git push origin master
```

### Step 6: Set Dokploy Environment Variables

In Dokploy dashboard, ensure these are set:

```env
DATABASE_URI=postgresql://postgres:password@your-db-host:5432/your-db-name
PAYLOAD_SECRET=your-secret-key-here-min-32-chars
NEXT_PUBLIC_SERVER_URL=https://your-domain.com
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
FORCE_DB_REINIT=true
```

**Important**: Set `FORCE_DB_REINIT=true` for the first deployment to force clean import. After successful deployment, remove this variable.

### Step 7: Verify Deployment

After deployment:

1. **Check Logs**: Look for "🎉 CLEAN IMPORT SUCCESSFUL!"
2. **Verify Counts**:
   - Posts: 366
   - Media: ~700+ (hero + section images)
   - Categories: ~50
3. **Access Admin**: Go to `https://your-domain.com/admin`
   - You should see registration screen (create admin account)
4. **Check Articles**: Visit homepage, verify hero images display

## Troubleshooting

### Admin Panel Not Loading

```bash
# SSH into Dokploy container
docker exec -it your-container sh

# Check database
psql $DATABASE_URI -c "SELECT COUNT(*) FROM users;"

# Should return 0 (empty users table = registration screen)
# If not, clear it:
psql $DATABASE_URI -c "DELETE FROM users;"
```

### Hero Images Not Showing

```bash
# Check media IDs in database
psql $DATABASE_URI -c "SELECT id, filename FROM media ORDER BY id LIMIT 10;"

# Check posts reference correct media IDs
psql $DATABASE_URI -c "SELECT id, title, hero_image_id FROM posts LIMIT 10;"

# Media IDs should match
```

### Media Files Missing

```bash
# Check media directory
ls -la /app/public/media | head -20

# Should show image files
# If missing, media sync failed - check logs
tail -f /app/media-sync.log
```

### Force Clean Reimport

If deployment fails, set this in Dokploy:

```env
FORCE_DB_REINIT=true
```

Then redeploy. This will:
1. Drop all tables
2. Recreate schema
3. Import fresh data
4. Download media files

## Alternative: Manual SQL Import

If you prefer to use existing SQL dumps:

```bash
# Option 1: Export from local database
cd f:/blog/kawaiismallbird/kawaiitorichan
./export-and-deploy-366.sh

# Option 2: Use init-bird-production.sh
# It will download from GitHub if file not found
```

## Expected Results

After successful deployment:

✅ All 366 bird articles imported
✅ Hero images display on all posts
✅ Section images embedded in content
✅ Categories properly assigned
✅ Admin panel accessible (registration screen)
✅ SEO meta tags populated
✅ Japanese language content displayed

## Post-Deployment Checklist

- [ ] Admin registration completed
- [ ] Sample post displays hero image
- [ ] Homepage shows recent posts with images
- [ ] Category pages work
- [ ] Search functionality works
- [ ] Media files loading (not 404)
- [ ] SEO meta tags present (view source)
- [ ] Mobile responsive
- [ ] Performance acceptable

## Need Help?

Check these files for details:
- `docker-entrypoint.sh` - Main initialization logic
- `force-clean-import.sh` - Clean import script
- `init-bird-production.sh` - Production data import
- `smart-media-sync.sh` - Media file downloads

Look for these log messages:
- ✅ "CLEAN IMPORT SUCCESSFUL!" = database ready
- ✅ "Media sync started" = media downloading
- ❌ "Import failed" = check DATABASE_URI
- ❌ "NULL parent_id" = version table issue
