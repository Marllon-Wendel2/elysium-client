'use client'

import { useState } from 'react'

interface SetupScreenProps {
  onSubmitSlots: (front: number, back: number) => void
  waitingOpponent: boolean
  error: string | null
}

export default function SetupScreen({
  onSubmitSlots,
  waitingOpponent,
  error,
}: SetupScreenProps) {
  const [frontSlots, setFrontSlots] = useState(5)
  const [backSlots, setBackSlots] = useState(5)
  const [localError, setLocalError] = useState('')

  const totalSlots = frontSlots + backSlots
  const isValid = totalSlots === 10 && frontSlots >= 1 && backSlots >= 1

  const handleSubmit = () => {
    setLocalError('')

    // Validações
    if (frontSlots < 1 || backSlots < 1) {
      setLocalError('É necessário pelo menos 1 slot em cada linha')
      return
    }

    if (totalSlots > 10) {
      setLocalError('O total de slots não pode passar de 10')
      return
    }

    if (totalSlots < 10) {
      setLocalError('O total de slots deve ser exatamente 10')
      return
    }

    onSubmitSlots(frontSlots, backSlots)
  }

  // ==========================================
  // TELA: AGUARDANDO OPONENTE
  // ==========================================
  if (waitingOpponent) {
    return (
      <div className="w-full h-full flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          {/* Animação de loading */}
          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="absolute inset-0 border-4 border-indigo-600/30 rounded-full" />
            <div className="absolute inset-0 border-4 border-t-indigo-500 rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl">⚔️</span>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white mb-3">
            Aguardando Oponente
          </h2>
          
          <p className="text-neutral-400 mb-6">
            Sua escolha foi confirmada! Aguardando o oponente definir o campo de batalha...
          </p>

          {/* Resumo da escolha */}
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4">
            <p className="text-xs text-neutral-500 mb-2">Sua escolha:</p>
            <div className="flex justify-center gap-4">
              <div className="text-center">
                <p className="text-sm text-red-400">🗡️ Frente</p>
                <p className="text-2xl font-bold text-white">{frontSlots}</p>
              </div>
              <div className="text-neutral-600">|</div>
              <div className="text-center">
                <p className="text-sm text-blue-400">🛡️ Retaguarda</p>
                <p className="text-2xl font-bold text-white">{backSlots}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ==========================================
  // TELA: ESCOLHA DE SLOTS
  // ==========================================
  return (
    <div className="w-full h-full flex items-center justify-center p-8">
      <div className="w-full max-w-2xl">
        {/* Cabeçalho */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">⚔️</div>
          <h1 className="text-3xl font-black text-white mb-2">
            Prepare seu Campo de Batalha
          </h1>
          <p className="text-neutral-400">
            Distribua 10 slots entre a linha de frente e a retaguarda
          </p>
        </div>

        {/* Cards de escolha */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* Linha de Frente */}
          <div className="bg-neutral-900 border border-red-500/20 rounded-2xl p-6 hover:border-red-500/40 transition-all">
            <div className="text-center mb-4">
              <span className="text-4xl">🗡️</span>
              <h2 className="text-xl font-bold text-white mt-2">
                Linha de Frente
              </h2>
              <p className="text-xs text-neutral-500 mt-1">
                Cartas aqui atacam diretamente o oponente
              </p>
            </div>

            {/* Controles */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setFrontSlots(Math.max(1, frontSlots - 1))}
                className="w-12 h-12 bg-neutral-800 hover:bg-red-900/50 text-white 
                           rounded-xl text-2xl font-bold transition-all"
                disabled={frontSlots <= 1}
              >
                -
              </button>
              
              <div className="text-center">
                <span className="text-4xl font-black text-white">
                  {frontSlots}
                </span>
                <p className="text-xs text-neutral-500">slots</p>
              </div>
              
              <button
                onClick={() => setFrontSlots(Math.min(9, frontSlots + 1))}
                className="w-12 h-12 bg-neutral-800 hover:bg-red-900/50 text-white 
                           rounded-xl text-2xl font-bold transition-all"
                disabled={totalSlots >= 10}
              >
                +
              </button>
            </div>
          </div>

          {/* Retaguarda */}
          <div className="bg-neutral-900 border border-blue-500/20 rounded-2xl p-6 hover:border-blue-500/40 transition-all">
            <div className="text-center mb-4">
              <span className="text-4xl">🛡️</span>
              <h2 className="text-xl font-bold text-white mt-2">
                Retaguarda
              </h2>
              <p className="text-xs text-neutral-500 mt-1">
                Cartas aqui ficam protegidas de ataques diretos
              </p>
            </div>

            {/* Controles */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setBackSlots(Math.max(1, backSlots - 1))}
                className="w-12 h-12 bg-neutral-800 hover:bg-blue-900/50 text-white 
                           rounded-xl text-2xl font-bold transition-all"
                disabled={backSlots <= 1}
              >
                -
              </button>
              
              <div className="text-center">
                <span className="text-4xl font-black text-white">
                  {backSlots}
                </span>
                <p className="text-xs text-neutral-500">slots</p>
              </div>
              
              <button
                onClick={() => setBackSlots(Math.min(9, backSlots + 1))}
                className="w-12 h-12 bg-neutral-800 hover:bg-blue-900/50 text-white 
                           rounded-xl text-2xl font-bold transition-all"
                disabled={totalSlots >= 10}
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Barra de total */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-neutral-400 text-sm">Total de Slots</span>
            <span className={`text-lg font-bold ${
              totalSlots === 10 ? 'text-emerald-500' : 'text-yellow-500'
            }`}>
              {totalSlots} / 10
            </span>
          </div>
          
          {/* Barra de progresso */}
          <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-300 ${
                totalSlots === 10 ? 'bg-emerald-500' : 
                totalSlots > 10 ? 'bg-red-500' : 'bg-indigo-500'
              }`}
              style={{ width: `${Math.min(totalSlots * 10, 100)}%` }}
            />
          </div>
        </div>

        {/* Mensagem de erro */}
        {(localError || error) && (
          <div className="mb-4 bg-red-500/10 border border-red-500/20 
                          text-red-400 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
            <span>⚠️</span>
            {localError || error}
          </div>
        )}

        {/* Botão confirmar */}
        <button
          onClick={handleSubmit}
          disabled={totalSlots !== 10}
          className="w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-500 
                     disabled:bg-neutral-800 disabled:text-neutral-600 
                     disabled:cursor-not-allowed
                     text-white font-bold text-lg rounded-xl transition-all 
                     flex items-center justify-center gap-2
                     transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <span>✅</span>
          {totalSlots === 10 
            ? 'Confirmar Formação' 
            : `Faltam ${10 - totalSlots} slots`}
        </button>
      </div>
    </div>
  )
}