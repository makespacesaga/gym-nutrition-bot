import {
  getOrCreateProfile, updateProfile, saveMealRecord,
  getTodayMeals, getStreak, saveWeight, saveWater, getTodayWater,
  getAllCustomers, getAllTrainers, findCustomerByNickname, saveTrainerFeedback,
} from './db'
import { replyMessage, pushMessage, getMessageContent } from './lineApi'
import { analyzeFoodPhoto } from './claudeApi'
import { text, textQR, goalSelectMsg, nutritionFlex, todaySummaryFlex, helpMsg } from './messages'

// ─── ヘルパー関数 ─────────────────────────────────────

function streakMsg(s: number): string {
  if (s === 0) return '今日から記録を始めましょう！小さな一歩が大きな変化を生みます🌱'
  if (s < 3)  return `${s}日連続！いい調子。3日達成を目指しましょう！`
  if (s < 7)  return `${s}日連続！習慣が身についてきました。7日達成まであと少し！`
  if (s < 30) return `${s}日連続！素晴らしい！30日達成まで諦めないで🌟`
  return `${s}日連続！もう完璧な習慣ですね💎`
}

function progressText(profile: any, streak: number): string {
  let msg = `📈 ${profile.nickname}さんの進捗\n\n`
  msg += `🔥 連続記録：${streak}日\n`
  if (profile.start_weight && profile.target_weight) {
    const diff = profile.start_weight - profile.target_weight
    const cur  = profile.current_weight ?? profile.start_weight
    const lost = profile.start_weight - cur
    const pct  = diff > 0 ? Math.min(Math.round((lost / diff) * 100), 100) : 0
    msg += `⚖️ 達成率：${pct}%\n`
    msg += `📊 スタート ${profile.start_weight}kg → 目標 ${profile.target_weight}kg\n`
    if (cur !== profile.start_weight) msg += `現在 ${cur}kg（あと ${Math.max(0, cur - profile.target_weight).toFixed(1)}kg）\n`
  }
  if (profile.dream_vision) msg += `\n💭「${profile.dream_vision}」\n`
  msg += `\n${streakMsg(streak)}`
  return msg
}

function welcomeComplete(nickname: string) {
  return text(
    `準備完了です！${nickname}さん！🎉\n\n` +
    `使い方はとても簡単です：\n` +
    `📷 食事の写真を送る → AIが栄養を分析・記録\n\n` +
    `その他のコマンド：\n` +
    `「今日」→ 今日の食事まとめ\n` +
    `「進捗」→ 目標達成率・連続日数\n` +
    `「体重 55.0」→ 体重を記録\n` +
    `「ヘルプ」→ 使い方ガイド\n\n` +
    `では、最初の食事の写真を送ってみてください！`
  )
}

// ─── スタッフへ通知 ───────────────────────────────────

async function notifyTrainers(profile: any, mealType: string, analysis: any) {
  const trainers = await getAllTrainers()
  if (trainers.length === 0) return

  const mealLabel: Record<string, string> = { breakfast: '朝食', lunch: '昼食', dinner: '夕食', snack: '間食' }
  const label = mealLabel[mealType] ?? mealType
  const msg = text(
    `📋 食事記録の通知\n\n` +
    `👤 ${profile.nickname}さんが${label}を記録しました\n` +
    `🔥 ${analysis.totals.calories}kcal（P:${analysis.totals.protein}g F:${analysis.totals.fat}g C:${analysis.totals.carbs}g）\n\n` +
    `フィードバックは：@${profile.nickname}｜メッセージ`
  )

  for (const trainer of trainers) {
    await pushMessage(trainer.line_user_id, [msg])
  }
}

// ─── フォロー ─────────────────────────────────────────

export async function handleFollow(userId: string, replyToken: string) {
  const profile = await getOrCreateProfile(userId)

  if (profile.onboarding_done) {
    await replyMessage(replyToken, [
      text(`${profile.nickname}さん、おかえりなさい！🌸\n食事の写真を送ってください📷`),
    ])
    return
  }

  await replyMessage(replyToken, [
    text(
      `🌸 ようこそ！パーソナルジムの食事・栄養サポートBOTです！\n\n` +
      `📷 食事の写真を送るだけでAIが栄養を分析・記録します。\n\n` +
      `まず、ニックネームを教えてください。\n` +
      `（例：さくら、ゆきちゃん。本名でなくてOK）`
    ),
  ])
}

// ─── テキストメッセージ ───────────────────────────────

