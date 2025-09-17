# Reference Sections Management

## Overview
Implemented a collapsible reference section system for blog posts that automatically extracts and displays references (出典・参考文献) from imported WordPress content.

## Problem Solved
- Posts imported from WordPress had duplicate reference headings (e.g., "出典・参考文献出典・参考文献")
- References were displayed inline with article content, making posts unnecessarily long
- No way to hide/show references on demand

## Solution Architecture

### Components Created

1. **CollapsibleReferences.tsx** (`/src/components/CollapsibleReferences.tsx`)
   - Simple toggle component with expand/collapse functionality
   - Uses ChevronDown/ChevronRight icons from lucide-react
   - Closed by default, expands on click
   - Two variants: full-featured and simple

2. **PostReferences.tsx** (`/src/components/PostReferences.tsx`)
   - Extracts references from Lexical content structure
   - Identifies reference sections by headings containing:
     - "出典"
     - "参考文献"
     - "参考資料"
     - "References"
   - Handles duplicated heading text from WordPress imports
   - Cleans up numbered list formatting

3. **RichTextWithFilteredReferences.tsx** (`/src/components/RichTextWithFilteredReferences.tsx`)
   - Wrapper for RichText component
   - Filters out reference sections from main content display
   - Searches backwards from end of content for more accuracy
   - Only considers headings in last 50% of content as potential reference sections

### Integration Points

1. **Post Page** (`/src/app/(frontend)/posts/[slug]/page.tsx`)
   ```tsx
   <ContentWithAffiliateLinksOptimized>
     <RichTextWithFilteredReferences content={post.content} />
   </ContentWithAffiliateLinksOptimized>

   <PostReferences content={post.content} />
   ```

2. **Admin Interface** (`/src/components/admin/InternalLinksManager.tsx`)
   - Added "Clean Reference Sections" button
   - Calls API endpoint to remove references from all posts

3. **API Route** (`/src/app/api/internal-links/remove-references/route.ts`)
   - Batch processes all posts to remove reference sections
   - Fixes duplicated heading text
   - Handles Lexical content structure updates

### Scripts for Maintenance

1. **debug-references.ts** - Debug specific post's reference structure
2. **fix-and-remove-references.ts** - Fix duplicated text and remove references
3. **remove-reference-sections.ts** - Remove reference sections from all posts
4. **check-post-references.ts** - Check which posts have reference sections

## Technical Details

### Lexical Content Structure
References are stored in Lexical editor format with structure:
```javascript
{
  root: {
    children: [
      { type: 'heading', children: [{ type: 'text', text: '出典・参考文献' }] },
      { type: 'list', children: [...listItems] }
    ]
  }
}
```

### Duplicated Text Issue
WordPress import created duplicated heading text like "出典・参考文献出典・参考文献". The system handles both:
- Original format: "出典・参考文献"
- Duplicated format: "出典・参考文献出典・参考文献"

### Detection Algorithm
1. Searches from end of content backwards
2. Identifies headings with reference keywords
3. Only considers headings in last 50% of content
4. Extracts all list items and paragraphs after reference heading
5. Cleans up numbering (removes "1. ", "2) ", etc.)

## User Experience

### Before
- Long posts with references inline
- Duplicated heading text
- No way to hide references

### After
- Clean article content
- References in collapsible section at bottom
- Closed by default (saves screen space)
- Click to expand and view references
- Professional appearance

## Usage

### For Developers
- Import `PostReferences` component for any post-like content
- Use `RichTextWithFilteredReferences` instead of `RichText` when references should be separated
- Run maintenance scripts as needed to clean imported content

### For Content Editors
- References automatically extracted and displayed
- No manual intervention needed
- Admin button available for bulk cleanup if needed

## Future Enhancements
- Add reference counting badge
- Support for footnote-style references
- Export references to citation formats (BibTeX, etc.)
- Automatic link validation for reference URLs