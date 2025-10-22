# VPS Deployment Guide - Dokploy with Fresh Bird Articles

## Your VPS Configuration

**Database URI:** `postgresql://postgres:2801@webblog-kawaiibirddb-gq00ip:5432/kawaii-bird-db`

**What was fixed:**
1. ✅ GoogleAnalytics Suspense error (site now loads)
2. ✅ Cache busting updated (forces fresh build)
3. ✅ Code pushed to GitHub (ready for Dokploy)

## Dokploy Environment Variables

Set these in your Dokploy dashboard under **Environment Variables**:

```env
DATABASE_URI=postgresql://postgres:2801@webblog-kawaiibirddb-gq00ip:5432/kawaii-bird-db
PAYLOAD_SECRET=76a2b7954f87ee6abbe2924dbbc2b1be198dc0bc1d008abea0228863f1aed42d
NEXT_PUBLIC_SERVER_URL=https://your-domain.traefik.me
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
```

**For first deployment, also add:**
```env
FORCE_DB_REINIT=true
```

**Important:** After first successful deployment, **REMOVE** `FORCE_DB_REINIT=true` to preserve your data.

## Deployment Steps

### Step 1: Configure Dokploy

1. Open your Dokploy dashboard
2. Go to your application settings
3. Navigate to **Environment Variables**
4. Add all variables listed above
5. **Save** the configuration

### Step 2: Trigger Deployment

Dokploy should auto-deploy since we pushed to GitHub. If not:

1. Go to your application in Dokploy
2. Click **Deploy** or **Redeploy**
3. Wait for build to complete (5-10 minutes)

### Step 3: Monitor Deployment

Watch the build logs for these key messages:

✅ **Success indicators:**
```
✓ Ready in XX.Xs
🔥 FORCE CLEAN IMPORT - Dropping ALL tables
✅ Schema created
✅ Import complete:
   📝 Posts: 366
   📁 Categories: XX
   🖼️  Media: XXX
🎉 CLEAN IMPORT SUCCESSFUL!
Starting Next.js server on port 3000...
```

❌ **Error indicators to watch for:**
```
❌ ERROR: DATABASE_URI not set
❌ Data import failed
❌ NULL parent_id
Error: Bail out to client-side rendering: useSearchParams()
```

## Expected Results

After successful deployment:

### Database Content
- **Posts:** 366 bird articles
- **Categories:** ~50 hierarchical categories
- **Media:** ~700+ images (hero + section images)
- **Users:** 0 (empty for registration screen)

### Site Features
- ✅ Homepage loads without errors
- ✅ Articles display with hero images
- ✅ Category navigation works
- ✅ Search functionality active
- ✅ Admin panel accessible at `/admin`
- ✅ Registration screen appears (create admin)

## Current Deployment Status

### What's Deployed:
1. **Fixed GoogleAnalytics Suspense error** - Site won't crash on load
2. **Updated cache busting** - Forces complete rebuild
3. **366-post SQL dump** - Ready to import

### What Data Will Be Used:

The deployment uses `production-data-366-posts-fixed.sql.gz` which contains:
- 366 Japanese bird articles
- All categories and hierarchies
- Media references with correct IDs

## Troubleshooting

### Issue: Admin Panel Shows Blank/White Screen

**Check version table:**
```bash
# SSH into your Dokploy container
docker exec -it your-container sh

# Check for NULL parent_id issues
psql $DATABASE_URI -c "SELECT COUNT(*) FROM _posts_v WHERE parent_id IS NULL;"
```

**If you see ANY rows with NULL parent_id:**
```bash
# The entrypoint script should fix this automatically
# If not, manually run:
psql $DATABASE_URI -c "DELETE FROM _posts_v WHERE parent_id IS NULL;"

# Then restart container
```

### Issue: Hero Images Not Displaying

**Check media URLs:**
```bash
psql $DATABASE_URI -c "SELECT id, url, filename FROM media LIMIT 5;"
```

URLs should look like:
- ✅ `/media/filename.jpg` (CORRECT)
- ❌ `/api/media/file/filename.jpg` (WRONG - will be auto-fixed)
- ❌ `https://external-url.com/...` (WRONG - will be auto-fixed)

The `docker-entrypoint.sh` automatically converts these to correct format.

### Issue: No Posts Showing

**Check database:**
```bash
# Count posts
psql $DATABASE_URI -c "SELECT COUNT(*) FROM posts WHERE _status = 'published';"

# Should return: 366
```

**If 0 or wrong number:**
```bash
# Set FORCE_DB_REINIT=true in Dokploy environment variables
# Then redeploy
```

### Issue: Categories Missing

**Check categories:**
```bash
psql $DATABASE_URI -c "SELECT COUNT(*) FROM categories;"

# Should return: ~50
```

**If missing:**
The `docker-entrypoint.sh` has inline category creation (lines 289-367).
Categories will be auto-created if missing.

## Post-Deployment Verification

### 1. Check Homepage
```bash
curl -I https://your-domain.traefik.me/
# Should return: HTTP/2 200
```

