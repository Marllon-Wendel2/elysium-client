'use client'

import Image from "next/image"
import type { CardInstance } from "../../types/game"

interface CardModalInBoardProps {
  card: CardInstance | null
  isOpen: boolean
  onClose: () => void
  isEnemy: boolean
  onAttack?: () => void
  onActivateEffect?: () => void
  onDiscard?: () => void
}

export default function CardModalInBoard({
  card,
  isOpen,
  onClose,
  isEnemy,
  onAttack,
  onActivateEffect,
  onDiscard,
}: CardModalInBoardProps) {
  if (!isOpen || !card) return null

  const { base, state } = card

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-80 max-w-[95%] rounded-2xl bg-neutral-900 
                      border border-neutral-700 shadow-2xl p-5">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">{base.name}</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white text-lg">
            ✕
          </button>
        </div>

        {/* Arte */}
        <div className="relative w-full h-48 rounded-xl overflow-hidden mb-4">
          <Image
            src={base.artUrl || '/Cards/verso.jpg'}
            alt={base.name}
            fill
            className="object-cover"
            unoptimized
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 text-sm mb-4">
          <Stat label="Ataque" value={`${state.currentAttack} (base: ${base.attack})`} />
          <Stat label="Vida" value={`${state.currentLife} (base: ${base.life})`} />
          <Stat label="Energia" value={`${state.currentEnergy}/${base.energy}`} />
          <Stat label="Alcance" value={base.range} />
        </div>

        {/* Efeitos ativos */}
        {card.status.length > 0 && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2 mb-4">
            <p className="text-xs text-yellow-400 font-bold mb-1">Efeitos:</p>
            {card.status.map((s, i) => (
              <span key={i} className="text-xs text-yellow-300">{s} </span>
            ))}
          </div>
        )}

        {/* Ações (só para cartas do jogador) */}
        {!isEnemy && (
          <div className="flex flex-col gap-2">
            {!state.hasAttacked && (
              <button
                onClick={onAttack}
                className="w-full py-2 bg-red-600 hover:bg-red-500 text-white 
                           font-bold rounded-lg transition-all text-sm"
              >
                ⚔️ Atacar
              </button>
            )}
            
            {state.currentEnergy > 0 && base.ability.length > 0 && (
              <button
                onClick={onActivateEffect}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white 
                           font-bold rounded-lg transition-all text-sm"
              >
                ✨ Ativar Habilidade ({state.currentEnergy}⚡)
              </button>
            )}

            <button
              onClick={onDiscard}
              className="w-full py-2 bg-neutral-700 hover:bg-red-900/50 text-neutral-400 
                         hover:text-red-400 rounded-lg transition-all text-sm"
            >
              🗑️ Remover
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between bg-neutral-800 rounded-md px-3 py-2 border border-neutral-700">
      <span className="text-neutral-400 text-xs">{label}</span>
      <span className="font-bold text-white text-xs">{value}</span>
    </div>
  )
}