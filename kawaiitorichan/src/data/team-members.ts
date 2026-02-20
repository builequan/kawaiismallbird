export interface TeamMember {
  id: string
  name: string
  role: string
  roleShort: string
  experience: string
  birds: string
  birdNames: string
  description: string
  credentials: string[]
  avatarGradient: { from: string; to: string }
}

export interface VeterinaryAdvisor {
  title: string
  name: string
  jobTitle: string
  description: string
  credentials: string[]
  note: string
}

export const teamMembers: TeamMember[] = [
  {
    id: 'midori-suzuki',
    name: '鈴木 みどり',
    role: '編集長・コンテンツ責任者',
    roleShort: '編集長',
    experience: '小鳥飼育歴15年',
    birds: 'セキセイインコ、オカメインコ',
    birdNames: 'セキセイインコの「ピーちゃん」と「そらくん」、オカメインコの「ふくちゃん」',
    description:
      '20代でセキセイインコの「ピーちゃん」をお迎えしたことをきっかけに、小鳥の魅力に取り憑かれました。現在は3羽のインコと暮らしながら、換羽期のケアや季節ごとの温度管理など、日々の飼育で得た知識を記事にまとめています。「飼い主さんが安心して小鳥と暮らせる情報」をモットーに、正確で実践的な情報発信を心がけています。',
    credentials: ['日本愛玩動物協会会員', '愛玩動物飼養管理士'],
    avatarGradient: { from: 'from-orange-400', to: 'to-amber-500' },
  },
  {
    id: 'haruka-tanaka',
    name: '田中 はるか',
    role: '健康・栄養担当ライター',
    roleShort: '健康・栄養担当',
    experience: '小鳥飼育歴12年',
    birds: '文鳥、十姉妹',
    birdNames: '白文鳥の「もちくん」と桜文鳥の「さくらちゃん」、十姉妹3羽',
    description:
      '文鳥の「もちくん」が体調を崩した経験から、小鳥の健康管理の重要性を痛感しました。以来、鳥類専門の獣医師への取材を重ね、フードの栄養成分比較や季節ごとの体調管理について深く学んでいます。飼い主さんが「うちの子、大丈夫かな？」と不安になったとき、すぐに役立つ正確な健康情報をわかりやすくお伝えしています。',
    credentials: ['ペット栄養管理士', '動物看護助手'],
    avatarGradient: { from: 'from-blue-400', to: 'to-cyan-500' },
  },
  {
    id: 'kotori-sato',
    name: '佐藤 ことり',
    role: '飼育環境・用品担当ライター',
    roleShort: '飼育環境担当',
    experience: '小鳥飼育歴10年',
    birds: 'カナリア、錦華鳥',
    birdNames: 'カナリアの「レモンちゃん」と錦華鳥の「チビたん」「まるちゃん」',
    description:
      'カナリアの美しいさえずりに魅せられて飼育を始め、以来10年にわたって快適なケージ環境づくりを追求してきました。HOEI・SANKOなど主要メーカーのケージやヒーターを実際に購入・テストし、使い勝手や安全性を比較レビューしています。元ペットショップ勤務の経験を活かし、初心者の方にもわかりやすい用品選びのアドバイスをお届けします。',
    credentials: ['ペットショップ勤務経験3年'],
    avatarGradient: { from: 'from-green-400', to: 'to-emerald-500' },
  },
]

export const veterinaryAdvisor: VeterinaryAdvisor = {
  title: '監修獣医師',
  name: '監修獣医師',
  jobTitle: '鳥類専門獣医師',
  description:
    '当サイトの医療・健康に関する記事は、鳥類診療を専門とする獣医師の監修のもと作成されています。臨床経験10年以上、年間500羽以上の鳥類を診療しています。',
  credentials: [
    '獣医師免許取得',
    '鳥類診療専門',
    '臨床経験10年以上',
    'Association of Avian Veterinarians会員',
  ],
  note: '※監修獣医師のプライバシー保護のため、個人名の公開は控えさせていただいております。',
}

/**
 * Find a team member by ID or name
 */
export function findTeamMember(identifier: string): TeamMember | undefined {
  return teamMembers.find(
    (m) => m.id === identifier || m.name === identifier || m.name.replace(/\s/g, '') === identifier,
  )
}

/**
 * Get the default author (editor-in-chief)
 */
export function getDefaultAuthor(): TeamMember {
  return teamMembers[0]
}
