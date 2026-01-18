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
        showInfos: boolean,
    }

    interface BoardState {
        slots: BoardSlot[]
    }

    interface BoardSlot {
        lane: 0 | 1 | 2 
        position: Position
        owner: "PLAYER" | "CPU" 
        card?: Card
    }

    type Position = "FRONT" | "BACK"

    interface PlayerState {
        life: number,
        hand: Card[] | number,
        deck: number,
        victoryPoints: number,
    }

    interface Card {
        id?: string,
        name: string,
        mana: number,
        energy: number,
        energyUsend: number,
        class: string,
        attack: number,
        life: number,
        art: string,
        canAttack: boolean,
        canEvolve: boolean,
        effect: CardEffect
    }

    interface CardEffect {
    type: "DAMAGE" | "HEAL" | "DRAW" | "BUFF" | "DEBUFF",
     value: number
    }
}