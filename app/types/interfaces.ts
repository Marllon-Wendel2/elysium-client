export{}
 declare global {
    interface GameMatch {
        phase: "MENU" | "PLAYING" | "GAME_OVER",
        currentTurn: "PLAYER" | "CPU",

        board: BoardState,

        player: PlayerState,
        cpu: PlayerState,

        turn: number,
        winner: "PLAYER" | "CPU" | 'NONE' | "DRAW"
    }

    interface BoardState {
        slots: BoardSlot[]
    }

    interface BoardSlot {
        id: number
        owner: "PLAYER" | "CPU" | null
        card?: Card
    }

    interface PlayerState {
        life: number,
        hand: Card[] | number,
        deck: number,
    }

    interface Card {
        id?: string,
        name: string,
        turnInGame: number,
        damegeDead: number,
        class: string,
        attack: number,
        life: number,
        art: string,
        effect: CardEffect
    }

    interface CardEffect {
    type: "DAMAGE" | "HEAL" | "DRAW" | "BUFF" | "DEBUFF",
     value: number
    }
}