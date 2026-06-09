import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Users, Search } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types'

export default function ClientsPage() {
  const { profile } = useAuth()
  const [clients, setClients] = useState<Profile[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    fetchClients()
  }, [profile])

  async function fetchClients() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('trainer_id', profile!.id)
      .eq('role', 'customer')
      .order('full_name')
    setClients(data ?? [])
    setLoading(false)
  }

  const filtered = query.trim()
    ? clients.filter(c => c.full_name.toLowerCase().includes(query.toLowerCase()))
    : clients

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-bold text-gray-800">お客様管理</h2>
        <span className="text-sm text-gray-400">{clients.length}名</span>
      </div>

      {/* 検索 */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="お客様名で検索"
          className="w-full pl-9 pr-4 py-3 bg-white border border-rose-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 shadow-sm"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-4 border-rose-300 border-t-rose-500 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Users size={48} className="text-rose-200 mx-auto mb-4" />
          <p className="text-gray-400 text-sm">
            {query ? '該当するお客様が見つかりません' : 'お客様がまだ登録されていません'}
          </p>
          {!query && (
            <p className="text-gray-400 text-xs mt-2">
              お客様がサインアップ後、プロフィールからトレーナーIDを設定してもらってください
            </p>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-rose-50 overflow-hidden">
          <div className="divide-y divide-rose-50">
            {filtered.map(client => (
              <Link
                key={client.id}
                to={`/clients/${client.user_id}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-rose-50 transition-colors group"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-rose-300 to-pink-400 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {client.full_name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-700">{client.full_name}</p>
                  <p className="text-xs text-gray-400">
                    目標: {client.target_weight ? `${client.target_weight}kg` : '--'} ·
                    {client.daily_calorie_goal ? ` ${client.daily_calorie_goal}kcal/日` : ''}
                  </p>
                </div>
                <ChevronRight size={16} className="text-gray-300 group-hover:text-rose-400 flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
