import { create } from "zustand";

const useGameStore = create<GameMatch>(() => ({
  phase: "PLAYING",
  currentTurn: "PLAYER",

  board: {
    slots:[
      {
        lane: 1,
        owner: 'PLAYER',
        position: 'FRONT',
        card: {
          name: 'Menino gentil',
          mana: 1,
          energy: 1,
          attack: 7,
          life: 9,
          art: '/Cards/good-boy.jpg',
          class: 'cidadao'
        },
      },
      {
        lane: 1,
        owner: 'CPU',
        position: 'FRONT',
        card: {
          name: 'Menino gentil',
          mana: 1,
          energy: 1,
          attack: 7,
          life: 9,
          art: '/Cards/good-boy.jpg',
          class: 'cidadao'
        },
      }
    ]
  } as BoardState,

  player: {
    victoryPoints: 0,
    hand: [
      {
        name: 'Menino gentil',
        mana: 1,
        energy: 1,
        attack: 7,
        life: 9,
        art: '/Cards/good-boy.jpg',
        class: 'cidadao'
      },
      {
        name: 'Soldado iniciado',
        mana: 4,
        energy: 4,
        attack: 20,
        life: 25,
        art: '/Cards/arthur.jpg',
        class: 'exercito'
      },
            {
        name: 'Soldado iniciado',
        mana: 4,
        energy: 4,
        attack: 20,
        life: 25,
        art: '/Cards/arthur.jpg',
        class: 'exercito'
      },
            {
        name: 'Soldado iniciado',
        mana: 4,
        energy: 4,
        attack: 20,
        life: 25,
        art: '/Cards/arthur.jpg',
        class: 'exercito'
      },
            {
        name: 'Soldado iniciado',
        mana: 4,
        energy: 4,
        attack: 20,
        life: 25,
        art: '/Cards/arthur.jpg',
        class: 'exercito'
      },
            {
        name: 'Soldado iniciado',
        mana: 4,
        energy: 4,
        attack: 20,
        life: 25,
        art: '/Cards/arthur.jpg',
        class: 'exercito'
      },
            {
        name: 'Soldado iniciado',
        mana: 4,
        energy: 4,
        attack: 20,
        life: 25,
        art: '/Cards/arthur.jpg',
        class: 'exercito'
      },
            {
        name: 'Soldado iniciado',
        mana: 4,
        energy: 4,
        attack: 20,
        life: 25,
        art: '/Cards/arthur.jpg',
        class: 'exercito'
      },
            {
        name: 'Soldado iniciado',
        mana: 4,
        energy: 4,
        attack: 20,
        life: 25,
        art: '/Cards/arthur.jpg',
        class: 'exercito'
      },
            {
        name: 'Soldado iniciado',
        mana: 4,
        energy: 4,
        attack: 20,
        life: 25,
        art: '/Cards/arthur.jpg',
        class: 'exercito'
      },
            {
        name: 'Soldado iniciado',
        mana: 4,
        energy: 4,
        attack: 20,
        life: 25,
        art: '/Cards/arthur.jpg',
        class: 'exercito'
      },
      
    ],
    deck: 5,
  } as PlayerState,
  cpu: {
    victoryPoints: 0,
    hand: 4,
    deck: 20
  } as PlayerState,

  turn: 1,
  winner: 'NONE',
  showInfos: false
}));

export default useGameStore;