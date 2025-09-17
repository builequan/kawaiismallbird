# Dokploy Deployment Guide for Kawaii Bird Website

## Prerequisites
- Dokploy instance running
- GitHub repository (already set up: https://github.com/builequan/kawaiismallbird)
- Domain name (optional but recommended)

## Step 1: Prepare Your Dokploy Environment

### 1.1 Create a New Project in Dokploy
1. Log into your Dokploy dashboard
2. Click "Create New Project"
3. Name it "kawaii-bird" or similar

### 1.2 Set Up PostgreSQL Database Service
In Dokploy, create a PostgreSQL service:

1. Go to Services → Add Service → PostgreSQL
2. Configure:
   - Service Name: `kawaii-bird-db`
   - PostgreSQL Version: 15 (or latest)
   - Database Name: `kawaii_bird`
   - Username: `postgres`
   - Password: Generate a secure password
   - Port: 5432 (internal)

## Step 2: Configure Application Deployment

### 2.1 Create Application Service
1. In your Dokploy project, click "Add Service" → "Application"
2. Select "GitHub" as source
3. Connect your repository: `https://github.com/builequan/kawaiismallbird`
4. Branch: `master`

### 2.2 Build Configuration
Set these build settings in Dokploy:

- **Build Command**:
  ```bash
  cd kawaiitorichan && pnpm install && pnpm build
  ```

- **Start Command**:
  ```bash
  cd kawaiitorichan && pnpm start
  ```

- **Port**: 3000

- **Dockerfile Path** (if using Docker):
  ```
  ./kawaiitorichan/Dockerfile
  ```

### 2.3 Environment Variables
Add these environment variables in Dokploy's environment settings:

```env
# Database - Use Dokploy's internal network
DATABASE_URI=postgres://postgres:YOUR_SECURE_PASSWORD@kawaii-bird-db:5432/kawaii_bird

# Required Secrets (generate new ones!)
PAYLOAD_SECRET=generate_32_char_string_here
PREVIEW_SECRET=generate_random_string_here
CRON_SECRET=generate_cron_secret_here

# Your domain
NEXT_PUBLIC_SERVER_URL=https://your-domain.com

# Email (Resend)
RESEND_API_KEY=re_your_resend_key
CONTACT_EMAIL_TO=your-email@example.com

# reCAPTCHA
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_site_key
RECAPTCHA_SECRET_KEY=your_secret_key

# Production mode
NODE_ENV=production
```

## Step 3: Deploy with Docker Compose (Alternative Method)

If you prefer using docker-compose:

1. In Dokploy, select "Docker Compose" deployment
2. Point to: `docker-compose.dokploy.yml`
3. Dokploy will automatically:
   - Build the Docker images
   - Set up the network
   - Link services together

## Step 4: Database Migration

After first deployment, initialize the database:

1. Access your application container:
   ```bash
   docker exec -it kawaii-bird-app sh
   ```

2. Run database setup (if needed):
   ```bash
   cd kawaiitorichan
   pnpm payload migrate:create
   pnpm payload migrate
   ```

## Step 5: Domain & SSL Configuration

In Dokploy:

1. Go to your application service
2. Click "Domains"
3. Add your domain: `yourdomain.com`
4. Enable "Auto SSL" (Let's Encrypt)
5. Dokploy will automatically:
   - Configure nginx proxy
   - Generate SSL certificates
   - Set up auto-renewal

## Step 6: Persistent Storage

Configure volumes in Dokploy for:

1. **Media uploads**: `/app/public/media`
2. **Data files**: `/app/data`
3. **PostgreSQL data**: Already handled by Dokploy

## Step 7: Health Checks & Monitoring

Set up health checks:

1. **Application Health Check**:
   - Path: `/api/health` (you may need to create this endpoint)
   - Interval: 30 seconds
   - Timeout: 10 seconds

2. **Database Health Check**:
   - Already configured in docker-compose

## Step 8: Backup Strategy

1. **Database Backups**:
   - Use Dokploy's built-in PostgreSQL backup feature
   - Schedule daily backups
   - Store in S3 or local storage

2. **Media Backups**:
   - Configure volume backups for uploaded files
   - Sync to external storage

## Deployment Commands Summary

```bash
# Initial deployment
git push origin master

# Dokploy will automatically:
# 1. Pull latest code
# 2. Build the application
# 3. Run database migrations
# 4. Start the services

# Manual rebuild (if needed)
# In Dokploy UI: Click "Rebuild" button

# View logs
# In Dokploy UI: Click "Logs" tab
```

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL service is running
- Check DATABASE_URI uses internal Docker network name
- Verify password matches PostgreSQL service config

### Build Failures
- Check Node.js version compatibility (requires 18+)
- Ensure all environment variables are set
- Review build logs in Dokploy

### SSL/Domain Issues
- Verify DNS points to Dokploy server
- Check firewall allows ports 80 and 443
- Wait for DNS propagation (up to 48 hours)

## Security Checklist

- [ ] Generate new PAYLOAD_SECRET (32+ characters)
- [ ] Set strong database password
- [ ] Configure CORS properly in NEXT_PUBLIC_SERVER_URL
- [ ] Enable rate limiting
- [ ] Set up regular backups
- [ ] Monitor logs for errors
- [ ] Keep dependencies updated

## Support

For issues specific to:
- Dokploy: Check Dokploy documentation
- Application: Review logs in Dokploy dashboard
- Database: Check PostgreSQL container logs