export async function handleTextMessage(userId: string, rawText: string, replyToken: string) {
  const profile = await getOrCreateProfile(userId)
  const t = rawText.trim()

  if (!profile.onboarding_done) {
    await handleOnboarding(profile, t, replyToken, userId)
    return
  }

  if (profile.role === 'trainer') {
    await handleTrainer(profile, t, replyToken, userId)
    return
  }

  await handleCustomer(profile, t, replyToken, userId)
}

// ─── オンボーディング ─────────────────────────────────

async function handleOnboarding(profile: any, t: string, replyToken: string, userId: string) {
  switch (profile.conversation_state) {
    case 'onboarding_nickname': {
      if (t.length < 1 || t.length > 20) {
        await replyMessage(replyToken, [text('ニックネームは1〜20文字で入力してください🌸')])
        return
      }
      await updateProfile(userId, { nickname: t, conversation_state: 'onboarding_goal' })
      await replyMessage(replyToken, [goalSelectMsg(t)])
      break
    }

    case 'onboarding_vision': {
      await updateProfile(userId, { dream_vision: t, conversation_state: 'onboarding_weight' })
      await replyMessage(replyToken, [
        text(
          `素敵なビジョンですね！✨\n「${t}」\n\nその夢、必ず一緒に叶えましょう🌸\n\n` +
          `次に、今の体重（kg）を教えてください。\n` +
          `任意です。入力しない場合は「スキップ」と送ってください。`
        ),
      ])
      break
    }

    case 'onboarding_weight': {
      if (t === 'スキップ' || t.toLowerCase() === 'skip') {
        await updateProfile(userId, { onboarding_done: true, conversation_state: 'active' })
        await replyMessage(replyToken, [welcomeComplete(profile.nickname)])
        return
      }
      const w = parseFloat(t)
      if (isNaN(w) || w < 20 || w > 250) {
        await replyMessage(replyToken, [
          text('正しい体重を入力してください（例：55.0）\n入力しない場合は「スキップ」と送ってください'),
        ])
        return
      }
      await updateProfile(userId, {
        start_weight: w,
        current_weight: w,
        onboarding_done: true,
        conversation_state: 'active',
      })
      await replyMessage(replyToken, [welcomeComplete(profile.nickname)])
      break
    }

    default:
      await updateProfile(userId, { conversation_state: 'onboarding_nickname' })
      await replyMessage(replyToken, [text('ニックネームを教えてください🌸')])
  }
}

// ─── お客様コマンド ───────────────────────────────────

async function handleCustomer(profile: any, t: string, replyToken: string, userId: string) {
  // スタッフ登録コマンド
  const staffMatch = t.match(/^スタッフ登録[：:\s　]*(.+)/)
  if (staffMatch) {
    const inputCode = staffMatch[1].trim()
    const staffCode = process.env.STAFF_JOIN_CODE
    if (staffCode && inputCode === staffCode) {
      await updateProfile(userId, { role: 'trainer' })
      await replyMessage(replyToken, [
        text(
          `✅ ${profile.nickname}さん、スタッフ登録が完了しました！\n\n` +
          `🌸 トレーナーモードで使えるコマンド：\n\n` +
          `📋「顧客一覧」→ お客様全員を表示\n` +
          `👤「@名前」→ お客様の今日の状況\n` +
          `💬「@名前｜メッセージ」→ フィードバック送信\n\n` +
          `「ヘルプ」でいつでも確認できます。`
        ),
      ])
    } else {
      await replyMessage(replyToken, [text('スタッフ登録コードが違います。正しいコードを入力してください。')])
    }
    return
  }

  const weightMatch = t.match(/^体重[：:\s　]*(\d+\.?\d*)/)
  if (weightMatch) {
    const w = parseFloat(weightMatch[1])
    if (w >= 20 && w <= 250) {
      await saveWeight(userId, w)
      if (!profile.start_weight) await updateProfile(userId, { start_weight: w })
      await replyMessage(replyToken, [
        text(`✅ 体重 ${w}kg を記録しました！\n\n継続は力なり。毎日の記録が大きな変化を生みます💪`),
      ])
      return
    }
  }

  // 水分記録
  const waterMatch = t.match(/^(?:水分|水)[：:\s　]*(\d+)/)
  if (waterMatch) {
    const ml = parseInt(waterMatch[1], 10)
    if (ml > 0 && ml <= 5000) {
      await saveWater(userId, ml)
      const total = await getTodayWater(userId)
      const remaining = Math.max(0, 2000 - total)
      await replyMessage(replyToken, [
        text(
          `💧 水分 ${ml}ml を記録しました！\n\n` +
          `今日の合計：${total}ml / 2000ml\n` +
          (remaining > 0 ? `あと ${remaining}ml で目標達成！` : `🎉 今日の水分目標達成！素晴らしい！`)
        ),
      ])
      return
    }
  }

  if (/今日|きょう|記録|きろく/.test(t)) {
    const [meals, waterMl] = await Promise.all([getTodayMeals(userId), getTodayWater(userId)])
    await replyMessage(replyToken, [todaySummaryFlex(meals, waterMl, profile)])
    return
  }

  if (/進捗|しんちょく|達成率/.test(t)) {
    const streak = await getStreak(userId)
    await replyMessage(replyToken, [text(progressText(profile, streak))])
    return
  }

  if (/ヘルプ|help|使い方/.test(t)) {
    await replyMessage(replyToken, [helpMsg(false)])
    return
  }

  await replyMessage(replyToken, [
    textQR(
      `${profile.nickname}さん！\n\n食事の写真を送ってください📷\nAIが栄養を分析します！`,
      [
        { label: '📊 今日の記録', data: 'action=today_summary', displayText: '今日の記録を見せて' },
        { label: '📈 進捗確認',   data: 'action=progress',     displayText: '進捗を見せて' },
        { label: '❓ ヘルプ',     data: 'action=help',         displayText: 'ヘルプ' },
      ]
    ),
  ])
}

