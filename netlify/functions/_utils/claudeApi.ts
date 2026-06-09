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
  comment: string
}

export async function analyzeFoodPhoto(imageBuffer: Buffer): Promise<NutritionAnalysis> {
  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
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
          text: `この食事の写真を分析して、含まれる食品と栄養素を推定してください。

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
    "protein": 合計タンパク質,
    "fat": 合計脂質,
    "carbs": 合計炭水化物
  },
  "comment": "食事への短い前向きコメント（1〜2文、日本語）"
}

単位：calories=kcal、protein/fat/carbs=g（すべて整数）。
写真に写っている食品をすべて特定し、見えない部分は一般的な量として推定してください。`,
        },
      ],
    }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('Claude response parse failed')
  return JSON.parse(match[0]) as NutritionAnalysis
}
