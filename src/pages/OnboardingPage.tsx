import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, ChevronLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import type { GoalType } from '../types'

const STEPS = 4

const GOAL_OPTIONS: { value: GoalType; emoji: string; title: string; desc: string }[] = [
  {
    value: 'diet',
    emoji: '👗',
    title: 'ダイエット成功',
    desc: '理想の体型・体重になって好きな服を着こなしたい',
  },
  {
    value: 'health',
    emoji: '🏥',
    title: '健康診断で引っかからない',
    desc: '血圧・血糖値・コレステロールなど数値を改善したい',
  },
  {
    value: 'both',
    emoji: '✨',
    title: '両方達成したい',
    desc: '見た目も体の内側も、理想の状態にしたい',
  },
]

const DIET_VISIONS = [
  '去年着れなかったワンピースを着て旅行したい',
  '子どもと元気に走り回れる体になりたい',
  '鏡を見るのが楽しみになりたい',
  '友人に「綺麗になったね」と言われたい',
  '海で自信を持って水着を着たい',
]

const HEALTH_VISIONS = [
  '健康診断で「異常なし」を全部並べたい',
  '再検査の通知が来ない体になりたい',
  'お医者さんに「健康ですね」と言われたい',
  '薬に頼らない体を作りたい',
  '10年後も元気でいたい',
]

