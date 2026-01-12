'use client'

import Image from "next/image"
import EnemyHand from "./componentes/EnemyHand"
import PlayerHand from "./componentes/PlayerHand"
import useGameStore from "./store/gameStore"
import BoardMonster from "./componentes/BoardMonster"

export default function Home() {
  const deckPlayer = useGameStore((state) => state.player.deck)
  const deckEnemy = useGameStore((state) => state.cpu.deck)

  const playerVP = useGameStore((state) => state.player.victoryPoints)
  const enemyVP = useGameStore((state) => state.cpu.victoryPoints)

  return (
    <main className="w-screen h-screen bg-neutral-950 grid grid-rows-[auto_1fr_auto]">

      {/* 🔴 TOPO — INIMIGO */}
      <section className="grid grid-cols-[auto_1fr_auto] items-center px-6 pt-4">

        {/* Deck inimigo */}
        <div className="relative w-24 h-36">
          <Image
            src="/Cards/verso.jpg"
            alt="Deck inimigo"
            fill
            className="object-cover rounded shadow-lg"
          />
          <span className="absolute bottom-2 left-1/2 -translate-x-1/2
            bg-black/70 text-white text-xs px-2 py-1 rounded-full">
            {deckEnemy} cartas
          </span>
        </div>

        {/* Mão inimiga */}
        <div className="flex justify-center">
          <EnemyHand />
        </div>

        {/* Vitórias inimigo */}
        <div className="
          flex flex-col items-center justify-center
          min-w-20
          bg-red-600/20 border border-red-500
          text-red-300
          rounded-lg px-3 py-2
        ">
          <span className="text-xs uppercase tracking-wide">
            Vitória
          </span>
          <span className="text-2xl font-bold">
            {enemyVP}/10
          </span>
        </div>

      </section>

      {/* 🟢 CENTRO — BOARD */}
      <section className="flex items-center justify-center flex-1">
  <div className="relative h-[90%] aspect-2/3 max-w-full">
    <Image
      src="/Cards/board-bg.jpg"
      alt="Tabuleiro"
      fill
      priority
      className="object-cover rounded-lg"
    />

    {/* Container das 4 linhas */}
    <div className="absolute inset-0 flex flex-col justify-between py-10">
      {/* 1) CPU BACK */}
      <BoardMonster owner="CPU" position="BACK" />

      {/* 2) CPU FRONT */}
      <BoardMonster owner="CPU" position="FRONT" />

      {/* 3) PLAYER FRONT */}
      <BoardMonster owner="PLAYER" position="FRONT" />

      {/* 4) PLAYER BACK */}
      <BoardMonster owner="PLAYER" position="BACK" />
    </div>
  </div>
</section>


      {/* 🔵 BASE — JOGADOR */}
      <section className="grid grid-cols-[auto_1fr_auto] items-center px-6 pb-4">

        {/* Vitórias jogador */}
        <div className="
          flex flex-col items-center justify-center
          min-w-20
          bg-emerald-600/20 border border-emerald-500
          text-emerald-300
          rounded-lg px-3 py-2
        ">
          <span className="text-xs uppercase tracking-wide">
            Vitória
          </span>
          <span className="text-2xl font-bold">
            {playerVP}/10
          </span>
        </div>

        {/* Mão jogador */}
        <div className="absolute bottom-0 left-0 w-full flex justify-center">
          <PlayerHand />
        </div>
        <div className=" bottom-0 left-0 w-full flex justify-center"></div>

        {/* Deck jogador */}
        <div className="relative left-2 w-24 h-36">
          <Image
            src="/Cards/verso.jpg"
            alt="Deck jogador"
            fill
            className="object-cover rounded shadow-lg"
          />
          <span className="absolute bottom-2 left-1/2 -translate-x-1/2
            bg-black/70 text-white text-xs px-2 py-1 rounded-full">
            {deckPlayer} cartas
          </span>
        </div>

      </section>
    </main>
  )
}
