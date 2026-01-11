'use client'

import Image from "next/image"
import useGameStore from "../store/gameStore"

const CARD_WIDTH = 96
const MAX_WIDTH = 600

const CARD_BORDER_BY_CLASS: Record<string, string> = {
  cidadao: "border-blue-400",
  exercito: "border-red-500",
  mago: "border-purple-500",
  nobre: "border-yellow-400",
}

export default function PlayerHand() {
  const playerHand = useGameStore((state) => state.player.hand)

  if (!Array.isArray(playerHand) || playerHand.length === 0) {
    return null
  }

  const totalWidth = playerHand.length * CARD_WIDTH
  const overlap =
    playerHand.length > 1 && totalWidth > MAX_WIDTH
      ? (totalWidth - MAX_WIDTH) / (playerHand.length - 1)
      : 0

  return (
    <div className="flex justify-center">
      {playerHand.map((card, index) => {
        const borderColor =
          CARD_BORDER_BY_CLASS[card.class] ?? "border-neutral-400"

        return (
          <div
            key={card.id ?? index}
            className={`
              relative h-36
              border-2 ${borderColor}
              rounded-lg
              shadow-lg
              overflow-hidden
              transition-transform hover:-translate-y-4
            `}
            style={{
              width: CARD_WIDTH,
              marginLeft: index === 0 ? 0 : -overlap,
              zIndex: index,
            }}
          >
            {/* IMAGEM */}
            <Image
              src={card.art}
              alt={card.name}
              fill
              className="object-cover"
            />

            {/* ATAQUE */}
            <div className="
              absolute top-1 left-1
              bg-black/80 backdrop-blur
              text-white text-xs font-bold
              px-2 py-1 rounded-full
              flex items-center gap-1
            ">
              ⚔️ {card.attack}
            </div>

            {/* DEFESA */}
            <div className="
              absolute top-1 right-1
              bg-black/80 backdrop-blur
              text-white text-xs font-bold
              px-2 py-1 rounded-full
              flex items-center gap-1
            ">
              🛡️ {card.life}
            </div>
          </div>
        )
      })}
    </div>
  )
}
