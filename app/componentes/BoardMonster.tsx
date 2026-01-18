'use client'

import { useDroppable } from "@dnd-kit/core"
import Image from "next/image"
import useGameStore from "../store/gameStore"
import { useState } from "react"
import CardDetailsInBoard from "./Modals/CardModalInBoard"

interface BoardMonsterProps {
  owner: "PLAYER" | "CPU"
  position: Position
  attackingSlot?: any
  setAttackingSlot?: (slot: any) => void
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
  isTarget,
}: {
  id: string
  slot: any
  isEnemy: boolean
  onClick: (card: any) => void
  isTarget: boolean
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
      onClick={() => slot && onClick(slot)}
      style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
      className={`
        relative border-2
        rounded-lg shadow-lg overflow-hidden
        bg-black/20 flex items-center justify-center
        transition-colors
        ${isTarget ? "border-red-500 bg-red-500/20 cursor-crosshair animate-pulse" : isOver ? "bg-green-500/30 border-green-400" : borderColor}
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

export default function BoardMonster({ owner, position, attackingSlot, setAttackingSlot }: BoardMonsterProps) {
  const [selectedSlot, setSelectedSlot] = useState<any | null>(null)
  const allSlots = useGameStore((state) => state.board.slots)

  const slots = allSlots
    .filter((s) => s.owner === owner && s.position === position)
    .sort((a, b) => a.lane - b.lane)

  const isEnemy = owner === "CPU"

  // Lógica para verificar se um slot é um alvo válido
  const checkIsTarget = (targetSlot: any) => {
    if (!attackingSlot) return false
    if (!targetSlot?.card) return false // Só pode atacar slots com cartas
    if (targetSlot.owner === attackingSlot.owner) return false // Não pode atacar aliados

    const range = (attackingSlot.card as any).range ?? 1 // Assume range 1 se não definido
    const attackerPos = attackingSlot.position
    const targetPos = targetSlot.position

    if (range === 1) {
      // Range 1: Se estiver atrás, não ataca ninguém.
      if (attackerPos === 'BACK') return false
      // Se estiver na frente, ataca apenas a frente inimiga.
      if (attackerPos === 'FRONT') {
         return targetPos === 'FRONT'
      }
    } else if (range >= 2) {
      // Range 2+: Ataca qualquer posição inimiga
       return true
    }
    return false
  }

  return (
    <>
    <div className="flex justify-center gap-4">
      {[1, 2, 3].map((lane) => {
        const slot = slots.find((s) => s.lane === lane)
        const slotId = `${owner}-${position}-${lane}`
        const isTarget = checkIsTarget(slot)

        return (
          <BoardSlot
            key={slotId}
            id={slotId}
            slot={slot}
            isEnemy={isEnemy}
            isTarget={isTarget}
            onClick={(clickedSlot) => {
              if (isTarget) {
                console.log(`⚔️ ${attackingSlot.card.name} atacou ${clickedSlot.card.name}!`)
                setAttackingSlot?.(null) // Reseta o ataque após o clique
              } else if (clickedSlot.card) {
                // Se não for alvo, abre detalhes (se tiver carta)
                setSelectedSlot(clickedSlot)
                setAttackingSlot?.(null) // Cancela ataque anterior se clicar em outra carta
              }
            }}
          />
        )
      })}
    </div>

    <CardDetailsInBoard
      card={selectedSlot?.card}
      isOpen={!!selectedSlot}
      onClose={() => setSelectedSlot(null)}
      onAttack={(card) => {
        console.log("⚔️ Preparando ataque com:", card.name)
        // Define o slot atual como atacante
        if (selectedSlot && setAttackingSlot) {
          setAttackingSlot(selectedSlot)
        }
        setSelectedSlot(null)
      }}
      onActivateEffect={(card) => {
        console.log("✨ Ativar efeito de:", card.name)
        setSelectedSlot(null)
      }}
      onDiscard={(card) => {
        console.log("🗑️ Descartar:", card.name)
        setSelectedSlot(null)
      }}
    />
    </>
  )
}
