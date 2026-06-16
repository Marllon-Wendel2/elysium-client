'use client'

import Image from "next/image"
import EnemyHand from "../components/EnemyHand"
import PlayerHand from "../components/PlayerHand"
import useGameStore from "../store/gameStore"
import BoardMonster from "../components/BoardMonster"
import PixiGame from "../components/Pixi/PixiGame"
import { useState } from "react"

export default function Home() {
  const deckPlayer = useGameStore((state) => state.player.deck)
  const deckEnemy = useGameStore((state) => state.cpu.deck)
  const manaAvailable = useGameStore((state) => state.player.manaAvailable)
  const manaAvailableCpu = useGameStore((state) => state.cpu.manaAvailable)
  const playerVP = useGameStore((state) => state.player.victoryPoints)
  const enemyVP = useGameStore((state) => state.cpu.victoryPoints)
  const [attackingSlot, setAttackingSlot] = useState<any | null>(null)

  return (
    <main 
      className="w-screen h-screen bg-neutral-950 grid grid-rows-[auto_1fr_auto]"
      onClick={() => {
        if (attackingSlot) setAttackingSlot(null)
      }}
    >
      {/* 🔴 TOPO — INIMIGO */}
      <section className="grid grid-cols-[auto_1fr_auto] items-center px-6 pt-4">
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

        <div className="flex justify-center">
          <EnemyHand />
        </div>

        <div className="flex flex-col gap-2 items-center">
          <div className="
            relative group
            flex flex-col items-center justify-center
            min-w-20
            bg-indigo-950/60 border border-indigo-500/30
            text-indigo-300
            rounded-xl px-3 py-2
            backdrop-blur-md
            overflow-hidden
            shadow-[0_0_15px_rgba(99,102,241,0.15)]
          ">
            <div className="absolute -inset-1 bg-indigo-500/20 blur-lg group-hover:bg-indigo-500/30 transition-all duration-500"></div>
            <span className="relative text-[10px] uppercase tracking-widest font-bold text-indigo-400">
              Mana
            </span>
            <div className="relative flex items-baseline gap-0.5">
              <span className="text-2xl font-black text-white drop-shadow-[0_0_8px_rgba(165,180,252,0.6)]">
                {manaAvailableCpu}
              </span>
            </div>
          </div>

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
        </div>
      </section>

      {/* 🟢 CENTRO — BOARD */}
      <section className="flex items-center justify-center flex-1">
        <div className="relative w-full h-full max-w-5xl max-h-[80vh]">
          <PixiGame />
        </div>
      </section>

      {/* 🔵 BASE — JOGADOR */}
      <section className="grid grid-cols-[auto_1fr_auto] items-center px-6 pb-4">
        <div className="flex flex-col gap-2 z-10 items-center">
          <div className="
            relative group
            flex flex-col items-center justify-center
            min-w-20
            bg-indigo-950/60 border border-indigo-500/30
            text-indigo-300
            rounded-xl px-3 py-2
            backdrop-blur-md
            overflow-hidden
            shadow-[0_0_15px_rgba(99,102,241,0.15)]
          ">
            <div className="absolute -inset-1 bg-indigo-500/20 blur-lg group-hover:bg-indigo-500/30 transition-all duration-500"></div>
            <span className="relative text-[10px] uppercase tracking-widest font-bold text-indigo-400">
              Mana
            </span>
            <div className="relative flex items-baseline gap-0.5">
              <span className="text-2xl font-black text-white drop-shadow-[0_0_8px_rgba(165,180,252,0.6)]">
                {manaAvailable}
              </span>
            </div>
          </div>

          <div className="
            flex flex-col items-center justify-center
            min-w-20
            bg-emerald-950/60 border border-emerald-500/30
            text-emerald-400
            rounded-xl px-3 py-2
            backdrop-blur-md
          ">
            <span className="text-[10px] uppercase tracking-widest font-bold text-emerald-500">
              Vitória
            </span>
            <span className="text-2xl font-black">
              {playerVP}<span className="text-sm text-emerald-700">/10</span>
            </span>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 w-full flex justify-center">
          <PlayerHand />
        </div>
        <div className=" bottom-0 left-0 w-full flex justify-center"></div>

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