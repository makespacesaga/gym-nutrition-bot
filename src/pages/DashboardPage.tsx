import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, MessageCircle, ChevronRight, Flame, Map } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { calcStreak, getDailyMessage, calcWeightProgress, getCurrentMilestone } from '../lib/journey'
import type { MealRecord, TrainerFeedback, GoalType } from '../types'

const MEAL_LABELS: Record<string, string> = {
  breakfast: '朝食', lunch: '昼食', dinner: '夕食', snack: '間食',
}
const MEAL_EMOJI: Record<string, string> = {
  breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍪',
}

function NutritionBar({ label, value, goal, color }: { label: string; value: number; goal: number; color: string }) {
  const pct = Math.min((value / goal) * 100, 100)
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-500">
        <span>{label}</span>
        <span className="font-medium text-gray-700">{value.toFixed(0)}g / {goal}g</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { profile, user } = useAuth()
  const [todayMeals, setTodayMeals] = useState<MealRecord[]>([])
  const [latestFeedback, setLatestFeedback] = useState<TrainerFeedback | null>(null)
  const [streak, setStreak] = useState(0)
  const [currentWeight, setCurrentWeight] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  const todayISO = new Date().toISOString().split('T')[0]
  const today = new Date().toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' })

  useEffect(() => {
    if (!user) return
    Promise.all([fetchTodayMeals(), fetchLatestFeedback(), fetchStreak(), fetchLatestWeight()])
      .finally(() => setLoading(false))
  }, [user])

  async function fetchTodayMeals() {
    const { data } = await supabase
      .from('meal_records').select('*')
      .eq('user_id', user!.id).eq('meal_date', todayISO)
      .order('created_at', { ascending: true })
    setTodayMeals(data ?? [])
  }

  async function fetchLatestFeedback() {
    const { data } = await supabase
      .from('trainer_feedback')
      .select('*, trainer:profiles!trainer_id(full_name)')
      .eq('customer_id', user!.id)
      .order('created_at', { ascending: false }).limit(1).single()
    if (data) setLatestFeedback(data)
  }

  async function fetchStreak() {
    const { data } = await supabase
      .from('meal_records').select('meal_date').eq('user_id', user!.id)
    const dates = (data ?? []).map(r => r.meal_date as string)
    setStreak(calcStreak(dates))
  }

  async function fetchLatestWeight() {
    const { data } = await supabase
      .from('body_measurements').select('weight_kg')
      .eq('user_id', user!.id).not('weight_kg', 'is', null)
      .order('measured_date', { ascending: false }).limit(1).single()
    if (data) setCurrentWeight(data.weight_kg)
  }

  const totalCalories = todayMeals.reduce((s, m) => s + m.total_calories, 0)
  const totalProtein = todayMeals.reduce((s, m) => s + m.total_protein, 0)
  const totalFat = todayMeals.reduce((s, m) => s + m.total_fat, 0)
  const totalCarbs = todayMeals.reduce((s, m) => s + m.total_carbs, 0)

  const calorieGoal = profile?.daily_calorie_goal ?? 1600
  const caloriePct = Math.min(Math.round((totalCalories / calorieGoal) * 100), 100)

  const goalType: GoalType = profile?.goal_type ?? 'both'
  const journeyPct = calcWeightProgress(profile?.start_weight ?? null, currentWeight, profile?.target_weight ?? null)
  const currentMilestone = getCurrentMilestone(journeyPct, goalType)
  const dailyMessage = getDailyMessage(profile?.full_name ?? '', streak, journeyPct, goalType)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-rose-300 border-t-rose-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 日付 */}
      <p className="text-gray-400 text-sm">{today}</p>

      {/* 励ましメッセージカード */}
      <div className="bg-gradient-to-br from-rose-400 to-pink-500 rounded-2xl p-5 text-white shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <p className="text-base font-medium leading-relaxed flex-1">{dailyMessage}</p>
          {streak > 0 && (
            <div className="flex flex-col items-center flex-shrink-0 bg-white/20 rounded-xl px-3 py-2">
              <Flame size={18} className="text-orange-200" />
              <span className="text-xl font-bold">{streak}</span>
              <span className="text-xs opacity-80">日連続</span>
            </div>
          )}
        </div>
      </div>

      {/* ジャーニー進捗バナー */}
      {(profile?.dream_vision || journeyPct > 0) && (
        <Link to="/journey" className="block bg-white rounded-2xl p-4 shadow-sm border border-rose-50 hover:border-rose-200 transition-colors">
          <div className="flex items-center gap-3">
            <Map size={20} className="text-rose-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-sm font-medium text-gray-700">理想の自分への旅</p>
                <span className="text-sm font-bold text-rose-500">{journeyPct}%</span>
              </div>
              <div className="h-2 bg-rose-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-rose-400 to-pink-400 rounded-full"
                  style={{ width: `${journeyPct}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1.5">
                {currentMilestone.emoji} {currentMilestone.label}
                {profile?.dream_vision && (
                  <span className="ml-2 text-rose-400 truncate">「{profile.dream_vision.slice(0, 18)}...」</span>
                )}
              </p>
            </div>
            <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
          </div>
        </Link>
      )}

      {/* カロリーリング */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-rose-50">
        <h3 className="font-semibold text-gray-700 mb-4">今日の栄養</h3>
        <div className="flex items-center gap-6">
          <div className="relative w-28 h-28 flex-shrink-0">
            <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#fce7f3" strokeWidth="12" />
              <circle
                cx="50" cy="50" r="40" fill="none"
                stroke={caloriePct >= 100 ? '#f87171' : '#f472b6'}
                strokeWidth="12" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - caloriePct / 100)}`}
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-gray-800">{Math.round(totalCalories)}</span>
              <span className="text-xs text-gray-400">/ {calorieGoal} kcal</span>
            </div>
          </div>
          <div className="flex-1 space-y-3">
            <NutritionBar label="タンパク質" value={totalProtein} goal={profile?.daily_protein_goal ?? 60} color="bg-rose-400" />
            <NutritionBar label="脂質" value={totalFat} goal={profile?.daily_fat_goal ?? 50} color="bg-amber-400" />
            <NutritionBar label="炭水化物" value={totalCarbs} goal={profile?.daily_carbs_goal ?? 200} color="bg-sky-400" />
          </div>
        </div>
      </div>

      {/* 今日の食事 */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-rose-50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-700">今日の食事</h3>
          <Link to="/meals/new" className="flex items-center gap-1 text-rose-500 text-sm font-medium hover:text-rose-600">
            <Plus size={16} />記録する
          </Link>
        </div>

        {todayMeals.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-300 text-4xl mb-2">🍽️</p>
            <p className="text-gray-400 text-sm mb-3">まだ食事が記録されていません</p>
            <Link
              to="/meals/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-rose-400 text-white text-sm rounded-xl font-medium hover:bg-rose-500 transition-colors"
            >
              <Plus size={14} />食事を記録する
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {todayMeals.map(meal => (
              <Link key={meal.id} to={`/meals/${meal.id}`}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-rose-50 transition-colors group"
              >
                <span className="text-2xl">{MEAL_EMOJI[meal.meal_type]}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-700 text-sm">{MEAL_LABELS[meal.meal_type]}</p>
                  <p className="text-xs text-gray-400">{Math.round(meal.total_calories)} kcal</p>
                </div>
                {meal.photo_url && (
                  <img src={meal.photo_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                )}
                <ChevronRight size={16} className="text-gray-300 group-hover:text-rose-400" />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* トレーナーコメント */}
      {latestFeedback && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-rose-100">
          <div className="flex items-center gap-2 mb-2">
            <MessageCircle size={15} className="text-rose-400" />
            <span className="text-sm font-medium text-rose-500">トレーナーからのコメント</span>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">{latestFeedback.content}</p>
          <p className="text-xs text-gray-400 mt-1.5">
            {new Date(latestFeedback.created_at).toLocaleDateString('ja-JP')}
          </p>
        </div>
      )}
    </div>
  )
}
