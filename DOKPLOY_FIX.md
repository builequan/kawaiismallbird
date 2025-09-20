# CRITICAL FIX FOR DOKPLOY - MUST READ

## The Problem
Your SQL files (`quick-import.sql` and `production-all-posts.sql.gz`) are NOT being included in the Docker build because of **Docker build context** issues.

## The Solution - Configure Dokploy Settings

In your Dokploy dashboard for this app, you need to change these settings:

### 1. **Build Path**
Set to: `./kawaiitorichan`

### 2. **Dockerfile Path**
Set to: `./Dockerfile`

### 3. **Docker Context Path**
Set to: `.` (just a dot)

## Why This Works

Currently, your Dockerfile is at the repository root trying to copy from `kawaiitorichan/` subdirectory. But Docker's build context might not be including the kawaiitorichan files properly.

## Alternative Solution - Move Dockerfile

If the above doesn't work, move the Dockerfile INTO the kawaiitorichan directory:

```bash
cd /Users/builequan/Desktop/web/kawaiismallbird
mv Dockerfile kawaiitorichan/Dockerfile
```

Then update it to use local paths:
```dockerfile
# Change from:
COPY kawaiitorichan/ .
# To:
COPY . .
```

And in Dokploy set:
- **Build Path**: `./kawaiitorichan`
- **Dockerfile Path**: `./kawaiitorichan/Dockerfile`

## Quick Test

To verify files are in git and will be available:
```bash
git ls-files | grep -E "quick-import|production-all"
# Should show:
# kawaiitorichan/production-all-posts.sql.gz
# kawaiitorichan/quick-import.sql
```

## Force Rebuild in Dokploy

After changing settings:
1. Click "Save" on the settings
2. Click "Deploy" or "Rebuild"
3. If available, use "Rebuild without cache" option

## What You'll See When It Works

```
🚀 DECOMPRESSING AND RUNNING FULL PRODUCTION IMPORT - 115 posts...
✅ FULL PRODUCTION IMPORT SUCCESS: 115 posts, 12 categories, 346 media items!
```

Instead of:
```
⚠️ quick-import.sql not found, creating it inline...
```