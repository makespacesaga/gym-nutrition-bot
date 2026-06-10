import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Flame, Scale, MessageSquare, Send, CircleCheck } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface LineProfile {
  line_user_id: string
  nickname: string
  goal_type: string
  dream_vision: string | null
  start_weight: number | null
  target_weight: number | null
  current_weight: number | null
  daily_calorie_goal: number
}

interface LineMealRecord {
  id: string
  meal_type: string
  meal_date: string
  total_calories: number
  total_protein: number
  total_fat: number
  total_carbs: number
  photo_analysis: {
    meal_balance?: string
    good_points?: string[]
    improvements?: string[]
    action_goal?: string
  } | null
  created_at: string
}

const MEAL_LABELS: Record<string, string> = { breakfast: '朝食', lunch: '昼食', dinner: '夕食', snack: '間食' }
const MEAL_EMOJI: Record<string, string> = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍪' }
const GOAL_LABELS: Record<string, string> = { diet: 'ダイエット', health: '健康診断クリア', both: '両方達成' }

function tokyoToday(): string {
  return new Date().toLocaleDateString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).replace(/\//g, '-')
}

function calcStreak(meals: LineMealRecord[]): number {
  if (meals.length === 0) return 0
  const uniqueDates = [...new Set(meals.map(m => m.meal_date))].sort().reverse()
  const today = tokyoToday()
  let streak = 0
  for (let i = 0; i < uniqueDates.length; i++) {
    const diff = Math.round(
      (new Date(today).getTime() - new Date(uniqueDates[i]).getTime()) / 86400000
    )
    if (diff === i) streak++
    else break
  }
  return streak
}

