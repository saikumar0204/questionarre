const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789' // no 0/O/1/I/L to avoid mix-ups when read aloud

export function makeCode(len = 6, rand: () => number = Math.random): string {
  let s = ''
  for (let i = 0; i < len; i++) s += ALPHABET[Math.floor(rand() * ALPHABET.length)]
  return s
}

export function normalizeCode(input: unknown): string | null {
  if (typeof input !== 'string') return null
  const c = input.toUpperCase().replace(/[^A-Z0-9]/g, '')
  return c.length === 6 && [...c].every((ch) => ALPHABET.includes(ch)) ? c : null
}

export function cleanName(input: unknown): string | null {
  if (typeof input !== 'string') return null
  const n = input.replace(/\s+/g, ' ').trim().slice(0, 24)
  return n.length >= 1 ? n : null
}
