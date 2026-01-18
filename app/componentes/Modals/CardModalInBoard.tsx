'use client'

import Image from "next/image"

interface CardModalInBoardProps {
  card: Card | null
  isOpen: boolean
  onClose: () => void
  onAttack?: (card: Card) => void
  onActivateEffect?: (card: Card) => void
  onDiscard?: (card: Card) => void
}

export default function CardDetailsInBoard({
  card,
  isOpen,
  onClose,
  onAttack,
  onActivateEffect,
  onDiscard,
}: CardModalInBoardProps) {
  if (!isOpen || !card) return null

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
            {card.name}
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white text-lg"
          >
            ✕
          </button>
        </div>

        {/* Arte da carta (MAIOR) */}
        <div className="relative w-full h-132 rounded-xl overflow-hidden mb-4">
          <Image
            src={card.art}
            alt={card.name}
            fill
            className="object-cover"
          />
        </div>

        {/* Classe */}
        <div className="text-sm text-neutral-300 mb-3">
          Classe:{" "}
          <span className="font-semibold capitalize">
            {card.class}
          </span>
        </div>

        {/* Valores */}
        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
          {card.mana !== undefined && (
            <Stat label="Mana" value={card.mana} />
          )}
          {card.energy !== undefined && (
            <Stat label="Energia" value={card.energy} />
          )}
          {card.attack !== undefined && (
            <Stat label="Ataque" value={card.attack} />
          )}
          {card.life !== undefined && (
            <Stat label="Vida" value={card.life} />
          )}
        </div>

        {/* Efeito */}
        {card.effect && (
          <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-sm text-neutral-200 mb-5">
            <div className="font-semibold mb-1">Efeito</div>
            <div>
              <span className="capitalize">
                {card.effect.type.toLowerCase()}
              </span>{" "}
              ({card.effect.value})
            </div>
          </div>
        )}

        {/* AÇÕES */}
        <div className="flex gap-3">
          <button
            onClick={() => onAttack?.(card)}
            className="
              flex-1
              bg-red-600 hover:bg-red-700
              text-white font-bold
              py-2 rounded-lg
              transition
            "
          >
            Atacar
          </button>

          <button
            onClick={() => onActivateEffect?.(card)}
            className="
              flex-1
              bg-blue-600 hover:bg-blue-700
              text-white font-bold
              py-2 rounded-lg
              transition
            "
          >
            Ativar
          </button>

          <button
            onClick={() => onDiscard?.(card)}
            className="
              flex-1
              bg-neutral-600 hover:bg-neutral-700
              text-white font-bold
              py-2 rounded-lg
              transition
            "
          >
            Descartar
          </button>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between bg-neutral-800 rounded-md px-3 py-2 border border-neutral-700">
      <span className="text-neutral-400">{label}</span>
      <span className="font-bold text-white">{value}</span>
    </div>
  )
}
