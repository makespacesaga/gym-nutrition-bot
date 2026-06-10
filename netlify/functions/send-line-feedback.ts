import { createClient } from '@supabase/supabase-js'
import { pushMessage } from './_utils/lineApi'
import { text } from './_utils/messages'

export const handler = async (event: {
  httpMethod: string
  body: string | null
  headers: Record<string, string>
}) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const authHeader = event.headers['authorization'] ?? event.headers['Authorization'] ?? ''
  const token = authHeader.replace('Bearer ', '').trim()
  if (!token) return { statusCode: 401, body: 'Unauthorized' }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )

  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return { statusCode: 401, body: 'Unauthorized' }

  let body: { customerLineUserId?: string; message?: string }
  try {
    body = JSON.parse(event.body ?? '{}')
  } catch {
    return { statusCode: 400, body: 'Bad Request' }
  }

  const { customerLineUserId, message } = body
  if (!customerLineUserId || !message?.trim()) {
    return { statusCode: 400, body: 'customerLineUserId and message are required' }
  }

  await pushMessage(customerLineUserId, [
    text(`🌸 トレーナーからのメッセージ\n\n${message.trim()}\n\n引き続き頑張ってください！💪`),
  ])

  return { statusCode: 200, body: JSON.stringify({ success: true }) }
}
