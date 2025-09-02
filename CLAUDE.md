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
- Admin UI at http://localhost:3000/admin/import-wordpress for folder-based imports

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
- **Pages** - Static pages with layout builder
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

**WordPress Import System:**
- **Folder-based Import** - Select and import entire WordPress export folders
- **Markdown Processing** - Converts WordPress markdown exports to Lexical format
- **Category Translation** - Japanese-to-English category mapping with hierarchical structure
- **Media Handling** - Processes and uploads images from separate directories
- **Mermaid Support** - Extracts and renders Mermaid diagrams from code blocks
- **Metadata Preservation** - Maintains WordPress metadata, SEO fields, and publish dates
- **Progress Tracking** - Real-time import progress with error handling

**Critical Block Structure Knowledge:**
- **Mermaid Blocks** must use `fields.blockType: 'mermaidDiagram'` not top-level `blockName`
- **Block Validation** requires exact structure: `{ type: 'block', fields: { blockType: 'slug', ...fields }, version: 1 }`
- **Categories Field** must be outside tabs structure to be visible in post editor
- **Mermaid Rendering** - Code-formatted text (format: 16) starting with Mermaid keywords auto-renders as diagrams
- **Fix Script** - Use `scripts/fix-mermaid-blocks.ts` if encountering "blockReferences" errors with Mermaid blocks

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