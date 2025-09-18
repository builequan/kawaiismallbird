# Dokploy Deployment Guide

## 🔥 CRITICAL FIX APPLIED

We've resolved the runtime environment variable issue that was causing the server-side exception. The problem was that environment variables were being compiled at build time instead of being read at runtime.

## Prerequisites
1. Database created in Dokploy (PostgreSQL)
2. Application created in Dokploy
3. Environment variables configured

## Environment Variables Setup in Dokploy

**IMPORTANT:** These MUST be set in Dokploy's environment variables section, not in build arguments.

Copy these to your Dokploy environment variables:

```env
# REQUIRED - Database connection
DATABASE_URI=postgresql://postgres:2801@webblog-kawaiibirddb-gq00ip:5432/kawaii-bird-db

# REQUIRED - Payload secret for JWT
PAYLOAD_SECRET=76a2b7954f87ee6abbe2924dbbc2b1be198dc0bc1d008abea0228863f1aed42d

# REQUIRED - Update with your actual domain
NEXT_PUBLIC_SERVER_URL=http://webblog-bird-3ynfsd-973333-72-60-195-24.traefik.me

# REQUIRED for production
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
```

## Using the Optimized Dockerfile

For Dokploy, use `Dockerfile.dokploy` instead of the regular Dockerfile:
1. In Dokploy settings, set the Dockerfile path to: `./kawaiitorichan/Dockerfile.dokploy`
2. Or rename it to `Dockerfile` in your repository

## Common Issues and Solutions

### 1. Database Connection Error
**Problem:** "server-side exception has occurred"

**Solutions:**
- Verify DATABASE_URI is set correctly in Dokploy environment variables
- Check if database service name is correct (e.g., `webblog-kawaiibirddb-gq00ip`)
- Ensure PostgreSQL service is running in Dokploy
- Try using IP address instead of hostname if DNS resolution fails

### 2. Database Not Initialized
**Problem:** Missing tables or schema errors

**Solution:**
Run database initialization after deployment:
```bash
pnpm tsx scripts/init-database.ts
```

### 3. Build Failures
**Problem:** Build fails during deployment

**Solutions:**
- Check build logs in Dokploy
- Ensure all environment variables are set
- The Dockerfile uses dummy values for build time, real values are needed at runtime

### 4. Runtime Errors
**Problem:** Application crashes after starting

**Solutions:**
- Check container logs in Dokploy
- Verify all required environment variables are present
- Check if port 3000 is properly exposed

## Deployment Steps

1. **Push code to repository**
   ```bash
   git add .
   git commit -m "Fix Dokploy deployment configuration"
   git push
   ```

2. **In Dokploy:**
   - Go to your application
   - Add all environment variables from `dokploy.env`
   - Deploy the application

3. **After deployment:**
   - Check logs for any errors
   - Access your application at the provided URL
   - If database errors occur, may need to run migrations

## Testing the Deployment

1. Check if the app is running:
   ```
   http://your-dokploy-url.traefik.me
   ```

2. Check admin panel:
   ```
   http://your-dokploy-url.traefik.me/admin
   ```

3. Monitor logs in Dokploy dashboard

## Database Connection Formats

Try these formats if the default doesn't work:

1. With internal service name:
   ```
   postgresql://postgres:2801@webblog-kawaiibirddb-gq00ip:5432/kawaii-bird-db
   ```

2. With container network name:
   ```
   postgresql://postgres:2801@kawaii-bird-db:5432/kawaii-bird-db
   ```

3. With IP (find in Dokploy):
   ```
   postgresql://postgres:2801@172.x.x.x:5432/kawaii-bird-db
   ```