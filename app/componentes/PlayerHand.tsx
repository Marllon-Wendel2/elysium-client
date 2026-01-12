'use client'

import Image from "next/image"
import useGameStore from "../store/gameStore"
import { useState } from "react"
import CardModal from "./Modals/CardDetailsInHand"

const CARD_WIDTH = 96
const CARD_HEIGHT = 144
const CARD_EXPANDED_WIDTH = 128
const CARD_EXPANDED_HEIGHT = 192
const MAX_WIDTH = 600

const CARD_BORDER_BY_CLASS: Record<string, string> = {
  cidadao: "border-blue-400",
  exercito: "border-red-500",
  mago: "border-purple-500",
  nobre: "border-yellow-400",
}

export default function PlayerHand() {
  const playerHand = useGameStore((state) => state.player.hand)
  const showInfos = useGameStore((state) => state.showInfos)

  const [selectedCard, setSelectedCard] = useState<Card | null>(null)

  if (!Array.isArray(playerHand) || playerHand.length === 0) return null

  const totalWidth = playerHand.length * CARD_WIDTH
  const overlap =
    playerHand.length > 1 && totalWidth > MAX_WIDTH
      ? (totalWidth - MAX_WIDTH) / (playerHand.length - 1)
      : 0

  return (
    <div className="relative flex justify-center items-end">
      {playerHand.map((card, index) => {
        const borderColor =
          CARD_BORDER_BY_CLASS[card.class] ?? "border-neutral-400"

        return (
          <div
            key={card.id ?? index}
            className="
              relative group
              transition-all duration-200
              hover:-translate-y-6
              hover:z-50
            "
            onClick={() => setSelectedCard(card)}
            style={{
              marginLeft: index === 0 ? 0 : -overlap,
              zIndex: index,
            }}
          >
            {/* CARTA */}
            <div
              className={`
                relative
                border-2 ${borderColor}
                rounded-lg
                shadow-lg
                overflow-hidden
                transition-all duration-200
                group-hover::absolute
                group-hover:z-50
                group-hover:w-32
                group-hover:h-48
                group-hover:-top-6

                ${showInfos ? "absolute -top-6 w-32 h-48 z-50" : "w-24 h-36"}
              `}
            >
              <Image
                src={card.art}
                alt={card.name}
                fill
                className="object-cover"
              />

              {/* OVERLAY DE STATUS */}
              <div
                className={`
                  absolute inset-0
                  flex flex-col justify-between
                  p-2
                  text-xs font-bold text-white
                  pointer-events-none
                  transition-opacity duration-200

                  ${showInfos
                    ? "opacity-100"
                    : "opacity-0 group-hover:opacity-100"}
                `}
              >
                {/* TOPO */}
                <div className="flex justify-between">
                  <span className="bg-indigo-600/80 px-2 py-1 rounded-full shadow">
                    🔮 {card.mana}
                  </span>
                  <span className="bg-yellow-500/80 px-2 py-1 rounded-full shadow">
                    🔋 {card.energy}
                  </span>
                </div>

                {/* BASE */}
                <div className="flex justify-between">
                  <span className="bg-red-600/80 px-2 py-1 rounded-full shadow">
                    ⚔️ {card.attack}
                  </span>
                  <span className="bg-emerald-600/80 px-2 py-1 rounded-full shadow">
                    🛡️ {card.life}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    <CardModal
        card={selectedCard}
        isOpen={!!selectedCard}
        onClose={() => setSelectedCard(null)}
    />
    </div>
  )
}
