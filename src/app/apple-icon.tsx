import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#fb7185,#c026d3)' }}>
        <svg width="110" height="110" viewBox="0 0 24 24"><path fill="white" d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 2.6 5 6 5c2 0 3.4 1.1 4.2 2.4h.1C11.1 6.1 12.5 5 14.5 5 17.9 5 19.6 8.4 18.1 11.8 16 16.4 12 21 12 21z"/></svg>
      </div>
    ),
    size,
  )
}
