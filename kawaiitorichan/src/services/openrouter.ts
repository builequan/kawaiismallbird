/**
 * OpenRouter API Service
 * Uses Claude Haiku for term extraction and definition generation
 */

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'
const MODEL = 'anthropic/claude-haiku-4.5'

interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
}

interface ExtractedTerm {
  term: string
  reading: string
  category?: string
}

/**
 * Call OpenRouter API with Claude Haiku
 */
async function callOpenRouter(
  prompt: string,
  systemPrompt: string
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not set in environment variables')
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_SERVER_URL || 'https://kawaiitorichan.com',
      'X-Title': 'Kawaii Torichan Glossary',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3, // Lower temperature for more consistent output
      max_tokens: 2000,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`)
  }

  const data: OpenRouterResponse = await response.json()
  return data.choices[0]?.message?.content || ''
}

/**
 * Extract Japanese terms from post content
 * Returns up to maxTerms terms with their readings
 */
export async function extractTerms(
  content: string,
  existingTerms: string[],
  maxTerms: number = 20
): Promise<ExtractedTerm[]> {
  const systemPrompt = `You are a Japanese language expert specializing in bird-related vocabulary.
Your task is to extract important Japanese terms from blog posts about birds.

Focus on:
- Bird species names (鳥の種類): e.g., 文鳥、インコ、オウム
- Bird care terms (鳥の飼育): e.g., 餌、ケージ、止まり木
- Bird anatomy (鳥の体): e.g., 羽、くちばし、爪
- Bird behavior (鳥の行動): e.g., さえずり、換羽、発情
- Equipment (用品): e.g., 鳥かご、ヒーター、おもちゃ
- Food terms (餌・食べ物): e.g., シード、ペレット、野菜
- Health terms (健康): e.g., 病気、獣医、薬

Do NOT include:
- Common particles (は、が、を、に、etc.)
- Common verbs (する、なる、いる、etc.)
- Generic adjectives
- Terms that are not nouns or proper nouns

Return ONLY a JSON array with this exact format (no markdown, no explanation):
[{"term": "日本語の用語", "reading": "ひらがなのよみかた", "category": "category-slug"}]

Categories must be one of: bird-species, bird-care, bird-anatomy, bird-behavior, equipment, food, health, general`

  const existingTermsList = existingTerms.length > 0
    ? `\n\nDo NOT include these terms (already in glossary):\n${existingTerms.join('、')}`
    : ''

  const prompt = `Extract up to ${maxTerms} important Japanese terms from this bird blog post content.
${existingTermsList}

Content:
${content.substring(0, 8000)}` // Limit content to avoid token limits

  try {
    const response = await callOpenRouter(prompt, systemPrompt)

    // Parse JSON response - handle potential markdown wrapping
    let jsonStr = response.trim()
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/^```json\n?/, '').replace(/\n?```$/, '')
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```\n?/, '').replace(/\n?```$/, '')
    }

    const terms: ExtractedTerm[] = JSON.parse(jsonStr)

    // Validate and filter
    return terms
      .filter(t => t.term && t.reading && t.term.length > 0)
      .slice(0, maxTerms)
  } catch (error) {
    console.error('Error extracting terms:', error)
    return []
  }
}

/**
 * Generate a definition for a term using LLM
 */
export async function generateDefinition(
  term: string,
  context?: string
): Promise<string> {
  const systemPrompt = `You are a Japanese encyclopedia writer specializing in birds and pet care.
Generate clear, informative definitions in Japanese.
Definitions should be 2-3 sentences, factual, and helpful for bird owners.
Do NOT include the term itself at the start of the definition.
Write naturally as if explaining to someone learning about birds.`

  const contextInfo = context
    ? `\n\nContext from the blog post where this term appeared:\n${context.substring(0, 1000)}`
    : ''

  const prompt = `Write a 2-3 sentence definition in Japanese for this term related to birds:

Term: ${term}
${contextInfo}

Write ONLY the definition, nothing else.`

  try {
    const response = await callOpenRouter(prompt, systemPrompt)
    return response.trim()
  } catch (error) {
    console.error('Error generating definition for', term, error)
    return ''
  }
}

/**
 * Categorize a term if category wasn't determined during extraction
 */
export async function categorizeterm(term: string, definition: string): Promise<string> {
  const systemPrompt = `You categorize Japanese bird-related terms.
Return ONLY the category slug, nothing else.
Categories: bird-species, bird-care, bird-anatomy, bird-behavior, equipment, food, health, general`

  const prompt = `Categorize this term:
Term: ${term}
Definition: ${definition}

Return ONLY the category slug.`

  try {
    const response = await callOpenRouter(prompt, systemPrompt)
    const category = response.trim().toLowerCase()
    const validCategories = ['bird-species', 'bird-care', 'bird-anatomy', 'bird-behavior', 'equipment', 'food', 'health', 'general']
    return validCategories.includes(category) ? category : 'general'
  } catch (error) {
    return 'general'
  }
}
