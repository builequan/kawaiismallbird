# WordPress Import System - Project Memory

## Overview
Comprehensive WordPress content import system with duplicate prevention, batch processing, and smart content conversion capabilities for the Japanese golf blog.

## Implementation Date
January 2025 - Enhanced with duplicate title/hero image prevention

## System Architecture

### Core Components

#### 1. Import Interface
- **Location**: `/admin/import-wordpress`
- **Features**:
  - Single folder import
  - Batch import for multiple folders
  - Folder picker with file type filtering
  - Real-time progress tracking
  - Dry run preview mode
  - Duplicate removal toggle (enabled by default)

#### 2. Content Processing
- **Markdown to Lexical Conversion**: Full-featured markdown parser
- **Frontmatter Extraction**: Metadata preservation from WordPress exports
- **Image Processing**: Automatic upload and reference updating
- **Duplicate Prevention**: Smart detection and removal of redundant content

#### 3. Special Content Support
- **Mermaid Diagrams**: Automatic detection and rendering
- **Code Blocks**: Language-specific syntax highlighting
- **Tables**: Proper table structure conversion
- **Japanese Content**: Full Unicode support

### File Structure

#### API Routes
```
src/app/api/import-wordpress/
└── route.ts                    # Main import endpoint (POST/GET)
```

#### Utilities
```
src/utilities/
├── wordpress-import.ts          # Core import logic
├── markdown-to-lexical.ts      # Content conversion with duplicate removal
├── image-upload.ts             # Media handling and processing
└── [other utility files]
```

#### Components
```
src/components/
├── FolderPicker.tsx            # File system navigation
└── ImportedPostContent.tsx    # Rendered content display
```

#### Scripts
```
scripts/
├── test-duplicate-removal.ts   # Verification of duplicate prevention
├── fresh-import.ts             # Full fresh import
├── import-terminology.ts       # Specific post import
└── [other import scripts]
```

### Duplicate Prevention System

#### Title Deduplication
1. **Exact H1 Match**: Removes `# Title` that matches metadata
2. **Plain Text Match**: Removes title at content beginning without markdown
3. **Fuzzy Matching**: Checks first 5 lines for similar H1 headings
4. **Case Insensitive**: Handles variations in capitalization

#### Hero Image Deduplication  
1. **Featured Image Detection**: Identifies image from metadata
2. **Content Scanning**: Checks first 10 lines for duplicate image
3. **Path Variations**: Handles different path formats and extensions
4. **Smart Removal**: Only removes if image matches featured_image

#### Control Options
- **UI Toggle**: "Remove Duplicate Titles and Hero Images (Recommended)"
- **Default Enabled**: Best practice for clean imports
- **Programmatic Control**: `removeDuplicates` parameter in API

### Import Process Flow

#### 1. File Reading
```typescript
// Read markdown files from specified folder
const files = fs.readdirSync(folderPath).filter(file => file.endsWith('.md'))
```

#### 2. Content Parsing
```typescript
// Convert with duplicate removal (default: true)
const converted = await convertMarkdownToLexical(content, removeDuplicates)
```

#### 3. Media Processing
```typescript
// Upload images and update references
const heroImageId = await uploadImageToPayload({
  imagePath: metadata.featured_image,
  imagesFolder,
  altText: metadata.featured_image_alt
})
```

#### 4. Category Management
- **Hierarchical Structure**: Parent-child category relationships
- **Japanese Support**: Bilingual category names
- **Auto-creation**: Creates missing categories during import

### Data Management

#### Metadata Preservation
- **WordPress Fields**: Author, date, modified date, status
- **SEO Data**: Meta description, keywords, focus keyphrase
- **Custom Fields**: Comments enabled, TOC enabled
- **Language Detection**: Automatic based on file path

#### Error Handling
- **Graceful Failures**: Continue import despite individual file errors
- **Detailed Reporting**: File-specific error messages
- **Fallback Images**: Default hero images when featured image fails
- **Validation**: Pre-import checks for file existence

### Performance Metrics

#### Import Statistics
- **Batch Processing**: Multiple folders in single operation
- **Progress Tracking**: Real-time status updates
- **Success/Failure Counts**: Detailed import results
- **File-by-file Status**: Created, updated, skipped, or failed

#### Typical Import Results
```json
{
  "success": true,
  "imported": 45,
  "failed": 2,
  "details": [
    {
      "file": "golf-tips.md",
      "status": "created",
      "title": "Essential Golf Tips"
    }
  ]
}
```

### Testing & Verification

#### Test Scripts
1. **test-duplicate-removal.ts**: Verifies title/image deduplication
2. **test-mermaid.ts**: Validates diagram processing
3. **import-terminology.ts**: Tests specific content import

#### Validation Points
- Title appears only once (in metadata, not content)
- Hero image not duplicated in article body
- Mermaid diagrams properly converted
- Images uploaded and referenced correctly

### Maintenance Procedures

#### Regular Tasks
1. **Export Folder Updates**: New content from WordPress
2. **Image Folder Sync**: Ensure media files available
3. **Category Mapping**: Update parent-child relationships
4. **Test Imports**: Verify with dry run before actual import

#### Troubleshooting
- **Duplicate Content**: Enable "Remove Duplicates" checkbox
- **Missing Images**: Verify image folder path and file existence
- **Category Issues**: Check category mapping configuration
- **Conversion Errors**: Review markdown syntax and frontmatter

### Configuration

#### Environment Variables
```env
DATABASE_URI=postgres://...
PAYLOAD_SECRET=...
```

#### Default Paths
```javascript
defaultImagesFolder: '/Users/builequan/Desktop/web/rewriteapp_try7/export/images'
sampleFolders: [
  '/Users/builequan/Desktop/web/rewriteapp_try7/export/japanese',
  '/Users/builequan/Desktop/web/rewriteapp_try7/export/wordpress'
]
```

### Key Improvements (January 2025)

#### Duplicate Prevention Enhancement
- **Problem**: Double titles and hero images in imported posts
- **Solution**: Smart detection and removal algorithms
- **Implementation**: Regex patterns with fallback strategies
- **User Control**: Toggle option in UI (recommended enabled)

#### Code Quality
- **TypeScript**: Full type safety throughout
- **Error Handling**: Comprehensive try-catch blocks
- **Logging**: Detailed console output for debugging
- **Testing**: Dedicated test scripts for verification

## Commit References
- Duplicate Fix: `2baada1` - "fix: Prevent duplicate titles and hero images in WordPress import"
- Previous Work: Multiple commits for core import functionality

## Future Enhancements

### Planned Features
- **Incremental Import**: Only import new/changed content
- **Media Optimization**: Automatic image compression
- **Content Validation**: Pre-import content quality checks
- **Import History**: Track and revert import operations

### Architecture Improvements
- **Queue System**: Background processing for large imports
- **Webhook Integration**: Auto-import on WordPress changes
- **Cloud Storage**: Support for remote image sources
- **Multi-language**: Extended language detection and processing

---
*This memory file documents the WordPress import system with focus on duplicate prevention and content quality.*