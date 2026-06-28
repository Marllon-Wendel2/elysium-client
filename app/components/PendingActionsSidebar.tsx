'use client'

import { useState } from 'react'
import useGameStore from '../store/gameStore'
import type { PlayCardAction } from '../types/actions'

interface PendingActionsSidebarProps {
  onConfirm: () => void
}

const POSITION_LABELS: Record<string, string> = {
  FRONT: 'Frontal',
  BACK: 'Traseira',
}

const POSITION_ICONS: Record<string, string> = {
  FRONT: '⚔️',
  BACK: '🛡️',
}

const LANE_LABELS: Record<number, string> = {
  0: 'Esquerda',
  1: 'Centro',
  2: 'Direita',
}

function formatAction(action: unknown): { icon: string; label: string; detail: string; cardName: string; cardArt: string; cardType: string } | null {
  if (!action || typeof action !== 'object') return null

  const act = action as Record<string, unknown>

  if (act.type === 'DOWN_CARD') {
    const playCard = action as PlayCardAction
    const card = playCard.cardInstance?.base
    const target = playCard.targetSlot

    return {
      icon: '🃏',
      label: 'Jogar Carta',
      detail: `${LANE_LABELS[target?.lane] ?? `Lane ${target?.lane}`} · ${POSITION_LABELS[target?.position] ?? target?.position}`,
      cardName: card?.name ?? 'Carta',
      cardArt: card?.artUrl ?? '',
      cardType: card?.type ?? 'UNIT',
    }
  }

  return {
    icon: '❓',
    label: 'Ação Desconhecida',
    detail: String(act.type || 'N/A'),
    cardName: '???',
    cardArt: '',
    cardType: '',
  }
}

const TYPE_BADGE_COLORS: Record<string, string> = {
  UNIT: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  SPELL: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  EQUIPMENT: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
}

