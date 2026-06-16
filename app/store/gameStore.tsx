import { create } from 'zustand'
import type { 
  GamePhase, 
  Winner, 
  BoardState, 
  PlayerView, 
  OpponentView,
  GameSyncEvent 
} from '../types/game'

// ==========================================
// INTERFACE DA STORE
// ==========================================

interface GameStore {
  // Fase atual
  phase: GamePhase
  turn: number
  winner: Winner
  
  // Board
  board: BoardState
  
  // Você (jogador logado)
  player: PlayerView
  
  // Oponente
  opponent: OpponentView
  
  // Controles
  showInfos: boolean
  
  // Ações
  syncGameState: (event: GameSyncEvent) => void
  setShowInfos: (show: boolean) => void
}

// ==========================================
// STORE
// ==========================================

const useGameStore = create<GameStore>((set) => ({
  // Estado inicial (vazio, será preenchido pelo GAME_SYNC)
  phase: 'WAITING',
  turn: 0,
  winner: 'NONE',
  
  board: {
    slots: []
  },
  
  player: {
    hand: [],
    deckCount: 0,
    victoryPoints: 0,
    totalMana: 0,
    manaAvailable: 0,
  },
  
  opponent: {
    handCount: 0,
    deckCount: 0,
    victoryPoints: 0,
  },
  
  showInfos: false,

  // ==========================================
  // AÇÕES
  // ==========================================
  
  syncGameState: (event: GameSyncEvent) => {
    const { state } = event
    
    console.log('📊 Atualizando gameStore...')
    console.log('   Fase:', state.phase)
    console.log('   Turno:', state.turn)
    console.log('   Cartas na mão:', state.you.hand.length)
    console.log('   Slots no board:', state.board.slots.length)
    console.log('   Mana:', state.you.manaAvailable, '/', state.you.totalMana)
    
    set({
      phase: state.phase,
      turn: state.turn,
      winner: state.winner,
      board: state.board,
      player: state.you,
      opponent: state.opponent,
    })
  },
  
  setShowInfos: (show: boolean) => set({ showInfos: show }),
}))

export default useGameStore