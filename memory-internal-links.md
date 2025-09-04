# Internal Links System - Memory

## Overview
The internal links system automatically adds semantic links between related posts using vector embeddings and cosine similarity. It analyzes Japanese content to find meaningful phrases and creates natural internal links.

## System Architecture

### Core Components
1. **Index Building** (`01-build-index-fixed.ts`)
   - Extracts posts from database
   - Identifies Japanese anchor phrases using TinySegmenter
   - Creates searchable index with post metadata

2. **Embedding Generation** (Python script)
   - Uses Sentence Transformers (all-MiniLM-L6-v2)
   - Generates 384-dimensional vectors for each post
   - Stores embeddings in JSON format

3. **Similarity Computation** (`03-compute-similarity-fixed.ts`)
   - Calculates cosine similarity between all post pairs
   - Filters to top 20 most similar posts per post
   - Threshold: 0.7+ for high-quality matches

4. **Link Application** (`04-apply-semantic-links-fixed.ts`)
   - Applies semantic links without duplicates
   - Prevents self-linking and bidirectional links
   - Maximum 5 links per post
   - Tracks links globally to prevent A→B and B→A patterns

## Key Features
- **Japanese Phrase Extraction**: Multi-word phrases like "スイングプレーン", "ゴルフレッスン"
- **Semantic Matching**: Uses embeddings for contextual relevance
- **Duplicate Prevention**: Each keyword linked only once per post
- **Bidirectional Prevention**: If post A links to B, B won't link back to A
- **Natural Integration**: Links appear naturally within content text

## Known Issues Resolved

### Self-Linking Issue (Fixed)
**Problem**: Posts appeared to link to themselves on the frontend
**Root Causes**:
1. Frontend RichText component wasn't handling internal links properly
2. Post query used `depth: 0`, not populating link relationships

**Solution**:
- Updated RichText component to handle internal links using `internalDocToHref`
- Changed post query to use `depth: 2` to populate doc relationships
- Internal links now properly resolve to target post URLs

### Stale Index Issue (Fixed)
**Problem**: Links pointed to wrong posts after data reimport
**Cause**: Index contained old post IDs from before deletion/reimport
**Solution**: Rebuild index after any data changes

## Command Reference

### Full Pipeline
```bash
# 1. Build index
pnpm tsx scripts/internal-links/01-build-index-fixed.ts

# 2. Generate embeddings
python3 scripts/internal-links/embedding-service.py

# 3. Compute similarity
pnpm tsx scripts/internal-links/03-compute-similarity-fixed.ts

# 4. Apply links (force mode to bypass cache)
pnpm tsx scripts/internal-links/04-apply-semantic-links-fixed.ts --force
```

### Utilities
```bash
# Remove all internal links
pnpm tsx scripts/internal-links/simple-remove-all.ts

# Apply with limit
pnpm tsx scripts/internal-links/04-apply-semantic-links-fixed.ts --limit=10
```

## Database Structure
Internal links are stored in Lexical JSON format:
```json
{
  "type": "link",
  "fields": {
    "linkType": "internal",
    "doc": {
      "value": 430,  // Target post ID
      "relationTo": "posts"
    },
    "newTab": false,
    "url": null
  },
  "children": [
    {
      "type": "text",
      "text": "anchor text"
    }
  ]
}
```

## Frontend Integration
- Post pages must use `depth: 2` when fetching to populate relationships
- RichText component handles both internal and affiliate links
- Internal links use format: `/posts/{slug}`

## Admin Dashboard
Available at `/admin/internal-links` with:
- Statistics overview
- Process controls
- Link distribution charts
- Most linked posts tracking

## Best Practices
1. Always rebuild index after importing new posts
2. Use --force flag when reapplying after content changes
3. Monitor link coverage in admin dashboard
4. Verify no self-links in database after processing

## Technical Notes
- Similarity threshold: 0.7+ for quality matches
- Maximum 5 internal links per post
- Global link tracking prevents bidirectional linking
- Japanese text requires proper phrase segmentation
- Frontend must populate relationships for link resolution