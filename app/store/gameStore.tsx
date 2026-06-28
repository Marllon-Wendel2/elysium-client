import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { 
  GamePhase, 
  Winner, 
  GameSyncEvent,
  PlayerOwner
} from '../types/game'
import { BoardState } from '../types/board'
import { PlayerView } from '../types/player'
import { OpponentView } from '../types/ability'

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
  
  // Ações pendentes
  pendingActions: unknown[]
  waitingForOpponent: boolean
  
  // Lado do jogador
  playerSide: PlayerOwner
  
  // Ações
  syncGameState: (event: GameSyncEvent) => void
  setShowInfos: (show: boolean) => void
  addAction: (action: unknown) => void
  removeAction: (index: number) => void
  clearPendingActions: () => void
  setWaitingForOpponent: (waiting: boolean) => void
  setPlayerSide: (side: PlayerOwner) => void
}

// ==========================================
// STORE
// ==========================================

const useGameStore = create<GameStore>()(
  subscribeWithSelector((set) => ({
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

    pendingActions: [],
    waitingForOpponent: false,

    playerSide: 'PLAYERONE',

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
        pendingActions: [],
        waitingForOpponent: false,
      })
    },
    
    setShowInfos: (show: boolean) => set({ showInfos: show }),
    
    addAction: (action: unknown) => set((state) => ({
      pendingActions: [...state.pendingActions, action],
    })),
    
    removeAction: (index: number) => set((state) => ({
      pendingActions: state.pendingActions.filter((_, i) => i !== index),
    })),
    
    clearPendingActions: () => set({ pendingActions: [] }),
    
    setWaitingForOpponent: (waiting: boolean) => set({ waitingForOpponent: waiting }),
    
    setPlayerSide: (side: PlayerOwner) => set({ playerSide: side }),
  }))
)

export default useGameStore
