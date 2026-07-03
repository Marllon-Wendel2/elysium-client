'use client'

import useGameStore from "../../store/gameStore"
import PixiGame from "../Pixi/PixiGame"
import type { PlayCardAction } from "../Pixi/PixiRender"
import type { BoardSlot } from "../../types/board"
import type { CardInstance } from "../../types/cardInstance"

interface GameScreenProps {
  sendActions: (actions: unknown[]) => void
}

export default function GameScreen({ sendActions }: GameScreenProps) {
  const addAction = useGameStore((s) => s.addAction)
  const pendingActions = useGameStore((s) => s.pendingActions)
  const clearPendingActions = useGameStore((s) => s.clearPendingActions)
  const removeAction = useGameStore((s) => s.removeAction)
  const waitingForOpponent = useGameStore((s) => s.waitingForOpponent)
  const setWaitingForOpponent = useGameStore((s) => s.setWaitingForOpponent)

  const handlePlayCard = (action: PlayCardAction) => {
    console.log('🃏 Adicionando ação pendente:', action)
    addAction(action)
  }

  const handleConfirm = () => {
    if (pendingActions.length === 0) return
    console.log('📤 Confirmando jogadas:', pendingActions)
    sendActions(pendingActions)
    clearPendingActions()
    setWaitingForOpponent(true)
  }

  const handleRemoveAction = (index: number) => {
    removeAction(index)
  }

  const handlePass = () => {
    console.log('⏭ Passando a vez sem ações')
    sendActions([])
    clearPendingActions()
    setWaitingForOpponent(true)
  }

  const handleActionPerformed = (actionId: string, slot: BoardSlot, card: CardInstance) => {
    console.log('🎯 Ação selecionada:', actionId, '| Carta:', card.base.name, '| Slot:', slot.owner, slot.position, slot.lane)
  }

  return (
    <main className="relative w-screen h-screen">
      <PixiGame
        onPlayCard={handlePlayCard}
        onActionPerformed={handleActionPerformed}
        onConfirm={handleConfirm}
        onPass={handlePass}
        onRemoveAction={handleRemoveAction}
      />

      {/* Spinner "Aguardando o adversário" - centro do board */}
      {waitingForOpponent && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center gap-4 bg-black/70 backdrop-blur-sm px-8 py-6 rounded-2xl">
            <div className="spinner" />
            <span className="text-white font-semibold text-lg tracking-wide">
              Aguardando o adversário
            </span>
          </div>
        </div>
      )}
    </main>
  )
}
