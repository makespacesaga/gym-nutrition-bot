import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend,
} from 'recharts'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import type { BodyMeasurement, MealRecord } from '../types'

export default function ProgressPage() {
  const { user, profile } = useAuth()
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([])
  const [weeklyCalories, setWeeklyCalories] = useState<{ date: string; calories: number }[]>([])
  const [showForm, setShowForm] = useState(false)
  const [weight, setWeight] = useState('')
  const [bodyFat, setBodyFat] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    fetchMeasurements()
    fetchWeeklyCalories()
  }, [user])

  async function fetchMeasurements() {
    const { data } = await supabase
      .from('body_measurements')
      .select('*')
      .eq('user_id', user!.id)
      .order('measured_date', { ascending: false })
      .limit(30)
    setMeasurements(data ?? [])
  }

  async function fetchWeeklyCalories() {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
    const fromDate = sevenDaysAgo.toISOString().split('T')[0]

    const { data } = await supabase
      .from('meal_records')
      .select('meal_date, total_calories')
      .eq('user_id', user!.id)
      .gte('meal_date', fromDate)

    const byDate: Record<string, number> = {}
    ;(data ?? []).forEach((r: Pick<MealRecord, 'meal_date' | 'total_calories'>) => {
      byDate[r.meal_date] = (byDate[r.meal_date] ?? 0) + r.total_calories
    })

    const result = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toISOString().split('T')[0]
      const label = d.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })
      result.push({ date: label, calories: Math.round(byDate[key] ?? 0) })
    }
    setWeeklyCalories(result)
  }

  async function handleSaveMeasurement(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    const today = new Date().toISOString().split('T')[0]
    await supabase.from('body_measurements').upsert({
      user_id: user.id,
      measured_date: today,
      weight_kg: weight ? parseFloat(weight) : null,
      body_fat_pct: bodyFat ? parseFloat(bodyFat) : null,
    }, { onConflict: 'user_id,measured_date' })
    setWeight('')
    setBodyFat('')
    setShowForm(false)
    setSaving(false)
    await fetchMeasurements()
  }

  const latest = measurements[0]
  const prev = measurements[1]

  const weightDiff = latest?.weight_kg && prev?.weight_kg
    ? (latest.weight_kg - prev.weight_kg).toFixed(1)
    : null

  const chartData = [...measurements].reverse().map(m => ({
    date: new Date(m.measured_date).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' }),
    weight: m.weight_kg,
    bodyFat: m.body_fat_pct,
  }))

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">進捗管理</h2>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1 px-3 py-2 bg-rose-400 text-white text-sm rounded-xl font-medium hover:bg-rose-500 transition-colors"
        >
          <Plus size={14} />
          記録する
        </button>
      </div>

      {/* 今日の記録フォーム */}
      {showForm && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-rose-50">
          <h3 className="font-semibold text-gray-700 mb-4">今日の体重・体脂肪を記録</h3>
          <form onSubmit={handleSaveMeasurement} className="space-y-3">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">体重 (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={weight}
                  onChange={e => setWeight(e.target.value)}
                  placeholder="例: 55.5"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">体脂肪率 (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={bodyFat}
                  onChange={e => setBodyFat(e.target.value)}
                  placeholder="例: 22.0"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={saving || (!weight && !bodyFat)}
              className="w-full py-2.5 bg-rose-400 hover:bg-rose-500 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50"
            >
              {saving ? '保存中...' : '記録を保存'}
            </button>
          </form>
        </div>
      )}

      {/* 目標と現在値 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-rose-50">
          <p className="text-xs text-gray-400 mb-1">現在の体重</p>
          <div className="flex items-end gap-1">
            <p className="text-3xl font-bold text-gray-800">{latest?.weight_kg ?? '--'}</p>
            <p className="text-sm text-gray-400 mb-1">kg</p>
          </div>
          {weightDiff !== null && (
            <p className={`text-xs mt-1 font-medium ${parseFloat(weightDiff) < 0 ? 'text-green-500' : 'text-red-400'}`}>
              {parseFloat(weightDiff) < 0 ? '▼' : '▲'} {Math.abs(parseFloat(weightDiff))}kg
            </p>
          )}
          {profile?.target_weight && (
            <p className="text-xs text-gray-400 mt-1">目標: {profile.target_weight}kg</p>
          )}
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-rose-50">
          <p className="text-xs text-gray-400 mb-1">体脂肪率</p>
          <div className="flex items-end gap-1">
            <p className="text-3xl font-bold text-gray-800">{latest?.body_fat_pct ?? '--'}</p>
            <p className="text-sm text-gray-400 mb-1">%</p>
          </div>
          {profile?.target_body_fat && (
            <p className="text-xs text-gray-400 mt-1">目標: {profile.target_body_fat}%</p>
          )}
        </div>
      </div>

      {/* 体重グラフ */}
      {chartData.length > 1 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-rose-50">
          <h3 className="font-semibold text-gray-700 mb-4">体重の推移</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#fce7f3" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} domain={['auto', 'auto']} unit="kg" width={45} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: '1px solid #fce7f3', fontSize: 12 }}
                formatter={(v) => [`${v}kg`, '体重']}
              />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="#f472b6"
                strokeWidth={2.5}
                dot={{ fill: '#f472b6', r: 4 }}
                activeDot={{ r: 6 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 週間カロリーグラフ */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-rose-50">
        <h3 className="font-semibold text-gray-700 mb-4">今週のカロリー摂取</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={weeklyCalories}>
            <CartesianGrid strokeDasharray="3 3" stroke="#fce7f3" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} unit="kcal" width={55} />
            <Tooltip
              contentStyle={{ borderRadius: '12px', border: '1px solid #fce7f3', fontSize: 12 }}
              formatter={(v) => [`${v} kcal`, 'カロリー']}
            />
            <Bar dataKey="calories" fill="#f9a8d4" radius={[6, 6, 0, 0]} />
            {profile?.daily_calorie_goal && (
              <Legend
                content={() => (
                  <p className="text-xs text-gray-400 text-center mt-1">
                    目標: {profile.daily_calorie_goal} kcal / 日
                  </p>
                )}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 記録履歴 */}
      {measurements.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-rose-50 overflow-hidden">
          <div className="px-5 py-4 border-b border-rose-50">
            <h3 className="font-semibold text-gray-700">記録履歴</h3>
          </div>
          <div className="divide-y divide-rose-50">
            {measurements.slice(0, 10).map(m => (
              <div key={m.id} className="flex items-center px-5 py-3">
                <p className="text-sm text-gray-500 flex-shrink-0 w-24">
                  {new Date(m.measured_date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                </p>
                <div className="flex gap-4">
                  {m.weight_kg && (
                    <p className="text-sm font-medium text-gray-700">{m.weight_kg} kg</p>
                  )}
                  {m.body_fat_pct && (
                    <p className="text-sm text-gray-500">{m.body_fat_pct}%</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
