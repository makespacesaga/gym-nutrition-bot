import { type ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard,
  UtensilsCrossed,
  TrendingUp,
  Users,
  LogOut,
  User,
  Map,
} from 'lucide-react'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/auth')
  }

  const navItems = profile?.role === 'trainer'
    ? [
        { to: '/', icon: <LayoutDashboard size={20} />, label: 'ホーム' },
        { to: '/clients', icon: <Users size={20} />, label: 'お客様管理' },
      ]
    : [
        { to: '/', icon: <LayoutDashboard size={20} />, label: 'ホーム' },
        { to: '/meals', icon: <UtensilsCrossed size={20} />, label: '食事記録' },
        { to: '/journey', icon: <Map size={20} />, label: 'ジャーニー' },
        { to: '/progress', icon: <TrendingUp size={20} />, label: '進捗' },
        { to: '/profile', icon: <User size={20} />, label: 'プロフィール' },
      ]

  return (
    <div className="min-h-screen bg-rose-50 flex flex-col">
      {/* ヘッダー */}
      <header className="bg-white border-b border-rose-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌸</span>
            <span className="font-bold text-rose-600 text-lg">栄養管理</span>
            {profile?.role === 'trainer' && (
              <span className="text-xs bg-rose-100 text-rose-500 px-2 py-0.5 rounded-full font-medium">
                トレーナー
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 hidden sm:block">{profile?.full_name}</span>
            <button
              onClick={handleSignOut}
              className="p-2 text-gray-400 hover:text-rose-500 transition-colors rounded-lg"
              title="ログアウト"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 pb-24">
        {children}
      </main>

      {/* ボトムナビゲーション */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-rose-100 z-30">
        <div className="max-w-2xl mx-auto flex">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center py-2 gap-1 text-xs font-medium transition-colors ${
                  isActive ? 'text-rose-500' : 'text-gray-400 hover:text-rose-400'
                }`
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
