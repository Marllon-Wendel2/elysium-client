import { OpponentView } from "./ability"
import { BoardState, PlayerOwner } from "./board"
import { PlayerView } from "./player"

export type { PlayerOwner }

export type GamePhase = 
  | 'WAITING' 
  | 'SETUP' 
  | 'STANDBY' 
  | 'DECLARATION' 
  | 'RESOLUTION' 
  | 'FINISHED'

export type Winner = 'PLAYERONE' | 'PLAYERTWO' | 'NONE' | 'DRAW'



export interface PlayerGameView {
  phase: GamePhase
  turn: number
  board: BoardState
  you: PlayerView
  opponent: OpponentView
  winner: Winner
}


export interface GameSyncEvent {
  state: PlayerGameView
}