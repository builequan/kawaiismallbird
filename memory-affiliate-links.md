# Affiliate Links System - Project Memory

## Overview
Complete affiliate linking system implementation for the Japanese golf blog, enabling monetization through contextual product recommendations and inline text links. System has been significantly improved for better SEO, user experience, and tracking.

## Implementation Date
- January 2025: Japanese compound word protection, API endpoint updates
- January 2025: Major improvements - contextual matching, CSV export, link distribution
- December 2024: Initial comprehensive affiliate link integration

## System Architecture

### Core Components

#### 1. Inline Text Links
- **Location**: Embedded within article content using Lexical rich text editor
- **Styling**: Blue (#2563eb), underlined, with hover effects
- **Validation**: Proper `rel="nofollow sponsored"` attributes
- **Distribution**: Maximum 5 links per post, evenly distributed throughout article
- **Word Boundaries**: Proper Japanese text boundary detection to avoid partial matches
- **Contextual Matching**: Products matched based on relevance to surrounding text
- **Compound Word Protection**: Prevents splitting of Japanese compound words (スコアカード, プレーヤー, ゴルファー)

#### 2. Product Recommendation Box
- **Component**: `AffiliateLinksEnhanced.tsx`
- **Styling**: Green gradient box (`bg-gradient-to-br from-green-50 to-white`)
- **Content**: Exactly 3 products per article with pricing and CTA links
- **Placement**: Bottom of each article, client-side rendered

#### 3. Admin Management Interface
- **Location**: `/admin/affiliate-links`
- **Features**: 
  - Statistics dashboard (products, links, coverage)
  - JSON file import/export for products
  - Bulk processing controls
  - Product management functions
  - CSV export of all affiliate links with article details
  - Duplicate link detection and removal
  - Link distribution analysis

### File Structure

#### API Routes
```
src/app/api/affiliate-links/
├── import/route.ts           # JSON product import
├── statistics/route.ts       # Dashboard statistics
├── process-posts/route.ts    # Bulk post processing with contextual matching
├── remove-all/route.ts       # Link cleanup
├── products/remove-all/route.ts # Product cleanup
└── export-csv/route.ts       # Export links to CSV for tracking
```

#### Management Scripts
```
scripts/affiliate-links/
├── 04-apply-contextual-links-fixed.ts  # Contextual matching with proper boundaries
├── fix-duplicate-links.ts              # Remove duplicate keyword links
├── limit-links-to-five.ts             # Enforce 5-link maximum per post
├── remove-inline-links-keep-boxes.ts   # Remove text links, keep product boxes
├── verify-no-duplicates.ts            # Check for duplicate links
├── verify-link-structure.ts           # Validate link node structure
└── [20+ other utility scripts]
```

#### Components
```
src/components/
├── AffiliateLinksEnhanced.tsx    # Main product recommendation box
├── AffiliateLink.tsx             # Individual link component
└── ProductRecommendationBox.tsx  # Alternative box component
```

### Data Management

#### Product Storage
- **Primary**: JSON files in `data/affiliate-links/products-index.json`
- **Public**: Duplicate in `public/data/affiliate-links/` for client access
- **Structure**: Each product contains id, name, URL, price, keywords, anchor phrases

#### Link Integration
- **Method**: Contextual keyword matching with product relevance scoring
- **Keywords**: Golf-specific terms (ゴルフ, スイング, クラブ, ボール, etc.)
- **Limits**: Maximum 5 inline links per post, each keyword used only once
- **Distribution**: Even spacing algorithm throughout article length
- **Boundary Detection**: Japanese character analysis prevents partial matches

### Technical Implementation

#### Link Processing Algorithm
1. **Content Cleaning**: Remove existing affiliate links and recommendations
2. **Keyword Matching**: Find golf-related terms in article text
3. **Product Association**: Match keywords to relevant products
4. **Link Creation**: Insert properly structured Lexical link nodes
5. **Showcase Generation**: Create product recommendation section

#### Validation System
- **Link Structure**: Proper Lexical node format with required fields
- **URL Extraction**: Clean affiliate URLs from HTML strings
- **Error Handling**: Comprehensive validation to prevent malformed content

### Performance Metrics

#### Current Statistics (January 2025)
- **Total Posts**: 80 published articles
- **Posts with Links**: 80 (100% coverage)
- **Total Products**: 542 (all with verified A8 tracking codes)
- **Maximum Links per Post**: 5 (SEO optimized)
- **Product Recommendations**: 240 total (3 per post)
- **Tracking Code**: All products use `a8mat=45BP2Z+2BCPGY+2HOM+BWGDT`

#### User Experience
- **Link Styling**: Professional blue links with smooth hover transitions
- **Mobile Responsive**: Product boxes adapt to screen size
- **Load Performance**: Client-side rendering prevents blocking
- **Clean Presentation**: Removed duplicate text-based recommendations

### Maintenance Procedures

#### Regular Tasks
1. **Product Updates**: Import new JSON files via admin interface
2. **Link Refresh**: Re-process posts when product catalog changes
3. **Statistics Review**: Monitor performance through admin dashboard
4. **Content Cleanup**: Remove outdated or invalid links

#### Troubleshooting
- **Duplicate Links**: Use `fix-duplicate-links.ts` to remove duplicates
- **Too Many Links**: Run `limit-links-to-five.ts` to enforce limits
- **Partial Word Matches**: Update with `04-apply-contextual-links-fixed.ts`
- **Link Distribution**: Re-process with even spacing algorithm
- **CSV Export**: Available via admin interface Export CSV button
- **Tracking Verification**: All products verified to have correct A8 codes

### Future Enhancements

#### Planned Features
- **A/B Testing**: Different product recommendation layouts
- **Analytics Integration**: Click-through rate tracking
- **Dynamic Products**: Real-time product feed updates
- **Personalization**: User behavior-based recommendations

#### Scalability Considerations
- **Database Migration**: Consider moving from JSON to database storage
- **Caching Strategy**: Implement product data caching
- **API Rate Limits**: Monitor affiliate network API usage
- **Content Optimization**: Automatic keyword density management

## Key Learnings

### Technical Insights
1. **Lexical Editor**: Requires precise node structure for proper validation
2. **Japanese Text Processing**: Proper word boundary detection essential for accuracy
3. **Contextual Relevance**: Product-text matching improves user experience
4. **Link Distribution**: Even spacing throughout articles improves readability
5. **CSV Export**: UTF-8 BOM required for Excel Japanese text compatibility
6. **SEO Optimization**: 5-link limit prevents over-optimization penalties
7. **Compound Word Protection**: Critical for Japanese text - prevents breaking words like スコアカード into スコア + カード

### Business Impact
1. **Monetization Ready**: Complete system for affiliate revenue generation
2. **User Experience**: Natural integration doesn't disrupt reading flow
3. **Content Quality**: Professional presentation maintains editorial standards
4. **Scalable Foundation**: Architecture supports future expansion

## Commit References
- Initial Implementation: `e4f966e` - "feat: Complete affiliate links system with inline linking and styled recommendations"
- Latest Improvements: January 2025 - Contextual matching, CSV export, link optimization
  - Fixed duplicate links and enforced 5-link maximum
  - Implemented proper Japanese word boundary detection
  - Added CSV export functionality for link tracking
  - Improved contextual product-text matching
  - Verified all 542 products have correct A8 tracking codes

---
*This memory file documents the complete affiliate links system implementation for future reference and maintenance.*