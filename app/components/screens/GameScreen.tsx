'use client'

import Image from "next/image"
import EnemyHand from "../EnemyHand"
import PlayerHand from "../PlayerHand"
import useGameStore from "../../store/gameStore"
import BoardMonster from "../BoardMonster"
import { useState } from "react"

export default function GameScreen() {
  const phase = useGameStore((state) => state.phase)
  const turn = useGameStore((state) => state.turn)
  
  // Jogador (você)
  const playerHand = useGameStore((state) => state.player.hand)
  const deckCount = useGameStore((state) => state.player.deckCount)
  const manaAvailable = useGameStore((state) => state.player.manaAvailable)
  const totalMana = useGameStore((state) => state.player.totalMana)
  const playerVP = useGameStore((state) => state.player.victoryPoints)
  
  // Oponente
  const opponentDeckCount = useGameStore((state) => state.opponent.deckCount)
  const enemyVP = useGameStore((state) => state.opponent.victoryPoints)
  
  const [attackingSlot, setAttackingSlot] = useState<any | null>(null)

  // Determinar quem é você e quem é o oponente
  // Precisamos saber se você é PLAYERONE ou PLAYERTWO
  const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null
  const user = userStr ? JSON.parse(userStr) : null
  const myOwner = user?.id // Vamos comparar com os slots depois

  return (
    <main 
      className="w-screen h-screen bg-neutral-950 grid grid-rows-[auto_1fr_auto]"
      onClick={() => {
        if (attackingSlot) setAttackingSlot(null)
      }}
    >
      {/* 🔴 TOPO — OPONENTE */}
      <section className="grid grid-cols-[auto_1fr_auto] items-center px-6 pt-4">
        {/* Deck oponente */}
        <div className="relative w-24 h-36">
          <Image
            src="/Cards/verso.jpg"
            alt="Deck oponente"
            fill
            className="object-cover rounded shadow-lg"
          />
          <span className="absolute bottom-2 left-1/2 -translate-x-1/2
            bg-black/70 text-white text-xs px-2 py-1 rounded-full">
            {opponentDeckCount} cartas
          </span>
        </div>

        {/* Mão oponente */}
        <div className="flex justify-center">
          <EnemyHand />
        </div>

        {/* Info oponente */}
        <div className="flex flex-col gap-2 items-center">
          <div className="relative group flex flex-col items-center justify-center min-w-20
            bg-neutral-800/60 border border-neutral-700/30 text-neutral-500
            rounded-xl px-3 py-2 backdrop-blur-md">
            <span className="relative text-[10px] uppercase tracking-widest font-bold">
              Mana
            </span>
            <span className="text-2xl font-black">?</span>
          </div>

          <div className="flex flex-col items-center justify-center min-w-20
            bg-red-600/20 border border-red-500 text-red-300 rounded-lg px-3 py-2">
            <span className="text-xs uppercase tracking-wide">Vitória</span>
            <span className="text-2xl font-bold">{enemyVP}/10</span>
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

          {/* Slots do tabuleiro */}
          <div className="absolute inset-0 flex flex-col justify-between py-10">
            {/* Linha do oponente - BACK */}
            <BoardMonster 
              owner="PLAYERTWO" 
              position="BACK" 
              attackingSlot={attackingSlot} 
              setAttackingSlot={setAttackingSlot}
            />

            {/* Linha do oponente - FRONT */}
            <BoardMonster 
              owner="PLAYERTWO" 
              position="FRONT" 
              attackingSlot={attackingSlot} 
              setAttackingSlot={setAttackingSlot}
            />

            {/* Linha do jogador - FRONT */}
            <BoardMonster 
              owner="PLAYERONE" 
              position="FRONT" 
              attackingSlot={attackingSlot} 
              setAttackingSlot={setAttackingSlot}
            />

            {/* Linha do jogador - BACK */}
            <BoardMonster 
              owner="PLAYERONE" 
              position="BACK" 
              attackingSlot={attackingSlot} 
              setAttackingSlot={setAttackingSlot}
            />
          </div>
        </div>
      </section>

      {/* 🔵 BASE — JOGADOR */}
      <section className="grid grid-cols-[auto_1fr_auto] items-center px-6 pb-4">
        <div className="flex flex-col gap-2 z-10 items-center">
          <div className="relative group flex flex-col items-center justify-center min-w-20
            bg-indigo-950/60 border border-indigo-500/30 text-indigo-300
            rounded-xl px-3 py-2 backdrop-blur-md overflow-hidden
            shadow-[0_0_15px_rgba(99,102,241,0.15)]">
            <div className="absolute -inset-1 bg-indigo-500/20 blur-lg group-hover:bg-indigo-500/30 transition-all duration-500"></div>
            <span className="relative text-[10px] uppercase tracking-widest font-bold text-indigo-400">
              Mana
            </span>
            <div className="relative flex items-baseline gap-0.5">
              <span className="text-2xl font-black text-white drop-shadow-[0_0_8px_rgba(165,180,252,0.6)]">
                {manaAvailable}
              </span>
              <span className="text-sm text-indigo-400/70">/ {totalMana}</span>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center min-w-20
            bg-emerald-950/60 border border-emerald-500/30 text-emerald-400
            rounded-xl px-3 py-2 backdrop-blur-md">
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
        <div className="bottom-0 left-0 w-full flex justify-center"></div>

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
            {deckCount} cartas
          </span>
        </div>
      </section>

      {/* Indicador de Fase/Turno */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-neutral-900/80 
                      backdrop-blur-md border border-neutral-700 rounded-xl px-4 py-2
                      flex items-center gap-3 z-30">
        <span className="text-neutral-400 text-sm">
          Fase: <span className="text-white font-bold">{phase}</span>
        </span>
        <span className="text-neutral-600">|</span>
        <span className="text-neutral-400 text-sm">
          Turno: <span className="text-white font-bold">{turn}</span>
        </span>
      </div>
    </main>
  )
}