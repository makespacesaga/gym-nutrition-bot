import type { NutritionAnalysis } from './claudeApi'
import type { LineProfile } from './db'

type Msg = Record<string, unknown>

// ─── シンプルテキスト ───────────────────────────────────
export function text(t: string): Msg {
  return { type: 'text', text: t }
}

// ─── クイックリプライ付きテキスト ──────────────────────
export function textQR(
  t: string,
  items: Array<{ label: string; data: string; displayText?: string }>
): Msg {
  return {
    type: 'text',
    text: t,
    quickReply: {
      items: items.map(i => ({
        type: 'action',
        action: { type: 'postback', label: i.label, data: i.data, displayText: i.displayText ?? i.label },
      })),
    },
  }
}

// ─── ゴール選択クイックリプライ ───────────────────────
export function goalSelectMsg(nickname: string): Msg {
  return textQR(
    `${nickname}さん！\nどんな目標を持っていますか？`,
    [
      { label: '👗 ダイエット成功', data: 'action=set_goal&type=diet', displayText: 'ダイエット成功' },
      { label: '🏥 健康診断クリア', data: 'action=set_goal&type=health', displayText: '健康診断クリア' },
      { label: '✨ 両方達成したい', data: 'action=set_goal&type=both', displayText: '両方達成したい' },
    ]
  )
}

