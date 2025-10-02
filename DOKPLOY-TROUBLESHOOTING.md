# Dokploy Deployment Troubleshooting Guide

## Common Issues and Solutions

### Issue 1: Build Fails with TypeScript Errors

**Symptoms:**
- Build stops during compilation
- TypeScript errors mentioning `UploadFeature`
- Errors about type definitions

**Solution:**
The UploadFeature we added might have type issues. Try this simpler configuration:

```typescript
// In src/collections/Posts/index.ts - simplified version
UploadFeature({
  collections: {
    media: {},
  },
})
```

Or temporarily remove UploadFeature if it's blocking deployment:
```typescript
// Comment out the UploadFeature temporarily
// UploadFeature({ ... }),
```

---

### Issue 2: Still Showing 352/353 Posts

**Symptoms:**
- Deployment succeeds
- Admin shows old post count (352 or 353)
- FORCE_REIMPORT doesn't seem to work

**Root Cause:**
- FORCE_REIMPORT variable not set correctly
- Database not being cleared before import
- Old data persisting

**Solution A: Check Environment Variable**
Make sure in Dokploy:
1. Variable name is exactly: `FORCE_REIMPORT`
2. Value is exactly: `true` (lowercase)
3. No extra spaces

**Solution B: Manually Clear Database**
If FORCE_REIMPORT isn't working, manually truncate via Dokploy database console:

```sql
TRUNCATE TABLE posts_internal_links_metadata_links_added CASCADE;
TRUNCATE TABLE posts_affiliate_links_metadata_links_added CASCADE;
TRUNCATE TABLE posts_populated_authors CASCADE;
TRUNCATE TABLE _posts_v_rels CASCADE;
TRUNCATE TABLE _posts_v CASCADE;
TRUNCATE TABLE posts_rels CASCADE;
TRUNCATE TABLE posts CASCADE;
TRUNCATE TABLE categories_breadcrumbs CASCADE;
TRUNCATE TABLE categories CASCADE;
TRUNCATE TABLE tags CASCADE;
TRUNCATE TABLE media CASCADE;
```

Then redeploy WITHOUT FORCE_REIMPORT (fresh import will happen).

---

### Issue 3: Database Dump Not Found

**Symptoms:**
- Logs show "⚠️ WARNING: Using old 352-post dump"
- Logs show "No SQL files found"
- Import uses wrong database file

**Root Cause:**
- Docker image missing production-data-494-posts.sql.gz
- Dockerfile COPY command failed
- GitHub download failed

**Solution:**
Check Dockerfile line 66:
```dockerfile
COPY --from=builder /app/production-data-494-posts.sql.gz ./
```

Verify the file exists in GitHub:
```
https://github.com/builequan/kawaiismallbird/blob/master/kawaiitorichan/production-data-494-posts.sql.gz
```

---

### Issue 4: Media Files Not Downloading

**Symptoms:**
- Logs show "⚠️ smart-media-sync.sh not found"
- Images still blank after deployment
- Media count is correct but files missing

**Root Cause:**
- smart-media-sync.sh not copied to container
- Script has no execute permission
- Network issue downloading from GitHub

**Solution:**
Already fixed in commit `e2491afb`, but verify Dockerfile lines 61 and 71:
```dockerfile
COPY --from=builder /app/smart-media-sync.sh ./
RUN chmod +x ... ./smart-media-sync.sh ...
```

---

### Issue 5: Database Connection Failed

**Symptoms:**
- Build succeeds but container crashes
- Logs show PostgreSQL connection errors
- "fe_sendauth: no password supplied"

**Root Cause:**
- DATABASE_URI malformed or missing
- Database service not accessible from container
- Wrong credentials

**Solution:**
Check DATABASE_URI format:
```
postgresql://username:password@hostname:5432/database
```

Test connection from Dokploy console:
```bash
psql $DATABASE_URI -c "SELECT 1;"
```

---

### Issue 6: Build Timeout

