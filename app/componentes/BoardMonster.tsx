'use client'

import { useDroppable } from "@dnd-kit/core"
import Image from "next/image"
import useGameStore from "../store/gameStore"
import { useState } from "react"
import CardDetailsInBoard from "./Modals/CardModalInBoard"

interface BoardMonsterProps {
  owner: "PLAYER" | "CPU"
  position: Position
}

const CARD_WIDTH = 96
const CARD_HEIGHT = 144

const CARD_BORDER_BY_CLASS: Record<string, string> = {
  cidadao: "border-blue-400",
  exercito: "border-red-500",
  mago: "border-purple-500",
  nobre: "border-yellow-400",
}

function BoardSlot({
  id,
  slot,
  isEnemy,
  onClick,
}: {
  id: string
  slot: any
  isEnemy: boolean
  onClick: (card: any) => void
}) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    disabled: isEnemy,
  })

  const borderColor = isEnemy
    ? "border-neutral-400"
    : CARD_BORDER_BY_CLASS[slot?.card?.class ?? ""] ?? "border-neutral-400"

  return (
    <div
      ref={setNodeRef}
      onClick={() => slot?.card && onClick(slot.card)}
      style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
      className={`
        relative border-2
        rounded-lg shadow-lg overflow-hidden
        bg-black/20 flex items-center justify-center
        transition-colors
        ${isOver ? "bg-green-500/30 border-green-400" : borderColor}
        ${slot?.card ? "cursor-pointer hover:brightness-110" : ""}
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
}

export default function BoardMonster({ owner, position }: BoardMonsterProps) {
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)
  const allSlots = useGameStore((state) => state.board.slots)

  const slots = allSlots
    .filter((s) => s.owner === owner && s.position === position)
    .sort((a, b) => a.lane - b.lane)

  const isEnemy = owner === "CPU"

  return (
    <>
    <div className="flex justify-center gap-4">
      {[1, 2, 3].map((lane) => {
        const slot = slots.find((s) => s.lane === lane)
        const slotId = `${owner}-${position}-${lane}`

        return (
          <BoardSlot
            key={slotId}
            id={slotId}
            slot={slot}
            isEnemy={isEnemy}
            onClick={setSelectedCard}
          />
        )
      })}
    </div>

    <CardDetailsInBoard
      card={selectedCard}
      isOpen={!!selectedCard}
      onClose={() => setSelectedCard(null)}
      onAttack={(card) => {
        console.log("⚔️ Atacar com:", card.name)
        setSelectedCard(null)
      }}
      onActivateEffect={(card) => {
        console.log("✨ Ativar efeito de:", card.name)
        setSelectedCard(null)
      }}
      onDiscard={(card) => {
        console.log("🗑️ Descartar:", card.name)
        setSelectedCard(null)
      }}
    />
    </>
  )
}
