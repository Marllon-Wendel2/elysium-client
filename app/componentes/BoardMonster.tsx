'use client'

import Image from "next/image"
import useGameStore from "../store/gameStore"

interface BoardMonsterProps {
  owner: "PLAYER" | "CPU"
  position: Position // "FRONT" | "BACK"
}

const CARD_WIDTH = 96
const CARD_HEIGHT = 144

const CARD_BORDER_BY_CLASS: Record<string, string> = {
  cidadao: "border-blue-400",
  exercito: "border-red-500",
  mago: "border-purple-500",
  nobre: "border-yellow-400",
}

export default function BoardMonster({ owner, position }: BoardMonsterProps) {
  const allSlots = useGameStore((state) => state.board.slots)

  const slots = allSlots
    .filter((s) => s.owner === owner && s.position === position)
    .sort((a, b) => a.lane - b.lane)

  const isEnemy = owner === "CPU"

  return (
    <div className="flex justify-center gap-4">
      {[1, 2, 3].map((lane) => {
        const slot = slots.find((s) => s.lane === lane)

        const borderColor = isEnemy
          ? "border-neutral-400"
          : CARD_BORDER_BY_CLASS[slot?.card?.class ?? ""] ?? "border-neutral-400"

        return (
          <div
            key={`${owner}-${position}-${lane}`}
            style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
            className={`
              relative border-2 ${borderColor}
              rounded-lg shadow-lg overflow-hidden
              bg-black/20 flex items-center justify-center
            `}
          >
            {slot?.card ? (
              <Image
                src={slot.card.art}
                alt={slot.card.name}
                fill
                className={`object-cover transform-gpu ${isEnemy ? "rotate-180" : ""}`}
              />
            ) : (
              <span className="text-gray-500 text-xs">Vazio</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
