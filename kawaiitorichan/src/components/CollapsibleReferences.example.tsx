// Example usage of CollapsibleReferences component

import { CollapsibleReferences, SimpleCollapsibleReferences } from './CollapsibleReferences'

// Example 1: Full-featured references with URLs
export function ExampleWithUrls() {
  const references = [
    {
      id: '1',
      title: 'アメリカで最も難しいゴルフコース',
      description: '独自の建築様式と高速グリーンで知られるペンシルベニアの場所です',
      url: 'https://www.msn.com/en-us/sports/golf/the-hardest-golf-course-in-america',
    },
    {
      id: '2',
      title: 'Golf Digest - Course Rankings 2024',
      url: 'https://www.golfdigest.com/rankings',
    },
    {
      id: '3',
      title: 'PGA Tour Statistics Database',
      description: 'Official tour statistics and player data',
      url: 'https://www.pgatour.com/stats',
    },
  ]

  return <CollapsibleReferences references={references} />
}

// Example 2: Simple inline references (for articles)
export function ExampleSimple() {
  const references = [
    'https://www.msn.com/en-us/sports/golf/the-hardest-golf-course-in-america-is-a-pennsylvania-spot-known-for-unique-architecture-and-fast-greens/ar-AA1IUPFq?ocid=BingNewsVerp',
    'Golf Digest Japan - 2024年コースランキング',
    'Japan Golf Association Official Guidelines',
  ]

  return <SimpleCollapsibleReferences references={references} />
}

// Example 3: Custom title and default open
export function ExampleCustom() {
  const references = [
    {
      id: '1',
      title: '日本ゴルフ協会公式ガイドライン',
      url: 'https://www.jga.or.jp',
    },
    {
      id: '2',
      title: 'ゴルフダイジェスト・オンライン',
      url: 'https://www.golfdigest.co.jp',
    },
  ]

  return (
    <CollapsibleReferences
      title="参考資料"
      references={references}
      defaultOpen={true} // Start expanded
    />
  )
}

// Example 4: Integration in a blog post or article
export function ArticleWithReferences() {
  return (
    <article className="prose max-w-none">
      <h1>ゴルフスイングの基本技術</h1>

      <p>
        ゴルフスイングは、体の回転と腕の振りを組み合わせた複雑な動作です。
        プロゴルファーの平均的なヘッドスピードは約50m/sに達します。
      </p>

      <h2>スイングの要素</h2>
      <p>
        効果的なスイングには、グリップ、スタンス、テークバック、
        ダウンスイング、インパクト、フォロースルーの6つの要素があります。
      </p>

      {/* References at the end of the article */}
      <SimpleCollapsibleReferences
        references={[
          'PGA Teaching Manual - Chapter 3: The Golf Swing',
          'Trackman University - Ball Flight Laws',
          '日本プロゴルフ協会 - スイング理論基礎',
        ]}
      />
    </article>
  )
}