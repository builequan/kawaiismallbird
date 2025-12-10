import type { Metadata } from 'next'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { StructuredData } from '@/components/StructuredData'
import Link from 'next/link'

// Force dynamic rendering - glossary collection may not exist during build
export const dynamic = 'force-dynamic'
export const revalidate = 3600 // Revalidate every hour

export const metadata: Metadata = {
  title: '用語集 | Glossary - かわいい鳥ちゃん',
  description: '鳥に関する用語集。鳥の種類、飼育方法、健康管理など、鳥に関する様々な用語の意味を解説しています。',
  openGraph: {
    title: '用語集 | Glossary - かわいい鳥ちゃん',
    description: '鳥に関する用語集。鳥の種類、飼育方法、健康管理など、鳥に関する様々な用語の意味を解説しています。',
  },
}

interface GlossaryTerm {
  id: number
  term: string
  reading: string
  definition: string
  source: 'wikipedia' | 'llm'
  wikipediaUrl?: string
  category?: string
}

// Group terms by first hiragana character
function groupTerms(terms: GlossaryTerm[]): Record<string, GlossaryTerm[]> {
  const groups: Record<string, GlossaryTerm[]> = {
    'あ': [], 'か': [], 'さ': [], 'た': [], 'な': [],
    'は': [], 'ま': [], 'や': [], 'ら': [], 'わ': [],
    'その他': [],
  }

  for (const term of terms) {
    const reading = term.reading || ''
    const firstChar = reading.charAt(0)

    let group = 'その他'

    if (firstChar >= 'あ' && firstChar <= 'お') group = 'あ'
    else if (firstChar >= 'か' && firstChar <= 'こ' || 'がぎぐげご'.includes(firstChar)) group = 'か'
    else if (firstChar >= 'さ' && firstChar <= 'そ' || 'ざじずぜぞ'.includes(firstChar)) group = 'さ'
    else if (firstChar >= 'た' && firstChar <= 'と' || 'だぢづでど'.includes(firstChar)) group = 'た'
    else if (firstChar >= 'な' && firstChar <= 'の') group = 'な'
    else if (firstChar >= 'は' && firstChar <= 'ほ' || 'ばびぶべぼぱぴぷぺぽ'.includes(firstChar)) group = 'は'
    else if (firstChar >= 'ま' && firstChar <= 'も') group = 'ま'
    else if ('やゆよ'.includes(firstChar)) group = 'や'
    else if (firstChar >= 'ら' && firstChar <= 'ろ') group = 'ら'
    else if ('わをん'.includes(firstChar)) group = 'わ'

    groups[group].push(term)
  }

  return groups
}

// Category labels
const categoryLabels: Record<string, string> = {
  'bird-species': '鳥の種類',
  'bird-care': '飼育',
  'bird-anatomy': '体の部位',
  'bird-behavior': '行動',
  'equipment': '用品',
  'food': '餌',
  'health': '健康',
  'general': '一般',
}

export default async function GlossaryPage() {
  const payload = await getPayload({ config: configPromise })

  const glossary = await payload.find({
    collection: 'glossary',
    limit: 10000,
    pagination: false,
    sort: 'reading',
  })

  const terms = glossary.docs as GlossaryTerm[]
  const groupedTerms = groupTerms(terms)

  // Order of groups
  const groupOrder = ['あ', 'か', 'さ', 'た', 'な', 'は', 'ま', 'や', 'ら', 'わ', 'その他']

  // Breadcrumbs
  const breadcrumbItems = [
    { label: 'ホーム', href: '/' },
    { label: '用語集', href: '/glossary' },
  ]

  // Structured data for SEO
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    name: '鳥に関する用語集',
    description: '鳥の種類、飼育方法、健康管理など、鳥に関する様々な用語の意味を解説しています。',
    hasDefinedTerm: terms.slice(0, 50).map(term => ({
      '@type': 'DefinedTerm',
      name: term.term,
      description: term.definition,
    })),
  }

  return (
    <div className="min-h-screen bg-post-green">
      <StructuredData data={[structuredData]} />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Breadcrumbs items={breadcrumbItems} className="mb-6" />

        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">用語集</h1>
          <p className="text-gray-600">
            鳥に関する用語の意味を解説しています。全{terms.length}語を収録。
          </p>
        </header>

        {/* Quick Navigation */}
        <nav className="mb-8 sticky top-0 bg-post-green py-4 z-10 border-b border-gray-200">
          <div className="flex flex-wrap gap-2">
            {groupOrder.map(group => {
              const count = groupedTerms[group]?.length || 0
              if (count === 0) return null
              return (
                <a
                  key={group}
                  href={`#group-${group}`}
                  className="px-3 py-1 bg-white rounded-full text-sm font-medium text-gray-700 hover:bg-green-100 hover:text-green-800 transition-colors shadow-sm"
                >
                  {group} <span className="text-xs text-gray-500">({count})</span>
                </a>
              )
            })}
          </div>
        </nav>

        {/* Terms by Group */}
        <div className="space-y-12">
          {groupOrder.map(group => {
            const termsInGroup = groupedTerms[group]
            if (!termsInGroup || termsInGroup.length === 0) return null

            return (
              <section key={group} id={`group-${group}`} className="scroll-mt-20">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-green-500">
                  {group}行
                </h2>
                <div className="space-y-4">
                  {termsInGroup.map(term => (
                    <article
                      key={term.id}
                      id={`term-${term.term}`}
                      className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900">
                            {term.term}
                            <span className="text-sm font-normal text-gray-500 ml-2">
                              ({term.reading})
                            </span>
                          </h3>
                          <p className="text-gray-700 mt-1">{term.definition}</p>
                          <div className="flex items-center gap-2 mt-2">
                            {term.category && (
                              <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded">
                                {categoryLabels[term.category] || term.category}
                              </span>
                            )}
                            {term.source === 'wikipedia' && term.wikipediaUrl && (
                              <a
                                href={term.wikipediaUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                              >
                                Wikipedia
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )
          })}
        </div>

        {/* Back to Top */}
        <div className="mt-12 text-center">
          <a
            href="#"
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            ページトップへ
          </a>
        </div>
      </div>
    </div>
  )
}
