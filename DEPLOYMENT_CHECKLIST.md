# 🚀 Dokploy VPS Deployment Checklist

## ✅ What's Already Done

- [x] Fixed GoogleAnalytics Suspense error
- [x] Updated Dockerfile cache busting
- [x] Committed and pushed to GitHub
- [x] Code is ready for deployment

## 📋 Your Action Items

### Step 1: Configure Dokploy Environment Variables ⚠️ **DO THIS FIRST**

Open your Dokploy dashboard and set these environment variables:

```env
DATABASE_URI=postgresql://postgres:2801@webblog-kawaiibirddb-gq00ip:5432/kawaii-bird-db
PAYLOAD_SECRET=76a2b7954f87ee6abbe2924dbbc2b1be198dc0bc1d008abea0228863f1aed42d
NEXT_PUBLIC_SERVER_URL=https://your-actual-domain.traefik.me
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
FORCE_DB_REINIT=true
```

**IMPORTANT:** Replace `your-actual-domain` with your real domain!

### Step 2: Trigger Deployment

Dokploy should auto-deploy from GitHub. If not:
1. Click **Deploy** or **Redeploy** button
2. Wait 5-10 minutes for build

### Step 3: Monitor Build Logs

Watch for these success messages:
```
✅ Schema created
✅ Import complete: 📝 Posts: 366
🎉 CLEAN IMPORT SUCCESSFUL!
✓ Ready in X.Xs
```

### Step 4: Verify Deployment

1. **Visit your site:** `https://your-domain.traefik.me/`
   - Should load without errors
   - Should show bird articles with images

2. **Visit admin:** `https://your-domain.traefik.me/admin`
   - Should show registration screen
   - Create your admin account

3. **Check a sample post:**
   - Click any article
   - Verify hero image displays
   - Check content loads properly

### Step 5: Post-Deployment Cleanup

**IMPORTANT:** After successful first deployment:

1. Go back to Dokploy environment variables
2. **REMOVE** the line: `FORCE_DB_REINIT=true`
3. Save (this preserves your data on future deployments)

## 🔍 Troubleshooting

### Site Not Loading

**Check Dokploy logs for:**
```
Error: Bail out to client-side rendering: useSearchParams()
```

**Solution:** This should be fixed now. If you still see it, check that the latest commit is deployed.

### Admin Panel Blank/White Screen

**Run in container:**
```bash
docker exec -it your-container sh
psql $DATABASE_URI -c "SELECT COUNT(*) FROM _posts_v WHERE parent_id IS NULL;"
```

If returns > 0, the entrypoint script should auto-fix it. If not, set `FORCE_DB_REINIT=true` and redeploy.

### No Posts Showing

**Check database:**
```bash
psql $DATABASE_URI -c "SELECT COUNT(*) FROM posts WHERE _status = 'published';"
```

Should return: **366**

If 0, set `FORCE_DB_REINIT=true` and redeploy.

### Images Not Loading

Check media URLs:
```bash
psql $DATABASE_URI -c "SELECT url FROM media LIMIT 5;"
```

Should show: `/media/filename.jpg`

The entrypoint auto-fixes wrong URLs, but if still broken, set `FORCE_DB_REINIT=true` and redeploy.

## 📊 Expected Results

### Database
- Posts: **366** bird articles
- Categories: **~50** hierarchical categories
- Media: **~700+** images
- Users: **0** (empty until you register)

### Site Features
- ✅ Homepage with article grid
- ✅ Hero images on all posts
- ✅ Category navigation
- ✅ Search functionality
- ✅ SEO meta tags
- ✅ Mobile responsive

## 📝 Quick Reference

### Your Database Connection
```
Host: webblog-kawaiibirddb-gq00ip
Port: 5432
Database: kawaii-bird-db
User: postgres
Password: 2801
```

### Your Dokploy Build Settings
```
Build Path: ./kawaiitorichan
Docker File: Dockerfile
Docker Context: .
```

### Environment Variables (Copy-Paste Ready)
```env
DATABASE_URI=postgresql://postgres:2801@webblog-kawaiibirddb-gq00ip:5432/kawaii-bird-db
PAYLOAD_SECRET=76a2b7954f87ee6abbe2924dbbc2b1be198dc0bc1d008abea0228863f1aed42d
NEXT_PUBLIC_SERVER_URL=https://your-domain.traefik.me
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
FORCE_DB_REINIT=true
```

## 🎯 Success Criteria

Your deployment is successful when:

1. ✅ Build completes without errors
2. ✅ Container starts and stays running
3. ✅ Homepage loads and shows articles
4. ✅ Hero images display on posts
5. ✅ Admin panel shows registration screen
6. ✅ You can create admin account
7. ✅ You can login to admin panel
8. ✅ Posts are visible in admin panel

## 🚨 Emergency Contact

If deployment completely fails:

**Set this environment variable:**
```env
USE_SIMPLE_SERVER=true
```

**Redeploy** - This loads a diagnostic server that shows exact errors.

**Check logs** for specific error messages.

**Fix the issue**, then remove `USE_SIMPLE_SERVER` and redeploy.

## 📚 Full Documentation

- [VPS_DEPLOYMENT_GUIDE.md](VPS_DEPLOYMENT_GUIDE.md) - Complete VPS deployment guide
- [ERROR_FIX_SUMMARY.md](ERROR_FIX_SUMMARY.md) - Details on the Suspense fix
- [DEPLOYMENT_FIX_GUIDE.md](DEPLOYMENT_FIX_GUIDE.md) - Hero image and data issues

---

## 🎉 You're Ready!

All code is pushed to GitHub. Just configure the environment variables in Dokploy and click Deploy!

**Estimated deployment time:** 5-10 minutes
**Expected result:** Fully working bird articles site with 366 posts and all images
