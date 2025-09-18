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

# First deployment only - sets up bird theme content
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

✅ **Database Content**
- Bird-themed homepage with slideshow
- About page with bird content
- Bird-related categories (野鳥観察, 飼い鳥, etc.)

✅ **Theme Configuration**
- Japanese language support
- Bird-themed navigation
- Pastel color scheme

### Manual Updates (if needed)

If the automatic initialization doesn't work, you can run these commands manually in the container:

```bash
# Update homepage
pnpm tsx scripts/update-homepage-bird.ts

# Update about page
pnpm tsx scripts/update-about-bird.ts

# Setup categories
pnpm tsx scripts/setup-bird-categories.ts

# Or run all at once
pnpm tsx scripts/deploy-bird-theme.ts
```

### Verification Checklist

After deployment, verify:

- [ ] Homepage shows bird slideshow (not golf content)
- [ ] Logo shows "Kawaii Bird" (not golf logo)
- [ ] About page has bird content
- [ ] Categories are bird-related
- [ ] Navigation menu is in Japanese
- [ ] Images load correctly

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