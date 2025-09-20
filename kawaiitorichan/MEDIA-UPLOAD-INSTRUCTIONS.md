# Media Files Upload Instructions

## Problem
The database contains 346 media records but the actual image files are not in the Docker container.

## Solution

### Option 1: Manual Upload via Dokploy (Recommended)

1. **Access Dokploy Terminal**
   - Go to your Dokploy dashboard
   - Click on your kawaiismallbird application
   - Click "Terminal" or "SSH"

2. **Create media directory**
   ```bash
   mkdir -p public/media
   ```

3. **Upload media files**
   - Use Dokploy's file manager or SCP to upload the contents of `kawaiitorichan/public/media/` to the container's `public/media/` directory

### Option 2: Download from External Source

1. **SSH into container**
2. **Run this command to download a sample set**:
   ```bash
   # Download sample images (you'll need to replace with actual source)
   cd public/media

   # Example: Download specific images
   wget https://your-image-source.com/image1.jpg
   wget https://your-image-source.com/image2.jpg
   ```

### Option 3: Use Payload CMS Upload

1. **After deployment, go to `/admin`**
2. **Register your admin account**
3. **Go to Media section**
4. **Re-upload images as needed**

## Quick Fix for Missing Images

If you just want the site to work without images temporarily:

```bash
# SSH into container and run:
psql $DATABASE_URI <<EOF
-- Set all media URLs to a placeholder
UPDATE media SET url = '/placeholder.jpg' WHERE url IS NOT NULL;
EOF
```

## Notes

- Media files total ~160MB (too large for Git)
- Each post references multiple image sizes (thumbnail, small, medium, large, etc.)
- The database has all the metadata, just missing the actual files
- Once files are uploaded to `public/media/`, they will be served at `/media/filename.jpg`