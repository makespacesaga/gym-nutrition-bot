import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import type { MealRecord } from '../types'

const MEAL_LABELS: Record<string, string> = {
  breakfast: '朝食',
  lunch: '昼食',
  dinner: '夕食',
  snack: '間食',
}

const MEAL_EMOJI: Record<string, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🍪',
}

export default function MealsPage() {
  const { user } = useAuth()
  const [meals, setMeals] = useState<MealRecord[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [loading, setLoading] = useState(true)

  const dateISO = currentDate.toISOString().split('T')[0]
  const dateLabel = currentDate.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' })
  const isToday = dateISO === new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (!user) return
    fetchMeals()
  }, [user, dateISO])

  async function fetchMeals() {
    setLoading(true)
    const { data } = await supabase
      .from('meal_records')
      .select('*')
      .eq('user_id', user!.id)
      .eq('meal_date', dateISO)
      .order('created_at', { ascending: true })
    setMeals(data ?? [])
    setLoading(false)
  }

  function prevDay() {
    setCurrentDate(d => { const n = new Date(d); n.setDate(n.getDate() - 1); return n })
  }

  function nextDay() {
    if (isToday) return
    setCurrentDate(d => { const n = new Date(d); n.setDate(n.getDate() + 1); return n })
  }

  const totalCalories = meals.reduce((s, m) => s + m.total_calories, 0)
  const totalProtein = meals.reduce((s, m) => s + m.total_protein, 0)
  const totalFat = meals.reduce((s, m) => s + m.total_fat, 0)
  const totalCarbs = meals.reduce((s, m) => s + m.total_carbs, 0)

  return (
    <div className="space-y-4">
      {/* 日付ナビゲーション */}
      <div className="flex items-center justify-between bg-white rounded-2xl p-3 shadow-sm border border-rose-50">
        <button onClick={prevDay} className="p-2 hover:bg-rose-50 rounded-xl transition-colors">
          <ChevronLeft size={20} className="text-rose-400" />
        </button>
        <div className="text-center">
          <p className="font-semibold text-gray-700">{dateLabel}</p>
          {isToday && <span className="text-xs text-rose-400 font-medium">今日</span>}
        </div>
        <button onClick={nextDay} disabled={isToday} className="p-2 hover:bg-rose-50 rounded-xl transition-colors disabled:opacity-30">
          <ChevronRight size={20} className="text-rose-400" />
        </button>
      </div>

      {/* 合計栄養 */}
      {meals.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'カロリー', value: `${Math.round(totalCalories)}`, unit: 'kcal', color: 'text-rose-500' },
            { label: 'タンパク質', value: totalProtein.toFixed(1), unit: 'g', color: 'text-rose-400' },
            { label: '脂質', value: totalFat.toFixed(1), unit: 'g', color: 'text-amber-500' },
            { label: '炭水化物', value: totalCarbs.toFixed(1), unit: 'g', color: 'text-sky-500' },
          ].map(item => (
            <div key={item.label} className="bg-white rounded-xl p-3 text-center shadow-sm border border-rose-50">
              <p className={`text-lg font-bold ${item.color}`}>{item.value}</p>
              <p className="text-xs text-gray-400">{item.unit}</p>
              <p className="text-xs text-gray-500 mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* 食事リスト */}
      <div className="bg-white rounded-2xl shadow-sm border border-rose-50 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-rose-50">
          <h3 className="font-semibold text-gray-700">食事記録</h3>
          <Link
            to={`/meals/new?date=${dateISO}`}
            className="flex items-center gap-1 text-rose-500 text-sm font-medium hover:text-rose-600"
          >
            <Plus size={16} />
            追加
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-3 border-rose-300 border-t-rose-500 rounded-full animate-spin" />
          </div>
        ) : meals.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">🍽️</p>
            <p className="text-gray-400 text-sm mb-4">この日の食事記録はありません</p>
            <Link
              to={`/meals/new?date=${dateISO}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-rose-400 text-white text-sm rounded-xl font-medium hover:bg-rose-500 transition-colors"
            >
              <Plus size={14} />
              食事を記録する
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-rose-50">
            {meals.map(meal => (
              <Link
                key={meal.id}
                to={`/meals/${meal.id}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-rose-50 transition-colors group"
              >
                <span className="text-2xl">{MEAL_EMOJI[meal.meal_type]}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-700">{MEAL_LABELS[meal.meal_type]}</p>
                  <p className="text-sm text-gray-400">
                    {Math.round(meal.total_calories)} kcal ·
                    P: {meal.total_protein.toFixed(0)}g ·
                    F: {meal.total_fat.toFixed(0)}g ·
                    C: {meal.total_carbs.toFixed(0)}g
                  </p>
                  {meal.memo && <p className="text-xs text-gray-400 mt-1 truncate">{meal.memo}</p>}
                </div>
                {meal.photo_url && (
                  <img src={meal.photo_url} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
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
