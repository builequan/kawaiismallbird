# Dokploy Deployment Instructions - Fix Blank Images

## Problem Summary
Images appear blank in articles because the running container is OLD and has:
- Old database dump with external URLs (https://im.runware.ai/...)
- Missing smart-media-sync.sh script
- Missing media URL fixes

## Solution: Rebuild Container

All fixes are already in GitHub (commit `79af0185`). You just need to rebuild the container.

---

## Step-by-Step Instructions

### Step 1: Add Environment Variable in Dokploy

1. Go to your Dokploy dashboard
2. Navigate to your application (kawaiismallbird)
3. Click on **"Environment"** or **"Environment Variables"** tab
4. Add a new environment variable:
   ```
   Name: FORCE_REIMPORT
   Value: true
   ```
5. **Save** the environment variable

> **Why?** This forces the database to be cleared and reimported with fixed URLs.

---

### Step 2: Trigger Rebuild in Dokploy

1. Go to the **"Deployments"** or **"General"** tab
2. Click **"Redeploy"** or **"Rebuild"** button
3. Wait for the build process to complete (5-10 minutes)

> **Important:** You must REBUILD, not just restart. The old container doesn't have the new scripts.

---

### Step 3: Monitor Deployment Logs

Watch the logs for these key messages:

```
✅ Downloaded production-all-posts.sql.gz successfully
🚀 RUNNING PRODUCTION DATA IMPORT - 494 posts + 3414 media (compressed)...
✅ Data import successful!
✅ PRODUCTION DATA IMPORT SUCCESS: 494 posts, XX categories, 3414 media items!
🔧 Fixing media URLs (converting external URLs to local paths)...
✅ Fixed 3414 main URLs and XXXX size-specific URLs to use local paths
📥 Running smart media sync...
✅ Downloaded XXX media files
```

---

### Step 4: Verify Deployment Success

1. **Check Post Count:**
   - Visit `/admin` on your site
   - Log in and check Posts collection
   - Should see **494 posts** (not 352 or 353)

2. **Check Images:**
   - Open any article on the frontend
   - Images should display correctly (no blank images)
   - Open browser DevTools (F12) → Console tab
   - Should see NO 404 errors for images

3. **Check Media URLs:**
   - In admin, go to Media collection
   - Open any media item
   - URL should be `/media/[filename].jpg` (not https://im.runware.ai/...)

---

### Step 5: Clean Up (After Success)

Once everything works:

1. Go back to **Environment Variables** in Dokploy
2. **Delete** or set to `false` the `FORCE_REIMPORT` variable
3. Save changes

> **Why?** You don't want to reimport data on every deployment. Only needed once.

---

## What Gets Fixed in This Rebuild

✅ **Database:** 494 posts (up from 352)
✅ **Media URLs:** All 3,414 records updated from external to local paths
✅ **Size URLs:** All 7 size variants (thumbnail, square, small, medium, large, xlarge, og)
✅ **Media Files:** smart-media-sync.sh downloads all missing files from GitHub
✅ **Hero Images:** Automatically extracted from post content

---

## Troubleshooting

### Problem: Still seeing 352-353 posts
**Solution:** Make sure you clicked "Rebuild" not "Restart". The container must pull fresh code from GitHub.

### Problem: Images still blank
**Solution:** Check browser console for errors. If you see 404s, the media files might not have downloaded. Check logs for smart-media-sync.sh output.

### Problem: Build fails
**Solution:** Check build logs. Most common issue is database connection. Verify DATABASE_URI is correct.

### Problem: Can't log in to admin
**Solution:** The users table is cleared on import. You'll see a registration screen - create a new admin account.

---

## Files Updated in Latest GitHub Commit

- `kawaiitorichan/Dockerfile` - Cache timestamp updated to force rebuild
- `kawaiitorichan/init-bird-production.sh` - Added fixes for ALL media URL fields
- `kawaiitorichan/production-data-494-posts.sql.gz` - Full database with 494 posts
- `kawaiitorichan/smart-media-sync.sh` - Downloads media files from GitHub

---

## Expected Timeline

- Build: 3-5 minutes
- Database import: 1-2 minutes
- Media download: 2-5 minutes (depends on connection speed)
- **Total: 5-10 minutes**

---

## Need Help?

If you encounter issues:
1. Check the deployment logs in Dokploy
2. Look for error messages (red text with ❌)
3. Verify environment variables are set correctly
4. Make sure DATABASE_URI, PAYLOAD_SECRET are configured
