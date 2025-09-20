# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Structure

This repository contains two distinct projects:

- **golfer/** - Next.js website template with Payload CMS backend
- **serena/** - Python coding agent toolkit with Language Server Protocol integration

## golfer/ - Golf-Themed Payload CMS Website

### Theme Configuration

**Color Scheme:**
- **Homepage**: White background with dark text (#212121)
- **Post Pages**: Light green background (#E8F5E8) with dark text
- **Primary Color**: Golf green (#357A35)
- **Text Color**: Dark gray (#212121) for optimal readability
- **Muted Text**: Medium gray (#404040)

**Design Features:**
- Post hero images with gradient overlay (transparent to dark)
- Gradient text effect on post titles (white to gray)
- Clean, golf-themed aesthetic throughout
- Responsive category dropdown navigation
- Homepage sections: Categories, Most Viewed, Recent Posts

### Development Commands

**Essential Commands:**
- `pnpm install` - Install dependencies
- `pnpm dev` - Start development server on http://localhost:3000
- `pnpm build` - Build production bundle
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint checks
- `pnpm lint:fix` - Fix ESLint issues automatically
- `pnpm test` - Run integration and e2e tests
- `pnpm test:int` - Run integration tests only (Vitest)
- `pnpm test:e2e` - Run end-to-end tests (Playwright)
- All test go to tests folder.

**Payload-Specific Commands:**
- `pnpm payload` - Access Payload CLI
- `pnpm generate:types` - Generate TypeScript types from Payload config
- `pnpm generate:importmap` - Generate import map

**WordPress Import Commands:**
- `pnpm tsx scripts/test-mermaid.ts` - Test Mermaid diagram block creation
- `pnpm tsx scripts/import-terminology.ts` - Import specific WordPress post
- `pnpm tsx scripts/fresh-import.ts` - Full fresh import from WordPress folders
- `pnpm tsx scripts/create-about-us-page.ts` - Create/update Japanese About Us page
- Admin UI at http://localhost:3000/admin/import-wordpress for folder-based imports

**Internal Linking Commands:**
- `pnpm tsx scripts/internal-links/01-build-index-fixed.ts` - Build post index with Japanese phrases
- `python3 scripts/internal-links/embedding-service.py` - Generate semantic embeddings
- `pnpm tsx scripts/internal-links/03-compute-similarity-fixed.ts` - Compute content similarity
- `pnpm tsx scripts/internal-links/04-apply-semantic-links-fixed.ts --force` - Apply semantic links (recommended)
- `pnpm tsx scripts/internal-links/simple-remove-all.ts` - Remove all internal links
- Admin UI at http://localhost:3000/admin/internal-links for management dashboard

**Affiliate Links Commands:**
- `pnpm tsx scripts/affiliate-links/apply-compound-safe-links.ts` - Apply links with Japanese compound word protection
- `pnpm tsx scripts/affiliate-links/04-apply-contextual-links-fixed.ts` - Apply contextually relevant links with proper word boundaries (max 5 per post)
- `pnpm tsx scripts/affiliate-links/fix-duplicate-links.ts` - Remove duplicate keyword links within posts
- `pnpm tsx scripts/affiliate-links/limit-links-to-five.ts` - Enforce maximum 5 links per post
- `pnpm tsx scripts/affiliate-links/export-links-csv.ts` - Export all affiliate links to CSV format
- `pnpm tsx scripts/affiliate-links/check-link-distribution.ts` - Verify link distribution across posts
- `pnpm tsx scripts/reset-and-reapply-all-links.ts` - Remove all links and prepare for reapplication
- Admin UI at http://localhost:3000/admin/affiliate-links for complete product and link management

### Architecture Overview

**Tech Stack:**
- Next.js 15 with App Router
- Payload CMS 3.54.0 as headless CMS
- TypeScript with strict configuration
- TailwindCSS + shadcn/ui components
- PostgreSQL database adapter
- React Hook Form for form handling

**Key Components:**

**1. Content Management (`src/collections/`)**
- **Posts** - Blog posts and articles with draft preview, WordPress metadata fields
- **Pages** - Static pages with layout builder (includes comprehensive Japanese About Us page)
- **Media** - File uploads with image processing
- **Categories** - Hierarchical taxonomy with parent-child relationships, Japanese-to-English translation
- **Tags** - Tagging system for content organization
- **Users** - Authentication and admin access

**2. Layout Builder System (`src/blocks/`)**
- **Hero** - Landing page hero sections
- **Content** - Rich text content blocks
- **Media** - Image and video blocks
- **MermaidDiagram** - Technical diagrams with mermaid.js rendering
- **Call To Action** - CTA components
- **Archive** - Content listing blocks
- **Form** - Dynamic form builder with validation

**3. Frontend Architecture (`src/app/`)**
- Server-side rendering with static generation
- Draft preview system for unpublished content
- On-demand revalidation via webhooks
- SEO plugin integration
- Search functionality

**4. Configuration System**
- `payload.config.ts` - Main CMS configuration
- Collections, globals, and field definitions
- Access control and authentication setup
- Plugin configurations (SEO, Search, Redirects, Forms)

**Development Patterns:**
- All content uses layout builder for flexible page construction
- Draft/publish workflow with scheduled publishing
- Lexical rich text editor for content authoring with custom blocks
- Image optimization with focal point selection
- Responsive design with TailwindCSS utilities

**Image Rendering System:**
- **Lexical Editor Integration** - UploadFeature configured with media collection support
- **Markdown-to-Lexical Conversion** - Inline images automatically converted to upload nodes
- **Image Processing Pipeline** - Handles both block-level and inline image syntax
- **Verification Scripts** - Comprehensive tools for validating image rendering correctness
- **Upload Node Structure** - Proper media collection relationships with alt text support
- **Media URL Fix** - fixMediaUrl utility transforms `/api/media/file/` paths to `/media/`
- **Image Extraction Logic** - Hierarchical extraction: hero field → content upload nodes → fallback defaults
- **Category Page Images** - All category pages extract and display images from Lexical content structure
- **Debug Scripts** - `scripts/debug-post-images.ts` to inspect image structure in posts

**WordPress Import System:**
- **Folder-based Import** - Select and import entire WordPress export folders
- **Markdown Processing** - Converts WordPress markdown exports to Lexical format
- **Category Translation** - Japanese-to-English category mapping with hierarchical structure
- **Media Handling** - Downloads and uploads images to Media collection automatically
- **Mermaid Support** - Extracts and renders Mermaid diagrams from code blocks
- **Metadata Preservation** - Maintains WordPress metadata, SEO fields, and publish dates
- **Progress Tracking** - Real-time import progress with error handling

**Content Import System (`/api/content-import/import`):**
- **Image Download & Upload** - Automatically fetches external images and creates Media entries
- **Lexical Node Structure** - Minimal upload nodes: `{ type: 'upload', relationTo: 'media', value: mediaId }`
- **List Item Fix** - All list items include `indent: 0` to prevent "Invalid indent value" errors
- **Upload Value Format** - Uses media ID directly (number), not object with id property
- **Error Prevention** - Validates all Lexical node structures before database insertion

**Critical Block Structure Knowledge:**
- **Mermaid Blocks** must use `fields.blockType: 'mermaidDiagram'` not top-level `blockName`
- **Block Validation** requires exact structure: `{ type: 'block', fields: { blockType: 'slug', ...fields }, version: 1 }`
- **Categories Field** must be outside tabs structure to be visible in post editor
- **Mermaid Rendering** - Code-formatted text (format: 16) starting with Mermaid keywords auto-renders as diagrams
- **Fix Script** - Use `scripts/fix-mermaid-blocks.ts` if encountering "blockReferences" errors with Mermaid blocks
- **Image Rendering** - Inline images `![alt](url)` automatically converted to upload nodes during markdown processing
- **Upload Nodes** - Images stored as `{ type: 'upload', relationTo: 'media', value: mediaId }` structure (media ID only)
- **Image Verification** - Use `scripts/find-markdown-images.ts` to check for unconverted markdown images

**Reference Section Display:**
- **PostReferences Component** - Extracts and displays references with collapsible toggle
- **RichTextWithFilteredReferences** - Removes reference sections from main content display
- **Flexible Detection** - Matches any heading containing "出典" (sources), "参考文献", "References", or "参考資料"
- **Toggle Functionality** - Default closed state with toggle to show/hide references
- **Separation Pattern** - Main content displays without references, separate collapsible section shows references

**Internal Linking System:**
- **Automated Backlinking** - Uses vector embeddings and cosine similarity to find related content
- **Japanese Phrase Extraction** - Extracts meaningful multi-word phrases (e.g., スイングプレーン, ゴルフレッスン)
- **Embedding Model** - Sentence Transformers (all-MiniLM-L6-v2) for 384-dimensional semantic embeddings
- **Link Limits** - Maximum 5 internal links per post to maintain natural flow
- **Admin Dashboard** - Complete management interface at `/admin/internal-links`
- **Semantic Links Script** - Use `04-apply-semantic-links-fixed.ts --force` for best results
- **Bidirectional Prevention** - Global link tracking ensures if A→B, then B won't link to A
- **Frontend Requirements** - Post queries must use `depth: 2` to populate internal link relationships
- **RichText Component** - Must handle internal links via `internalDocToHref` function
- **API Authentication** - Currently disabled for development, re-enable in production by uncommenting auth checks

**Affiliate Links System:**
- **Compound Word Protection** - Won't split スコアカード into スコア + カード, preserves プレーヤー, ゴルファー intact
- **One Link Per Paragraph** - Maximum 1 affiliate link per paragraph to avoid cluttered content
- **Smart URL Handling** - Uses `clean_url` (proper affiliate URL) instead of `affiliate_url` (HTML table code)
- **No Partial Matches** - Won't link "ゴルフ" in "ゴルファー" (proper Japanese word boundaries)
- **Product Type Matching** - Links only match relevant product types (driver→driver, putter→putter)
- **Even Distribution** - Maximum 5 links per post, distributed across different paragraphs
- **Duplicate Prevention** - Each keyword linked only once per post
- **CSV Export** - Export all links to CSV (Article Title, Link, Product, URL)
- **A8 Tracking Preserved** - All products maintain correct tracking code (a8mat=45BP2Z+2BCPGY+2HOM+BWGDT)
- **Admin Interface** - Complete management dashboard at `/admin/affiliate-links`
- **Database Sync** - "Sync to Database" button imports JSON products to Payload CMS collection
- **Product Recommendations** - Maximum 3 products in recommendation box at article end
- **Process New Posts Button** - Applies links with 1-per-paragraph limit and clean_url priority
- **API Endpoint Protection** - `/api/affiliate-links/process-posts` enforces all link limits

## Dokploy Deployment

### Prerequisites
- Dokploy VPS with Docker
- PostgreSQL database created in Dokploy
- GitHub repository connected

### Dokploy Configuration

**Build Settings:**
- **Build Path**: `./kawaiitorichan`
- **Docker File**: `Dockerfile`
- **Docker Context Path**: `.`

**Required Environment Variables:**
```env
DATABASE_URI=postgresql://postgres:password@database-service-name:5432/database-name
PAYLOAD_SECRET=your-secret-key-here  # Minimum 32 characters
NEXT_PUBLIC_SERVER_URL=https://your-domain.traefik.me
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
```

### Database Initialization

**Automatic Deployment:**
1. Database tables are created automatically on first deployment
2. Imports 115 posts, 12 categories, and 346 media records
3. Downloads all 347 media files from GitHub automatically
4. No user intervention needed - fully automated

**Database Content:**
- Schema includes all Payload CMS tables
- Pre-populated with 115 Japanese golf articles
- 12 hierarchical categories with Japanese titles
- 346 media records with automatic image download
- No pre-created admin users - registration screen appears on first visit

### Troubleshooting

**Media Not Displaying:**
- Media files download automatically during deployment (~5 minutes)
- Check container logs for download progress
- Files are downloaded from GitHub to `/app/public/media`
- 347 verified files in `media-files-list.txt`

**Admin Access:**
- No pre-created admin users
- Visit `/admin` to see registration screen
- Create your own admin account on first visit

**Database Issues:**
- Tables are created automatically from `production-data-115-posts.sql.gz`
- Schema includes all necessary columns and relationships
- Users table is kept empty for proper registration flow

**Build Cache Issues:**
- Dockerfile includes `REBUILD_TIMESTAMP` for cache-busting
- Change timestamp to force complete rebuild
- Located at line ~20 in Dockerfile

### Key Deployment Files

- `kawaiitorichan/Dockerfile` - Production Docker configuration with cache-busting
- `kawaiitorichan/docker-entrypoint.sh` - Startup script with automatic initialization
- `kawaiitorichan/init-bird-production.sh` - Imports data and downloads media
- `kawaiitorichan/production-data-115-posts.sql.gz` - Compressed database dump (1MB)
- `kawaiitorichan/media-files-list.txt` - Verified list of 347 media files
- `kawaiitorichan/quick-import-data.sql` - Fallback import with sample data

### Local Development vs Production

**Local Databases:**
- `golfer` - Payload CMS with 115 imported posts
- `content_creation_db` - 1372 articles from content system

**Production:**
- Single PostgreSQL database in Dokploy
- Schema from `golfer` applied
- Content can be imported via scripts or created fresh

## serena/ - Coding Agent Toolkit

### Development Commands

**Essential Commands:**
- `uv run poe format` - Format code (Black + Ruff)
- `uv run poe type-check` - Run mypy type checking
- `uv run poe test` - Run tests (excludes Java/Rust by default)
- `uv run poe lint` - Check code style without fixing
- `uv run serena-mcp-server` - Start MCP server
- `uv run index-project` - Index project for faster performance

**Language-Specific Testing:**
- `uv run poe test -m "python or go"` - Run specific language tests
- Available markers: python, go, java, rust, typescript, php, csharp, elixir, terraform, clojure, swift, bash, ruby

### Architecture Overview

**Core Components:**

**1. SerenaAgent (`src/serena/agent.py`)**
- Central orchestrator for projects, tools, and interactions
- Manages language servers and memory persistence
- Coordinates MCP server interface

**2. SolidLanguageServer (`src/solidlsp/ls.py`)**
- Unified Language Server Protocol wrapper
- Language-agnostic symbol operations interface
- Handles caching and error recovery

**3. Tool System (`src/serena/tools/`)**
- **file_tools.py** - File operations, search, regex
- **symbol_tools.py** - Language-aware code navigation/editing
- **memory_tools.py** - Project knowledge persistence
- **config_tools.py** - Project activation and modes
- **workflow_tools.py** - Onboarding and meta-operations

**4. Configuration System (`src/serena/config/`)**
- **Contexts** - Environment-specific tool sets (desktop-app, agent, ide-assistant)
- **Modes** - Operational patterns (planning, editing, interactive, one-shot)
- **Projects** - Per-project settings and language server configs

**Language Support:**
16+ programming languages via LSP integration including Python, TypeScript/JavaScript, Go, Rust, PHP, C#, Java, and more.

**Memory & Knowledge System:**
- Markdown-based storage in `.serena/memories/`
- Project-specific knowledge persistence
- Contextual retrieval and onboarding support

## Development Environment Setup

**golfer/ Requirements:**
- Node.js ^18.20.2 || >=20.9.0
- pnpm ^9 || ^10
- PostgreSQL database
- Environment variables in `.env` (copy from `.env.example`)

**serena/ Requirements:**
- Python 3.11
- uv package manager
- Language servers for supported languages (auto-downloaded when needed)

## Configuration Notes

- **golfer/**: Uses pnpm workspaces, configured via `package.json` and Next.js config
- **serena/**: Uses uv with pyproject.toml, supports flexible context/mode configurations
- Both projects have comprehensive test suites and strict TypeScript/Python typing