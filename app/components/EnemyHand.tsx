'use client'

import useGameStore from "../store/gameStore"
import Image from "next/image"

const CARD_WIDTH = 96
const MAX_WIDTH = 600

export default function EnemyHand() {
  // Mudou: state.cpu.hand → state.opponent.handCount
  const handCount = useGameStore((state) => state.opponent.handCount)

  if (!handCount || handCount <= 0) return null

  const totalWidth = handCount * CARD_WIDTH
  const overlap =
    handCount > 1 && totalWidth > MAX_WIDTH
      ? (totalWidth - MAX_WIDTH) / (handCount - 1)
      : 0

  return (
    <div className="flex justify-center">
      {Array.from({ length: handCount }).map((_, index) => (
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
            alt="Carta do oponente"
            fill
            className="object-cover rounded"
          />
        </div>
      ))}
    </div>
  )
}