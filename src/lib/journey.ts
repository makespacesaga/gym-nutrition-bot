import type { GoalType } from '../types'

export interface Milestone {
  pct: number        // 達成率（0〜100）
  emoji: string
  label: string
  story: string      // その時点での理想の未来
}

export interface Badge {
  id: string
  emoji: string
  label: string
  description: string
}

// ゴール種別ごとのマイルストーンストーリー
export const MILESTONES: Record<GoalType, Milestone[]> = {
  diet: [
    {
      pct: 0,
      emoji: '🌱',
      label: 'スタート',
      story: '今日から新しい自分への旅が始まります。最初の一歩を踏み出したあなたは、すでに変わり始めています。',
    },
    {
      pct: 10,
      emoji: '🌿',
      label: '変化の兆し',
      story: '体の中から少しずつ変わっています。むくみが取れて、なんとなく軽い感じがしてくる頃です。',
    },
    {
      pct: 25,
      emoji: '🌸',
      label: '周りが気づく',
      story: '友人や家族が「なんか変わった？」と声をかけてくれる頃。顔まわりや体のラインに変化が出始めます。',
    },
    {
      pct: 50,
      emoji: '💫',
      label: '折り返し！',
      story: '目標の半分に到達しました！去年着れなかった服を試してみてください。きっと驚きがあるはずです✨',
    },
    {
      pct: 75,
      emoji: '🌟',
      label: 'ゴールが見えてきた',
      story: '鏡を見るのが楽しみになっている頃です。自信が体から溢れ出しています。もう少し！',
    },
    {
      pct: 100,
      emoji: '🎉',
      label: '理想の自分、完成！',
      story: '目標達成おめでとうございます！なりたかった自分になれました。この体型・習慣を一生の宝物にしてください🌺',
    },
  ],
  health: [
    {
      pct: 0,
      emoji: '🌱',
      label: 'スタート',
      story: '食生活を変えるだけで、数値は必ず変わります。毎年ドキドキした健康診断が、楽しみな日になる旅の始まりです。',
    },
    {
      pct: 10,
      emoji: '🌿',
      label: '腸から変わる',
      story: '腸内環境が整い始めています。お腹の調子が良くなり、体の中から元気になってくる頃です。',
    },
    {
      pct: 25,
      emoji: '🌸',
      label: '血液が変わる',
      story: '血中コレステロールや血糖値が改善し始める頃。「最近なんか元気そうだね」と言われるかもしれません。',
    },
    {
      pct: 50,
      emoji: '💫',
      label: '折り返し！',
      story: '半分達成！次の健診に向けて数値が着実に改善中です。お医者さんに褒められる日が近づいています。',
    },
    {
      pct: 75,
      emoji: '🌟',
      label: '健診が楽しみに',
      story: '毎年ドキドキしていた健診が、今年は楽しみになっているはずです。「異常なし」の文字が目に浮かびます。',
    },
    {
      pct: 100,
      emoji: '🎉',
      label: '健診オールグリーン！',
      story: '健康診断で全項目「異常なし」を達成しました！家族も安心、お医者さんにも褒められる体になりました🌺',
    },
  ],
  both: [
    {
      pct: 0,
      emoji: '🌱',
      label: 'スタート',
      story: '今日から見た目も健康も、両方手に入れる旅の始まりです。きっと半年後の自分に驚くことになります。',
    },
    {
      pct: 10,
      emoji: '🌿',
      label: '体が目覚める',
      story: '体の中から変化が起きています。むくみが取れて、腸の調子も整ってきた頃。内側からキレイになっています。',
    },
    {
      pct: 25,
      emoji: '🌸',
      label: '内外から変わる',
      story: '顔まわりがすっきりして、血液検査の数値も動き始めています。「なんか最近キレイだね」と言われる頃です。',
    },
    {
      pct: 50,
      emoji: '💫',
      label: '折り返し！',
      story: 'ダイエットも健康数値も半分達成！去年着れなかった服を試しながら、次の健診が楽しみになっているはずです✨',
    },
    {
      pct: 75,
      emoji: '🌟',
      label: 'ゴールが見えてきた',
      story: '鏡を見るのが楽しくなり、体の内側も健康的。自信が体から溢れ出しています。もう少し！',
    },
    {
      pct: 100,
      emoji: '🎉',
      label: '理想の自分、完成！',
      story: '見た目も健康数値も理想を達成しました！健診オールグリーン＆好きな服が似合う体。この習慣を一生続けましょう🌺',
    },
  ],
}

