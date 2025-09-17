import { GenericArticle as ContentArticle } from './multi-database-connection';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import { visit } from 'unist-util-visit';
import type { Root, Content } from 'mdast';

// Lexical node types
type LexicalNode = {
  type: string;
  version: number;
  [key: string]: any;
};

export interface LexicalDocument {
  root: {
    type: 'root';
    version: 1;
    children: LexicalNode[];
    format: number;
    indent: number;
    direction: 'ltr' | 'rtl' | null;
  };
}

// Convert article content to Lexical format
export async function articleToLexical(
  article: ContentArticle,
  options?: { uploadImages?: boolean }
): Promise<LexicalDocument> {
  // Check if content is already in Lexical format (JSON)
  if (isLexicalFormat(article.content)) {
    return JSON.parse(article.content);
  }

  // Convert markdown/HTML to Lexical
  const lexicalNodes = await convertContentToLexical(article.content, options);

  return {
    root: {
      type: 'root',
      version: 1,
      children: lexicalNodes,
      format: 0,
      indent: 0,
      direction: null,
    },
  };
}

// Check if content is already in Lexical JSON format
function isLexicalFormat(content: string): boolean {
  try {
    const parsed = JSON.parse(content);
    return parsed.root && parsed.root.type === 'root' && Array.isArray(parsed.root.children);
  } catch {
    return false;
  }
}

// Convert markdown/HTML content to Lexical nodes
async function convertContentToLexical(
  content: string,
  options?: { uploadImages?: boolean }
): Promise<LexicalNode[]> {
  const lexicalNodes: LexicalNode[] = [];

  // Parse markdown content
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm);

  const tree = processor.parse(content) as Root;

  // Track which nodes to process at root level
  const rootNodes: any[] = [];

  // Only process direct children of root
  if (tree.children) {
    for (const node of tree.children) {
      if (node.type === 'paragraph') {
        const paragraphNode = createParagraphNode(node);
        // Only skip truly empty paragraphs (no children)
        if (paragraphNode.children && paragraphNode.children.length > 0) {
          lexicalNodes.push(paragraphNode);
        }
      } else if (node.type === 'heading') {
        lexicalNodes.push(createHeadingNode(node));
      } else if (node.type === 'list') {
        lexicalNodes.push(createListNode(node));
      } else if (node.type === 'blockquote') {
        lexicalNodes.push(createQuoteNode(node));
      } else if (node.type === 'code') {
        lexicalNodes.push(createCodeNode(node));
      } else if (node.type === 'image') {
        const imageNode = await createImageNode(node, options);
        if (imageNode) {
          lexicalNodes.push(imageNode);
        }
      } else if (node.type === 'table') {
        lexicalNodes.push(createTableNode(node));
      } else if (node.type === 'html') {
        // Skip HTML comments
        if (!node.value?.includes('<!--')) {
          // Convert HTML to text in a paragraph
          lexicalNodes.push({
            type: 'paragraph',
            version: 1,
            children: [{
              type: 'text',
              version: 1,
              text: node.value || '',
              format: 0,
              detail: 0,
              mode: 'normal',
            }],
            format: 0,
            indent: 0,
            direction: null,
          });
        }
      }
    }
  }

  // If no nodes were created, create a paragraph with the content
  if (lexicalNodes.length === 0) {
    lexicalNodes.push({
      type: 'paragraph',
      version: 1,
      children: [{
        type: 'text',
        version: 1,
        text: content.substring(0, 1000), // Limit to first 1000 chars for safety
        format: 0,
        detail: 0,
        mode: 'normal',
      }],
      format: 0,
      indent: 0,
      direction: null,
    });
  }

  return lexicalNodes;
}

// Create paragraph node
function createParagraphNode(node: any): LexicalNode {
  return {
    type: 'paragraph',
    version: 1,
    children: processInlineContent(node.children || []),
    format: 0,
    indent: 0,
    direction: null,
  };
}

// Create heading node
function createHeadingNode(node: any): LexicalNode {
  return {
    type: 'heading',
    version: 1,
    tag: `h${node.depth}`,
    children: processInlineContent(node.children || []),
    format: 0,
    indent: 0,
    direction: null,
  };
}