// ─── トレーナーコマンド ───────────────────────────────

async function handleTrainer(profile: any, t: string, replyToken: string, userId: string) {
  if (/顧客一覧|お客様一覧|一覧/.test(t)) {
    const customers = await getAllCustomers()
    if (customers.length === 0) {
      await replyMessage(replyToken, [text('まだお客様が登録されていません。')])
      return
    }
    const list = customers.map((c, i) => `${i + 1}. ${c.nickname}`).join('\n')
    await replyMessage(replyToken, [
      text(
        `👥 お客様一覧（${customers.length}名）\n\n${list}\n\n` +
        `詳細：@名前\n` +
        `フィードバック：@名前｜メッセージ`
      ),
    ])
    return
  }

  const atMatch = t.match(/^@(.+?)(?:[｜|](.+))?$/)
  if (atMatch) {
    const nickname = atMatch[1].trim()
    const comment  = atMatch[2]?.trim()
    const customer = await findCustomerByNickname(nickname)

    if (!customer) {
      await replyMessage(replyToken, [text(`「${nickname}」のお客様が見つかりませんでした。\n「顧客一覧」で名前を確認してください。`)])
      return
    }

    if (comment) {
      await saveTrainerFeedback(customer.line_user_id, userId, comment)
      await pushMessage(customer.line_user_id, [
        text(`🌸 トレーナーからのメッセージ\n\n${comment}\n\n引き続き頑張ってください！`),
      ])
      await replyMessage(replyToken, [
        text(`✅ ${customer.nickname}さんにフィードバックを送りました！\n「${comment}」`),
      ])
    } else {
      const meals  = await getTodayMeals(customer.line_user_id)
      const streak = await getStreak(customer.line_user_id)
      const mealLabel: Record<string, string> = { breakfast: '朝食', lunch: '昼食', dinner: '夕食', snack: '間食' }
      const goalLabel: Record<string, string> = { diet: 'ダイエット', health: '健康診断クリア', both: '両方' }
      const mealsText = meals.length === 0
        ? '本日の記録なし'
        : meals.map(m => `  ${mealLabel[m.meal_type] ?? m.meal_type}：${Math.round(m.total_calories)}kcal`).join('\n')

      await replyMessage(replyToken, [
        text(
          `👤 ${customer.nickname}さん\n\n` +
          `🎯 目標：${goalLabel[customer.goal_type] ?? customer.goal_type}\n` +
          `🔥 連続記録：${streak}日\n\n` +
          `📝 今日の食事:\n${mealsText}\n\n` +
          `フィードバックは：@${customer.nickname}｜メッセージ`
        ),
      ])
    }
    return
  }

  await replyMessage(replyToken, [helpMsg(true)])
}

// ─── 画像メッセージ（食事写真） ───────────────────────

