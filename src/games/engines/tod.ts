import type { Engine, GameEvent, Reduced } from '../types.ts'
import { fill } from '../text.ts'
import { TOD_CARDS, type Level } from '../content/tod.ts'

/**
 * Truth or Dare, turn by turn:
 *   choose  -> the player whose turn it is picks Truth, Dare or Random
 *   card    -> they do it (they may skip a limited number of times)
 *   verify  -> their partner decides: approve (points!) or "try again"
 */
export type TodState = {
  engine: 'tod'
  level: Level
  turn: string
  phase: 'choose' | 'card' | 'verify'
  card?: { id: string; type: 'TRUTH' | 'DARE'; text: string }
  used: string[]
  skips: Record<string, number>
  completed: number
  note?: string
}

export type TodOptions = { level?: Level; rand?: () => number }

const DO_POINTS = 30
const JUDGE_POINTS = 10
export const SKIPS_PER_PLAYER = 2

export type TodView = {
  engine: 'tod'
  level: Level
  phase: TodState['phase']
  performer: { id: string; name: string; isMe: boolean }
  judge: { name: string }
  card?: TodState['card']
  skipsLeft: number
  completed: number
  note?: string
}

const isLevel = (v: unknown): v is Level => v === 'SPICY' || v === 'FUN' || v === 'SWEET'

export const todEngine: Engine<TodState, TodView, TodOptions> = {
  init(players, options) {
    return {
      engine: 'tod',
      level: options.level && isLevel(options.level) ? options.level : 'FUN',
      turn: players[0].id,
      phase: 'choose',
      used: [],
      skips: Object.fromEntries(players.map((p) => [p.id, SKIPS_PER_PLAYER])),
      completed: 0,
    }
  },

  reduce(state, event: GameEvent, actor, players, rand = Math.random): Reduced<TodState> {
    const performer = players.find((p) => p.id === state.turn)
    const other = players.find((p) => p.id !== state.turn)
    if (!performer || !other || !players.some((p) => p.id === actor)) return { state, error: 'Not a player.' }

    switch (event.type) {
      case 'level': {
        if (state.phase !== 'choose') return { state, error: 'Change the level between turns.' }
        if (!isLevel(event.level)) return { state, error: 'Unknown level.' }
        return { state: { ...state, level: event.level, note: undefined } }
      }

      case 'pick': {
        if (state.phase !== 'choose') return { state, error: 'A card is already in play.' }
        if (actor !== state.turn) return { state, error: `It is ${performer.name}'s turn.` }
        let kind = event.kind
        if (kind === 'RANDOM') kind = rand() < 0.5 ? 'TRUTH' : 'DARE'
        if (kind !== 'TRUTH' && kind !== 'DARE') return { state, error: 'Pick truth or dare.' }

        let pool = TOD_CARDS.filter((c) => c.type === kind && c.level === state.level)
        let used = state.used
        const fresh = pool.filter((c) => !used.includes(c.id))
        if (fresh.length === 0) {
          used = used.filter((id) => !pool.some((c) => c.id === id))
        } else {
          pool = fresh
        }
        const card = pool[Math.floor(rand() * pool.length)]
        return {
          state: {
            ...state,
            phase: 'card',
            used: [...used, card.id],
            card: { id: card.id, type: card.type, text: fill(card.text, { p: performer.name, o: other.name }) },
            note: undefined,
          },
        }
      }

      case 'done': {
        if (state.phase !== 'card') return { state, error: 'No card to complete.' }
        if (actor !== state.turn) return { state, error: `Only ${performer.name} can mark this done.` }
        return { state: { ...state, phase: 'verify' } }
      }

      case 'approve': {
        if (state.phase !== 'verify' || !state.card) return { state, error: 'Nothing to approve.' }
        if (actor === state.turn) return { state, error: `${other.name} has to approve this one 😉` }
        return {
          state: { ...state, phase: 'choose', turn: other.id, card: undefined, completed: state.completed + 1, note: `${performer.name} nailed it! 🎉` },
          points: { [performer.id]: DO_POINTS, [actor]: JUDGE_POINTS },
          stats: { [state.card.type === 'TRUTH' ? 'truthsDone' : 'daresDone']: 1 },
        }
      }

      case 'reject': {
        if (state.phase !== 'verify') return { state, error: 'Nothing to review.' }
        if (actor === state.turn) return { state, error: `${other.name} decides this one.` }
        return { state: { ...state, phase: 'card', note: `${other.name} says: not convincing enough, try again! 😏` } }
      }

      case 'skip': {
        if (state.phase !== 'card') return { state, error: 'Nothing to skip.' }
        if (actor !== state.turn) return { state, error: `Only ${performer.name} can skip.` }
        if ((state.skips[actor] ?? 0) <= 0) return { state, error: 'No skips left — you have got this! 💪' }
        return {
          state: { ...state, phase: 'choose', turn: other.id, card: undefined, skips: { ...state.skips, [actor]: state.skips[actor] - 1 }, note: `${performer.name} skipped. Your turn, ${other.name}!` },
        }
      }
    }
    return { state, error: 'Unknown action.' }
  },

  view(state, viewer, players): TodView {
    const performer = players.find((p) => p.id === state.turn) ?? players[0]
    const judge = players.find((p) => p.id !== performer.id) ?? players[1] ?? performer
    return {
      engine: 'tod',
      level: state.level,
      phase: state.phase,
      performer: { id: performer.id, name: performer.name, isMe: performer.id === viewer },
      judge: { name: judge.name },
      card: state.card,
      skipsLeft: state.skips[viewer] ?? 0,
      completed: state.completed,
      note: state.note,
    }
  },
}
