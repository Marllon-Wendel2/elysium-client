import { Card, CardInstance } from "./cardInstance";

export interface PlayerState {
    life: number,
    hand: Card[] | number,
    deck: number,
    victoryPoints: number,
    totalMana: number,
    manaAvailable: number,
}

export interface PlayerView {
  hand: CardInstance[]
  deckCount: number
  victoryPoints: number
  totalMana: number
  manaAvailable: number
}