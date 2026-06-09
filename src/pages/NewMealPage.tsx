import { useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Camera, Plus, Trash2, ArrowLeft, Search } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { searchFoods, calcNutrition } from '../lib/foodDatabase'
import type { FoodItem, MealType } from '../types'

const MEAL_OPTIONS: { value: MealType; label: string; emoji: string }[] = [
  { value: 'breakfast', label: '朝食', emoji: '🌅' },
  { value: 'lunch', label: '昼食', emoji: '☀️' },
  { value: 'dinner', label: '夕食', emoji: '🌙' },
  { value: 'snack', label: '間食', emoji: '🍪' },
]

interface CartItem {
  food: FoodItem
  amount: number
}

export default function NewMealPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const dateParam = searchParams.get('date') ?? new Date().toISOString().split('T')[0]

  const [mealType, setMealType] = useState<MealType>('breakfast')
  const [memo, setMemo] = useState('')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<FoodItem[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null)
  const [amount, setAmount] = useState('100')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleSearch(q: string) {
    setQuery(q)
    setResults(q.trim() ? searchFoods(q) : [])
  }

  function selectFood(food: FoodItem) {
    setSelectedFood(food)
    setAmount('100')
    setResults([])
    setQuery('')
  }

  function addToCart() {
    if (!selectedFood || !amount) return
    setCart(c => [...c, { food: selectedFood, amount: parseFloat(amount) }])
    setSelectedFood(null)
    setAmount('100')
  }

  function removeFromCart(idx: number) {
    setCart(c => c.filter((_, i) => i !== idx))
  }

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const totals = cart.reduce(
    (acc, item) => {
      const n = calcNutrition(item.food, item.amount)
      return {
        calories: acc.calories + n.calories,
        protein: acc.protein + n.protein,
        fat: acc.fat + n.fat,
        carbs: acc.carbs + n.carbs,
      }
    },
    { calories: 0, protein: 0, fat: 0, carbs: 0 }
  )

  async function handleSave() {
    if (cart.length === 0 && !photoFile) return
    setSaving(true)

    try {
      let photoUrl: string | null = null

      if (photoFile) {
        const ext = photoFile.name.split('.').pop()
        const path = `${user!.id}/${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('meal-photos')
          .upload(path, photoFile)
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('meal-photos').getPublicUrl(path)
          photoUrl = urlData.publicUrl
        }
      }

      const { data: mealData, error: mealError } = await supabase
        .from('meal_records')
        .insert({
          user_id: user!.id,
          meal_date: dateParam,
          meal_type: mealType,
          memo: memo || null,
          photo_url: photoUrl,
          total_calories: totals.calories,
          total_protein: totals.protein,
          total_fat: totals.fat,
          total_carbs: totals.carbs,
        })
        .select()
        .single()

      if (mealError) throw mealError

      if (cart.length > 0) {
        const items = cart.map(item => {
          const n = calcNutrition(item.food, item.amount)
          return {
            meal_record_id: mealData.id,
            food_name: item.food.name,
            amount_g: item.amount,
            ...n,
          }
        })
        await supabase.from('meal_items').insert(items)
      }

      navigate('/meals')
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-rose-50 rounded-xl transition-colors">
          <ArrowLeft size={20} className="text-rose-400" />
        </button>
        <h2 className="text-lg font-bold text-gray-800">食事を記録</h2>
      </div>

      {/* 食事タイプ選択 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-rose-50">
        <p className="text-sm font-medium text-gray-600 mb-3">食事の種類</p>
        <div className="grid grid-cols-4 gap-2">
          {MEAL_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setMealType(opt.value)}
              className={`flex flex-col items-center py-3 rounded-xl border-2 transition-all ${
                mealType === opt.value
                  ? 'border-rose-400 bg-rose-50'
                  : 'border-gray-100 hover:border-rose-200'
              }`}
            >
              <span className="text-xl mb-1">{opt.emoji}</span>
              <span className={`text-xs font-medium ${mealType === opt.value ? 'text-rose-600' : 'text-gray-500'}`}>
                {opt.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 写真 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-rose-50">
        <p className="text-sm font-medium text-gray-600 mb-3">写真（任意）</p>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
        {photoPreview ? (
          <div className="relative">
            <img src={photoPreview} alt="食事" className="w-full h-40 object-cover rounded-xl" />
            <button
              onClick={() => { setPhotoFile(null); setPhotoPreview(null) }}
              className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow"
            >
              <Trash2 size={14} className="text-red-400" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full h-32 border-2 border-dashed border-rose-200 rounded-xl flex flex-col items-center justify-center gap-2 text-rose-300 hover:border-rose-400 hover:text-rose-400 transition-colors"
          >
            <Camera size={24} />
            <span className="text-sm">写真を追加</span>
          </button>
        )}
      </div>

      {/* 食品検索・追加 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-rose-50">
        <p className="text-sm font-medium text-gray-600 mb-3">食品を追加</p>

        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
          <input
            type="text"
            value={query}
            onChange={e => handleSearch(e.target.value)}
            placeholder="食品名で検索（例：鶏むね肉）"
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
          />
        </div>

        {/* 検索結果 */}
        {results.length > 0 && (
          <div className="mt-2 border border-gray-100 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
            {results.map(food => (
              <button
                key={food.name}
                onClick={() => selectFood(food)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-rose-50 transition-colors border-b border-gray-50 last:border-0 text-left"
              >
                <span className="text-sm font-medium text-gray-700">{food.name}</span>
                <span className="text-xs text-gray-400">{food.per100g.calories} kcal/100g</span>
              </button>
            ))}
          </div>
        )}

        {/* 選択済み食品の量入力 */}
        {selectedFood && (
          <div className="mt-3 p-3 bg-rose-50 rounded-xl">
            <p className="text-sm font-medium text-rose-700">{selectedFood.name}</p>
            <div className="flex items-center gap-2 mt-2">
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                min="1"
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
              />
              <span className="text-sm text-gray-500">g</span>
              <button
                onClick={addToCart}
                className="flex items-center gap-1 px-3 py-2 bg-rose-400 text-white text-sm rounded-lg hover:bg-rose-500 transition-colors font-medium"
              >
                <Plus size={14} />
                追加
              </button>
            </div>
            {amount && (
              <p className="text-xs text-rose-500 mt-1">
                {calcNutrition(selectedFood, parseFloat(amount) || 0).calories.toFixed(0)} kcal ·
                P: {calcNutrition(selectedFood, parseFloat(amount) || 0).protein.toFixed(1)}g
              </p>
            )}
          </div>
        )}

        {/* カート */}
        {cart.length > 0 && (
          <div className="mt-3 space-y-2">
            {cart.map((item, idx) => {
              const n = calcNutrition(item.food, item.amount)
              return (
                <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">{item.food.name}</p>
                    <p className="text-xs text-gray-400">{item.amount}g · {n.calories.toFixed(0)} kcal</p>
                  </div>
                  <button onClick={() => removeFromCart(idx)} className="p-1 text-red-400 hover:text-red-500">
                    <Trash2 size={14} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 合計 */}
      {cart.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'カロリー', value: `${Math.round(totals.calories)}`, unit: 'kcal', color: 'text-rose-500' },
            { label: 'P', value: totals.protein.toFixed(1), unit: 'g', color: 'text-rose-400' },
            { label: 'F', value: totals.fat.toFixed(1), unit: 'g', color: 'text-amber-500' },
            { label: 'C', value: totals.carbs.toFixed(1), unit: 'g', color: 'text-sky-500' },
          ].map(item => (
            <div key={item.label} className="bg-white rounded-xl p-3 text-center shadow-sm border border-rose-50">
              <p className={`text-base font-bold ${item.color}`}>{item.value}</p>
              <p className="text-xs text-gray-400">{item.label} {item.unit}</p>
            </div>
          ))}
        </div>
      )}

      {/* メモ */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-rose-50">
        <p className="text-sm font-medium text-gray-600 mb-2">メモ（任意）</p>
        <textarea
          value={memo}
          onChange={e => setMemo(e.target.value)}
          placeholder="食事の感想や気づきなど..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none"
        />
      </div>

      {/* 保存ボタン */}
      <button
        onClick={handleSave}
        disabled={saving || (cart.length === 0 && !photoFile)}
        className="w-full py-3.5 bg-rose-400 hover:bg-rose-500 text-white font-semibold rounded-2xl shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? '保存中...' : '記録を保存する'}
      </button>
    </div>
  )
}
