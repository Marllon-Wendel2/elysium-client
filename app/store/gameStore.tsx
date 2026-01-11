import { create } from "zustand";

const useGameStore = create<GameMatch>(() => ({
  phase: "PLAYING",
  currentTurn: "PLAYER",

  board: {} as BoardState,

  player: {
    life: 10000,
    hand: [
      {
        name: 'Menino gentil',
        turnInGame: 6,
        damegeDead: 300,
        attack: 7,
        life: 9,
        art: '/Cards/good-boy.jpg',
        class: 'cidadao'
      },
      {
        name: 'Soldado iniciado',
        turnInGame: 6,
        damegeDead: 300,
        art: '/Cards/arthur.jpg',
        class: 'exercito'
      }
    ],
    deck: 5
  } as PlayerState,
  cpu: {
    life: 10000,
    hand: 4,
    deck: 20
  } as PlayerState,

  turn: 1,
  winner: 'NONE'
}));

export default useGameStore;