### 2. Check Admin Panel
Visit: `https://your-domain.traefik.me/admin`
- Should show: **Registration screen**
- Create your admin account

### 3. Check Sample Post
Visit any post URL from the homepage
- Hero image should display
- Content should load
- No JavaScript errors in console

### 4. Check Database Stats
```bash
# Total posts
psql $DATABASE_URI -tAc "SELECT COUNT(*) FROM posts WHERE _status = 'published';"

# Posts with hero images
psql $DATABASE_URI -tAc "SELECT COUNT(*) FROM posts WHERE hero_image_id IS NOT NULL;"

# Media files
psql $DATABASE_URI -tAc "SELECT COUNT(*) FROM media;"
```

**Expected:**
- Posts: 366
- Posts with hero: ~366
- Media: ~700+

## Important Notes

### Media Files

Media files are **included in the Docker image** (Dockerfile line 73):
```dockerfile
COPY --from=builder /app/public/media ./public/media
```

This means:
- ✅ Images available immediately on deployment
- ✅ No download delay
- ✅ Reliable image serving

### Database Persistence

Your PostgreSQL database is **separate from the app container**:
- Database: `webblog-kawaiibirddb-gq00ip:5432`
- Database name: `kawaii-bird-db`

This means:
- ✅ Data persists across deployments
- ✅ Only first deployment imports data
- ⚠️ Use `FORCE_DB_REINIT=true` to reimport (DELETES ALL DATA)

### Build Cache

The Dockerfile has cache busting:
```dockerfile
ARG REBUILD_TIMESTAMP=2025-01-22-SUSPENSE-FIX-GOOGLE-ANALYTICS
```

This ensures:
- ✅ Complete rebuild with new code
- ✅ Suspense fix included
- ✅ Latest dependencies

## Monitoring Deployment

### Watch Dokploy Logs

Look for this sequence:
```
1. Docker build starts
2. Dependencies install
3. Next.js build completes
4. Container starts
5. Database initialization begins
6. Tables dropped (if FORCE_DB_REINIT=true)
7. Schema created
8. Data imported
9. Media URLs fixed
10. Post versions created
11. Next.js server starts
12. ✅ Ready to accept connections
```

### Common Log Messages

**GOOD:**
```
✅ Data import successful!
✅ All versions have valid parent_id
✅ All media URLs are using local paths
🎉 CLEAN IMPORT SUCCESSFUL!
Starting main Next.js application...
✓ Ready in X.Xs
```

**BAD (need action):**
```
❌ ERROR: DATABASE_URI environment variable is not set!
❌ Data import failed
❌ CRITICAL: Still have XX versions with NULL parent_id
⚠️ Some media URLs may still need fixing
```

## Emergency Rollback

If deployment fails completely:

1. **In Dokploy:** Set environment variable:
   ```
   USE_SIMPLE_SERVER=true
   ```

2. **Redeploy** - This uses a diagnostic server instead of full app

3. **Check logs** to see specific error

4. **Fix issue** then remove `USE_SIMPLE_SERVER` and redeploy

## Next Steps After Successful Deployment

1. **Create Admin Account**
   - Visit `/admin`
   - Register first user (becomes admin)
   - Login

2. **Verify Content**
   - Check random posts
   - Verify images load
   - Test search
   - Test categories

3. **Remove FORCE_DB_REINIT**
   - Go to Dokploy environment variables
   - Delete `FORCE_DB_REINIT=true`
   - Save (don't redeploy unless needed)

4. **Set Up Backups** (recommended)
   ```bash
   # Manual backup command
   docker exec -it your-db-container pg_dump -U postgres kawaii-bird-db | gzip > backup-$(date +%Y%m%d).sql.gz
   ```

## Need Fresh Bird Articles Data?

If you want to import fresh articles from `F:\blog\articles\workspace\bird`:

1. **Locally:** Run the export script
   ```bash
   cd f:/blog/kawaiismallbird/kawaiitorichan
   pnpm tsx scripts/export-bird-to-production.ts
   ```

2. **Update Dockerfile** to use new SQL file
   ```dockerfile
   COPY --from=builder /app/production-data-fresh-bird.sql.gz ./
   ```

3. **Update force-clean-import.sh**
   ```bash
   if [ -f production-data-fresh-bird.sql.gz ]; then
   ```

4. **Commit and push**

5. **Set FORCE_DB_REINIT=true** in Dokploy

6. **Deploy**

For now, the existing `production-data-366-posts-fixed.sql.gz` will work fine!

---

## Summary

✅ **Code pushed to GitHub** with Suspense fix
✅ **Cache busting updated** for fresh build
✅ **Environment variables documented** for Dokploy
✅ **Deployment will auto-trigger** when you configure Dokploy
✅ **Site will load properly** without useSearchParams error
✅ **366 bird articles** will be imported
✅ **Admin panel** will be accessible

**Your next action:** Configure environment variables in Dokploy dashboard, then deployment will auto-trigger!