**Symptoms:**
- Build runs for 10+ minutes and times out
- Stops during "Creating an optimized production build"
- Out of memory errors

**Root Cause:**
- Next.js build is very slow on Dokploy servers
- Not enough memory allocated

**Solution A: Increase Build Resources**
In Dokploy:
- Increase CPU limit (2 cores minimum)
- Increase Memory limit (2GB minimum)

**Solution B: Optimize Build**
Already configured in Dockerfile:
```dockerfile
ENV SKIP_BUILD_STATIC_GENERATION=true
```

---

### Issue 7: Images Blank After Successful Deploy

**Symptoms:**
- 494 posts imported correctly
- Media URLs fixed in database
- Images still don't display

**Root Cause:**
- Media files not downloaded to /app/public/media
- Volume mount missing or incorrect
- smart-media-sync.sh failed silently

**Solution:**
1. Check volume mount exists: `/app/public/media`
2. SSH into container and verify:
```bash
ls /app/public/media | wc -l
# Should show ~20000 files
```

3. Check smart-media-sync.sh logs for errors
4. Manually trigger media sync:
```bash
sh /app/smart-media-sync.sh
```

---

## Diagnostic Commands

### Check Current State

**From Dokploy Console:**
```bash
# Check post count
psql $DATABASE_URI -tAc "SELECT COUNT(*) FROM posts;"

# Check media count
psql $DATABASE_URI -tAc "SELECT COUNT(*) FROM media;"

# Check media URL format
psql $DATABASE_URI -tAc "SELECT url FROM media LIMIT 5;"

# Check if files exist
ls /app/public/media | wc -l

# Check database files in container
ls -lh /app/*.sql* /app/*.gz
```

### Force Fresh Import

**Method 1: Via Environment Variable**
```
FORCE_REIMPORT=true
```

**Method 2: Delete Database Volume**
In Dokploy, delete the database volume completely, then redeploy.

**Method 3: Rename Database**
Change database name in DATABASE_URI to create fresh database.

---

## Expected Successful Deployment Logs

You should see these messages in order:

```
🦜 Initializing Kawaii Bird Production Content...
📊 Applying bird content to database...
📁 Available SQL files:
production-data-494-posts.sql.gz

🚀 RUNNING PRODUCTION DATA IMPORT - 494 posts + 3414 media (compressed)...
📦 Using file: production-data-494-posts.sql.gz
📦 File size: 17M
✅ Data import successful!
✅ PRODUCTION DATA IMPORT SUCCESS: 494 posts, 55 categories, 3414 media items!
✅ Cleared users table for fresh registration
🔧 Fixing media URLs (converting external URLs to local paths)...
✅ Fixed 3414 main URLs and 3414 size-specific URLs to use local paths
🖼️ Setting hero images from post content...
✅ Hero images set from content
📥 Running smart media sync...
Progress: 50/3414 files checked...
Progress: 100/3414 files checked...
...
✅ Smart Media Sync Complete!
   📊 Database records: 3414
   📁 Local files: 20490
   ⬇️  Downloaded: 20490
```

---

## Quick Fix Checklist

- [ ] Latest code pulled from GitHub (commit `b68d7ec8` or later)
- [ ] FORCE_REIMPORT=true set in environment variables
- [ ] DATABASE_URI format is correct
- [ ] PAYLOAD_SECRET is set (min 32 characters)
- [ ] Volume mount exists for /app/public/media
- [ ] Dockerfile has smart-media-sync.sh (line 61)
- [ ] Build resources: 2 CPU, 2GB RAM minimum
- [ ] Old database data cleared (if FORCE_REIMPORT not working)

---

## Still Having Issues?

Please provide:
1. **Exact error message** from Dokploy logs
2. **Post count** showing in admin (0, 352, 353, or 494)
3. **Build stage** where it fails (deps, builder, runner, or runtime)
4. **Environment variables** configured (redact passwords)
5. **Database connection status** (can you connect via psql?)

This will help me identify the exact issue and provide a specific fix.