export async function handleImageMessage(userId: string, messageId: string, replyToken: string) {
  const profile = await getOrCreateProfile(userId)

  if (!profile.onboarding_done) {
    await replyMessage(replyToken, [text('まずニックネームの登録を完了してください！\nニックネームを教えてください🌸')])
    return
  }

  // replyToken は1回しか使えないので「分析中」を先に返信
  await replyMessage(replyToken, [
    text('📸 写真を受け取りました！\n🔍 AIが食事を分析中...\n（5〜15秒ほどお待ちください）'),
  ])

  try {
    const imageBuffer = await getMessageContent(messageId)
    const analysis    = await analyzeFoodPhoto(imageBuffer)
    const streak      = await getStreak(userId)

    // 時間帯でデフォルト食事タイプを決定（JST）
    const jstHour = (new Date().getUTCHours() + 9) % 24
    const mealType = jstHour < 10 ? 'breakfast' : jstHour < 15 ? 'lunch' : jstHour < 20 ? 'dinner' : 'snack'

    // ユーザーが「記録する」を押すまで DB に仮保存
    await updateProfile(userId, {
      conversation_data: {
        pendingAnalysis: analysis,
        pendingMealType: mealType,
        pendingAt: Date.now(),
      },
    })

    // 分析結果を push（replyToken は使用済みなので push を使う）
    await pushMessage(userId, [nutritionFlex(analysis, mealType, streak)])
  } catch (err) {
    console.error('Image analysis error:', err)
    await pushMessage(userId, [
      text('申し訳ありません。分析に失敗しました。\nもう一度写真を送ってみてください📷'),
    ])
  }
}

// ─── ポストバック（ボタン押下） ───────────────────────

export async function handlePostback(userId: string, data: string, replyToken: string) {
  const profile = await getOrCreateProfile(userId)
  const params  = new URLSearchParams(data)
  const action  = params.get('action')

  switch (action) {
    case 'set_goal': {
      const goalType = params.get('type') as 'diet' | 'health' | 'both'
      const goalLabel: Record<string, string> = { diet: 'ダイエット成功', health: '健康診断クリア', both: '両方達成' }
      await updateProfile(userId, { goal_type: goalType, conversation_state: 'onboarding_vision' })
      await replyMessage(replyToken, [
        text(
          `${goalLabel[goalType] ?? goalType}を目指すんですね！応援します🌸\n\n` +
          `次に、目標を達成した時にどんな自分になっていたいか教えてください。\n\n` +
          `数字より場面・感情で書くと効果的です。\n` +
          `例：「去年着れなかったワンピースを着て旅行したい」`
        ),
      ])
      break
    }

    case 'save_meal': {
      const mealType = params.get('meal_type') ?? 'lunch'
      const pending  = profile.conversation_data as Record<string, unknown>
      const analysis = pending.pendingAnalysis as any
      const savedAt  = pending.pendingAt as number

      if (!analysis || Date.now() - savedAt > 300_000) {
        await replyMessage(replyToken, [text('時間が経過しました。もう一度写真を送ってください。')])
        return
      }

      await saveMealRecord(userId, analysis, mealType)
      await updateProfile(userId, { conversation_data: {} })

      const streak     = await getStreak(userId)
      const mealLabel: Record<string, string> = { breakfast: '朝食', lunch: '昼食', dinner: '夕食', snack: '間食' }
      await replyMessage(replyToken, [
        text(`✅ ${mealLabel[mealType] ?? mealType}を記録しました！\n🔥 ${streak}日連続記録中！\n\n「今日」で今日の記録を確認できます。`),
      ])

      // スタッフへ通知（バックグラウンド）
      notifyTrainers(profile, mealType, analysis).catch(e => console.error('trainer notify error:', e))
      break
    }

    case 'retake':
      await updateProfile(userId, { conversation_data: {} })
      await replyMessage(replyToken, [text('📷 もう一度写真を送ってください！')])
      break

    case 'today_summary': {
      const [meals, waterMl] = await Promise.all([getTodayMeals(userId), getTodayWater(userId)])
      await replyMessage(replyToken, [todaySummaryFlex(meals, waterMl, profile)])
      break
    }

    case 'progress': {
      const streak = await getStreak(userId)
      await replyMessage(replyToken, [text(progressText(profile, streak))])
      break
    }

    case 'help':
      await replyMessage(replyToken, [helpMsg(profile.role === 'trainer')])
      break

    default:
      await replyMessage(replyToken, [helpMsg(profile.role === 'trainer')])
  }
}
