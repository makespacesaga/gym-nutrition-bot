import { useState } from 'react'
import { supabase } from '../lib/supabase'

type Mode = 'login' | 'signup'

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<'customer' | 'trainer'>('customer')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        if (data.user) {
          const { error: profileError } = await supabase.from('profiles').insert({
            user_id: data.user.id,
            role,
            full_name: fullName,
          })
          if (profileError) throw profileError
          setMessage('登録完了しました。メールを確認してアカウントを有効化してください。')
        }
      }
    } catch (err: unknown) {
      const e = err as { message?: string }
      if (e.message?.includes('Invalid login credentials')) {
        setError('メールアドレスまたはパスワードが正しくありません')
      } else if (e.message?.includes('User already registered')) {
        setError('このメールアドレスはすでに登録されています')
      } else {
        setError(e.message ?? 'エラーが発生しました')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-pink-100 px-4">
      <div className="w-full max-w-md">
        {/* ロゴ・タイトル */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-400 mb-4 shadow-lg">
            <span className="text-3xl">🌸</span>
          </div>
          <h1 className="text-2xl font-bold text-rose-700">栄養管理アプリ</h1>
          <p className="text-rose-400 text-sm mt-1">あなたの健康をサポート</p>
        </div>

        {/* カード */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* タブ切り替え */}
          <div className="flex rounded-xl bg-rose-50 p-1 mb-6">
            <button
              onClick={() => { setMode('login'); setError(null); setMessage(null) }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === 'login' ? 'bg-rose-400 text-white shadow' : 'text-rose-500 hover:text-rose-600'
              }`}
            >
              ログイン
            </button>
            <button
              onClick={() => { setMode('signup'); setError(null); setMessage(null) }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === 'signup' ? 'bg-rose-400 text-white shadow' : 'text-rose-500 hover:text-rose-600'
              }`}
            >
              新規登録
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">お名前</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    required
                    placeholder="山田 花子"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">アカウント種別</label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setRole('customer')}
                      className={`flex-1 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                        role === 'customer'
                          ? 'border-rose-400 bg-rose-50 text-rose-600'
                          : 'border-gray-200 text-gray-500 hover:border-rose-200'
                      }`}
                    >
                      お客様
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('trainer')}
                      className={`flex-1 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                        role === 'trainer'
                          ? 'border-rose-400 bg-rose-50 text-rose-600'
                          : 'border-gray-200 text-gray-500 hover:border-rose-200'
                      }`}
                    >
                      トレーナー
                    </button>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="example@email.com"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">パスワード</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="6文字以上"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300 text-sm"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}
            {message && (
              <div className="bg-green-50 border border-green-200 text-green-600 text-sm rounded-xl px-4 py-3">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-rose-400 hover:bg-rose-500 text-white font-semibold rounded-xl shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '処理中...' : mode === 'login' ? 'ログイン' : '登録する'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
