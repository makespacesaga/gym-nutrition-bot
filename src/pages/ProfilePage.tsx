import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export default function ProfilePage() {
  const { profile, refreshProfile } = useAuth()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    full_name: profile?.full_name ?? '',
    daily_calorie_goal: profile?.daily_calorie_goal?.toString() ?? '1600',
    daily_protein_goal: profile?.daily_protein_goal?.toString() ?? '60',
    daily_fat_goal: profile?.daily_fat_goal?.toString() ?? '50',
    daily_carbs_goal: profile?.daily_carbs_goal?.toString() ?? '200',
    target_weight: profile?.target_weight?.toString() ?? '',
    target_body_fat: profile?.target_body_fat?.toString() ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await supabase.from('profiles').update({
      full_name: form.full_name,
      daily_calorie_goal: parseInt(form.daily_calorie_goal) || null,
      daily_protein_goal: parseInt(form.daily_protein_goal) || null,
      daily_fat_goal: parseInt(form.daily_fat_goal) || null,
      daily_carbs_goal: parseInt(form.daily_carbs_goal) || null,
      target_weight: form.target_weight ? parseFloat(form.target_weight) : null,
      target_body_fat: form.target_body_fat ? parseFloat(form.target_body_fat) : null,
    }).eq('id', profile!.id)
    await refreshProfile()
    setSaving(false)
    setEditing(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function updateForm(key: keyof typeof form, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-gray-800">プロフィール</h2>

      {/* アバター */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-rose-50 text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-rose-300 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-3 text-3xl font-bold text-white">
          {profile?.full_name?.[0] ?? '?'}
        </div>
        <p className="font-bold text-gray-800 text-lg">{profile?.full_name}</p>
        <span className={`inline-block text-xs px-3 py-1 rounded-full font-medium mt-1 ${
          profile?.role === 'trainer' ? 'bg-rose-100 text-rose-600' : 'bg-pink-100 text-pink-600'
        }`}>
          {profile?.role === 'trainer' ? 'トレーナー' : 'お客様'}
        </span>
      </div>

      {/* 設定フォーム */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-rose-50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-700">目標設定</h3>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="text-sm text-rose-500 font-medium hover:text-rose-600"
            >
              編集する
            </button>
          )}
        </div>

        {saved && (
          <div className="mb-3 bg-green-50 text-green-600 text-sm rounded-xl px-4 py-2 text-center">
            保存しました
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">お名前</label>
            <input
              type="text"
              value={form.full_name}
              onChange={e => updateForm('full_name', e.target.value)}
              disabled={!editing}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">1日の摂取目標</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'daily_calorie_goal', label: 'カロリー (kcal)', placeholder: '1600' },
                { key: 'daily_protein_goal', label: 'タンパク質 (g)', placeholder: '60' },
                { key: 'daily_fat_goal', label: '脂質 (g)', placeholder: '50' },
                { key: 'daily_carbs_goal', label: '炭水化物 (g)', placeholder: '200' },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{field.label}</label>
                  <input
                    type="number"
                    value={form[field.key as keyof typeof form]}
                    onChange={e => updateForm(field.key as keyof typeof form, e.target.value)}
                    disabled={!editing}
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">目標値</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">目標体重 (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.target_weight}
                  onChange={e => updateForm('target_weight', e.target.value)}
                  disabled={!editing}
                  placeholder="例: 50.0"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">目標体脂肪率 (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.target_body_fat}
                  onChange={e => updateForm('target_body_fat', e.target.value)}
                  disabled={!editing}
                  placeholder="例: 20.0"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
            </div>
          </div>

          {editing && (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setEditing(false); setForm({
                  full_name: profile?.full_name ?? '',
                  daily_calorie_goal: profile?.daily_calorie_goal?.toString() ?? '1600',
                  daily_protein_goal: profile?.daily_protein_goal?.toString() ?? '60',
                  daily_fat_goal: profile?.daily_fat_goal?.toString() ?? '50',
                  daily_carbs_goal: profile?.daily_carbs_goal?.toString() ?? '200',
                  target_weight: profile?.target_weight?.toString() ?? '',
                  target_body_fat: profile?.target_body_fat?.toString() ?? '',
                }) }}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-2.5 bg-rose-400 hover:bg-rose-500 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50"
              >
                {saving ? '保存中...' : '保存する'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