// Create list node
function createListNode(node: any): LexicalNode {
  return {
    type: 'list',
    version: 1,
    tag: node.ordered ? 'ol' : 'ul',
    start: node.start || 1,
    listType: node.ordered ? 'number' : 'bullet',
    children: (node.children || []).map((item: any) => ({
      type: 'listitem',
      version: 1,
      value: item.checked !== undefined ? (item.checked ? 1 : 0) : undefined,
      children: processInlineContent(item.children?.[0]?.children || []),
      format: 0,
      indent: 0,
      direction: null,
    })),
    format: 0,
    indent: 0,
    direction: null,
  };
}

// Create quote node
function createQuoteNode(node: any): LexicalNode {
  return {
    type: 'quote',
    version: 1,
    children: (node.children || []).map((child: any) =>
      child.type === 'paragraph' ? createParagraphNode(child) : createTextNode(getTextContent(child))
    ),
    format: 0,
    indent: 0,
    direction: null,
  };
}

// Create code block node
function createCodeNode(node: any): LexicalNode {
  // Check if it's a Mermaid diagram
  if (node.lang === 'mermaid' || node.value?.trim().startsWith('graph') || node.value?.trim().startsWith('flowchart')) {
    return {
      type: 'block',
      version: 1,
      fields: {
        blockType: 'mermaidDiagram',
        blockName: '',
        code: node.value || '',
      },
    };
  }

  return {
    type: 'code',
    version: 1,
    language: node.lang || 'plain',
    children: [{
      type: 'text',
      version: 1,
      text: node.value || '',
      format: 16, // Code format
      detail: 0,
      mode: 'normal',
    }],
    format: 0,
    indent: 0,
    direction: null,
  };
}

// Create image node - optionally upload to media collection
async function createImageNode(
  node: any,
  options?: { uploadImages?: boolean }
): Promise<LexicalNode | null> {
  console.log(`🖼️ Processing image node:`, { url: node.url, alt: node.alt, uploadImages: options?.uploadImages });

  // If uploadImages is true, try to upload the image
  if (options?.uploadImages && node.url) {
    try {
      console.log(`📤 Attempting to upload image: ${node.url}`);
      const { uploadImageToPayload } = await import('./image-handler');
      const uploaded = await uploadImageToPayload(node.url, node.alt);

      if (uploaded) {
        console.log(`✅ Image uploaded successfully with ID: ${uploaded.id}`);
        // Create proper upload node
        return {
          type: 'upload',
          version: 1,
          relationTo: 'media',
          value: {
            id: uploaded.id,
          },
        };
      } else {
        console.log(`❌ Image upload failed`);
      }
    } catch (error) {
      console.error('Failed to upload image:', error);
    }
  }

  // Fallback: create a paragraph with the image info and URL
  // This preserves the image URL for future processing
  const imageText = node.alt ? `![${node.alt}](${node.url})` : `![Image](${node.url})`;

  return {
    type: 'paragraph',
    version: 1,
    children: [{
      type: 'text',
      version: 1,
      text: imageText,
      format: 2, // Italic to make it stand out
      detail: 0,
      mode: 'normal',
    }],
    format: 0,
    indent: 0,
    direction: null,
  };
}

// Create table node
function createTableNode(node: any): LexicalNode {
  const rows = node.children || [];
  const headerRow = rows[0];
  const bodyRows = rows.slice(1);

  return {
    type: 'table',
    version: 1,
    children: [
      {
        type: 'tablerow',
        version: 1,
        children: (headerRow?.children || []).map((cell: any) => ({
          type: 'tablecell',
          version: 1,
          headerState: 'header',
          children: processInlineContent(cell.children || []),
          format: 0,
          indent: 0,
          direction: null,
        })),
      },
      ...bodyRows.map((row: any) => ({
        type: 'tablerow',
        version: 1,
        children: (row.children || []).map((cell: any) => ({
          type: 'tablecell',
          version: 1,
          headerState: 'normal',
          children: processInlineContent(cell.children || []),
          format: 0,
          indent: 0,
          direction: null,
        })),
      })),
    ],
    format: 0,
    indent: 0,
    direction: null,
  };
}

