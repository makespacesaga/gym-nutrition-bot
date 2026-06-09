import { createClient } from '@supabase/supabase-js'
import type { NutritionAnalysis } from './claudeApi'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export interface LineProfile {
  id: string
  line_user_id: string
  nickname: string
  email?: string
  role: 'customer' | 'trainer'
  goal_type: 'diet' | 'health' | 'both'
  dream_vision?: string
  start_weight?: number
  target_weight?: number
  current_weight?: number
  onboarding_done: boolean
  conversation_state: string
  conversation_data: Record<string, unknown>
  daily_calorie_goal: number
  created_at: string
  updated_at: string
}

export async function getOrCreateProfile(lineUserId: string): Promise<LineProfile> {
  const { data: existing } = await supabase
    .from('line_profiles')
    .select('*')
    .eq('line_user_id', lineUserId)
    .single()

  if (existing) return existing as LineProfile

  const { data, error } = await supabase
    .from('line_profiles')
    .insert({ line_user_id: lineUserId })
    .select()
    .single()

  if (error || !data) throw new Error(`Profile create failed: ${error?.message}`)
  return data as LineProfile
}

export async function updateProfile(lineUserId: string, updates: Partial<LineProfile>) {
  const { error } = await supabase
    .from('line_profiles')
    .update(updates)
    .eq('line_user_id', lineUserId)
  if (error) console.error('updateProfile error:', error)
}

export async function saveMealRecord(
  lineUserId: string,
  analysis: NutritionAnalysis,
  mealType: string
): Promise<string> {
  const today = tokyoDateString()

  const { data: record, error } = await supabase
    .from('line_meal_records')
    .insert({
      line_user_id: lineUserId,
      meal_type: mealType,
      meal_date: today,
      total_calories: analysis.totals.calories,
      total_protein: analysis.totals.protein,
      total_fat: analysis.totals.fat,
      total_carbs: analysis.totals.carbs,
      photo_analysis: analysis,
    })
    .select()
    .single()

  if (error || !record) throw new Error(`saveMealRecord failed: ${error?.message}`)

  if (analysis.foods.length > 0) {
    await supabase.from('line_meal_items').insert(
      analysis.foods.map(f => ({
        meal_record_id: record.id,
        name: f.name,
        amount: f.amount,
        calories: f.calories,
        protein: f.protein,
        fat: f.fat,
        carbs: f.carbs,
      }))
    )
  }

  return record.id as string
}

export async function getTodayMeals(lineUserId: string) {
  const today = tokyoDateString()
  const { data } = await supabase
    .from('line_meal_records')
    .select('*')
    .eq('line_user_id', lineUserId)
    .eq('meal_date', today)
    .order('created_at', { ascending: true })
  return data ?? []
}

export async function getStreak(lineUserId: string): Promise<number> {
  const { data } = await supabase
    .from('line_meal_records')
    .select('meal_date')
    .eq('line_user_id', lineUserId)
    .order('meal_date', { ascending: false })

  if (!data || data.length === 0) return 0

  const uniqueDates = [...new Set(data.map(r => r.meal_date as string))].sort().reverse()
  const today = tokyoDateString()

  let streak = 0
  for (let i = 0; i < uniqueDates.length; i++) {
    const diffDays = daysBetween(uniqueDates[i], today)
    if (diffDays === i || (i === 0 && diffDays === 0)) {
      streak++
    } else {
      break
    }
  }
  return streak
}

export async function saveWeight(lineUserId: string, weightKg: number) {
  const today = tokyoDateString()
  await supabase.from('line_body_measurements').upsert(
    { line_user_id: lineUserId, weight_kg: weightKg, measured_date: today },
    { onConflict: 'line_user_id,measured_date' }
  )
  await updateProfile(lineUserId, { current_weight: weightKg })
}

export async function getAllCustomers(): Promise<LineProfile[]> {
  const { data } = await supabase
    .from('line_profiles')
    .select('*')
    .eq('role', 'customer')
    .eq('onboarding_done', true)
    .order('nickname', { ascending: true })
  return (data ?? []) as LineProfile[]
}

export async function findCustomerByNickname(nickname: string): Promise<LineProfile | null> {
  const { data } = await supabase
    .from('line_profiles')
    .select('*')
    .eq('role', 'customer')
    .ilike('nickname', `%${nickname}%`)
    .limit(1)
    .single()
  return data as LineProfile | null
}

export async function saveTrainerFeedback(
  customerLineUserId: string,
  trainerLineUserId: string,
  content: string
) {
  await supabase.from('line_trainer_feedback').insert({
    customer_line_user_id: customerLineUserId,
    trainer_line_user_id: trainerLineUserId,
    content,
  })
}

function tokyoDateString(): string {
  return new Date().toLocaleDateString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).replace(/\//g, '-')
}

function daysBetween(dateStr: string, todayStr: string): number {
  const d1 = new Date(dateStr).getTime()
  const d2 = new Date(todayStr).getTime()
  return Math.round(Math.abs(d2 - d1) / 86400000)
}
