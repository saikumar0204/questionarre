export const AVATARS = ['🐻', '🦊', '🐰', '🐼', '🐯', '🦁', '🐨', '🐱', '🐶', '🦄', '🐸', '🌸', '🌻', '🍓', '🌙', '⭐']

const LEVELS = [
  { at: 0, title: 'Cute Crush', emoji: '🌸' },
  { at: 60, title: 'Sweethearts', emoji: '💕' },
  { at: 200, title: 'Love Birds', emoji: '🐦' },
  { at: 450, title: 'Partners in Crime', emoji: '😎' },
  { at: 900, title: 'Soulmates', emoji: '👑' },
  { at: 1600, title: 'Power Couple', emoji: '🔥' },
  { at: 2600, title: 'Eternal Lovers', emoji: '💎' },
  { at: 4000, title: 'Legends of Love', emoji: '🏆' },
]

export function levelFor(points: number) {
  let i = 0
  for (let k = 0; k < LEVELS.length; k++) if (points >= LEVELS[k].at) i = k
  const cur = LEVELS[i]
  const next = LEVELS[i + 1]
  return {
    level: i + 1,
    title: cur.title,
    emoji: cur.emoji,
    points,
    nextAt: next?.at ?? null,
    nextTitle: next?.title ?? null,
    progress: next ? Math.min(1, (points - cur.at) / (next.at - cur.at)) : 1,
  }
}

export type LevelInfo = ReturnType<typeof levelFor>
