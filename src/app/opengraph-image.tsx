import { ImageResponse } from 'next/og'
import { SITE } from '@/config/site'

export const alt = `${SITE.name} — ${SITE.tagline}`
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OG() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 80, background: 'linear-gradient(135deg,#0c0615 0%,#3b0a45 55%,#be185d 130%)', color: 'white' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <svg width="84" height="84" viewBox="0 0 24 24"><path fill="#fb7185" d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 2.6 5 6 5c2 0 3.4 1.1 4.2 2.4h.1C11.1 6.1 12.5 5 14.5 5 17.9 5 19.6 8.4 18.1 11.8 16 16.4 12 21 12 21z"/></svg>
          <div style={{ fontSize: 64, fontWeight: 800 }}>{SITE.name}</div>
        </div>
        <div style={{ fontSize: 76, fontWeight: 800, marginTop: 40, lineHeight: 1.05, display: 'flex' }}>Date night, anywhere.</div>
        <div style={{ fontSize: 34, marginTop: 28, color: '#fbcfe8', display: 'flex' }}>20 games for two · a daily streak · no sign-up</div>
      </div>
    ),
    size,
  )
}
