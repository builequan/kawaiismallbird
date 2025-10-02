# Dokploy 494 Posts Fix - Complete Solution

## Problem

Dokploy deployment shows only 352 posts instead of the expected 494 posts from the local database.

## Root Causes Identified

1. **Persistent Database Volume**: Dokploy uses persistent PostgreSQL volumes that retain data between deployments
2. **Old Data Persisting**: The 352-post data from an old deployment persists in the volume
3. **Import Script Skipping**: The init script detects existing data and skips reimport to avoid data loss

## Solution Implemented

### 1. Force Table Dropping Before Import

The `init-bird-production.sh` script now:
- **Drops all tables** before importing the 494-post dump
- This ensures a clean slate for every import
- Tables dropped: posts, posts_rels, categories, tags, media, users, etc.

### 2. Smart Existing Data Detection

The script checks existing post count:
- If **≥400 posts** exist → Skip import (data is current)
- If **1-399 posts** exist → Drop tables and reimport
- If **0 posts** → Import fresh data

### 3. Force Reinit Environment Variable

Set `FORCE_DB_REINIT=true` in Dokploy to force complete database reset regardless of existing data.

## Deployment Instructions

### Method 1: Normal Deployment (Recommended)

1. Push the latest code to GitHub (already done)
2. Go to Dokploy
3. Rebuild the application
4. The init script will detect 352 posts and automatically reimport 494 posts

### Method 2: Force Reinit (If Method 1 Doesn't Work)

1. In Dokploy, go to your application settings
2. Add environment variable:
   ```
   FORCE_DB_REINIT=true
   ```
3. Rebuild the application
4. **After successful import**, remove the `FORCE_DB_REINIT` variable
5. Rebuild again to ensure it doesn't keep resetting

### Method 3: Manual Database Reset (Last Resort)

If the above methods don't work, manually reset the database in Dokploy:

1. Go to Dokploy → Your App → Database section
2. Stop the database service
3. Delete the database volume
4. Restart the database service
5. Rebuild the application

## Verification

After deployment, check:

1. **Dokploy Logs**: Look for:
   ```
   ✅ Data import successful!
   ✅ PRODUCTION DATA IMPORT SUCCESS: 494 posts
   ```

2. **Admin Panel**:
   - Visit `/admin/collections/posts`
   - Should show 494 total posts

3. **Frontend**:
   - Browse the site
   - Check categories and post listings

## Files Modified

- `kawaiitorichan/Dockerfile` - Fixed COPY paths for correct context
- `kawaiitorichan/init-bird-production.sh` - Added table dropping and smart detection
- `Dockerfile` (root) - Removed incorrect SQL file copies

## Technical Details

### Why 352 Posts Persisted

1. Docker volumes persist between container rebuilds
2. The old deployment had 352 posts in the database volume
3. Even when rebuilding with new code, the volume data remained
4. The init script saw existing data and skipped import

### How This Fix Works

1. Init script runs on container startup
2. Detects 352 posts (< 400 threshold)
3. Drops all tables using CASCADE
4. Imports production-data-494-posts.sql.gz
5. Database now has 494 posts

### Cache Busting

The Dockerfile uses `ARG REBUILD_TIMESTAMP=2025-10-02-13:30` to force Docker to rebuild without using cached layers.

## Troubleshooting

### Still Shows 352 Posts

1. Check Dokploy logs for import errors
2. Verify `production-data-494-posts.sql.gz` exists in the image:
   ```bash
   docker exec <container-id> ls -lh production-data-494-posts.sql.gz
   ```
3. Try Method 2 (Force Reinit)

### Import Fails

1. Check PostgreSQL logs in Dokploy
2. Verify DATABASE_URI environment variable is correct
3. Ensure database has proper permissions

### Wrong File Being Used

Check logs for:
```
✅ Found: production-data-494-posts.sql.gz (from Docker image)
```

If you see a different file name, the Docker build didn't copy the correct file.

## Support

If issues persist after trying all methods:
1. Check container logs in Dokploy
2. Verify environment variables are set correctly
3. Ensure the PostgreSQL service is healthy
