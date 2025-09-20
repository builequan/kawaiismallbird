# Dokploy Deployment Memory

## Successful Deployment Configuration (2025-09-20)

### What Works

#### Database Import
- **115 posts** imported successfully from `production-data-115-posts.sql.gz`
- **12 categories** with Japanese titles and hierarchy
- **346 media records** in database
- No pre-created admin users (allows registration screen)

#### Media Files
- **347 images** automatically download from GitHub
- Uses `media-files-list.txt` to download only verified files
- Shows progress during download (every 10 files)
- Takes ~5 minutes to complete
- No failed downloads with verified list

#### Key Files
1. **production-data-115-posts.sql.gz** - Compressed SQL with all content (1MB)
2. **media-files-list.txt** - List of 347 verified media files
3. **init-bird-production.sh** - Runs automatically, imports data and downloads media
4. **Dockerfile** - Contains `REBUILD_TIMESTAMP` for cache-busting

### Environment Variables Required
```env
DATABASE_URI=postgresql://postgres:password@host:5432/dbname
PAYLOAD_SECRET=minimum-32-character-secret-key-here
NEXT_PUBLIC_SERVER_URL=https://your-domain.traefik.me
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
```

### Deployment Process
1. Push code to GitHub
2. In Dokploy: Click "Deploy" or "Rebuild"
3. Wait for build (~2-3 minutes)
4. Database imports automatically
5. Media downloads automatically (~5 minutes)
6. Visit `/admin` to register first admin account

### Issues Resolved

#### Media Download Failures
- **Problem**: Database had filenames that didn't exist in GitHub
- **Solution**: Created `media-files-list.txt` with only verified files
- **Result**: No more "Failed" messages during download

#### Admin Login Issues
- **Problem**: Pre-created admin user blocked registration
- **Solution**: Removed `INSERT INTO users` from all SQL files
- **Result**: Registration screen appears properly

#### Docker Build Cache
- **Problem**: Changes weren't being deployed due to cache
- **Solution**: Added `REBUILD_TIMESTAMP` environment variable
- **Result**: Changing timestamp forces complete rebuild

#### SQL File Not Found
- **Problem**: Docker couldn't find SQL files during build
- **Solution**: Explicitly COPY files in Dockerfile with proper paths
- **Result**: All files available during container startup

### Critical Scripts

#### init-bird-production.sh
- Runs automatically via docker-entrypoint.sh
- Imports database from production-data-115-posts.sql.gz
- Fixes schema issues (adds missing columns)
- Clears users table for registration
- Downloads all media files from GitHub
- Shows progress and completion status

#### Force Rebuild
To force a complete rebuild without cache:
1. Edit Dockerfile line ~20
2. Change `ENV REBUILD_TIMESTAMP="2025-09-20-23:30:00"`
3. Commit and push
4. Redeploy in Dokploy

### Verification Steps
After deployment:
1. Check posts: Should show 115 posts
2. Check categories: Should show 12 categories
3. Check media: Images should display (after ~5 min)
4. Check admin: Should show registration screen
5. Register admin account and login

### Repository State
- Repository is public (for media downloads)
- `.env` files are in `.gitignore`
- Media files are in GitHub (347 files, 78MB)
- All scripts are production-ready

### Notes
- Media download happens in foreground (blocking)
- Total deployment time: ~8-10 minutes
- Database import is very fast (~2 seconds)
- Media download is the slowest part (~5 minutes)
- No manual intervention needed - fully automated