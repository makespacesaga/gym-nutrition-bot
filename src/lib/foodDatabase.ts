import type { FoodItem } from '../types'

// 文部科学省「食品成分データベース」に基づいた代表的な食品（100gあたり）
export const FOOD_DATABASE: FoodItem[] = [
  // 主食
  { name: '白米（炊いたもの）', per100g: { calories: 168, protein: 2.5, fat: 0.3, carbs: 37.1 } },
  { name: '玄米（炊いたもの）', per100g: { calories: 165, protein: 2.8, fat: 1.0, carbs: 35.6 } },
  { name: '食パン', per100g: { calories: 264, protein: 9.3, fat: 4.4, carbs: 46.7 } },
  { name: 'うどん（ゆで）', per100g: { calories: 105, protein: 2.6, fat: 0.4, carbs: 21.6 } },
  { name: 'そば（ゆで）', per100g: { calories: 130, protein: 4.8, fat: 1.0, carbs: 26.0 } },
  { name: 'パスタ（ゆで）', per100g: { calories: 165, protein: 5.8, fat: 0.9, carbs: 32.2 } },
  { name: 'オートミール', per100g: { calories: 380, protein: 13.7, fat: 5.7, carbs: 69.1 } },

  // 肉類
  { name: '鶏むね肉（皮なし）', per100g: { calories: 108, protein: 23.3, fat: 1.9, carbs: 0 } },
  { name: '鶏もも肉（皮なし）', per100g: { calories: 127, protein: 19.0, fat: 5.0, carbs: 0 } },
  { name: '豚ロース（赤身）', per100g: { calories: 150, protein: 22.7, fat: 5.6, carbs: 0.1 } },
  { name: '豚バラ肉', per100g: { calories: 395, protein: 14.4, fat: 35.4, carbs: 0.1 } },
  { name: '牛もも肉（赤身）', per100g: { calories: 140, protein: 21.3, fat: 5.0, carbs: 0.4 } },
  { name: '牛ひき肉', per100g: { calories: 272, protein: 17.1, fat: 21.1, carbs: 0.3 } },

  // 魚介類
  { name: 'さけ（生）', per100g: { calories: 133, protein: 22.3, fat: 4.1, carbs: 0.1 } },
  { name: 'まぐろ（赤身）', per100g: { calories: 125, protein: 26.4, fat: 1.4, carbs: 0.1 } },
  { name: 'さばの塩焼き', per100g: { calories: 211, protein: 26.2, fat: 12.0, carbs: 0.1 } },
  { name: 'えび', per100g: { calories: 97, protein: 20.6, fat: 1.0, carbs: 0.1 } },
  { name: 'いか', per100g: { calories: 88, protein: 17.9, fat: 1.2, carbs: 0.4 } },
  { name: 'ツナ缶（水煮）', per100g: { calories: 71, protein: 16.0, fat: 0.7, carbs: 0.1 } },

  // 卵・大豆製品
  { name: '卵（全卵）', per100g: { calories: 151, protein: 12.3, fat: 10.3, carbs: 0.3 } },
  { name: '豆腐（絹ごし）', per100g: { calories: 56, protein: 5.3, fat: 3.5, carbs: 2.0 } },
  { name: '豆腐（木綿）', per100g: { calories: 72, protein: 7.0, fat: 4.3, carbs: 1.5 } },
  { name: '納豆', per100g: { calories: 200, protein: 16.5, fat: 10.0, carbs: 12.1 } },
  { name: '豆乳（無調整）', per100g: { calories: 46, protein: 3.6, fat: 2.0, carbs: 3.1 } },

  // 乳製品
  { name: '牛乳', per100g: { calories: 67, protein: 3.3, fat: 3.8, carbs: 4.8 } },
  { name: 'ギリシャヨーグルト（無糖）', per100g: { calories: 59, protein: 10.0, fat: 0.4, carbs: 3.6 } },
  { name: 'プレーンヨーグルト', per100g: { calories: 62, protein: 3.6, fat: 3.0, carbs: 4.9 } },
  { name: 'チーズ（プロセス）', per100g: { calories: 339, protein: 22.7, fat: 26.0, carbs: 1.3 } },
  { name: 'カッテージチーズ', per100g: { calories: 105, protein: 13.3, fat: 4.5, carbs: 1.9 } },

  // 野菜
  { name: 'ほうれん草（ゆで）', per100g: { calories: 25, protein: 2.6, fat: 0.5, carbs: 3.6 } },
  { name: 'ブロッコリー（ゆで）', per100g: { calories: 33, protein: 3.9, fat: 0.4, carbs: 4.3 } },
  { name: 'キャベツ（生）', per100g: { calories: 23, protein: 1.3, fat: 0.2, carbs: 5.2 } },
  { name: 'トマト（生）', per100g: { calories: 19, protein: 0.7, fat: 0.1, carbs: 4.7 } },
  { name: 'きゅうり（生）', per100g: { calories: 14, protein: 1.0, fat: 0.1, carbs: 3.0 } },
  { name: 'にんじん（生）', per100g: { calories: 39, protein: 0.7, fat: 0.1, carbs: 9.3 } },
  { name: 'アボカド', per100g: { calories: 187, protein: 2.1, fat: 17.5, carbs: 7.9 } },
  { name: 'さつまいも（蒸し）', per100g: { calories: 131, protein: 1.2, fat: 0.2, carbs: 30.3 } },
  { name: 'じゃがいも（蒸し）', per100g: { calories: 84, protein: 1.9, fat: 0.1, carbs: 19.9 } },

  // 果物
  { name: 'バナナ', per100g: { calories: 86, protein: 1.1, fat: 0.2, carbs: 22.5 } },
  { name: 'りんご', per100g: { calories: 61, protein: 0.2, fat: 0.2, carbs: 16.2 } },
  { name: 'オレンジ', per100g: { calories: 46, protein: 0.9, fat: 0.1, carbs: 11.8 } },
  { name: 'いちご', per100g: { calories: 34, protein: 0.9, fat: 0.1, carbs: 8.5 } },
  { name: 'ブルーベリー', per100g: { calories: 49, protein: 0.5, fat: 0.1, carbs: 12.9 } },

  // ナッツ・種実
  { name: 'アーモンド', per100g: { calories: 609, protein: 19.6, fat: 51.8, carbs: 19.7 } },
  { name: 'くるみ', per100g: { calories: 713, protein: 14.6, fat: 68.8, carbs: 13.6 } },

  // 飲料・調味料
  { name: 'プロテインパウダー（ホエイ）', per100g: { calories: 380, protein: 75.0, fat: 5.0, carbs: 10.0 } },
  { name: 'オリーブオイル', per100g: { calories: 921, protein: 0, fat: 100.0, carbs: 0 } },
  { name: 'マヨネーズ', per100g: { calories: 703, protein: 1.5, fat: 76.0, carbs: 3.6 } },
]

export function searchFoods(query: string): FoodItem[] {
  if (!query.trim()) return FOOD_DATABASE.slice(0, 20)
  const q = query.toLowerCase()
  return FOOD_DATABASE.filter(f => f.name.toLowerCase().includes(q))
}

export function calcNutrition(food: FoodItem, amountG: number) {
  const ratio = amountG / 100
  return {
    calories: Math.round(food.per100g.calories * ratio * 10) / 10,
    protein: Math.round(food.per100g.protein * ratio * 10) / 10,
    fat: Math.round(food.per100g.fat * ratio * 10) / 10,
    carbs: Math.round(food.per100g.carbs * ratio * 10) / 10,
  }
}
