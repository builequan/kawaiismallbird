# Project Memory - PayloadCMS WordPress Import System

## Project Overview
This project implements a comprehensive WordPress content import system for PayloadCMS, featuring hierarchical categories, Mermaid diagram support, and Japanese-to-English translation capabilities.

## Key Technical Discoveries

### 1. Japanese About Us Page Implementation
**IMPORTANT**: Successfully implemented comprehensive Japanese "私たちについて" (About Us) page:

- **Location**: `/about-us` URL with full Japanese content
- **Structure**: Using Payload CMS blocks (heroBlog, content, callToAction)
- **Features**: Mission, philosophy, services, expertise, vision sections
- **AI Transparency**: Includes disclaimer about AI-generated content and images
- **SEO**: Optimized with Japanese meta title and description
- **Script**: `scripts/create-about-us-page.ts` for creation/updates
- **Content Reference**: `about-us-content.md` for content planning

**Key Implementation Details**:
- Must disable revalidation during script execution with `context: { disableRevalidate: true }`
- Use `overrideAccess: true` for programmatic page creation
- Follow existing gradient style options: 'pinkPurple', 'mintBlue', 'yellowOrange', 'lavenderPink'

### 2. PayloadCMS Lexical Block Structure
**CRITICAL**: PayloadCMS Lexical blocks require specific structure for validation:

```typescript
// ✅ CORRECT - Block identifier goes in fields.blockType
{
  type: 'block',
  fields: {
    blockType: 'mermaidDiagram',  // This is where the block slug goes
    title: 'Diagram Title',
    diagramCode: 'graph TD...',
    caption: 'Optional caption'
  },
  version: 1
}

// ❌ INCORRECT - These formats will fail validation
{
  type: 'block',
  blockName: 'mermaidDiagram',  // Wrong property name
  fields: { ... }
}

{
  type: 'block',
  blockType: 'mermaidDiagram',  // Wrong level - should be in fields
  fields: { ... }
}
```

**Error Message**: "Block undefined not found" indicates incorrect block structure.

### 2. PayloadCMS Field Positioning
**Categories Field Visibility Issue**: Categories field must be placed outside the tabs structure to be visible in the post editor interface. Fields inside tabs may not appear in certain admin contexts.

### 3. Mermaid.js Integration
- Use `mermaid.js` library for client-side rendering
- Clean diagram code by removing markdown code fence syntax
- Implement error boundary for rendering failures
- Use `useEffect` with proper cleanup for re-initialization

### 4. WordPress Import Challenges
- **Markdown to Lexical Conversion**: Complex process requiring proper paragraph structure and block handling
- **Category Hierarchy**: Must create parent categories first, then assign children
- **Japanese Translation**: Requires comprehensive mapping dictionary for proper English slug generation
- **Image Processing**: Handle separate image directories and missing files gracefully

### 5. Database Schema Issues
- **Duplicate Field Error**: Can occur from field definition conflicts
- **Relationship Fields**: Require proper depth settings for population
- **Computed Fields**: Remove problematic computed fields (like breadcrumbs) that cause schema errors

## Architecture Decisions

### 1. Import System Design
```
WordPress Export Folder Structure:
├── wordpress/          # Markdown files with frontmatter
├── japanese/          # Japanese language content
└── images/           # Media files
```

### 2. Category Translation Strategy
```typescript
const categoryTranslations: Record<string, string> = {
  'ゴルフ指導': 'Golf Instruction',
  'ゴルフ技術': 'Golf Technique',
  // Comprehensive mapping for consistent translation
}
```

### 3. Block System Extension
- Custom Mermaid diagram block with proper validation
- Client-side rendering with mermaid.js
- Error handling and fallback display

## Common Pitfalls & Solutions

### 1. Block Validation Errors
**Problem**: "Block undefined not found" validation errors
**Solution**: Ensure `fields.blockType` contains the block slug, not top-level properties

### 2. Categories Not Showing
**Problem**: Category field missing from post editor
**Solution**: Move categories field outside tabs structure in collection config

### 3. Import Progress Issues
**Problem**: Large imports cause timeouts
**Solution**: Implement batch processing and progress tracking

### 4. Revalidation Context Errors
**Problem**: Next.js revalidation fails during script execution
**Solution**: Wrap revalidation calls in try-catch blocks

## Performance Considerations

### 1. Import Optimization
- Process files in batches
- Use database transactions for data consistency
- Implement progress tracking for user feedback

### 2. Mermaid Rendering
- Client-side rendering to avoid SSR issues
- Lazy loading for better performance
- Error boundaries for graceful failures

## Development Workflow

### 1. Testing Block Structures
Always test new block types with a dedicated script:
```bash
pnpm tsx scripts/test-mermaid.ts
```

### 2. Import Validation
Test import process with single files before bulk operations:
```bash
pnpm tsx scripts/import-terminology.ts
```

### 3. Database Inspection
Use inspection scripts to understand existing data structures:
```bash
pnpm tsx scripts/inspect-blocks.ts
```

## Lessons for Future Development

1. **Always verify block structure** before implementing custom blocks
2. **Test field positioning** in actual admin interface, not just schema
3. **Implement comprehensive error handling** for import operations
4. **Use TypeScript strictly** for better development experience
5. **Document complex relationships** like category hierarchies
6. **Plan for localization** early in the development process

## File Structure Knowledge

### Key Import Files
- `src/utilities/wordpress-import.ts` - Core import logic
- `src/utilities/markdown-to-lexical.ts` - Content conversion
- `scripts/` - Import and testing scripts
- `src/blocks/MermaidDiagram/` - Custom block implementation

### Configuration Files
- `src/collections/Posts/index.ts` - Enhanced with WordPress fields
- `src/collections/Categories.ts` - Hierarchical structure
- `src/payload.config.ts` - Main CMS configuration

This memory serves as a reference for future development and debugging of the WordPress import system.