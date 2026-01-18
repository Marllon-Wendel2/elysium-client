'use client'

import Image from "next/image"
import EnemyHand from "./componentes/EnemyHand"
import PlayerHand from "./componentes/PlayerHand"
import useGameStore from "./store/gameStore"
import BoardMonster from "./componentes/BoardMonster"

import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'

export default function Home() {
  const deckPlayer = useGameStore((state) => state.player.deck)
  const deckEnemy = useGameStore((state) => state.cpu.deck)
  const manaAvailable = useGameStore((state) => state.player.manaAvailable)
  const manaAvailableCpu = useGameStore((state) => state.cpu.manaAvailable)
  const playerVP = useGameStore((state) => state.player.victoryPoints)
  const enemyVP = useGameStore((state) => state.cpu.victoryPoints)

    const sensors = useSensors(
      useSensor(PointerSensor, {
        activationConstraint: { distance: 8 },
      })
    )
    function handleDragEnd(event: DragEndEvent) {
      const { active, over } = event
  
      if (!over) {
        console.log('❌ Drop fora de slot')
        return
      }
  
      console.log('✅ Carta:', active.id)
      console.log('🎯 Slot:', over.id)
    }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
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

        <div className="flex flex-col gap-2 items-center">
          {/* Mana Counter Enemy */}
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
        </div>

      </section>

      {/* 🟢 CENTRO — BOARD */}
      <section className="flex items-center justify-center flex-1">
      <div className="relative h-[90%] aspect-2/3 max-w-full">
        <Image
          src="/Cards/bord.jpg"
          alt="Tabuleiro"
          fill
          priority
          className="object-cover rounded-lg"
        />

        {/* Container das 4 linhas */}
        <div className="absolute inset-0 flex flex-col justify-between py-10">
          <BoardMonster owner="CPU" position="BACK" />

          <BoardMonster owner="CPU" position="FRONT" />

          <BoardMonster owner="PLAYER" position="FRONT" />

          <BoardMonster owner="PLAYER" position="BACK" />
        </div>
      </div>
    </section>


      {/* 🔵 BASE — JOGADOR */}
      <section className="grid grid-cols-[auto_1fr_auto] items-center px-6 pb-4">

        <div className="flex flex-col gap-2 z-10 items-center">
          {/* Mana Counter */}
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

          {/* Vitórias jogador */}
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
    </DndContext>
  )
}
