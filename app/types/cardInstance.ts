import { Ability } from "./ability"

export interface CardInstance {
  instanceId: string     // ID único DESTA instância
  base: Card         // Dados fixos da carta
  state: CardState       // Estado mutável (vida, energia, etc)
  status: string[]       // Efeitos ativos
}

export interface Card {
  id: string
  name: string
  type: string          // "UNIT" | "SPELL" | "EQUIPMENT"
  mana: number
  class: string 
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

export interface CardState {
  currentLife: number
  currentEnergy: number
  isOnBoard: boolean
  hasAttacked: boolean
  canEvolution: boolean
  currentAttack: number
  equipment?: CardInstance[]
}