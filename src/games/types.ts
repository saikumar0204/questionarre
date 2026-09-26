export type Player = { id: string; name: string }

/** A client -> server game event. `type` is interpreted by the active engine. */
export type GameEvent = { type: string; [key: string]: unknown }

export type Reduced<S> = {
  state: S
  /** love points to award, keyed by user id */
  points?: Record<string, number>
  /** counters merged into the room stats (used for badges) */
  stats?: Record<string, number>
  error?: string
}

export interface Engine<S, V, O = Record<string, unknown>> {
  init(players: Player[], options: O): S
  /** `rand` is injectable so tests are deterministic */
  reduce(state: S, event: GameEvent, actor: string, players: Player[], rand?: () => number): Reduced<S>
  /** What one player is allowed to see. Must never leak the partner's hidden answers. */
  view(state: S, viewer: string, players: Player[]): V
}

export type Prompt = {
  id: string
  cat: string
  text: string
  options?: string[]
  /** optional tag, e.g. love-language code */
  tag?: string[]
}
