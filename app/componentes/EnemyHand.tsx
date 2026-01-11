'use client'

import useGameStore from "../store/gameStore"
import Image from "next/image"// ajuste se necessário

const CARD_WIDTH = 96
const MAX_WIDTH = 600

export default function EnemyHand() {
  const hand = useGameStore((state) => state.cpu.hand)

  const numberCards =
    typeof hand === "number"
      ? hand
      : Array.isArray(hand)
        ? hand.length
        : 0

  if (numberCards <= 0) return null

  const totalWidth = numberCards * CARD_WIDTH
  const overlap =
    numberCards > 1 && totalWidth > MAX_WIDTH
      ? (totalWidth - MAX_WIDTH) / (numberCards - 1)
      : 0

  return (
    <div className="flex justify-center">
      {Array.from({ length: numberCards }).map((_, index) => (
        <div
          key={index}
          className="relative h-36"
          style={{
            width: CARD_WIDTH,
            marginLeft: index === 0 ? 0 : -overlap,
            zIndex: index,
          }}
        >
          <Image
            src="/Cards/verso.jpg"
            alt="Carta inimiga"
            fill
            className="object-cover rounded"
          />
        </div>
      ))}
    </div>
  )
}
