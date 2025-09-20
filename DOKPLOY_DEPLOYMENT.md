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

**IMPORTANT: Use Docker deployment method for best results**

- **Build Type**: Docker
- **Dockerfile Path**: `./Dockerfile` (at repository root)
- **Docker Context**: `.` (repository root)
- **Port**: 3000

### 2.3 Environment Variables
Add these environment variables in Dokploy's environment settings:

```env
# Database - Use Dokploy's internal network service name
DATABASE_URI=postgres://postgres:YOUR_SECURE_PASSWORD@kawaii-bird-db:5432/kawaii_bird

# Required Secrets (MUST have these!)
PAYLOAD_SECRET=your-secret-key-here-at-least-32-characters-long
NEXT_PUBLIC_SERVER_URL=https://your-domain.com

# Production mode
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0

# For first deployment to initialize database with posts
FORCE_DB_INIT=true

# Optional: Email (Resend)
RESEND_API_KEY=re_your_resend_key
CONTACT_EMAIL_TO=your-email@example.com

# Optional: reCAPTCHA
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_site_key
RECAPTCHA_SECRET_KEY=your_secret_key
```

**IMPORTANT**: After first successful deployment with posts imported:
1. Remove `FORCE_DB_INIT` or set it to `false`
2. The container will auto-import posts if database is empty

## Step 3: Deploy with Docker Compose (Alternative Method)

If you prefer using docker-compose:

1. In Dokploy, select "Docker Compose" deployment
2. Point to: `docker-compose.dokploy.yml`
3. Dokploy will automatically:
   - Build the Docker images
   - Set up the network
   - Link services together

## Step 4: Deployment Process

### 4.1 Initial Deployment
1. Push your code to GitHub
2. In Dokploy, click "Deploy" button
3. The Docker build will:
   - Install dependencies
   - Build the Next.js application
   - Copy all necessary files including database initialization scripts
4. On first run, the container will:
   - Check if database tables exist
   - Initialize schema if needed
   - Import essential data (posts, categories, media)
   - Start the application

### 4.2 Verify Deployment
After deployment completes:
1. Check application logs for any errors
2. Visit your domain to see the site
3. Check `/admin` to access Payload CMS admin panel
4. Verify posts are displayed on the homepage

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

### No Posts or Empty Database
**Problem**: Website shows but no posts appear
**Solution**:

**Method 1 - Automatic Import (Recommended)**:
1. Set `FORCE_DB_INIT=true` in environment variables
2. Redeploy the application
3. Check logs for:
   - "Importing essential data..."
   - "✅ Imported XX posts"
4. Visit your site - posts should appear
5. Remove `FORCE_DB_INIT` after successful import

**Method 2 - Manual Import**:
1. Access the container:
   ```bash
   docker exec -it [container-name] sh
   ```
2. Import data manually:
   ```bash
   PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f essential_data.sql
   ```
3. Restart the container

**Method 3 - Create Admin User**:
1. Access `/admin` on your site
2. Create an admin user if prompted
3. Use the admin panel to create posts manually

### Different UI/Missing Styles
**Problem**: Website looks different from local development
**Solution**:
1. Ensure `NEXT_PUBLIC_SERVER_URL` matches your actual domain
2. Check that Docker build includes `.next/static` folder
3. Verify public folder is copied correctly
4. Clear browser cache and hard refresh

### Database Connection Issues
- Ensure PostgreSQL service is running
- Check DATABASE_URI uses internal Docker network name (e.g., `kawaii-bird-db`)
- Verify password matches PostgreSQL service config
- Test connection: `docker exec -it [container] psql $DATABASE_URI -c "\dt"`

### Build Failures
- Check Node.js version compatibility (requires 20)
- Ensure all required environment variables are set
- Review build logs in Dokploy for specific errors
- Verify pnpm is enabled with corepack

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