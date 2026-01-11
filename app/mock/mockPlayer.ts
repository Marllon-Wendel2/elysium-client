export const mockCards: Card[] = [
  {
    id: "c1",
    name: "Fire Bolt",
    cost: 1,
    art: "/cards/fire-bolt.png",
    effect: {
      type: "DAMAGE",
      value: 3
    }
  },
  {
    id: "c2",
    name: "Healing Light",
    cost: 2,
    art: "/cards/healing-light.png",
    effect: {
      type: "HEAL",
      value: 4
    }
  },
  {
    id: "c3",
    name: "Quick Draw",
    cost: 1,
    art: "/cards/quick-draw.png",
    effect: {
      type: "DRAW",
      value: 2
    }
  },
  {
    id: "c4",
    name: "Battle Cry",
    cost: 2,
    art: "/cards/battle-cry.png",
    effect: {
      type: "BUFF",
      value: 1
    }
  },
  {
    id: "c5",
    name: "Crippling Curse",
    cost: 3,
    art: "/cards/crippling-curse.png",
    effect: {
      type: "DEBUFF",
      value: 2
    }
  }
]
