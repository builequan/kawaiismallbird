# Mermaid Diagram Rendering Solution

## Problem Solved
Fixed issue where Mermaid diagrams in posts were displaying as plain text with backticks instead of rendering as actual diagrams.

## Root Cause
1. Initial "blockReferences" error was caused by programmatically created Mermaid blocks having incorrect structure
2. After fixing blocks, Mermaid code was stored as code-formatted text (format: 16 in Lexical) but wasn't being detected and rendered

## Solution Components

### 1. MermaidParagraph Component
**File**: `src/components/RichText/MermaidParagraph.tsx`

- Client-side component that detects Mermaid syntax in text
- Uses mermaid.js to render diagrams dynamically
- Falls back to code block display if rendering fails

### 2. Custom Paragraph Converter
**Location**: `RichText/index.tsx`

- Detects paragraphs with code-formatted text (format: 16)
- Checks if text starts with Mermaid keywords (flowchart, graph, sequenceDiagram, etc.)
- Routes Mermaid content to MermaidParagraph component

### 3. Fix Script
**File**: `scripts/fix-mermaid-blocks.ts`

- Removes malformed Mermaid blocks from database
- Preserves content as text for re-rendering
- Fixed 48 posts with problematic blocks

## Key Learnings

- **Lexical Editor Format**: Lexical editor uses format: 16 for code-formatted text
- **Block Structure**: Blocks created programmatically must match exact structure expected by Lexical
- **SSR Requirements**: SafeRichText component needed SSR enabled for proper rendering
- **Custom Converters**: Custom converters in RichText can handle special content types

## Technical Details

### Mermaid Keywords Detected
The solution detects the following Mermaid diagram types:
- `flowchart`
- `graph`
- `sequenceDiagram`
- `classDiagram`
- `stateDiagram`
- `erDiagram`
- `journey`
- `gantt`
- `pie`
- `gitgraph`

### Component Integration
The MermaidParagraph component is integrated into the RichText rendering pipeline through a custom converter that:
1. Checks for paragraphs with code formatting
2. Validates Mermaid syntax patterns
3. Renders diagrams client-side with proper error handling

## Impact
- Resolved Mermaid diagram display issues across 48+ blog posts
- Enabled proper rendering of technical documentation with diagrams
- Maintained backward compatibility with existing content

## Date
September 1, 2025