// 現在の達成率を計算（体重ベース）
export function calcWeightProgress(
  startWeight: number | null,
  currentWeight: number | null,
  targetWeight: number | null
): number {
  if (!startWeight || !currentWeight || !targetWeight) return 0
  if (startWeight <= targetWeight) return 0
  const total = startWeight - targetWeight
  const done = startWeight - currentWeight
  return Math.min(Math.max(Math.round((done / total) * 100), 0), 100)
}

// 連続記録日数を計算
export function calcStreak(mealDates: string[]): number {
  if (mealDates.length === 0) return 0
  const sorted = [...new Set(mealDates)].sort().reverse()
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  if (sorted[0] !== today && sorted[0] !== yesterday) return 0

  let streak = 1
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1])
    const curr = new Date(sorted[i])
    const diffDays = Math.round((prev.getTime() - curr.getTime()) / 86400000)
    if (diffDays === 1) streak++
    else break
  }
  return streak
}

// 現在のマイルストーンを取得
export function getCurrentMilestone(pct: number, goalType: GoalType): Milestone {
  const milestones = MILESTONES[goalType]
  let current = milestones[0]
  for (const m of milestones) {
    if (pct >= m.pct) current = m
  }
  return current
}

// 次のマイルストーンを取得
export function getNextMilestone(pct: number, goalType: GoalType): Milestone | null {
  const milestones = MILESTONES[goalType]
  return milestones.find(m => m.pct > pct) ?? null
}

// バッジ定義
export const BADGES: Badge[] = [
  { id: 'first_meal', emoji: '🍽️', label: '最初の記録', description: '初めて食事を記録した' },
  { id: 'streak_3', emoji: '🔥', label: '3日連続', description: '3日連続で食事を記録' },
  { id: 'streak_7', emoji: '⚡', label: '7日連続', description: '7日連続で食事を記録' },
  { id: 'streak_30', emoji: '💎', label: '30日連続', description: '30日連続で食事を記録' },
  { id: 'photo_5', emoji: '📸', label: '食事美人', description: '写真付きで5食記録' },
  { id: 'protein_3', emoji: '💪', label: 'タンパク質マスター', description: 'タンパク質目標を3日連続達成' },
  { id: 'calorie_5', emoji: '🎯', label: 'カロリー名人', description: 'カロリー目標内を5日連続' },
  { id: 'weight_1', emoji: '🌸', label: '最初の変化', description: '体重が初めて記録より減った' },
  { id: 'milestone_25', emoji: '✨', label: '25%達成', description: '目標の25%に到達' },
  { id: 'milestone_50', emoji: '🌟', label: '折り返し！', description: '目標の50%に到達' },
  { id: 'milestone_100', emoji: '🎉', label: '目標達成！', description: '理想の自分を手に入れた' },
]

// 励ましメッセージ（時間帯・状況別）
export function getDailyMessage(
  nickname: string,
  streak: number,
  pct: number,
  goalType: GoalType
): string {
  const hour = new Date().getHours()
  const name = nickname.split(/[\s　]/)[0]

  if (streak >= 30) return `${name}さん、30日連続達成！これはもう習慣になりましたね💎`
  if (streak >= 7) return `${name}さん、${streak}日連続記録中！⚡ この調子が理想の自分への最短ルートです`
  if (streak >= 3) return `${name}さん、${streak}日続いてます🔥 継続は力なり、確実に変わっています`

  if (goalType === 'health') {
    if (hour < 10) return `おはようございます、${name}さん！今日の朝食から体の中が変わります🌅`
    if (hour < 14) return `${name}さん、お昼ご飯の記録を忘れずに。数値改善の積み重ねです☀️`
    if (hour < 18) return `${name}さん、今日も体に優しい食事ができていますか？健診が楽しみになる日が近いです🌿`
    return `${name}さん、今日の記録はできましたか？明日の健康な体は今日の食事で作られます🌙`
  }

  if (pct >= 75) return `${name}さん、ゴールまであと少し！毎日の積み重ねがここまで連れてきました🌟`
  if (pct >= 50) return `${name}さん、折り返し地点を超えました！好きな服が似合う日が近いです💫`
  if (pct >= 25) return `${name}さん、着実に変わっています。まわりに気づかれる頃ですよ🌸`

  if (hour < 10) return `おはようございます、${name}さん！今日も理想の自分に一歩近づく日にしましょう🌅`
  if (hour < 18) return `${name}さん、今日も一緒に頑張りましょう！小さな記録が大きな変化を生みます☀️`
  return `${name}さん、今日もよく頑張りました。毎日の積み重ねが未来の自分を作っています🌙`
}