export default function PendingActionsSidebar({ onConfirm }: PendingActionsSidebarProps) {
  const [isOpen, setIsOpen] = useState(true)
  const pendingActions = useGameStore((s) => s.pendingActions)
  const removeAction = useGameStore((s) => s.removeAction)
  const clearPendingActions = useGameStore((s) => s.clearPendingActions)
  const waitingForOpponent = useGameStore((s) => s.waitingForOpponent)
  const phase = useGameStore((s) => s.phase)
  const turn = useGameStore((s) => s.turn)
  const player = useGameStore((s) => s.player)

  const isDeclarationPhase = phase === 'DECLARATION' || phase === 'STANDBY'
  const actionCount = pendingActions.length

  return (
    <>
      {/* Toggle button - always visible */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-[60]
          bg-neutral-900/90 hover:bg-neutral-800/90
          border border-neutral-700/50 border-r-0
          rounded-l-xl px-2 py-4
          transition-all duration-300 ease-out
          group"
        title={isOpen ? 'Fechar painel' : 'Abrir painel de ações'}
      >
        <div className="flex flex-col items-center gap-2">
          <svg
            className={`w-4 h-4 text-neutral-400 group-hover:text-white transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          {actionCount > 0 && (
            <span className="absolute -top-1 -left-1 w-5 h-5 bg-emerald-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
              {actionCount}
            </span>
          )}
        </div>
      </button>

      {/* Sidebar panel */}
      <div
        className={`fixed right-0 top-0 h-screen z-50
          transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ width: '340px' }}
      >
        <div className="h-full flex flex-col
          bg-neutral-950/85 backdrop-blur-xl
          border-l border-neutral-700/40
          shadow-2xl shadow-black/50">

          {/* Header */}
          <div className="px-4 pt-4 pb-3 border-b border-neutral-800/60">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">📋</span>
                <h2 className="text-white font-bold text-sm tracking-wide">
                  Ações Pendentes
                </h2>
              </div>
              {actionCount > 0 && (
                <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/30">
                  {actionCount}
                </span>
              )}
            </div>

            {/* Game info bar */}
            <div className="flex items-center gap-3 text-[11px] text-neutral-500">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                Turno {turn}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                {phase === 'DECLARATION' ? 'Declaração' : phase === 'STANDBY' ? 'Preparação' : phase}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                {player.manaAvailable}/{player.totalMana} Mana
              </span>
            </div>
          </div>

          {/* Actions list */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 scrollbar-thin">
            {actionCount === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="w-16 h-16 mb-4 rounded-2xl bg-neutral-900/60 border border-neutral-800/50 flex items-center justify-center">
                  <span className="text-3xl opacity-40">🎯</span>
                </div>
                <p className="text-neutral-500 text-sm font-medium mb-1">
                  Nenhuma ação pendente
                </p>
                <p className="text-neutral-600 text-xs leading-relaxed">
                  Arraste cartas para o tabuleiro para criar ações
                </p>
              </div>
            ) : (
              pendingActions.map((action, index) => {
                const info = formatAction(action)
                if (!info) return null

                return (
                  <div
                    key={index}
                    className="group relative
                      bg-neutral-900/70 hover:bg-neutral-900/90
                      border border-neutral-800/60 hover:border-neutral-700/60
                      rounded-xl p-3
                      transition-all duration-200
                      animate-slideIn"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Action number badge */}
                    <div className="absolute -top-1.5 -left-1.5 w-5 h-5 
                      bg-emerald-600 text-white text-[10px] font-bold 
                      rounded-full flex items-center justify-center
                      shadow-md shadow-emerald-900/50">
                      {index + 1}
                    </div>

                    {/* Remove button */}
                    <button
                      onClick={() => removeAction(index)}
                      className="absolute top-2 right-2 w-5 h-5 
                        bg-neutral-800 hover:bg-red-900/80 
                        rounded-full flex items-center justify-center
                        opacity-0 group-hover:opacity-100
                        transition-all duration-150"
                      title="Remover ação"
                    >
                      <svg className="w-3 h-3 text-neutral-500 group-hover:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>

                    <div className="flex items-start gap-3">
                      {/* Card thumbnail */}
                      {info.cardArt ? (
                        <div className="w-11 h-14 rounded-lg overflow-hidden border border-neutral-700/50 flex-shrink-0 bg-neutral-800">
                          <img
                            src={info.cardArt}
                            alt={info.cardName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-11 h-14 rounded-lg border border-neutral-700/50 flex-shrink-0 bg-neutral-800 flex items-center justify-center">
                          <span className="text-lg">{info.icon}</span>
                        </div>
                      )}

                      {/* Action info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-white text-xs font-bold truncate">
                            {info.cardName}
                          </span>
                          {info.cardType && (
                            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${TYPE_BADGE_COLORS[info.cardType] || 'bg-neutral-800 text-neutral-400 border-neutral-700'}`}>
                              {info.cardType}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs">{POSITION_ICONS[info.detail.includes('Frontal') ? 'FRONT' : 'BACK']}</span>
                          <span className="text-neutral-400 text-[11px]">
                            {info.label}
                          </span>
                        </div>
                        <div className="text-neutral-500 text-[10px] mt-0.5">
                          → {info.detail}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer with confirm button */}
          {isDeclarationPhase && !waitingForOpponent && (
            <div className="px-3 py-3 border-t border-neutral-800/60">
              <button
                onClick={onConfirm}
                disabled={actionCount === 0}
                className={`w-full py-3 px-4 rounded-xl font-bold text-sm
                  transition-all duration-200
                  flex items-center justify-center gap-2
                  ${actionCount > 0
                    ? 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white shadow-lg shadow-emerald-900/40 hover:shadow-emerald-800/60'
                    : 'bg-neutral-800 text-neutral-600 cursor-not-allowed'
                  }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Confirmar Jogadas
                {actionCount > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                    {actionCount}
                  </span>
                )}
              </button>

              {actionCount > 0 && (
                <button
                  onClick={clearPendingActions}
                  className="w-full mt-2 py-2 px-4 
                    bg-transparent hover:bg-neutral-800/50 
                    text-neutral-500 hover:text-red-400
                    rounded-lg transition-all text-xs
                    border border-transparent hover:border-neutral-700/50"
                >
                  Limpar tudo
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