export default function OnboardingPage() {
  const { profile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [goalType, setGoalType] = useState<GoalType>('both')
  const [dreamVision, setDreamVision] = useState('')
  const [targetWeight, setTargetWeight] = useState('')
  const [startWeight, setStartWeight] = useState('')
  const [saving, setSaving] = useState(false)

  const visionSuggestions = goalType === 'health' ? HEALTH_VISIONS : DIET_VISIONS

  async function handleFinish() {
    if (!profile) return
    setSaving(true)
    await supabase.from('profiles').update({
      goal_type: goalType,
      dream_vision: dreamVision || null,
      target_weight: targetWeight ? parseFloat(targetWeight) : null,
      start_weight: startWeight ? parseFloat(startWeight) : null,
      onboarding_done: true,
    }).eq('id', profile.id)
    await refreshProfile()
    navigate('/')
  }

  const canNext = () => {
    if (step === 1) return true
    if (step === 2) return goalType !== null
    if (step === 3) return dreamVision.trim().length > 0
    return true
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-rose-100 flex flex-col">
      {/* ステップインジケーター */}
      <div className="flex justify-center pt-12 pb-6 px-8">
        <div className="flex gap-2">
          {Array.from({ length: STEPS }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i < step ? 'bg-rose-400 w-8' : i === step - 1 ? 'bg-rose-400 w-8' : 'bg-rose-200 w-4'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col px-6 max-w-md mx-auto w-full">

        {/* Step 1: ウェルカム */}
        {step === 1 && (
          <div className="flex-1 flex flex-col justify-center text-center">
            <div className="text-6xl mb-6">🌸</div>
            <h1 className="text-2xl font-bold text-rose-700 mb-3">
              {profile?.full_name?.split(/[\s　]/)[0]}さん、<br />ようこそ！
            </h1>
            <p className="text-gray-500 leading-relaxed mb-8">
              このアプリはただの記録アプリではありません。<br />
              <span className="text-rose-500 font-medium">理想の自分になるための旅</span>をサポートします。<br /><br />
              まず、あなたのゴールを教えてください。
            </p>
            <div className="bg-white rounded-2xl p-5 shadow-sm text-left">
              <p className="text-sm text-gray-500 mb-1">🎯 達成すると...</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✅ 食事が楽しみながら変わる</li>
                <li>✅ 見た目・体重・健康数値が改善</li>
                <li>✅ トレーナーからのサポートが届く</li>
                <li>✅ 達成のたびに「未来の自分」が見える</li>
              </ul>
            </div>
          </div>
        )}

        {/* Step 2: ゴール選択 */}
        {step === 2 && (
          <div className="flex-1 flex flex-col">
            <h2 className="text-xl font-bold text-gray-800 mb-2">あなたのゴールは？</h2>
            <p className="text-gray-500 text-sm mb-6">
              達成したいことを選んでください。あとから変更もできます。
            </p>
            <div className="space-y-3">
              {GOAL_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setGoalType(opt.value)}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                    goalType === opt.value
                      ? 'border-rose-400 bg-white shadow-md'
                      : 'border-rose-100 bg-white/60 hover:border-rose-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{opt.emoji}</span>
                    <div>
                      <p className={`font-bold ${goalType === opt.value ? 'text-rose-600' : 'text-gray-700'}`}>
                        {opt.title}
                      </p>
                      <p className="text-sm text-gray-500 mt-0.5">{opt.desc}</p>
                    </div>
                    {goalType === opt.value && (
                      <div className="ml-auto w-5 h-5 rounded-full bg-rose-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: 夢のビジョン */}
        {step === 3 && (
          <div className="flex-1 flex flex-col">
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              達成したら、どんな自分になっていたい？
            </h2>
            <p className="text-gray-500 text-sm mb-5">
              数字じゃなく、<span className="text-rose-500 font-medium">場面・感情</span>で書いてみてください。
              つらい日も、この言葉があなたを動かしてくれます。
            </p>

            <textarea
              value={dreamVision}
              onChange={e => setDreamVision(e.target.value)}
              placeholder="例：去年着れなかったワンピースを着て旅行したい"
              rows={3}
              className="w-full px-4 py-3 border-2 border-rose-200 rounded-2xl text-sm focus:outline-none focus:border-rose-400 resize-none bg-white mb-4"
            />

            <p className="text-xs text-gray-400 mb-3">💡 よくある例（タップで選択）</p>
            <div className="flex flex-wrap gap-2">
              {visionSuggestions.map(v => (
                <button
                  key={v}
                  onClick={() => setDreamVision(v)}
                  className={`text-xs px-3 py-2 rounded-full border transition-all ${
                    dreamVision === v
                      ? 'border-rose-400 bg-rose-50 text-rose-600'
                      : 'border-rose-200 text-gray-500 hover:border-rose-300'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: 体重目標（任意） */}
        {step === 4 && (
          <div className="flex-1 flex flex-col">
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              体重の目標を設定しよう
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              任意です。スキップしてもOK。<br />
              入力すると進捗グラフに使われます。
            </p>

            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  今の体重 (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={startWeight}
                  onChange={e => setStartWeight(e.target.value)}
                  placeholder="例：58.0"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-rose-300"
                />
              </div>

              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  目標体重 (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={targetWeight}
                  onChange={e => setTargetWeight(e.target.value)}
                  placeholder="例：52.0"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-rose-300"
                />
              </div>
            </div>

            {startWeight && targetWeight && parseFloat(startWeight) > parseFloat(targetWeight) && (
              <div className="mt-4 bg-rose-50 border border-rose-100 rounded-2xl p-4 text-center">
                <p className="text-rose-600 font-medium">
                  目標：{(parseFloat(startWeight) - parseFloat(targetWeight)).toFixed(1)}kg の減量
                </p>
                <p className="text-rose-400 text-sm mt-1">
                  週0.5kgペースで約{Math.ceil((parseFloat(startWeight) - parseFloat(targetWeight)) / 0.5)}週間で達成できます
                </p>
              </div>
            )}
          </div>
        )}

        {/* ナビゲーションボタン */}
        <div className="py-8 flex gap-3">
          {step > 1 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="flex items-center gap-1 px-4 py-3 border border-rose-200 text-rose-400 rounded-2xl font-medium"
            >
              <ChevronLeft size={18} />
              戻る
            </button>
          )}
          {step < STEPS ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canNext()}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-rose-400 hover:bg-rose-500 text-white font-bold rounded-2xl shadow-md transition-all disabled:opacity-40"
            >
              次へ
              <ChevronRight size={18} />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={saving}
              className="flex-1 py-3.5 bg-gradient-to-r from-rose-400 to-pink-500 text-white font-bold rounded-2xl shadow-lg transition-all disabled:opacity-50 text-lg"
            >
              {saving ? '設定中...' : '旅を始める 🌸'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
