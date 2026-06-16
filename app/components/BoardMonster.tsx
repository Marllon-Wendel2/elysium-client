'use client'

import Image from "next/image"
import useGameStore from "../store/gameStore"
import { useState } from "react"
import CardDetailsInBoard from "./Modals/CardModalInBoard"
import type { BoardSlot as BoardSlotType } from "../types/game"

interface BoardMonsterProps {
  owner: "PLAYERONE" | "PLAYERTWO"  // Mudou: PLAYER/CPU → PLAYERONE/PLAYERTWO
  position: "FRONT" | "BACK"
  attackingSlot?: any
  setAttackingSlot?: (slot: any) => void
}

const CARD_WIDTH = 96
const CARD_HEIGHT = 144

const CARD_BORDER_BY_CLASS: Record<string, string> = {
  citizen: "border-blue-400",
  army: "border-red-500",
  mage: "border-purple-500",
  noble: "border-yellow-400",
  spell: "border-cyan-400",
  equipment: "border-amber-400",
}

function BoardSlotCard({
  slot,
  isEnemy,
  onClick,
  isTarget,
  isAttackMode,
  isAttacker,
}: {
  slot: BoardSlotType
  isEnemy: boolean
  onClick: (slot: BoardSlotType) => void
  isTarget: boolean
  isAttackMode: boolean
  isAttacker: boolean
}) {
  const card = slot.cardInstance
  const isDimmed = isAttackMode && card && !isTarget && !isAttacker

  const borderColor = card
    ? (CARD_BORDER_BY_CLASS[card.base.class] ?? "border-neutral-400")
    : "border-neutral-700"

  return (
    <div
      onClick={() => onClick(slot)}
      style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
      className={`
        relative border-2 rounded-lg shadow-lg
        bg-black/20 flex items-center justify-center
        transition-all
        ${isTarget 
          ? "border-red-500 bg-red-500/20 cursor-crosshair animate-pulse" 
          : isAttacker 
            ? "border-yellow-500 bg-yellow-500/20" 
            : borderColor}
        ${isDimmed ? "opacity-50" : ""}
        ${card ? "cursor-pointer hover:brightness-110" : ""}
      `}
    >
      {card ? (
        <>
          {/* Equipamentos (se houver) */}
          {card.state.equipment?.map((equip, index) => (
            <div
              key={equip.instanceId}
              className="absolute w-full h-full rounded-lg overflow-hidden 
                         border border-neutral-600 bg-neutral-900 shadow-sm"
              style={{ top: (index + 1) * 15 }}
            >
              <Image
                src={equip.base.artUrl || '/Cards/verso.jpg'}
                alt={equip.base.name}
                fill
                className={`object-cover ${isEnemy ? "rotate-180" : ""}`}
                unoptimized
              />
            </div>
          ))}
          
          {/* Carta principal */}
          <div className="absolute inset-0 z-10 rounded-lg overflow-hidden">
            <Image
              src={card.base.artUrl || '/Cards/verso.jpg'}
              alt={card.base.name}
              fill
              className={`object-cover ${isEnemy ? "rotate-180" : ""}`}
              unoptimized
            />
            
            {/* Stats na carta */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-1 py-0.5
                            flex justify-between text-[10px] font-bold text-white">
              <span className="text-red-400">⚔️{card.state.currentAttack}</span>
              <span className="text-emerald-400">🛡️{card.state.currentLife}</span>
            </div>
          </div>
        </>
      ) : (
        <span className="text-neutral-600 text-xs">Vazio</span>
      )}
    </div>
  )
}

export default function BoardMonster({ 
  owner, 
  position, 
  attackingSlot, 
  setAttackingSlot 
}: BoardMonsterProps) {
  const [selectedSlot, setSelectedSlot] = useState<BoardSlotType | null>(null)
  const allSlots = useGameStore((state) => state.board.slots)

  // Filtrar slots deste owner e posição
  const slots = allSlots
    .filter((s) => s.owner === owner && s.position === position)
    .sort((a, b) => a.lane - b.lane)

  const isEnemy = owner === "PLAYERTWO"  // Mudou: CPU → PLAYERTWO
  const isAttackMode = !!attackingSlot

  // Verificar se um slot é alvo válido para ataque
  const checkIsTarget = (targetSlot: BoardSlotType) => {
    if (!attackingSlot || !targetSlot.cardInstance) return false
    if (targetSlot.owner === attackingSlot.owner) return false

    const range = attackingSlot.cardInstance?.base.range ?? 1
    const attackerPos = attackingSlot.position as string
    const targetPos = targetSlot.position

    if (range === 1) {
      if (attackerPos === 'BACK') return false
      if (attackerPos === 'FRONT') return targetPos === 'FRONT'
    } else if (range >= 2) {
      return true
    }
    return false
  }

  return (
    <>
      <div className="flex justify-center gap-4">
        {slots.map((slot) => {
          const slotId = `${owner}-${position}-${slot.lane}`
          const isTarget = checkIsTarget(slot)
          const isAttacker = attackingSlot && 
            attackingSlot.owner === slot.owner && 
            attackingSlot.position === slot.position && 
            attackingSlot.lane === slot.lane

          return (
            <BoardSlotCard
              key={slotId}
              slot={slot}
              isEnemy={isEnemy}
              isTarget={isTarget}
              isAttackMode={isAttackMode}
              isAttacker={!!isAttacker}
              onClick={(clickedSlot) => {
                if (attackingSlot && isTarget) {
                  console.log(`⚔️ Atacou ${clickedSlot.cardInstance?.base.name}!`)
                  setAttackingSlot?.(null)
                } else if (clickedSlot.cardInstance) {
                  setSelectedSlot(clickedSlot)
                }
              }}
            />
          )
        })}
      </div>

      {/* Modal de detalhes da carta no board */}
      {selectedSlot?.cardInstance && (
        <CardDetailsInBoard
          card={selectedSlot.cardInstance}
          isOpen={!!selectedSlot}
          onClose={() => setSelectedSlot(null)}
          isEnemy={isEnemy}
          onAttack={() => {
            if (setAttackingSlot) {
              setAttackingSlot(selectedSlot)
            }
            setSelectedSlot(null)
          }}
          onActivateEffect={() => {
            console.log("✨ Ativar efeito de:", selectedSlot.cardInstance?.base.name)
            setSelectedSlot(null)
          }}
          onDiscard={() => {
            console.log("🗑️ Descartar:", selectedSlot.cardInstance?.base.name)
            setSelectedSlot(null)
          }}
        />
      )}
    </>
  )
}