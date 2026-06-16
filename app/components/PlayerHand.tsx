'use client'

import { useState } from "react"
import useGameStore from "../store/gameStore"
import Card from "./Card"
import CardModal from "./Modals/CardDetailsInHand"
import type { CardInstance } from '../types/game'

const CARD_WIDTH = 96
const MAX_WIDTH = 600

export default function PlayerHand() {
  const playerHand = useGameStore((state) => state.player.hand)
  const showInfos = useGameStore((state) => state.showInfos)

  const [selectedCard, setSelectedCard] = useState<CardInstance | null>(null)

  if (!Array.isArray(playerHand) || playerHand.length === 0) return null

  const totalWidth = playerHand.length * CARD_WIDTH
  const overlap =
    playerHand.length > 1 && totalWidth > MAX_WIDTH
      ? (totalWidth - MAX_WIDTH) / (playerHand.length - 1)
      : 0

  return (
    <>
      <div className="relative flex justify-center items-end">
        {playerHand.map((card, index) => (
          <Card
            key={card.instanceId ?? index}    // Mudou: card.id → card.instanceId
            card={card}
            index={index}
            overlap={overlap}
            showInfos={showInfos}
            onSelect={setSelectedCard}
          />
        ))}

        <CardModal
          card={selectedCard}
          isOpen={!!selectedCard}
          onClose={() => setSelectedCard(null)}
        />
      </div>
    </>
  )
}