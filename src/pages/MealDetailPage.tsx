import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Trash2, MessageCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import type { MealRecord, MealItem, TrainerFeedback } from '../types'

const MEAL_LABELS: Record<string, string> = {
  breakfast: '朝食', lunch: '昼食', dinner: '夕食', snack: '間食',
}

export default function MealDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [meal, setMeal] = useState<MealRecord | null>(null)
  const [items, setItems] = useState<MealItem[]>([])
  const [feedbacks, setFeedbacks] = useState<TrainerFeedback[]>([])
  const [feedbackText, setFeedbackText] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!id) return
    Promise.all([fetchMeal(), fetchItems(), fetchFeedbacks()]).finally(() => setLoading(false))
  }, [id])

  async function fetchMeal() {
    const { data } = await supabase.from('meal_records').select('*').eq('id', id).single()
    setMeal(data)
  }

  async function fetchItems() {
    const { data } = await supabase.from('meal_items').select('*').eq('meal_record_id', id)
    setItems(data ?? [])
  }

  async function fetchFeedbacks() {
    const { data } = await supabase
      .from('trainer_feedback')
      .select('*, trainer:profiles!trainer_id(full_name)')
      .eq('meal_record_id', id)
      .order('created_at', { ascending: true })
    setFeedbacks(data ?? [])
  }

  async function handleDelete() {
    if (!confirm('この食事記録を削除しますか？')) return
    await supabase.from('meal_records').delete().eq('id', id)
    navigate('/meals')
  }

  async function handleFeedback(e: React.FormEvent) {
    e.preventDefault()
    if (!feedbackText.trim() || !user) return
    setSubmitting(true)
    await supabase.from('trainer_feedback').insert({
      trainer_id: user.id,
      customer_id: meal!.user_id,
      meal_record_id: id,
      content: feedbackText.trim(),
    })
    setFeedbackText('')
    await fetchFeedbacks()
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-rose-300 border-t-rose-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (!meal) return <p className="text-center text-gray-400 mt-20">記録が見つかりません</p>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-rose-50 rounded-xl transition-colors">
          <ArrowLeft size={20} className="text-rose-400" />
        </button>
        <h2 className="font-bold text-gray-800">{MEAL_LABELS[meal.meal_type]}</h2>
        {meal.user_id === user?.id && (
          <button onClick={handleDelete} className="p-2 hover:bg-red-50 rounded-xl transition-colors">
            <Trash2 size={18} className="text-red-400" />
          </button>
        )}
      </div>

      {meal.photo_url && (
        <img src={meal.photo_url} alt="食事" className="w-full h-52 object-cover rounded-2xl shadow-sm" />
      )}

      {/* 栄養情報 */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'カロリー', value: `${Math.round(meal.total_calories)}`, unit: 'kcal', color: 'text-rose-500' },
          { label: 'タンパク質', value: meal.total_protein.toFixed(1), unit: 'g', color: 'text-rose-400' },
          { label: '脂質', value: meal.total_fat.toFixed(1), unit: 'g', color: 'text-amber-500' },
          { label: '炭水化物', value: meal.total_carbs.toFixed(1), unit: 'g', color: 'text-sky-500' },
        ].map(item => (
          <div key={item.label} className="bg-white rounded-xl p-3 text-center shadow-sm border border-rose-50">
            <p className={`text-base font-bold ${item.color}`}>{item.value}</p>
            <p className="text-xs text-gray-400">{item.label}</p>
            <p className="text-xs text-gray-400">{item.unit}</p>
          </div>
        ))}
      </div>

      {/* 食品一覧 */}
      {items.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-rose-50">
          <h3 className="font-semibold text-gray-700 mb-3">食品内訳</h3>
          <div className="space-y-2">
            {items.map(item => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-700">{item.food_name}</p>
                  <p className="text-xs text-gray-400">{item.amount_g}g</p>
                </div>
                <p className="text-sm font-medium text-gray-600">{item.calories.toFixed(0)} kcal</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* メモ */}
      {meal.memo && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-rose-50">
          <h3 className="font-semibold text-gray-700 mb-2">メモ</h3>
          <p className="text-sm text-gray-600 leading-relaxed">{meal.memo}</p>
        </div>
      )}

      {/* トレーナーフィードバック */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-rose-50">
        <div className="flex items-center gap-2 mb-3">
          <MessageCircle size={16} className="text-rose-400" />
          <h3 className="font-semibold text-gray-700">コメント</h3>
        </div>

        {feedbacks.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">まだコメントはありません</p>
        )}

        <div className="space-y-3">
          {feedbacks.map(fb => (
            <div key={fb.id} className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-rose-600">
                  {(fb.trainer as { full_name: string } | undefined)?.full_name ?? 'トレーナー'}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(fb.created_at).toLocaleDateString('ja-JP')}
                </span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{fb.content}</p>
            </div>
          ))}
        </div>

        {profile?.role === 'trainer' && (
          <form onSubmit={handleFeedback} className="mt-3">
            <textarea
              value={feedbackText}
              onChange={e => setFeedbackText(e.target.value)}
              placeholder="コメントを入力..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none"
            />
            <button
              type="submit"
              disabled={submitting || !feedbackText.trim()}
              className="mt-2 w-full py-2 bg-rose-400 hover:bg-rose-500 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50"
            >
              {submitting ? '送信中...' : 'コメントを送信'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
