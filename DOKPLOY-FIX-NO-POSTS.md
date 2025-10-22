# Fix: No Posts Showing After Dokploy Deployment

## Problem
After deploying to Dokploy, the website shows no posts even though the database import script ran.

## Root Cause (CRITICAL BUG IDENTIFIED)

Your Dokploy has **`SKIP_DATA_IMPORT=true`** set as an environment variable. This is blocking ALL imports!

### The Bug

From your container logs:
```
📄 Database has        0 posts
✅ SKIP_DATA_IMPORT=true - Preserving existing database, skipping all imports
✅ Posts already exist (0 posts ≥ 250), skipping data import  <-- BUG!
```

The script logic was **broken**:
1. Detects 0 posts (needs import) ✅
2. Then checks `SKIP_DATA_IMPORT=true` and **disables import** ❌
3. Sets `FORCE_REIMPORT=false` (overriding force flags) ❌
4. Result: Skips import even with 0 posts! ⛔

**This has been FIXED in commit aa52a682+**. The fix makes `FORCE_DB_REINIT=true` override `SKIP_DATA_IMPORT=true`.

## Solution: Set BOTH Environment Variables

### Step 1: Update Environment Variables in Dokploy

1. Go to your Dokploy dashboard
2. Select your application
3. Go to **Environment** tab
4. **Remove or set to false**:
   ```
   SKIP_DATA_IMPORT=false
   ```
   OR delete the `SKIP_DATA_IMPORT` variable entirely

5. **Add this variable**:
   ```
   FORCE_DB_REINIT=true
   ```
6. **Save** the environment variables

### Step 2: Rebuild the Application

1. Click **"Rebuild"** button
2. Wait for build to complete (~5-10 minutes)
3. Watch the container logs for these messages:

```
🔴 FORCE_DB_REINIT=true detected - Will force complete database reimport!
🔴 FORCE_DB_REINIT=true OVERRIDES SKIP_DATA_IMPORT - Will force reimport!
🗑️  Dropping existing tables for clean import...
✅ Tables dropped - ready for fresh import
📋 Creating database schema...
✅ Schema created successfully
📦 Using file: production-data-267-posts.sql.gz
✅ Data import successful!
✅ PRODUCTION DATA IMPORT SUCCESS: 267 posts, XX categories, 3414 media items!
```

**The override message confirms the fix is working!**

### Step 3: Verify Posts Were Imported

After deployment completes, you can check the logs for:
- `✅ PRODUCTION DATA IMPORT SUCCESS: 267 posts`
- `✅ Cleared users table for fresh registration`

### Step 4: Create Admin Account

1. Visit `https://your-domain.com/admin`
2. You'll see the registration screen (not login)
3. Create a new admin account
4. Login and verify you see 267 posts

### Step 5: Remove FORCE_DB_REINIT

**IMPORTANT**: After successful import, remove or set to `false`:

```
FORCE_DB_REINIT=false
```

or just delete the variable entirely. Otherwise, every rebuild will drop all data!

## Alternative: Manually Check Database

If you want to verify posts exist in the database before fixing:

1. Connect to your Dokploy PostgreSQL database
2. Run:
   ```sql
   SELECT COUNT(*) FROM posts;
   SELECT COUNT(*) FROM posts WHERE _status = 'published';
   ```

If count is 0, you definitely need to force reinit.
If count is 267 but posts still don't show, it's a frontend query issue.

## Common Issues After Fix

### Issue 1: "Cannot read properties of undefined"
**Cause**: Frontend is querying posts without proper depth
**Fix**: Check `src/app/(frontend)/page.tsx` uses `depth: 2` in Payload query

### Issue 2: Images not loading
**Cause**: Media files downloading in background
**Fix**: Wait 5-10 minutes for smart-media-sync.sh to download all images from GitHub

### Issue 3: Homepage shows but posts page is empty
**Cause**: Status filter or query limit issue
**Fix**: Check query uses `where: { _status: { equals: 'published' } }`

## Files Modified (Already Pushed to GitHub)

- `kawaiitorichan/production-data-267-posts.sql.gz` (11MB) - All 267 posts
- `kawaiitorichan/Dockerfile` - Copies 267-post file
- `kawaiitorichan/init-bird-production.sh` - Imports 267 posts
- `kawaiitorichan/docker-entrypoint.sh` - Calls init script

Commit: `91c63a7a`

## Summary

The fix is simple:
1. Add `FORCE_DB_REINIT=true` in Dokploy
2. Rebuild
3. Wait for "267 posts" success message in logs
4. Remove FORCE_DB_REINIT variable
5. Visit site and verify posts show

This will completely drop and recreate the database with all 267 posts from your current local database.
