# Navi Golfer Project Context

## Project Overview
A golf-themed website built with Next.js and Payload CMS, designed for golf enthusiasts with a focus on Japanese golf content.

## Recent Updates (2025-09-02)

### Theme Implementation
- **Color Scheme Applied:**
  - Homepage: White background (#FFFFFF) with dark text (#212121)
  - Post pages: Light green background (#E8F5E8) with dark text
  - Primary accent: Golf green (#357A35)
  - Borders and muted elements: Light gray tones
  
### Design Enhancements
- **Post Hero Section:**
  - Featured images with gradient overlay (transparent top to dark bottom)
  - Title text with gradient effect (white to gray)
  - Removed date display, keeping only author information
  - White text on dark overlay for better readability

### Technical Fixes
- **Hydration Error Resolution:**
  - Fixed URL consistency between server and client
  - Updated getClientSideURL to prioritize NEXT_PUBLIC_SERVER_URL
  - Ensured port 3000 is used consistently

### Navigation Updates
- **Category Dropdown:**
  - Implemented hover-based dropdown menu
  - Shows up to 8 categories with proper hierarchy
  - Responsive design with mobile compatibility

### Homepage Layout
- **New Sections:**
  - Category grid with golf-themed icons
  - Most viewed posts section
  - Recent posts section
  - Configurable section order

## Database Configuration
- PostgreSQL database: `golfer`
- Connection: `postgres://postgres:2801@127.0.0.1:5432/golfer`

## Development Environment
- Port: 3000 (primary development server)
- Node.js with pnpm package manager
- Next.js 15.4.4 with App Router
- Payload CMS 3.54.0

## Content Structure
- Posts with WordPress import support
- Categories with Japanese-to-English translation
- Media handling with image optimization
- Mermaid diagram support in content blocks

## Current Focus
Golf-themed content website with emphasis on:
- Clean, readable design
- Golf course aesthetics
- Bilingual support (Japanese/English)
- Responsive user experience