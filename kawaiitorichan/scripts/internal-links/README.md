# Internal Backlinking System

Automated internal linking system for posts using semantic similarity and keyword matching.

## Features

- **Semantic Analysis**: Uses embeddings to find contextually related posts
- **Smart Anchor Detection**: Identifies meaningful phrases for natural link placement
- **Edge Case Handling**: Manages reimports, new posts, and content updates
- **Configurable Limits**: Maximum 5 internal links per post (adjustable)
- **Language Support**: Works with both Japanese and English content
- **Incremental Updates**: Efficient processing for new content

## Installation

### Python Dependencies (Optional)

For better semantic embeddings, install Python dependencies:

```bash
pip install sentence-transformers scikit-learn numpy
```

If not installed, the system will use a JavaScript fallback.

## Usage

### Full Pipeline

Run all steps to process all posts:

```bash
# Full execution
pnpm tsx scripts/internal-links/run-all.ts

# Dry run (preview changes)
pnpm tsx scripts/internal-links/run-all.ts --dry-run

# Skip indexing (use existing data)
pnpm tsx scripts/internal-links/run-all.ts --skip-index
```

### Individual Steps

Run steps separately for debugging or partial updates:

```bash
# 1. Build post index
pnpm tsx scripts/internal-links/01-build-index.ts

# 2. Generate embeddings
pnpm tsx scripts/internal-links/02-generate-embeddings.ts

# 3. Compute similarity matrix
pnpm tsx scripts/internal-links/03-compute-similarity.ts

# 4. Apply backlinks (with options)
pnpm tsx scripts/internal-links/04-apply-backlinks.ts
pnpm tsx scripts/internal-links/04-apply-backlinks.ts --dry-run
pnpm tsx scripts/internal-links/04-apply-backlinks.ts --limit=10
```

### Single Post Update

Update links for a specific post:

```bash
# Update using existing index
pnpm tsx scripts/internal-links/update-single-post.ts my-post-slug

# Rebuild index entry and update
pnpm tsx scripts/internal-links/update-single-post.ts my-post-slug --rebuild
```

## How It Works

### 1. Index Building (`01-build-index.ts`)
- Extracts all published posts from database
- Analyzes content to find potential anchor phrases
- Extracts keywords from SEO metadata and content
- Stores in `data/internal-links/posts-index.json`

### 2. Embedding Generation (`02-generate-embeddings.ts`)
- Creates semantic embeddings for each post
- Uses title + excerpt + content summary
- Tries Python sentence-transformers first
- Falls back to JavaScript TF-IDF-like vectors
- Stores in `data/internal-links/embeddings.json`

### 3. Similarity Computation (`03-compute-similarity.ts`)
- Calculates cosine similarity between all post pairs
- Considers category and tag overlap
- Applies language preference (same language scores higher)
- Stores top 20 similar posts per post
- Saves to `data/internal-links/similarity-matrix.json`

### 4. Backlink Application (`04-apply-backlinks.ts`)
- Processes each post's Lexical content
- Finds anchor text matches in paragraphs (not headings)
- Creates internal link nodes with proper structure
- Limits to 5 links per post
- Updates post with tracking metadata

## Data Structure

### Posts Collection Fields

Added to track internal linking:

```typescript
{
  internalLinksMetadata: {
    version: string           // Processing version
    lastProcessed: Date       // When links were last applied
    linksAdded: Array<{       // Track added links
      targetSlug: string
      anchorText: string
      position: string
    }>
    contentHash: string       // Content hash when processed
  }
}
```

### Generated Files

All data stored in `golfer/data/internal-links/`:

- `posts-index.json` - Post metadata and keywords
- `embeddings.json` - Vector embeddings
- `similarity-matrix.json` - Similarity scores
- `anchor-keywords.json` - Extracted anchor phrases (if generated)

## Edge Cases

### Reimport Handling
- Content hash tracked to detect changes
- Existing links preserved unless content changes
- Use `--rebuild` flag to force reprocessing

### New Post Addition
1. Run `update-single-post.ts` with `--rebuild` flag
2. Or run full pipeline to reprocess all posts
3. Hook integration available for automatic processing

### Content Updates
- Detected via content hash comparison
- Automatic reprocessing on next run
- Manual trigger via single post update

## Configuration

### Adjustable Parameters

In `04-apply-backlinks.ts`:
- `maxLinks`: Maximum links per post (default: 5)

In `03-compute-similarity.ts`:
- `threshold`: Minimum similarity score (default: 0.3)
- Weight distribution for scoring

## Troubleshooting

### Python Service Not Available
- System will use JavaScript fallback
- Install sentence-transformers for better results:
  ```bash
  pip install sentence-transformers
  ```

### No Links Added
- Check if posts have sufficient similar content
- Verify anchor phrases match content
- Lower similarity threshold if needed

### Performance Issues
- Use `--limit` flag to process fewer posts
- Run with `--skip-index` to avoid reindexing
- Consider batch processing for large datasets

## Integration with Import Workflow

Add to post-import scripts:

```typescript
// After importing posts
await spawn('tsx', [
  'scripts/internal-links/run-all.ts',
  '--skip-index'  // If posts already indexed
])
```

## Future Enhancements

- [ ] Admin UI for managing internal links
- [ ] Real-time link suggestions in editor
- [ ] Link performance analytics
- [ ] A/B testing for anchor text variations
- [ ] Multi-language cross-linking
- [ ] Custom anchor text rules per category