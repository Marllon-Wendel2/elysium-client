'use client'

import Image from "next/image"
import EnemyHand from "./componentes/EnemyHand"
import useGameStore from "./store/gameStore"
import PlayerHand from "./componentes/PlayerHand"

export default function Home() {
  const deckPlayer = useGameStore((state) => state.player.deck)
  const deckEnemy = useGameStore((state) => state.cpu.deck)

  return (
    <main className="relative w-screen h-screen bg-neutral-950 overflow-hidden">

      <div className="absolute left-6 top-20 z-30 w-24 h-36">
        <Image
          src="/Cards/verso.jpg"
          alt="Deck inimigo"
          fill
          className="object-cover rounded shadow-lg"
        />
      <div className="
        absolute bottom-2 left-1/2 -translate-x-1/2
        bg-black/70 backdrop-blur
        text-white text-xs font-semibold
        px-2 py-1 rounded-full
        shadow
      ">
        {deckEnemy} cartas
      </div>
      </div>

      <div className="absolute left-6 bottom-20 z-30 w-24 h-36">
        <Image
          src="/Cards/verso.jpg"
          alt="Deck jogador"
          fill
          className="object-cover rounded shadow-lg"
        />
        
      <div className="
        absolute bottom-2 left-1/2 -translate-x-1/2
        bg-black/70 backdrop-blur
        text-white text-xs font-semibold
        px-2 py-1 rounded-full
        shadow
      ">
        {deckPlayer} cartas
      </div>
      </div>

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative h-[90vh] aspect-2/3 max-w-full">

          <Image
            src="/Cards/board-bg.jpg"
            alt="Tabuleiro"
            fill
            priority
            className="object-cover"
          />

          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20">
            <EnemyHand />
          </div>

          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20">
            <PlayerHand />
          </div>


        </div>
      </div>

    </main>
  )
}
