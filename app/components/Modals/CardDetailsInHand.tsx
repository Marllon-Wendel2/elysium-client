'use client'

import Image from "next/image"
import type { CardInstance } from '../../types/cardInstance'


interface CardModalProps {
  card: CardInstance | null    // Mudou: Card → CardInstance
  isOpen: boolean
  onClose: () => void
  onPlay?: (card: CardInstance) => void     // Mudou
  onDiscard?: (card: CardInstance) => void  // Mudou
}

export default function CardModal({
  card,
  isOpen,
  onClose,
  onPlay,
  onDiscard,
}: CardModalProps) {
  if (!isOpen || !card) return null

  const { base, state, status } = card

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-105 max-w-[95%] rounded-2xl bg-neutral-900 border border-neutral-700 shadow-2xl p-5">

        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">
            {base.name}
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white text-lg"
          >
            ✕
          </button>
        </div>

        {/* Arte da carta */}
        <div className="relative w-full h-64 rounded-xl overflow-hidden mb-4">
          <Image
            src={base.artUrl}
            alt={base.name}
            fill
            className="object-cover"
            unoptimized  // Importante para URLs externas (Google Drive)
          />
        </div>

        {/* Tipo e Classe */}
        <div className="flex gap-2 mb-3">
          <span className="text-xs bg-neutral-800 text-neutral-300 px-2 py-1 rounded-full">
            {base.type}
          </span>
          <span className="text-xs bg-neutral-800 text-neutral-300 px-2 py-1 rounded-full capitalize">
            {base.class}
          </span>
          <span className="text-xs bg-neutral-800 text-neutral-300 px-2 py-1 rounded-full">
            {base.rarity}
          </span>
        </div>

        {/* Descrição */}
        <p className="text-sm text-neutral-400 mb-4">
          {base.description}
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
          <Stat label="Mana" value={base.mana} />
          <Stat label="Energia" value={`${state.currentEnergy}/${base.energy}`} />
          <Stat label="Ataque" value={`${state.currentAttack} (base: ${base.attack})`} />
          <Stat label="Vida" value={`${state.currentLife} (base: ${base.life})`} />
          {base.range > 0 && (
            <Stat label="Alcance" value={base.range} />
          )}
        </div>

        {/* Habilidades */}
        {base.ability && base.ability.length > 0 && (
          <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-sm mb-4">
            <div className="font-semibold text-white mb-2">Habilidades</div>
            {base.ability.map((ab, i) => (
              <div key={i} className="text-neutral-300 text-xs mb-1">
                <span className="text-indigo-400 font-bold">{ab.trigger}</span>
                : {ab.effect}
              </div>
            ))}
          </div>
        )}

        {/* Status Effects */}
        {status && status.length > 0 && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-sm mb-4">
            <div className="font-semibold text-yellow-400 mb-1">Efeitos Ativos</div>
            {status.map((s, i) => (
              <span key={i} className="text-yellow-300 text-xs">{s}</span>
            ))}
          </div>
        )}

        {/* Evolução */}
        {base.evolvesFromId && (
          <div className="text-xs text-purple-400 mb-4">
            🔄 Evolui de outra carta
          </div>
        )}

        {/* AÇÕES */}
        <div className="flex gap-3">
          <button
            onClick={() => onPlay?.(card)}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg transition"
          >
            Jogar
          </button>

          <button
            onClick={() => onDiscard?.(card)}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg transition"
          >
            Descartar
          </button>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between bg-neutral-800 rounded-md px-3 py-2 border border-neutral-700">
      <span className="text-neutral-400">{label}</span>
      <span className="font-bold text-white">{value}</span>
    </div>
  )
}