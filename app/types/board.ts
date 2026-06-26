import { CardInstance } from "./cardInstance"

export type Position = 'FRONT' | 'BACK'
export type PlayerOwner = 'PLAYERONE' | 'PLAYERTWO'

export interface BoardSlot {
    lane: 0 | 1 | 2 
    position: Position
    owner: PlayerOwner
    cardInstance?: CardInstance
}

export interface BoardState {
  slots: BoardSlot[]
}