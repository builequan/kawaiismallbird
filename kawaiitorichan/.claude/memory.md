# Project Memory - Kawaiitorichan Golf Website

## Recent Changes - Affiliate Links System Fix (September 2025)

### Problem Solved
1. **URL Field Issue**: Affiliate links were using `affiliate_url` field which contained HTML table code, causing 404 errors when users clicked links
2. **Content Cluttering**: Multiple affiliate links were appearing in the same paragraph, making content difficult to read and unprofessional

### Solution Implemented
1. **URL Field Fix**: Updated all components and scripts to use `clean_url` (proper affiliate URL with A8 tracking) instead of `affiliate_url` (HTML table code)
2. **One-Link-Per-Paragraph Rule**: Implemented strict enforcement to prevent multiple links in same paragraph
3. **Database Sync**: Added functionality to sync affiliate products between JSON files and database

### Key Technical Details
- **URL Priority**: All affiliate link components now use fallback pattern: `product.clean_url || product.affiliate_url`
- **Paragraph Processing**: Scripts stop processing paragraph completely after adding first link
- **Link Limits**: Maximum 5 links per post, distributed across different paragraphs
- **A8 Tracking**: A8 tracking codes (a8mat=45BP2Z+2BCPGY+2HOM+BWGDT) are preserved in clean_url

### Files Modified

#### API Routes
- `/src/app/api/affiliate-links/process-posts/route.ts` - Enforces 1 link per paragraph rule
- `/src/app/api/affiliate-links/import/route.ts` - Added database sync functionality
- `/src/app/api/affiliate-links/sync-to-db/route.ts` - New endpoint for manual database sync

#### Scripts
- `/scripts/sync-products-to-db.ts` - Standalone script for syncing products to database
- `/scripts/affiliate-links/add-database-affiliate-links.ts` - Fixed to use clean_url instead of affiliate_url
- All affiliate link processing scripts updated to respect paragraph limits

#### Components
- All affiliate link display components updated to prioritize `clean_url` over `affiliate_url`

### Admin Interface Updates
- **Sync to Database Button**: Added in affiliate links manager for manual synchronization
- **Process New Posts**: Now applies links with proper URL field and paragraph distribution limits
- **Link Management**: Better visibility into which posts have affiliate links applied

### Database Schema
- Affiliate products stored in database with proper clean_url field
- JSON files remain as backup/import source
- Sync functionality ensures consistency between file system and database

### Best Practices Established
1. Always use `clean_url` field for affiliate links in components
2. Enforce one-link-per-paragraph rule in all processing scripts
3. Maintain maximum 5 links per post limit
4. Use database as primary source, JSON as backup
5. Regular sync between file system and database

## System Architecture

### Affiliate Links Flow
1. **Import**: Products imported from JSON files via admin interface
2. **Sync**: Products synced to database for performance
3. **Processing**: Scripts apply links to posts with paragraph and count limits
4. **Display**: Components render links using clean_url with A8 tracking
5. **Management**: Admin interface provides oversight and manual controls

### Error Prevention
- URL validation before link application
- Paragraph-level duplicate prevention
- Database-JSON consistency checks
- A8 tracking code preservation

This system ensures professional presentation of affiliate links while maintaining proper tracking and user experience.