// ==========================================
// TIPOS DO BACKEND (PlayerGameView)
// ==========================================

export type GamePhase = 
  | 'WAITING' 
  | 'SETUP' 
  | 'STANDBY' 
  | 'DECLARATION' 
  | 'RESOLUTION' 
  | 'FINISHED'

export type PlayerOwner = 'PLAYERONE' | 'PLAYERTWO'
export type Position = 'FRONT' | 'BACK'
export type Winner = 'PLAYERONE' | 'PLAYERTWO' | 'NONE' | 'DRAW'

// ==========================================
// CARTA
// ==========================================

export interface CardBase {
  id: string
  name: string
  type: string          // "UNIT" | "SPELL" | "EQUIPMENT"
  mana: number
  class: string         // "citizen" | "army" | "mage" | "noble" | "spell" | "equipment"
  rarity: string
  artUrl: string
  description: string
  energy: number
  attack: number
  life: number
  range: number
  effect: unknown
  ability: Ability[]
  evolvesFromId: string | null
  disabled: boolean
  createdAt: string
  updatedAt: string
}

export interface Ability {
  trigger: string   // "START_TURN" | "END_TURN" | "ON_INVOCATION" | "RESOLVE_TURN"
  effect: string    // Nome do efeito: "meninoGentil", "soldadoIniciado", etc
}

export interface CardState {
  currentLife: number
  currentEnergy: number
  isOnBoard: boolean
  hasAttacked: boolean
  canEvolution: boolean
  currentAttack: number
  equipment?: CardInstance[]
}

export interface CardInstance {
  instanceId: string     // ID único DESTA instância
  base: CardBase         // Dados fixos da carta
  state: CardState       // Estado mutável (vida, energia, etc)
  status: string[]       // Efeitos ativos
}

// ==========================================
// BOARD
// ==========================================

export interface BoardSlot {
  lane: number
  position: Position
  owner: PlayerOwner
  cardInstance?: CardInstance | null
}

export interface BoardState {
  slots: BoardSlot[]
}

// ==========================================
// PLAYER (Você)
// ==========================================

export interface PlayerView {
  hand: CardInstance[]
  deckCount: number
  victoryPoints: number
  totalMana: number
  manaAvailable: number
}

// ==========================================
// OPPONENT (Oponente)
// ==========================================

export interface OpponentView {
  handCount: number        // Só a quantidade!
  deckCount: number
  victoryPoints: number
}

// ==========================================
// PLAYER GAME VIEW (O que o front recebe)
// ==========================================

export interface PlayerGameView {
  phase: GamePhase
  turn: number
  board: BoardState
  you: PlayerView
  opponent: OpponentView
  winner: Winner
}

// ==========================================
// PAYLOAD DO EVENTO GAME_SYNC
// ==========================================

export interface GameSyncEvent {
  state: PlayerGameView
}