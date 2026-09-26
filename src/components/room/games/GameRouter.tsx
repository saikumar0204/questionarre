'use client'

import type { GameView } from '@/games/index'
import { SimulGame } from './SimulGame'
import { KnowMeGame } from './KnowMeGame'
import { TodGame } from './TodGame'
import { DeepGame } from './DeepGame'
import { C4Game, HuntGame, MemoryGame, TttGame } from './BoardGames'
import { TuneInGame } from './TuneInGame'
import { MeldGame } from './MeldGame'
import { RankGame } from './RankGame'
import { LieGame } from './LieGame'
import { StoryGame } from './StoryGame'
import { CharadesGame } from './CharadesGame'

export function GameRouter({ view }: { view: GameView }) {
  switch (view.engine) {
    case 'simul': return <SimulGame view={view} />
    case 'guess': return <KnowMeGame view={view} />
    case 'tod': return <TodGame view={view} />
    case 'cards': return <DeepGame view={view} />
    case 'ttt': return <TttGame view={view} />
    case 'c4': return <C4Game view={view} />
    case 'memory': return <MemoryGame view={view} />
    case 'hunt': return <HuntGame view={view} />
    case 'tunein': return <TuneInGame view={view} />
    case 'meld': return <MeldGame view={view} />
    case 'rank': return <RankGame view={view} />
    case 'lie': return <LieGame view={view} />
    case 'story': return <StoryGame view={view} />
    case 'charades': return <CharadesGame view={view} />
  }
}