// Process inline content (text, links, emphasis, etc.)
function processInlineContent(children: any[]): LexicalNode[] {
  if (!children || children.length === 0) {
    // Return a single text node with space to avoid empty children
    return [createTextNode(' ', 0)];
  }

  // First, collect all text content
  let combinedText = '';
  let hasNonTextContent = false;

  children.forEach((child: any) => {
    if (child.type === 'text') {
      combinedText += child.value || '';
    } else if (child.type === 'emphasis' || child.type === 'strong') {
      combinedText += getTextContent(child);
    } else if (child.type === 'image') {
      const imageText = child.alt ? `![${child.alt}](${child.url})` : `![Image](${child.url})`;
      combinedText += imageText;
    } else if (child.type === 'link') {
      // For now, treat links as text
      combinedText += getTextContent(child);
    } else {
      const text = getTextContent(child);
      if (text) {
        combinedText += text;
      }
    }
  });

  // If we only have text content, return a single text node
  if (!hasNonTextContent && combinedText) {
    return [createTextNode(combinedText, 0)];
  }

  // Otherwise, process nodes individually but avoid adjacent text nodes
  const nodes: LexicalNode[] = [];
  let currentText = '';

  children.forEach((child: any, index: number) => {
    if (child.type === 'text') {
      currentText += child.value || '';
    } else if (child.type === 'emphasis') {
      // Flush current text if any
      if (currentText) {
        nodes.push(createTextNode(currentText, 0));
        currentText = '';
      }
      const text = getTextContent(child);
      if (text) {
        nodes.push(createTextNode(text, 2)); // Italic
      }
    } else if (child.type === 'strong') {
      // Flush current text if any
      if (currentText) {
        nodes.push(createTextNode(currentText, 0));
        currentText = '';
      }
      const text = getTextContent(child);
      if (text) {
        nodes.push(createTextNode(text, 1)); // Bold
      }
    } else if (child.type === 'link') {
      // For now, convert links to plain text to avoid validation issues
      // TODO: Fix link node validation in the future
      const linkText = getTextContent(child);
      if (linkText) {
        currentText += linkText;
      }
    } else if (child.type === 'inlineCode') {
      // Flush current text if any
      if (currentText) {
        nodes.push(createTextNode(currentText, 0));
        currentText = '';
      }
      if (child.value) {
        nodes.push(createTextNode(child.value, 16)); // Code format
      }
    } else if (child.type === 'image') {
      const imageText = child.alt ? `![${child.alt}](${child.url})` : `![Image](${child.url})`;
      currentText += imageText;
    } else {
      const text = getTextContent(child);
      if (text) {
        currentText += text;
      }
    }
  });

  // Flush any remaining text
  if (currentText) {
    nodes.push(createTextNode(currentText, 0));
  }

  // Always return at least one text node to avoid empty children
  return nodes.length > 0 ? nodes : [createTextNode(' ', 0)];
}

// Create text node
function createTextNode(text: string, format: number = 0): LexicalNode {
  return {
    type: 'text',
    version: 1,
    text: text || '',
    format,
    detail: 0,
    mode: 'normal',
  };
}

// Create link node
function createLinkNode(node: any): LexicalNode {
  // Ensure we have a valid URL, default to # if empty
  const url = node.url || node.href || '#';

  // Get link text
  const linkText = getTextContent(node) || url;

  return {
    type: 'link',
    version: 1,
    url: url,
    children: [{
      type: 'text',
      version: 1,
      text: linkText,
      format: 0,
      detail: 0,
      mode: 'normal',
    }],
    // Link nodes don't have format, indent, or direction
  };
}

// Get text content from node
function getTextContent(node: any): string {
  if (node.type === 'text') {
    return node.value || '';
  }
  if (node.children) {
    return node.children.map((child: any) => getTextContent(child)).join('');
  }
  return '';
}

// Language-specific formatting adjustments
export function applyLanguageFormatting(
  lexicalDoc: LexicalDocument,
  language: string
): LexicalDocument {
  // Apply language-specific formatting rules
  if (language === 'ja' || language === 'japanese') {
    // Japanese-specific formatting
    lexicalDoc.root.direction = null; // Let browser handle direction
  } else if (language === 'ar' || language === 'arabic' || language === 'he' || language === 'hebrew') {
    // RTL languages
    lexicalDoc.root.direction = 'rtl';
  } else {
    // Default LTR
    lexicalDoc.root.direction = 'ltr';
  }

  return lexicalDoc;
}