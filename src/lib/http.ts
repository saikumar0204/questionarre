import { NextResponse } from 'next/server'

/** Never let a database hiccup surface as an empty 500: answer with JSON the UI can show, and log the cause. */
export async function guard(handler: () => Promise<Response>): Promise<Response> {
  try {
    return await handler()
  } catch (e) {
    const code = typeof e === 'object' && e && 'code' in e ? String((e as { code: unknown }).code) : undefined
    console.error('[api] unhandled error', code ?? '', e)
    return NextResponse.json({ error: 'The server is busy right now. Please try again in a moment.', code }, { status: 503, headers: { 'cache-control': 'no-store', 'retry-after': '2' } })
  }
}
