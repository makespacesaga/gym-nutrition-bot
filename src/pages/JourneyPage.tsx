import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import {
  MILESTONES, BADGES,
  calcWeightProgress, calcStreak, getCurrentMilestone, getNextMilestone,
} from '../lib/journey'
import type { GoalType } from '../types'

const GOAL_LABELS: Record<GoalType, string> = {
  diet: 'ダイエット成功',
  health: '健康診断クリア',
  both: 'ダイエット＆健康診断',
}

export default function JourneyPage() {
  const { profile, user } = useAuth()
  const [streak, setStreak] = useState(0)
  const [currentWeight, setCurrentWeight] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    Promise.all([fetchStreak(), fetchLatestWeight()]).finally(() => setLoading(false))
  }, [user])

  async function fetchStreak() {
    const { data } = await supabase
      .from('meal_records')
      .select('meal_date')
      .eq('user_id', user!.id)
    const dates = (data ?? []).map(r => r.meal_date as string)
    setStreak(calcStreak(dates))
  }

  async function fetchLatestWeight() {
    const { data } = await supabase
      .from('body_measurements')
      .select('weight_kg')
      .eq('user_id', user!.id)
      .not('weight_kg', 'is', null)
      .order('measured_date', { ascending: false })
      .limit(1)
      .single()
    if (data) setCurrentWeight(data.weight_kg)
  }

  const goalType: GoalType = profile?.goal_type ?? 'both'
  const pct = calcWeightProgress(profile?.start_weight ?? null, currentWeight, profile?.target_weight ?? null)
  const milestones = MILESTONES[goalType]
  const currentMilestone = getCurrentMilestone(pct, goalType)
  const nextMilestone = getNextMilestone(pct, goalType)

  // バッジ獲得判定
  const earnedBadgeIds: string[] = []
  if (streak >= 1) earnedBadgeIds.push('first_meal')
  if (streak >= 3) earnedBadgeIds.push('streak_3')
  if (streak >= 7) earnedBadgeIds.push('streak_7')
  if (streak >= 30) earnedBadgeIds.push('streak_30')
  if (pct >= 25) earnedBadgeIds.push('milestone_25')
  if (pct >= 50) earnedBadgeIds.push('milestone_50')
  if (pct >= 100) earnedBadgeIds.push('milestone_100')

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-rose-300 border-t-rose-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* ヘッダー */}
      <div>
        <h2 className="text-xl font-bold text-gray-800">私のジャーニー</h2>
        <p className="text-sm text-rose-400 font-medium mt-0.5">{GOAL_LABELS[goalType]}</p>
      </div>

      {/* 夢のビジョン */}
      {profile?.dream_vision && (
        <div className="bg-gradient-to-br from-rose-400 to-pink-500 rounded-2xl p-5 text-white shadow-lg">
          <p className="text-xs font-medium opacity-80 mb-2">💭 私の夢</p>
          <p className="text-base font-bold leading-relaxed">「{profile.dream_vision}」</p>
          <p className="text-xs opacity-70 mt-3">この言葉のために、今日も一歩前へ</p>
        </div>
      )}

      {/* 全体進捗 */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-rose-50">
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-xs text-gray-400">全体の達成率</p>
            <p className="text-4xl font-bold text-rose-500">{pct}<span className="text-lg">%</span></p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-700">{currentMilestone.emoji} {currentMilestone.label}</p>
            {nextMilestone && (
              <p className="text-xs text-gray-400">次：{nextMilestone.label}（{nextMilestone.pct}%）</p>
            )}
          </div>
        </div>
        <div className="h-3 bg-rose-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-rose-400 to-pink-400 rounded-full transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
        {profile?.start_weight && profile?.target_weight && (
          <div className="flex justify-between text-xs text-gray-400 mt-1.5">
            <span>スタート {profile.start_weight}kg</span>
            <span>目標 {profile.target_weight}kg</span>
          </div>
        )}
      </div>

      {/* 今の位置のストーリー */}
      <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4">
        <p className="text-xs font-medium text-rose-500 mb-2">✨ 今のあなたの状態</p>
        <p className="text-sm text-gray-700 leading-relaxed">{currentMilestone.story}</p>
      </div>

      {/* マイルストーン地図 */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-rose-50">
        <h3 className="font-semibold text-gray-700 mb-5">理想の自分への地図</h3>
        <div className="space-y-0">
          {milestones.map((m, idx) => {
            const isReached = pct >= m.pct
            const isCurrent = currentMilestone.pct === m.pct
            const isLast = idx === milestones.length - 1

            return (
              <div key={m.pct} className="flex gap-4">
                {/* 左側：アイコン＋線 */}
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0 shadow-sm transition-all ${
                    isReached
                      ? isCurrent
                        ? 'bg-rose-400 ring-4 ring-rose-200 scale-110'
                        : 'bg-rose-200'
                      : 'bg-gray-100'
                  }`}>
                    {m.emoji}
                  </div>
                  {!isLast && (
                    <div className={`w-0.5 flex-1 my-1 ${isReached ? 'bg-rose-300' : 'bg-gray-100'}`}
                      style={{ minHeight: '32px' }}
                    />
                  )}
                </div>

                {/* 右側：テキスト */}
                <div className={`pb-6 flex-1 ${isLast ? 'pb-0' : ''}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <p className={`font-semibold text-sm ${isReached ? 'text-gray-800' : 'text-gray-400'}`}>
                      {m.label}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      isReached ? 'bg-rose-100 text-rose-500' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {m.pct}%
                    </span>
                    {isCurrent && (
                      <span className="text-xs bg-rose-400 text-white px-2 py-0.5 rounded-full font-medium">
                        今ここ
                      </span>
                    )}
                  </div>
                  {(isReached || isCurrent) && (
                    <p className="text-xs text-gray-500 leading-relaxed">{m.story}</p>
                  )}
                  {!isReached && !isCurrent && (
                    <p className="text-xs text-gray-300">まだ先の未来...</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 連続記録 */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-rose-50">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-4xl font-bold text-orange-400">{streak}</p>
            <p className="text-xs text-gray-400 mt-1">連続記録日数</p>
          </div>
          <div className="flex-1">
            <div className="flex gap-1 flex-wrap">
              {streak === 0 && <p className="text-sm text-gray-400">まず今日の食事を記録してみましょう！</p>}
              {streak >= 1 && streak < 3 && <p className="text-sm text-gray-600">🔥 いい調子！3日連続を目指しましょう</p>}
              {streak >= 3 && streak < 7 && <p className="text-sm text-gray-600">⚡ 3日達成！次は7日連続バッジを狙おう</p>}
              {streak >= 7 && streak < 30 && <p className="text-sm text-gray-600">🌟 素晴らしい！30日でダイヤモンドバッジ獲得です</p>}
              {streak >= 30 && <p className="text-sm text-gray-600">💎 30日連続！もう習慣になりましたね</p>}
            </div>
            <div className="flex gap-1 mt-2">
              {[3, 7, 30].map(target => (
                <div key={target} className={`flex-1 h-1.5 rounded-full ${streak >= target ? 'bg-orange-400' : 'bg-gray-100'}`} />
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>3日</span><span>7日</span><span>30日</span>
            </div>
          </div>
        </div>
      </div>

      {/* バッジ一覧 */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-rose-50">
        <h3 className="font-semibold text-gray-700 mb-4">獲得バッジ</h3>
        <div className="grid grid-cols-4 gap-3">
          {BADGES.map(badge => {
            const earned = earnedBadgeIds.includes(badge.id)
            return (
              <div key={badge.id} className="flex flex-col items-center gap-1">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                  earned ? 'bg-rose-50 shadow-sm' : 'bg-gray-100 grayscale opacity-40'
                }`}>
                  {badge.emoji}
                </div>
                <p className={`text-xs text-center leading-tight ${earned ? 'text-gray-600' : 'text-gray-300'}`}>
                  {badge.label}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
