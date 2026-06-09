export type UserRole = 'customer' | 'trainer'
export type GoalType = 'diet' | 'health' | 'both'

export interface Profile {
  id: string
  user_id: string
  role: UserRole
  full_name: string
  trainer_id: string | null
  goal_type: GoalType | null
  dream_vision: string | null
  start_weight: number | null
  daily_calorie_goal: number | null
  daily_protein_goal: number | null
  daily_fat_goal: number | null
  daily_carbs_goal: number | null
  target_weight: number | null
  target_body_fat: number | null
  onboarding_done: boolean
  created_at: string
  updated_at: string
}

export interface MealRecord {
  id: string
  user_id: string
  meal_date: string
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  memo: string | null
  photo_url: string | null
  total_calories: number
  total_protein: number
  total_fat: number
  total_carbs: number
  created_at: string
}

export interface MealItem {
  id: string
  meal_record_id: string
  food_name: string
  amount_g: number
  calories: number
  protein: number
  fat: number
  carbs: number
}

export interface BodyMeasurement {
  id: string
  user_id: string
  measured_date: string
  weight_kg: number | null
  body_fat_pct: number | null
  memo: string | null
  created_at: string
}

export interface TrainerFeedback {
  id: string
  trainer_id: string
  customer_id: string
  meal_record_id: string | null
  content: string
  created_at: string
  trainer?: Profile
}

export interface FoodItem {
  name: string
  per100g: {
    calories: number
    protein: number
    fat: number
    carbs: number
  }
}

export type MealType = MealRecord['meal_type']
