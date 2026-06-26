export interface Ability {
  trigger: string   // "START_TURN" | "END_TURN" | "ON_INVOCATION" | "RESOLVE_TURN"
  effect: string    // Nome do efeito: "meninoGentil", "soldadoIniciado", etc
}

export interface OpponentView {
  handCount: number        // Só a quantidade!
  deckCount: number
  victoryPoints: number
}