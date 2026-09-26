import type { GameEvent, Player, Reduced } from './types.ts'
import { GAMES, gameById, type GameId } from './registry.ts'
import { simulEngine, type SimulGame, type SimulState, type SimulView } from './engines/simul.ts'
import { guessEngine, type GuessState, type GuessView } from './engines/guess.ts'
import { todEngine, type TodState, type TodView } from './engines/tod.ts'
import { cardsEngine, type CardsState, type CardsView } from './engines/cards.ts'
import { c4Engine, memoryEngine, tttEngine, type BoardView, type C4State, type MemoryState, type MemoryView, type TttState } from './engines/board.ts'
import { meldEngine, rankEngine, tuneEngine, type MeldState, type MeldView, type RankState, type RankView, type TuneState, type TuneView } from './engines/sync.ts'
import { huntEngine, lieEngine, storyEngine, type HuntState, type HuntView, type LieState, type LieView, type StoryState, type StoryView } from './engines/play.ts'
import { charadesEngine, type CharadesState, type CharadesView } from './engines/charades.ts'
import type { Level } from './content/tod.ts'
import type { DeckId } from './content/deep.ts'

export type GameState =
  | SimulState | GuessState | TodState | CardsState | TttState | C4State | MemoryState
  | TuneState | MeldState | RankState | LieState | HuntState | StoryState | CharadesState
export type GameView =
  | SimulView | GuessView | TodView | CardsView | BoardView<TttState> | BoardView<C4State> | MemoryView
  | TuneView | MeldView | RankView | LieView | HuntView | StoryView | CharadesView

export type StartOptions = { category?: string; level?: string; deck?: string }

const SIMUL_GAMES: SimulGame[] = ['quiz', 'wyr', 'likely', 'nhie', 'sentence', 'lovelang']
const isSimul = (g: string): g is SimulGame => (SIMUL_GAMES as string[]).includes(g)

/** Only accept option values that the registry offers for that game. */
function cleanOption(id: GameId, key: 'category' | 'level' | 'deck', value: unknown): string | undefined {
  const def = gameById(id)
  if (!def?.option || def.option.key !== key) return undefined
  return def.option.choices.some((c) => c.id === value) ? String(value) : def.option.default
}

export function initGame(id: string, players: Player[], options: StartOptions = {}, rand: () => number = Math.random): GameState | null {
  if (!GAMES.some((g) => g.id === id) || players.length !== 2) return null
  const gid = id as GameId
  if (isSimul(gid)) return simulEngine.init(players, { game: gid, category: cleanOption(gid, 'category', options.category), rand })
  switch (gid) {
    case 'knowme': return guessEngine.init(players, { rand })
    case 'tod': return todEngine.init(players, { level: cleanOption(gid, 'level', options.level) as Level | undefined })
    case 'deep': return cardsEngine.init(players, { deck: cleanOption(gid, 'deck', options.deck) as DeckId | undefined })
    case 'ttt': return tttEngine.init(players, {})
    case 'c4': return c4Engine.init(players, {})
    case 'memory': return memoryEngine.init(players, { rand })
    case 'tunein': return tuneEngine.init(players, { rand })
    case 'meld': return meldEngine.init(players, { rand })
    case 'rank': return rankEngine.init(players, { rand })
    case 'lie': return lieEngine.init(players, {})
    case 'hunt': return huntEngine.init(players, {})
    case 'story': return storyEngine.init(players, { rand })
    case 'doodle': return charadesEngine.init(players, { mode: 'draw', rand })
    case 'emoji': return charadesEngine.init(players, { mode: 'emoji', rand })
  }
  return null
}

export function reduceGame(state: GameState, event: GameEvent, actor: string, players: Player[], rand: () => number = Math.random): Reduced<GameState> {
  switch (state.engine) {
    case 'simul': return simulEngine.reduce(state, event, actor, players, rand)
    case 'guess': return guessEngine.reduce(state, event, actor, players, rand)
    case 'tod': return todEngine.reduce(state, event, actor, players, rand)
    case 'cards': return cardsEngine.reduce(state, event, actor, players, rand)
    case 'ttt': return tttEngine.reduce(state, event, actor, players, rand)
    case 'c4': return c4Engine.reduce(state, event, actor, players, rand)
    case 'memory': return memoryEngine.reduce(state, event, actor, players, rand)
    case 'tunein': return tuneEngine.reduce(state, event, actor, players, rand)
    case 'meld': return meldEngine.reduce(state, event, actor, players, rand)
    case 'rank': return rankEngine.reduce(state, event, actor, players, rand)
    case 'lie': return lieEngine.reduce(state, event, actor, players, rand)
    case 'hunt': return huntEngine.reduce(state, event, actor, players, rand)
    case 'story': return storyEngine.reduce(state, event, actor, players, rand)
    case 'charades': return charadesEngine.reduce(state, event, actor, players, rand)
  }
}

export function viewGame(state: GameState, viewer: string, players: Player[]): GameView {
  switch (state.engine) {
    case 'simul': return simulEngine.view(state, viewer, players)
    case 'guess': return guessEngine.view(state, viewer, players)
    case 'tod': return todEngine.view(state, viewer, players)
    case 'cards': return cardsEngine.view(state, viewer, players)
    case 'ttt': return tttEngine.view(state, viewer, players)
    case 'c4': return c4Engine.view(state, viewer, players)
    case 'memory': return memoryEngine.view(state, viewer, players)
    case 'tunein': return tuneEngine.view(state, viewer, players)
    case 'meld': return meldEngine.view(state, viewer, players)
    case 'rank': return rankEngine.view(state, viewer, players)
    case 'lie': return lieEngine.view(state, viewer, players)
    case 'hunt': return huntEngine.view(state, viewer, players)
    case 'story': return storyEngine.view(state, viewer, players)
    case 'charades': return charadesEngine.view(state, viewer, players)
  }
}
