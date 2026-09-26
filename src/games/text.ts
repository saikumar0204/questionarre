import type { Player } from './types.ts'

/**
 * Replaces name placeholders with real names so nobody has to decode "me" and "you".
 *   {a} / {b}   the first / second player to have joined the room
 *   {who}       the person a "know me" question is about
 *   {p} / {o}   the performer / the other person (truth or dare)
 */
export function fill(text: string, vars: Record<string, string>): string {
  return text.replace(/\{(\w+)\}/g, (m, key: string) => (key in vars ? vars[key] : m))
}

export function playerVars(players: Player[]): Record<string, string> {
  return { a: players[0]?.name ?? 'Player 1', b: players[1]?.name ?? 'Player 2' }
}

export function otherOf(players: Player[], id: string): Player | undefined {
  return players.find((p) => p.id !== id)
}

export function shuffle<T>(arr: readonly T[], rand: () => number = Math.random): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function pick<T>(arr: readonly T[], n: number, rand: () => number = Math.random): T[] {
  return shuffle(arr, rand).slice(0, n)
}

/** Compact authoring helper: rows are [category, text, "opt1|opt2|opt3|opt4"]. */
export function build(prefix: string, rows: [string, string, string?][]) {
  return rows.map(([cat, text, opts], i) => ({
    id: `${prefix}.${i + 1}`,
    cat,
    text,
    options: opts ? opts.split('|').map((o) => o.trim()) : undefined,
  }))
}
