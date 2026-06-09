const LINE_API = 'https://api.line.me/v2/bot'
const LINE_DATA_API = 'https://api-data.line.me/v2/bot'

function headers(contentType = true) {
  const h: Record<string, string> = {
    Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
  }
  if (contentType) h['Content-Type'] = 'application/json'
  return h
}

export async function replyMessage(replyToken: string, messages: unknown[]) {
  const res = await fetch(`${LINE_API}/message/reply`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ replyToken, messages }),
  })
  if (!res.ok) console.error('LINE reply error:', await res.text())
}

export async function pushMessage(to: string, messages: unknown[]) {
  const res = await fetch(`${LINE_API}/message/push`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ to, messages }),
  })
  if (!res.ok) console.error('LINE push error:', await res.text())
}

export async function getMessageContent(messageId: string): Promise<Buffer> {
  const res = await fetch(`${LINE_DATA_API}/message/${messageId}/content`, {
    headers: headers(false),
  })
  if (!res.ok) throw new Error(`LINE content fetch failed: ${res.status}`)
  const ab = await res.arrayBuffer()
  return Buffer.from(ab)
}
