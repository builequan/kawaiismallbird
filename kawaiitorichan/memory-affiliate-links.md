# Affiliate Links System - Project Memory

## Overview
Complete affiliate linking system implementation for the Japanese golf blog, enabling monetization through contextual product recommendations and inline text links.

## Implementation Date
January 2025 - Session focused on comprehensive affiliate link integration
September 2025 - Major refactoring for natural link distribution

## System Architecture

### Core Components

#### 1. Inline Text Links (Updated Sept 2025)
- **Location**: Embedded within article content using Lexical rich text editor
- **Styling**: Blue (#2563eb), underlined, with hover effects + Shopping cart icon (🛒)
- **Validation**: Proper `rel="sponsored nofollow noopener"` attributes
- **Distribution**: 938 total links across 66 posts (natural distribution)
- **Limits**: Maximum 2 links per paragraph, 6 per article

#### 2. Product Recommendation Box (Removed Sept 2025)
- **Status**: Removed in favor of natural inline links only
- **Reason**: Better user experience with contextual links vs separate boxes

#### 3. Admin Management Interface
- **Location**: `/admin/affiliate-links`
- **Features**: 
  - Statistics dashboard (products, links, coverage)
  - JSON file import/export for products
  - Bulk processing controls
  - Product management functions

### File Structure

#### API Routes
```
src/app/api/affiliate-links/
├── import/route.ts           # JSON product import
├── statistics/route.ts       # Dashboard statistics
├── process-posts/route.ts    # Bulk post processing
├── remove-all/route.ts       # Link cleanup
└── products/remove-all/route.ts # Product cleanup
```

#### Management Scripts (Updated Sept 2025)
```
scripts/affiliate-links/
├── add-natural-affiliate-links.ts     # Natural distribution (max 2/paragraph)
├── add-database-affiliate-links.ts    # Links from 542 product database
├── fix-all-affiliate-links.ts        # Ensures all links have cart icons
├── add-golf-affiliate-links.ts       # Golf-specific keyword linking
├── remove-showcase-sections.ts       # Remove product boxes
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
- **Method**: Contextual keyword matching within article content
- **Keywords**: Golf-specific terms (ゴルフ, スイング, クラブ, ボール, etc.)
- **Limits**: Maximum 6 inline links per post, each keyword used only once

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

#### Current Statistics (September 2025)
- **Total Posts**: 66 published articles
- **Posts with Links**: 66 (100% coverage)
- **Total Inline Links**: 938 (with shopping cart icons)
- **Average per Post**: 6 links (naturally distributed)
- **Products Database**: 542 active products from Rakuten/A8.net
- **Product Recommendations**: Removed in favor of inline links

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
- **Validation Errors**: Use `fix-all-posts-affiliate-links.ts` to repair structure
- **Missing Links**: Check product JSON file and keyword matching
- **Duplicate Content**: Run `remove-text-recommendations.ts` cleanup
- **Performance Issues**: Monitor client-side component rendering

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
2. **Client-Server Split**: Admin processing server-side, display client-side
3. **Content Integrity**: Critical to clean existing content before adding new links
4. **Japanese Content**: Requires specific keyword matching for golf terminology

### Business Impact
1. **Monetization Ready**: Complete system for affiliate revenue generation
2. **User Experience**: Natural integration doesn't disrupt reading flow
3. **Content Quality**: Professional presentation maintains editorial standards
4. **Scalable Foundation**: Architecture supports future expansion

## Commit References
- Initial Implementation: `e4f966e` - "feat: Complete affiliate links system with inline linking and styled recommendations"
- Natural Distribution Update: `cd00d11` - "feat: Implement comprehensive affiliate link system with natural distribution"
- File Structure: 49 files changed, 53,989 insertions, 73,778 deletions
- Key Scripts: Comprehensive suite of 20+ management and processing tools

---
*This memory file documents the complete affiliate links system implementation for future reference and maintenance.*