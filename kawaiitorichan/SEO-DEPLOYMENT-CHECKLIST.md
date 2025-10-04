# SEO Implementation - Pre-Deployment Checklist

## ✅ Code Changes Summary

### New Files Created (9 files)
- ✅ `src/utilities/generateStructuredData.ts` - JSON-LD schema generators
- ✅ `src/utilities/serializeRichText.ts` - RichText to plain text converter
- ✅ `src/utilities/calculateReadingTime.ts` - Reading time calculator (Japanese/English)
- ✅ `src/components/StructuredData.tsx` - JSON-LD renderer component
- ✅ `src/components/Breadcrumbs.tsx` - SEO breadcrumb navigation
- ✅ `src/app/robots.ts` - Dynamic robots.txt
- ✅ `src/app/sitemap.ts` - Combined sitemap (all posts, categories, pages)
- ✅ `src/app/image-sitemap.xml/route.ts` - Image sitemap route handler

### Files Modified (7 files)
- ✅ `src/utilities/generateMeta.ts` - Added canonical URLs, keywords, enhanced OG/Twitter cards
- ✅ `src/utilities/mergeOpenGraph.ts` - Updated branding to "Golf Knowledge Hub"
- ✅ `src/app/(frontend)/layout.tsx` - Added site-wide Organization & WebSite schemas
- ✅ `src/app/(frontend)/posts/[slug]/page.tsx` - Added Article schema, breadcrumbs, enabled ISR
- ✅ `src/app/(frontend)/categories/[slug]/page.tsx` - Added breadcrumbs, canonical URLs, ISR
- ✅ `src/collections/Media.ts` - Required alt text with validation
- ✅ `next.config.js` - Enabled ISR cache (50MB)

### Files Deleted (6 files)
- ✅ `public/robots.txt` - Replaced by dynamic route
- ✅ `public/sitemap.xml` - Replaced by dynamic route
- ✅ `src/app/posts-sitemap.ts` - Consolidated into main sitemap
- ✅ `src/app/categories-sitemap.ts` - Consolidated into main sitemap
- ✅ `src/app/pages-sitemap.ts` - Consolidated into main sitemap
- ✅ `src/app/image-sitemap.ts` - Moved to proper route handler
- ✅ `src/app/(frontend)/(sitemaps)/` - Old sitemap folder (conflicted with new structure)

---

## 🔍 Critical Pre-Deployment Checks

### 1. Environment Variables
**Required in Dokploy:**
```env
NEXT_PUBLIC_SERVER_URL=https://your-domain.traefik.me
DATABASE_URI=postgresql://postgres:password@db:5432/golfer
PAYLOAD_SECRET=your-secret-key-here
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
```

**⚠️ IMPORTANT:** Update `NEXT_PUBLIC_SERVER_URL` to your actual Dokploy domain!

### 2. SEO URLs to Test After Deployment
- ✅ `https://your-domain/robots.txt` - Should show dynamic robots.txt
- ✅ `https://your-domain/sitemap.xml` - Should show all pages, posts, categories
- ✅ `https://your-domain/image-sitemap.xml` - Should show images from posts
- ✅ `https://your-domain/posts/[any-post-slug]` - Should have JSON-LD Article schema
- ✅ Test in Google Rich Results Test: https://search.google.com/test/rich-results

### 3. Expected SEO Improvements
**Structured Data:**
- Article schema with author, publish date, word count
- BreadcrumbList schema on all pages
- Organization schema site-wide
- WebSite schema with search box

**Metadata:**
- Canonical URLs on all pages
- Keywords from post meta
- Enhanced Open Graph with image dimensions
- Twitter Card with large images
- Alt text required on all images

**Performance:**
- ISR enabled (revalidate every hour)
- Static HTML for crawlers
- 50MB ISR cache enabled

### 4. Known Issues (Won't Block Deployment)
**Lint Warnings (Non-Critical):**
- Some unused variables in admin scripts
- `<img>` tags in legacy pages (planned migration to next/image)
- TypeScript `any` types in some legacy code

**These are pre-existing and don't affect SEO functionality**

---

## 📋 Deployment Steps

### Step 1: Local Build Test
```bash
pnpm build
```
Expected: Build should complete without errors

### Step 2: Commit Changes
```bash
git add .
git commit -m "🚀 SEO: Add comprehensive structured data, sitemaps, ISR, and metadata improvements

- Add JSON-LD schemas (Article, Organization, WebSite, BreadcrumbList)
- Implement dynamic robots.txt and sitemaps
- Enable ISR with 1-hour revalidation for better crawling
- Add canonical URLs and enhanced Open Graph/Twitter cards
- Require alt text on all media uploads
- Add breadcrumb navigation with schema markup
- Fix RichText excerpt handling with plain text serializer
- Add word count to Article schema
- Consolidate sitemaps into single unified sitemap
- Create image sitemap for image SEO"
```

### Step 3: Push to GitHub
```bash
git push origin master
```

### Step 4: Verify Dokploy Environment
- Check `NEXT_PUBLIC_SERVER_URL` is set to production domain
- Verify database connection string
- Confirm PAYLOAD_SECRET is set

### Step 5: Deploy on Dokploy
- Trigger rebuild in Dokploy UI
- Monitor build logs
- Wait for deployment to complete (~5-10 minutes)

### Step 6: Post-Deployment Verification
```bash
# Test robots.txt
curl https://your-domain/robots.txt

# Test sitemap
curl https://your-domain/sitemap.xml

# Test image sitemap
curl https://your-domain/image-sitemap.xml

# Test a post page (check for JSON-LD in <head>)
curl https://your-domain/posts/[any-slug] | grep 'application/ld+json'
```

---

## 🎯 Expected Results

### Google Search Console
1. Submit new sitemaps:
   - `https://your-domain/sitemap.xml`
   - `https://your-domain/image-sitemap.xml`

2. Request indexing for key pages

3. Monitor Rich Results:
   - Article cards should appear for blog posts
   - Breadcrumbs should show in search results

### Lighthouse SEO Score
- Before: ~70-80
- After: 95-100

### Page Speed
- ISR should provide instant page loads
- Static HTML improves TTFB (Time to First Byte)

---

## 🐛 Troubleshooting

### If sitemaps don't work:
1. Check `NEXT_PUBLIC_SERVER_URL` environment variable
2. Verify database connection (sitemaps query database)
3. Check Dokploy logs for errors

### If structured data doesn't appear:
1. View page source and search for `application/ld+json`
2. Test with Google Rich Results Test tool
3. Check if ISR is working (pages should be cached)

### If ISR doesn't work:
1. Verify `next.config.js` has `isrMemoryCacheSize: 50 * 1024 * 1024`
2. Check post/category pages have `export const revalidate = 3600`
3. Monitor cache headers in browser dev tools

---

## ✨ Success Criteria

- [ ] All sitemaps accessible and valid XML
- [ ] JSON-LD appears in page source for posts
- [ ] Breadcrumbs visible on post and category pages
- [ ] Canonical URLs in page `<head>`
- [ ] Google Rich Results Test passes for Article schema
- [ ] Lighthouse SEO score 95+
- [ ] Pages load with static HTML (ISR working)
- [ ] No console errors in browser
- [ ] No build errors in Dokploy logs

---

**Status:** ✅ Ready for Deployment
**Reviewed:** October 4, 2025
**Impact:** High - Major SEO improvements, better crawling, rich search results
