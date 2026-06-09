import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Profile, MealRecord, BodyMeasurement } from '../types'

const MEAL_LABELS: Record<string, string> = {
  breakfast: '朝食', lunch: '昼食', dinner: '夕食', snack: '間食',
}

const MEAL_EMOJI: Record<string, string> = {
  breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍪',
}

export default function ClientDetailPage() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const [client, setClient] = useState<Profile | null>(null)
  const [recentMeals, setRecentMeals] = useState<MealRecord[]>([])
  const [latestMeasurement, setLatestMeasurement] = useState<BodyMeasurement | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    Promise.all([fetchClient(), fetchRecentMeals(), fetchLatestMeasurement()]).finally(() => setLoading(false))
  }, [userId])

  async function fetchClient() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single()
    setClient(data)
  }

  async function fetchRecentMeals() {
    const { data } = await supabase
      .from('meal_records')
      .select('*')
      .eq('user_id', userId)
      .order('meal_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(10)
    setRecentMeals(data ?? [])
  }

  async function fetchLatestMeasurement() {
    const { data } = await supabase
      .from('body_measurements')
      .select('*')
      .eq('user_id', userId)
      .order('measured_date', { ascending: false })
      .limit(1)
      .single()
    setLatestMeasurement(data)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-rose-300 border-t-rose-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (!client) return <p className="text-center text-gray-400 mt-20">お客様が見つかりません</p>

  const today = new Date().toISOString().split('T')[0]
  const todayMeals = recentMeals.filter(m => m.meal_date === today)
  const todayCalories = todayMeals.reduce((s, m) => s + m.total_calories, 0)
  const todayProtein = todayMeals.reduce((s, m) => s + m.total_protein, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-rose-50 rounded-xl transition-colors">
          <ArrowLeft size={20} className="text-rose-400" />
        </button>
        <h2 className="text-lg font-bold text-gray-800">{client.full_name}</h2>
      </div>

      {/* お客様サマリー */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-rose-50">
          <p className="text-xs text-gray-400 mb-1">今日のカロリー</p>
          <p className="text-2xl font-bold text-rose-500">{Math.round(todayCalories)}</p>
          <p className="text-xs text-gray-400">kcal</p>
          {client.daily_calorie_goal && (
            <p className="text-xs text-gray-400 mt-1">目標: {client.daily_calorie_goal} kcal</p>
          )}
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-rose-50">
          <p className="text-xs text-gray-400 mb-1">今日のタンパク質</p>
          <p className="text-2xl font-bold text-rose-400">{todayProtein.toFixed(1)}</p>
          <p className="text-xs text-gray-400">g</p>
          {client.daily_protein_goal && (
            <p className="text-xs text-gray-400 mt-1">目標: {client.daily_protein_goal} g</p>
          )}
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-rose-50">
          <p className="text-xs text-gray-400 mb-1">現在の体重</p>
          <p className="text-2xl font-bold text-gray-700">{latestMeasurement?.weight_kg ?? '--'}</p>
          <p className="text-xs text-gray-400">kg</p>
          {client.target_weight && (
            <p className="text-xs text-gray-400 mt-1">目標: {client.target_weight} kg</p>
          )}
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-rose-50">
          <p className="text-xs text-gray-400 mb-1">体脂肪率</p>
          <p className="text-2xl font-bold text-gray-700">{latestMeasurement?.body_fat_pct ?? '--'}</p>
          <p className="text-xs text-gray-400">%</p>
          {client.target_body_fat && (
            <p className="text-xs text-gray-400 mt-1">目標: {client.target_body_fat} %</p>
          )}
        </div>
      </div>

      {/* 最近の食事 */}
      <div className="bg-white rounded-2xl shadow-sm border border-rose-50 overflow-hidden">
        <div className="px-5 py-4 border-b border-rose-50">
          <h3 className="font-semibold text-gray-700">最近の食事記録</h3>
        </div>
        {recentMeals.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-400 text-sm">食事記録がありません</p>
          </div>
        ) : (
          <div className="divide-y divide-rose-50">
            {recentMeals.map(meal => (
              <Link
                key={meal.id}
                to={`/meals/${meal.id}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-rose-50 transition-colors group"
              >
                <span className="text-xl">{MEAL_EMOJI[meal.meal_type]}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-700 text-sm">{MEAL_LABELS[meal.meal_type]}</p>
                    <span className="text-xs text-gray-400">
                      {new Date(meal.meal_date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {Math.round(meal.total_calories)} kcal · P: {meal.total_protein.toFixed(0)}g
                  </p>
                </div>
                {meal.photo_url && (
                  <img src={meal.photo_url} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                )}
                <ChevronRight size={16} className="text-gray-300 group-hover:text-rose-400 flex-shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
