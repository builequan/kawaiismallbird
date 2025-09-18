# Kawaii Bird Deployment Guide

## 🚀 Deploying to Dokploy

### Environment Variables

Required environment variables for Dokploy:

```env
# Database (use your Dokploy PostgreSQL details)
DATABASE_URI=postgresql://postgres:password@database-service-name:5432/database-name

# Security
PAYLOAD_SECRET=your-secret-key-here

# Application
NEXT_PUBLIC_SERVER_URL=https://kawaiibird.traefik.me
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0

# First deployment only - creates database tables
FORCE_DB_INIT=true

# First deployment only - initializes bird theme content via SQL
INIT_BIRD_THEME=true
```

### Deployment Steps

1. **Initial Deployment**
   - Set `FORCE_DB_INIT=true` to create database tables
   - Set `INIT_BIRD_THEME=true` to initialize bird content
   - Deploy the application

2. **After First Deployment**
   - Remove `FORCE_DB_INIT` (or set to `false`)
   - Remove `INIT_BIRD_THEME` (or set to `false`)
   - These only need to run once

### What Gets Deployed

The deployment includes:

✅ **Static Assets**
- Bird slideshow images (`/birdimage/`)
- Kawaii bird logo
- Favicons
- Removed golf images

✅ **Database Content** (via SQL)
- Bird-themed homepage with bird slideshow
- About page with correct slug (`about-us`)
- Bird-related categories (野鳥観察, 飼い鳥, etc.)

✅ **Theme Configuration**
- Japanese language support
- Bird-themed navigation
- Pastel color scheme

### Manual Updates (if needed)

If the automatic initialization doesn't work, you can run SQL directly:

```bash
# Connect to container
docker exec -it [container-id] sh

# Run SQL initialization
psql $DATABASE_URI -f init-bird-content.sql

# Or run the init script
sh init-bird-production.sh
```

### Verification Checklist

After deployment, verify:

- [ ] Homepage shows bird slideshow images
- [ ] HeroBlog component displays bird images (not golf)
- [ ] Logo shows "Kawaii Bird"
- [ ] About page works at `/about` route
- [ ] Categories are bird-related
- [ ] Navigation menu is in Japanese
- [ ] All bird images load correctly

### Recent Fixes Applied

✅ **Fixed HeroBlog Component** - Now uses bird images instead of golf images
✅ **Fixed About Page 404** - Corrected slug to `about-us`
✅ **SQL-based Initialization** - Works without Node.js runtime in production
✅ **Removed Golf Images** - Deleted `/golf-images/` directory

### Troubleshooting

**Images not showing?**
- Check that `/public/birdimage/` exists in container
- Verify static assets are being served

**Still showing golf content?**
- Set `INIT_BIRD_THEME=true` and redeploy
- Or run `scripts/production-init.sh` manually

**Database errors?**
- Ensure `DATABASE_URI` is correct
- Check database connection from container

### Production URL

Your site will be available at: `https://kawaiibird.traefik.me` (or your configured domain)