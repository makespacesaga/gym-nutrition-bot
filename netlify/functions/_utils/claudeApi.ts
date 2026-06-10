import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface FoodItem {
  name: string
  amount: string
  calories: number
  protein: number
  fat: number
  carbs: number
}

export interface NutritionAnalysis {
  foods: FoodItem[]
  totals: { calories: number; protein: number; fat: number; carbs: number }
  meal_balance: string
  good_points: string[]
  improvements: string[]
  action_goal: string
}

export async function analyzeFoodPhoto(imageBuffer: Buffer): Promise<NutritionAnalysis> {
  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1500,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/jpeg',
            data: imageBuffer.toString('base64'),
          },
        },
        {
          type: 'text',
          text: `この食事の写真をパーソナルトレーナーの視点で分析してください。

日本語で回答し、以下のJSON形式のみで返してください（前後に余分なテキスト不要）：

{
  "foods": [
    {
      "name": "食品名",
      "amount": "量（例：茶碗1杯、約200g）",
      "calories": 数値,
      "protein": 数値,
      "fat": 数値,
      "carbs": 数値
    }
  ],
  "totals": {
    "calories": 合計カロリー,
    "protein": 合計タンパク質g,
    "fat": 合計脂質g,
    "carbs": 合計炭水化物g
  },
  "meal_balance": "食事バランスの全体評価（1〜2文。栄養バランスの偏りや特徴を具体的に）",
  "good_points": [
    "良かった点1（具体的に）",
    "良かった点2（具体的に）"
  ],
  "improvements": [
    "改善点1（具体的な行動で）",
    "改善点2（具体的な行動で）",
    "改善点3（具体的な行動で）"
  ],
  "action_goal": "次回までの行動目標（明日からできる具体的な1つの行動）"
}

ルール：
- calories/protein/fat/carbs はすべて整数
- good_points は必ず2つ
- improvements は必ず3つ
- action_goal は「〜する」の形で1文
- 全て日本語、前向きで励ます口調で`,
        },
      ],
    }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('Claude response parse failed')
  return JSON.parse(match[0]) as NutritionAnalysis
}