// ─── 栄養分析 Flex メッセージ ─────────────────────────
export function nutritionFlex(
  analysis: NutritionAnalysis,
  mealType: string,
  streak: number
): Msg {
  const mealEmoji: Record<string, string> = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍪' }
  const mealLabel: Record<string, string> = { breakfast: '朝食', lunch: '昼食', dinner: '夕食', snack: '間食' }
  const label = mealLabel[mealType] ?? '食事'
  const emoji = mealEmoji[mealType] ?? '🍽️'

  const dateStr = new Date().toLocaleDateString('ja-JP', {
    timeZone: 'Asia/Tokyo', month: 'long', day: 'numeric',
  })

  const streakLine = streak > 0
    ? `🔥 ${streak}日連続記録中！素晴らしい継続力です`
    : '今日から記録スタート！一歩一歩が未来を変えます🌱'

  const foodRows = analysis.foods.slice(0, 5).map(f => ({
    type: 'box',
    layout: 'horizontal',
    contents: [
      { type: 'text', text: f.name, size: 'sm', color: '#444444', flex: 4, wrap: true },
      { type: 'text', text: f.amount, size: 'xs', color: '#aaaaaa', flex: 3, align: 'end' },
      { type: 'text', text: `${f.calories}`, size: 'sm', color: '#E84C88', flex: 2, align: 'end', weight: 'bold' },
      { type: 'text', text: 'kcal', size: 'xs', color: '#aaaaaa', flex: 1, margin: 'xs' },
    ],
    margin: 'sm',
  }))

  // 良かった点
  const goodRows = (analysis.good_points ?? []).map(p => ({
    type: 'box',
    layout: 'horizontal',
    margin: 'sm',
    contents: [
      { type: 'text', text: '✅', size: 'sm', flex: 0 },
      { type: 'text', text: p, size: 'sm', color: '#27AE60', wrap: true, flex: 1, margin: 'sm' },
    ],
  }))

  // 改善点
  const improveRows = (analysis.improvements ?? []).map(p => ({
    type: 'box',
    layout: 'horizontal',
    margin: 'sm',
    contents: [
      { type: 'text', text: '📌', size: 'sm', flex: 0 },
      { type: 'text', text: p, size: 'sm', color: '#E67E22', wrap: true, flex: 1, margin: 'sm' },
    ],
  }))

  return {
    type: 'flex',
    altText: `${label}の分析完了！合計${analysis.totals.calories}kcal`,
    contents: {
      type: 'bubble',
      size: 'kilo',
      header: {
        type: 'box',
        layout: 'horizontal',
        backgroundColor: '#E84C88',
        paddingAll: 'lg',
        contents: [
          { type: 'text', text: emoji, size: 'xxl', flex: 0 },
          {
            type: 'box',
            layout: 'vertical',
            flex: 1,
            paddingStart: 'md',
            contents: [
              { type: 'text', text: `${label}の分析結果`, size: 'md', color: '#ffffff', weight: 'bold' },
              { type: 'text', text: dateStr, size: 'xs', color: '#ffcce8' },
            ],
          },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        paddingAll: 'lg',
        spacing: 'none',
        contents: [
          // 食品リスト
          { type: 'box', layout: 'vertical', contents: foodRows },
          { type: 'separator', margin: 'md', color: '#f0f0f0' },

          // 合計カロリー
          {
            type: 'box',
            layout: 'horizontal',
            margin: 'md',
            contents: [
              { type: 'text', text: '合計カロリー', size: 'sm', color: '#555555', weight: 'bold', gravity: 'center' },
              { type: 'text', text: `${analysis.totals.calories} kcal`, size: 'xl', color: '#E84C88', weight: 'bold', align: 'end' },
            ],
          },

          // PFC バッジ
          {
            type: 'box',
            layout: 'horizontal',
            margin: 'sm',
            spacing: 'sm',
            contents: [
              pfcBadge('P タンパク質', `${analysis.totals.protein}g`, '#27AE60', '#E8F8EF'),
              pfcBadge('F 脂質', `${analysis.totals.fat}g`, '#E67E22', '#FEF5E7'),
              pfcBadge('C 炭水化物', `${analysis.totals.carbs}g`, '#2980B9', '#EBF5FB'),
            ],
          },
          { type: 'separator', margin: 'md', color: '#f0f0f0' },

          // 食事バランス
          {
            type: 'box',
            layout: 'vertical',
            margin: 'md',
            backgroundColor: '#F8F9FA',
            cornerRadius: 'md',
            paddingAll: 'md',
            contents: [
              { type: 'text', text: '🍽️ 食事バランス', size: 'xs', color: '#888888', weight: 'bold' },
              { type: 'text', text: analysis.meal_balance ?? '', size: 'sm', color: '#444444', wrap: true, margin: 'sm' },
            ],
          },

          // 良かった点
          {
            type: 'box',
            layout: 'vertical',
            margin: 'md',
            contents: [
              { type: 'text', text: '👍 良かった点', size: 'xs', color: '#27AE60', weight: 'bold' },
              ...goodRows,
            ],
          },

          // 改善点
          {
            type: 'box',
            layout: 'vertical',
            margin: 'md',
            contents: [
              { type: 'text', text: '📋 改善点', size: 'xs', color: '#E67E22', weight: 'bold' },
              ...improveRows,
            ],
          },

          // 行動目標
          {
            type: 'box',
            layout: 'vertical',
            margin: 'md',
            backgroundColor: '#FFF8E1',
            cornerRadius: 'md',
            paddingAll: 'md',
            contents: [
              { type: 'text', text: '🎯 次回までの行動目標', size: 'xs', color: '#F39C12', weight: 'bold' },
              { type: 'text', text: analysis.action_goal ?? '', size: 'sm', color: '#333333', wrap: true, margin: 'sm', weight: 'bold' },
            ],
          },

          // ストリーク
          {
            type: 'box',
            layout: 'vertical',
            margin: 'md',
            backgroundColor: '#FFF0F5',
            cornerRadius: 'md',
            paddingAll: 'sm',
            contents: [
              { type: 'text', text: streakLine, size: 'xs', color: '#E84C88', align: 'center', wrap: true },
            ],
          },
        ],
      },
      footer: {
        type: 'box',
        layout: 'horizontal',
        paddingAll: 'md',
        spacing: 'sm',
        contents: [
          {
            type: 'button',
            style: 'primary',
            color: '#E84C88',
            flex: 1,
            action: {
              type: 'postback',
              label: '✅ 記録する',
              data: `action=save_meal&meal_type=${mealType}`,
              displayText: 'この食事を記録しました！',
            },
          },
          {
            type: 'button',
            style: 'secondary',
            flex: 1,
            action: {
              type: 'postback',
              label: '📷 撮り直す',
              data: 'action=retake',
              displayText: 'もう一度写真を送ります',
            },
          },
        ],
      },
    },
  }
}

function pfcBadge(label: string, value: string, textColor: string, bgColor: string): Record<string, unknown> {
  return {
    type: 'box',
    layout: 'vertical',
    flex: 1,
    backgroundColor: bgColor,
    cornerRadius: 'md',
    paddingAll: 'sm',
    contents: [
      { type: 'text', text: label, size: 'xxs', color: textColor, weight: 'bold', align: 'center' },
      { type: 'text', text: value, size: 'sm', color: '#333333', weight: 'bold', align: 'center' },
    ],
  }
}

// ─── 今日の食事サマリー Flex ───────────────────────────
export function todaySummaryFlex(meals: any[], waterMl: number, profile: LineProfile): Msg {
  const totalCalories = meals.reduce((s, m) => s + Number(m.total_calories), 0)
  const totalProtein  = meals.reduce((s, m) => s + Number(m.total_protein),  0)
  const totalFat      = meals.reduce((s, m) => s + Number(m.total_fat),      0)
  const totalCarbs    = meals.reduce((s, m) => s + Number(m.total_carbs),    0)
  const goal = profile.daily_calorie_goal ?? 1600
  const pct  = Math.min(Math.round((totalCalories / goal) * 100), 100)

  const mealEmoji:  Record<string, string> = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍪' }
  const mealLabel:  Record<string, string> = { breakfast: '朝食', lunch: '昼食', dinner: '夕食', snack: '間食' }
  const dateStr = new Date().toLocaleDateString('ja-JP', {
    timeZone: 'Asia/Tokyo', month: 'long', day: 'numeric', weekday: 'short',
  })

  const waterPct = Math.min(Math.round((waterMl / 2000) * 100), 100)

  const mealRows = meals.map(m => ({
    type: 'box',
    layout: 'horizontal',
    margin: 'sm',
    contents: [
      { type: 'text', text: mealEmoji[m.meal_type] ?? '🍽️', size: 'md', flex: 0 },
      { type: 'text', text: mealLabel[m.meal_type] ?? m.meal_type, size: 'sm', color: '#555555', flex: 1, margin: 'sm' },
      { type: 'text', text: `${Math.round(m.total_calories)} kcal`, size: 'sm', color: '#E84C88', weight: 'bold', align: 'end' },
    ],
  }))

  const emptyMsg = [{
    type: 'text',
    text: 'まだ食事が記録されていません\n食事の写真を送ってください📷',
    size: 'sm', color: '#aaaaaa', align: 'center', wrap: true, margin: 'lg',
  }]

  return {
    type: 'flex',
    altText: `今日の食事：合計${Math.round(totalCalories)}kcal`,
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#E84C88',
        paddingAll: 'lg',
        contents: [
          { type: 'text', text: '📊 今日の食事まとめ', size: 'md', color: '#ffffff', weight: 'bold' },
          { type: 'text', text: dateStr, size: 'xs', color: '#ffcce8' },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        paddingAll: 'lg',
        contents: [
          // カロリー
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              { type: 'text', text: `${Math.round(totalCalories)}`, size: 'xxl', weight: 'bold', color: '#E84C88', flex: 0 },
              { type: 'text', text: ' kcal', size: 'sm', color: '#E84C88', gravity: 'bottom', flex: 0 },
              { type: 'filler' },
              { type: 'text', text: `目標 ${goal}kcal`, size: 'xs', color: '#aaaaaa', gravity: 'bottom' },
            ],
          },
          // カロリーバー
          {
            type: 'box', layout: 'horizontal', height: '8px', margin: 'sm',
            cornerRadius: 'xxl', backgroundColor: '#FFE0EF',
            contents: [{
              type: 'box', layout: 'vertical', width: `${pct}%`,
              backgroundColor: '#E84C88', cornerRadius: 'xxl', contents: [],
            }],
          },
          { type: 'text', text: `${pct}% 達成`, size: 'xs', color: '#E84C88', align: 'end', margin: 'xs' },

          // PFC
          {
            type: 'box', layout: 'horizontal', margin: 'md', spacing: 'sm',
            contents: [
              pfcBadge('P タンパク質', `${Math.round(totalProtein)}g`, '#27AE60', '#E8F8EF'),
              pfcBadge('F 脂質', `${Math.round(totalFat)}g`, '#E67E22', '#FEF5E7'),
              pfcBadge('C 炭水化物', `${Math.round(totalCarbs)}g`, '#2980B9', '#EBF5FB'),
            ],
          },

          // 水分量
          {
            type: 'box', layout: 'vertical', margin: 'md',
            backgroundColor: '#EBF5FB', cornerRadius: 'md', paddingAll: 'md',
            contents: [
              {
                type: 'box', layout: 'horizontal',
                contents: [
                  { type: 'text', text: '💧 水分量', size: 'sm', color: '#2980B9', weight: 'bold', flex: 1 },
                  { type: 'text', text: `${waterMl}ml / 2000ml`, size: 'sm', color: '#2980B9', weight: 'bold', align: 'end' },
                ],
              },
              {
                type: 'box', layout: 'horizontal', height: '6px', margin: 'sm',
                cornerRadius: 'xxl', backgroundColor: '#AED6F1',
                contents: [{
                  type: 'box', layout: 'vertical', width: `${waterPct}%`,
                  backgroundColor: '#2980B9', cornerRadius: 'xxl', contents: [],
                }],
              },
              {
                type: 'text',
                text: waterMl >= 2000 ? '🎉 目標達成！' : `あと ${2000 - waterMl}ml`,
                size: 'xs', color: '#2980B9', align: 'end', margin: 'xs',
              },
            ],
          },

          { type: 'separator', margin: 'md', color: '#f0f0f0' },

          // 食事リスト
          ...(meals.length > 0 ? mealRows : emptyMsg),
        ],
      },
    },
  }
}

// ─── ヘルプ ─────────────────────────────────────────
export function helpMsg(isTrainer: boolean): Msg {
  if (isTrainer) {
    return text(
      `🌸 トレーナー向けコマンド\n\n` +
      `📋「顧客一覧」→ お客様全員を表示\n` +
      `👤「@名前」→ お客様の今日の状況\n` +
      `💬「@名前｜メッセージ」→ フィードバック送信\n\n` +
      `例：@山田さん\n` +
      `例：@山田さん｜今日の食事バランスいいですね！`
    )
  }
  return text(
    `🌸 使い方ガイド\n\n` +
    `📷 写真を送る → 食事をAIが分析・記録\n` +
    `「水分 500」→ 水分量を記録（ml）\n` +
    `「今日」→ 今日の食事＋水分まとめ\n` +
    `「進捗」→ 目標達成率・連続日数\n` +
    `「体重 55.5」→ 体重を記録\n` +
    `「ヘルプ」→ このガイド\n\n` +
    `まずは食事の写真を送ってみてください！`
  )
}
