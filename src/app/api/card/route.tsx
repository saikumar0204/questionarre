import { ImageResponse } from 'next/og'
import { SITE } from '@/config/site'

const clean = (v: string | null, max: number, fallback: string) => (v ?? fallback).replace(/[^\p{L}\p{N} .'’&-]/gu, '').trim().slice(0, max) || fallback

/** Shareable "our streak" card (1080×1350, Instagram/WhatsApp-story friendly). */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams
  const a = clean(q.get('a'), 20, 'Us')
  const b = clean(q.get('b'), 20, 'Love')
  const level = clean(q.get('l'), 24, 'Sweethearts')
  const streak = Math.max(0, Math.min(99999, Math.floor(Number(q.get('s')) || 0)))

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(160deg,#0c0615 0%,#3b0a45 50%,#be185d 130%)', color: 'white', padding: 80, textAlign: 'center' }}>
        <div style={{ display: 'flex', fontSize: 40, letterSpacing: 8, color: '#fbcfe8', textTransform: 'uppercase' }}>Daily Spark streak</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 40 }}>
          <svg width="150" height="150" viewBox="0 0 24 24"><path fill="#fb923c" d="M12 2s5 4.2 5 9.3c0 1.7-.7 3-1.6 3.9.1-2-.9-3.6-2.4-4.7.1 2.2-1.8 3-1.8 5.2 0 1 .5 1.9 1.3 2.4C8.9 18 7 16 7 13.2 7 8 12 2 12 2z"/><path fill="#fb7185" d="M12 22c-3 0-5-2-5-4.6 0-1.6 1-3 2.3-4-.2 2 1.3 3.3 2.7 3.3 1.5 0 2.7-1 2.7-2.6 1.4 1.1 2.3 2.4 2.3 3.7C17 20 15 22 12 22z"/></svg>
          <div style={{ display: 'flex', fontSize: 330, fontWeight: 900, lineHeight: 1 }}>{streak}</div>
        </div>
        <div style={{ display: 'flex', fontSize: 60, marginTop: 10, color: '#fda4af' }}>{streak === 1 ? 'day together' : 'days together'}</div>
        <div style={{ display: 'flex', fontSize: 76, fontWeight: 800, marginTop: 90 }}>{a} &amp; {b}</div>
        <div style={{ display: 'flex', fontSize: 40, marginTop: 24, color: '#e9d5ff' }}>{level}</div>
        <div style={{ display: 'flex', fontSize: 34, marginTop: 110, color: '#fbcfe8' }}>Play with your partner · {SITE.domain}</div>
      </div>
    ),
    { width: 1080, height: 1350, headers: { 'cache-control': 'public, max-age=3600' } },
  )
}
