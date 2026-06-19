'use client'

import useGameStore from "../../store/gameStore"
import { useGameSocket } from "../../hooks/useGameSocket"
import PixiGame from "../Pixi/PixiGame"
import type { PlayCardAction } from "../Pixi/PixiRender"

export default function GameScreen() {
  const { sendActions } = useGameSocket()
  const addAction = useGameStore((s) => s.addAction)
  const pendingActions = useGameStore((s) => s.pendingActions)
  const waitingForOpponent = useGameStore((s) => s.waitingForOpponent)
  const setWaitingForOpponent = useGameStore((s) => s.setWaitingForOpponent)
  const phase = useGameStore((s) => s.phase)

  const handlePlayCard = (action: PlayCardAction) => {
    console.log('🃏 Adicionando ação pendente:', action)
    addAction(action)
  }

  const handleConfirm = () => {
    if (pendingActions.length === 0) return
    console.log('📤 Confirmando jogadas:', pendingActions)
    sendActions(pendingActions)
    setWaitingForOpponent(true)
  }

  const isDeclarationPhase = phase === 'DECLARATION' || phase === 'STANDBY'

  return (
    <main className="relative w-screen h-screen">
      <PixiGame onPlayCard={handlePlayCard} />

      {/* Botão "Confirma jogadas" - lado esquerdo, centralizado verticalmente */}
      {isDeclarationPhase && !waitingForOpponent && (
        <button
          onClick={handleConfirm}
          disabled={pendingActions.length === 0}
          className="fixed left-4 top-1/2 -translate-y-1/2 z-50
            px-4 py-3 rounded-xl font-bold text-sm
            bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700
            text-white shadow-lg shadow-emerald-900/50
            disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-neutral-700
            transition-all duration-150
            writing-mode-vertical"
          style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
        >
          Confirma jogadas
          {pendingActions.length > 0 && (
            <span className="ml-2 text-xs bg-white/20 px-2 py-0.5 rounded-full">
              {pendingActions.length}
            </span>
          )}
        </button>
      )}

      {/* Spinner "Aguardando o adversário" - centro do board */}
      {waitingForOpponent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
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