export default function ClientDetailPage() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const [client, setClient] = useState<LineProfile | null>(null)
  const [meals, setMeals] = useState<LineMealRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState('')
  const [sending, setSending] = useState(false)
  const [sentOk, setSentOk] = useState(false)
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return
    Promise.all([fetchClient(), fetchMeals()]).finally(() => setLoading(false))
  }, [userId])

  async function fetchClient() {
    const { data } = await supabase
      .from('line_profiles')
      .select('*')
      .eq('line_user_id', userId)
      .single()
    setClient(data)
  }

  async function fetchMeals() {
    const { data } = await supabase
      .from('line_meal_records')
      .select('*')
      .eq('line_user_id', userId)
      .order('meal_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(30)
    setMeals(data ?? [])
  }

  async function sendFeedback() {
    if (!feedback.trim() || !client) return
    setSending(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/.netlify/functions/send-line-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token ?? ''}`,
        },
        body: JSON.stringify({ customerLineUserId: client.line_user_id, message: feedback }),
      })
      if (res.ok) {
        setFeedback('')
        setSentOk(true)
        setTimeout(() => setSentOk(false), 3000)
      }
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-rose-300 border-t-rose-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (!client) return <p className="text-center text-gray-400 mt-20">お客様が見つかりません</p>

  const today = tokyoToday()
  const todayMeals = meals.filter(m => m.meal_date === today)
  const todayCalories = todayMeals.reduce((s, m) => s + Number(m.total_calories), 0)
  const todayProtein = todayMeals.reduce((s, m) => s + Number(m.total_protein), 0)
  const streak = calcStreak(meals)

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-rose-50 rounded-xl transition-colors">
          <ArrowLeft size={20} className="text-rose-400" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-gray-800">{client.nickname}</h2>
          <p className="text-xs text-gray-400">{GOAL_LABELS[client.goal_type] ?? client.goal_type}</p>
        </div>
      </div>

      {/* ドリームビジョン */}
      {client.dream_vision && (
        <div className="bg-rose-50 rounded-2xl px-4 py-3">
          <p className="text-xs text-rose-400 mb-0.5">目標ビジョン</p>
          <p className="text-sm text-gray-600 italic">「{client.dream_vision}」</p>
        </div>
      )}

      {/* 今日のサマリー */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-rose-50">
          <p className="text-xs text-gray-400 mb-1">今日のカロリー</p>
          <p className="text-2xl font-bold text-rose-500">{Math.round(todayCalories)}</p>
          <p className="text-xs text-gray-400">kcal / 目標 {client.daily_calorie_goal}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-rose-50">
          <p className="text-xs text-gray-400 mb-1">今日のタンパク質</p>
          <p className="text-2xl font-bold text-rose-400">{todayProtein.toFixed(0)}</p>
          <p className="text-xs text-gray-400">g</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-rose-50">
          <div className="flex items-center gap-1 mb-1">
            <Scale size={12} className="text-gray-400" />
            <p className="text-xs text-gray-400">体重</p>
          </div>
          <p className="text-2xl font-bold text-gray-700">{client.current_weight ?? '--'}</p>
          <p className="text-xs text-gray-400">kg{client.target_weight ? ` / 目標 ${client.target_weight}kg` : ''}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-rose-50">
          <div className="flex items-center gap-1 mb-1">
            <Flame size={12} className="text-gray-400" />
            <p className="text-xs text-gray-400">連続記録</p>
          </div>
          <p className="text-2xl font-bold text-orange-500">{streak}</p>
          <p className="text-xs text-gray-400">日</p>
        </div>
      </div>

      {/* フィードバック送信 */}
      <div className="bg-white rounded-2xl shadow-sm border border-rose-50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare size={16} className="text-rose-400" />
          <h3 className="font-semibold text-gray-700 text-sm">LINEでフィードバックを送る</h3>
        </div>
        <textarea
          value={feedback}
          onChange={e => setFeedback(e.target.value)}
          placeholder={`${client.nickname}さんへのメッセージ…`}
          rows={3}
          className="w-full px-3 py-2 text-sm border border-rose-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none"
        />
        <div className="flex items-center justify-between mt-2">
          {sentOk && (
            <span className="flex items-center gap-1 text-xs text-green-500">
              <CircleCheck size={13} /> 送信しました！
            </span>
          )}
          {!sentOk && <span />}
          <button
            onClick={sendFeedback}
            disabled={sending || !feedback.trim()}
            className="flex items-center gap-1.5 bg-rose-400 hover:bg-rose-500 disabled:bg-gray-200 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
          >
            <Send size={14} />
            {sending ? '送信中...' : 'LINEに送る'}
          </button>
        </div>
      </div>

      {/* 食事履歴 */}
      <div className="bg-white rounded-2xl shadow-sm border border-rose-50 overflow-hidden">
        <div className="px-5 py-4 border-b border-rose-50">
          <h3 className="font-semibold text-gray-700">食事記録</h3>
        </div>
        {meals.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-400 text-sm">食事記録がありません</p>
          </div>
        ) : (
          <div className="divide-y divide-rose-50">
            {meals.map(meal => {
              const isExpanded = expandedMeal === meal.id
              const analysis = meal.photo_analysis
              return (
                <div key={meal.id}>
                  <button
                    onClick={() => setExpandedMeal(isExpanded ? null : meal.id)}
                    className="w-full flex items-center gap-4 px-5 py-4 hover:bg-rose-50 transition-colors text-left"
                  >
                    <span className="text-xl">{MEAL_EMOJI[meal.meal_type]}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-700 text-sm">{MEAL_LABELS[meal.meal_type]}</p>
                        <span className="text-xs text-gray-400">
                          {new Date(meal.meal_date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                        </span>
                        {meal.meal_date === today && (
                          <span className="bg-rose-100 text-rose-500 text-xs px-1.5 py-0.5 rounded-full">今日</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {Math.round(Number(meal.total_calories))} kcal · P:{Number(meal.total_protein).toFixed(0)}g F:{Number(meal.total_fat).toFixed(0)}g C:{Number(meal.total_carbs).toFixed(0)}g
                      </p>
                    </div>
                    <span className="text-gray-300 text-xs">{isExpanded ? '▲' : '▼'}</span>
                  </button>

                  {/* 展開: AI分析詳細 */}
                  {isExpanded && analysis && (
                    <div className="px-5 pb-4 space-y-2 bg-rose-50/30">
                      {analysis.meal_balance && (
                        <div className="bg-gray-50 rounded-xl p-3">
                          <p className="text-xs text-gray-400 mb-1">食事バランス</p>
                          <p className="text-sm text-gray-600">{analysis.meal_balance}</p>
                        </div>
                      )}
                      {analysis.good_points && analysis.good_points.length > 0 && (
                        <div>
                          <p className="text-xs text-green-500 font-medium mb-1">✅ 良かった点</p>
                          {analysis.good_points.map((p, i) => (
                            <p key={i} className="text-sm text-gray-600 ml-2">・{p}</p>
                          ))}
                        </div>
                      )}
                      {analysis.improvements && analysis.improvements.length > 0 && (
                        <div>
                          <p className="text-xs text-orange-500 font-medium mb-1">📌 改善点</p>
                          {analysis.improvements.map((p, i) => (
                            <p key={i} className="text-sm text-gray-600 ml-2">・{p}</p>
                          ))}
                        </div>
                      )}
                      {analysis.action_goal && (
                        <div className="bg-yellow-50 rounded-xl p-3">
                          <p className="text-xs text-yellow-600 font-medium mb-1">🎯 行動目標</p>
                          <p className="text-sm text-gray-700">{analysis.action_goal}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
