import crypto from 'crypto'
import { handleFollow, handleTextMessage, handleImageMessage, handlePostback } from './_utils/stateHandler'

interface LINEEvent {
  type: string
  replyToken?: string
  source?: { userId?: string }
  message?: { type: string; id: string; text?: string }
  postback?: { data: string }
}

function verifySignature(body: string, signature: string): boolean {
  const secret = process.env.LINE_CHANNEL_SECRET
  if (!secret || !signature) return false

  const hash = crypto.createHmac('SHA256', secret).update(body).digest('base64')
  const expected = Buffer.from(hash)
  const actual = Buffer.from(signature)

  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual)
}

async function dispatch(event: LINEEvent): Promise<void> {
  const userId     = event.source?.userId
  const replyToken = event.replyToken ?? ''
  if (!userId) return

  switch (event.type) {
    case 'follow':
      await handleFollow(userId, replyToken)
      break

    case 'message':
      if (event.message?.type === 'text' && event.message.text) {
        await handleTextMessage(userId, event.message.text, replyToken)
      } else if (event.message?.type === 'image' && event.message.id) {
        await handleImageMessage(userId, event.message.id, replyToken)
      }
      break

    case 'postback':
      if (event.postback?.data) {
        await handlePostback(userId, event.postback.data, replyToken)
      }
      break
  }
}

// Netlify Functions ハンドラー
export const handler = async (event: { httpMethod: string; body: string | null; headers: Record<string, string> }) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const body      = event.body ?? ''
  const signature =
    event.headers['x-line-signature'] ??
    event.headers['X-Line-Signature'] ??
    ''

  if (!verifySignature(body, signature)) {
    console.error('Invalid LINE signature')
    return { statusCode: 401, body: 'Unauthorized' }
  }

  let parsed: { events?: LINEEvent[] }
  try {
    parsed = JSON.parse(body)
  } catch {
    return { statusCode: 400, body: 'Bad Request' }
  }

  const events = parsed.events ?? []

  // イベントを順番に処理（エラーが起きても 200 を返す）
  for (const evt of events) {
    try {
      await dispatch(evt)
    } catch (err) {
      console.error('Event dispatch error:', err)
    }
  }

  return { statusCode: 200, body: 'OK' }
}
