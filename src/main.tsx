import { createRoot } from 'react-dom/client'
import './index.css'

const root = createRoot(document.getElementById('root')!)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const hasValidSupabaseConfig =
  /^https:\/\/.+\.supabase\.co$/.test(supabaseUrl ?? '') &&
  Boolean(supabaseAnonKey) &&
  !supabaseAnonKey.startsWith('your_')

if (!hasValidSupabaseConfig) {
  root.render(
    <main className="min-h-screen bg-rose-50 px-6 py-16 text-slate-800">
      <section className="mx-auto max-w-lg rounded-3xl bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold text-rose-500">Configuration required</p>
        <h1 className="mt-2 text-2xl font-bold">アプリの接続設定を確認しています</h1>
        <p className="mt-4 leading-7 text-slate-600">
          現在、Supabaseの公開接続情報が正しく設定されていないため、ログイン画面を表示できません。
          管理者がNetlifyの環境変数を更新すると自動的に復旧します。
        </p>
      </section>
    </main>,
  )
} else {
  const { StrictMode } = await import('react')
  const { default: App } = await import('./App.tsx')

  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
