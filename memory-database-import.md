# Database Import System - Memory Context

## Overview
Complete database import system for importing articles from content_creation_db into Payload CMS with proper image handling and markdown formatting.

## Key Features Implemented

### 1. Database Import UI (`/admin/database-import`)
- Multi-database connection support
- Website and language selection interface
- Import progress tracking with real-time updates
- Duplicate detection and prevention
- Import statistics dashboard

### 2. Content Conversion System
- **Markdown to Lexical conversion** (`article-to-lexical.ts`)
  - Handles headings, paragraphs, lists, tables, quotes
  - Processes bold (`**text**`) and italic (`*text*`) formatting
  - Converts code blocks and inline code
  - Preserves Mermaid diagrams

### 3. Image Processing Pipeline
- **Image handler** (`image-handler.ts`)
  - Downloads images from external URLs
  - Uploads to Payload media collection
  - Caches uploaded images to prevent duplicates
  - Handles various image formats (JPEG, PNG, etc.)

### 4. RichText Component Fixes
- **Upload converter** for displaying images
  - Handles both populated and unpopulated media references
  - Corrects URL paths from `/api/media/file/` to `/media/`
- **Text formatting** support
  - Bold (format flag 1)
  - Italic (format flag 2)
  - Code (format flag 16)
  - Strikethrough (format flag 4)
  - Underline (format flag 8)
- **List rendering** with proper styling
- **Table support** with headers and borders

### 5. Post Collection Updates
- Added `contentDbMeta` field for tracking imported articles
  - `originalId`: Source database article ID
  - `websiteId`: Source website ID
  - `language`: Article language
  - `importedAt`: Import timestamp

## Database Configuration

### Connection Details
```typescript
{
  host: '127.0.0.1',
  port: 5432,
  user: 'postgres',
  password: '2801',
  database: 'content_creation_db'
}
```

### Site Configuration
- Site 19: Japanese Golf Content
- Site 18: English Golf Content
- Site 17: Japanese Golf Reviews
- Site 16: English Golf Reviews

## Import Scripts

### Main Import Commands
```bash
# Import articles via UI
http://localhost:3001/admin/database-import

# Process images in existing posts
PAYLOAD_SECRET=your-secret-key-here DATABASE_URI=postgres://postgres:2801@127.0.0.1:5432/golfer pnpm tsx scripts/content-db-migration/process-post-images-simple.ts

# Fix markdown formatting in posts
PAYLOAD_SECRET=your-secret-key-here DATABASE_URI=postgres://postgres:2801@127.0.0.1:5432/golfer pnpm tsx scripts/fix-markdown-formatting.ts
```

### Test Scripts
```bash
# Test import with images
pnpm tsx scripts/test-import-with-images.ts

# Test display features
pnpm tsx scripts/test-display-features.ts
```

## Critical Fixes Applied

### 1. Image Display Fix
- Changed post query depth from 1 to 2 to populate media relationships
- Updated RichText component to handle URL path conversion
- Images now use public `/media/` directory instead of API endpoint

### 2. Markdown Formatting Fix
- Created script to convert `**bold**` and `*italic*` syntax to Lexical format
- Processes text nodes to apply proper format flags
- Fixed 79 posts with incorrect formatting

### 3. List and Table Rendering
- Added proper converters for lists (bullet and numbered)
- Implemented table support with header row detection
- Applied consistent styling across all list types

## API Endpoints Created

- `GET /api/database-import/databases` - List available databases
- `GET /api/database-import/site-config` - Get site configuration
- `GET /api/database-import/site-languages` - Get languages for a site
- `GET /api/database-import/articles` - Get articles for import
- `POST /api/database-import/import` - Import selected articles
- `GET /api/database-import/check-imported` - Check import status
- `GET /api/database-import/stats` - Get import statistics

## Known Issues Resolved

1. ✅ Images not displaying - Fixed with URL path correction
2. ✅ Bold/italic text not rendering - Fixed with markdown conversion
3. ✅ Lists not showing bullets - Fixed with list converters
4. ✅ Tables missing borders - Fixed with table styling
5. ✅ Duplicate imports - Fixed with contentDbMeta tracking

## Import Statistics
- Total articles available: 753
- Successfully imported: 79 posts
- Images processed and uploaded
- All formatting issues resolved

## Future Enhancements
- Batch import functionality
- Scheduled import automation
- Category mapping improvements
- Author attribution system
- Import history tracking