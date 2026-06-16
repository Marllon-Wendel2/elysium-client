'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useGameSocket } from '../hooks/useGameSocket'

export default function LobbyPage() {
  const router = useRouter()
  
  const {
    connect,
    createRoom,
    joinRoom,
    isConnected,
    roomId,
    isWaiting,
    error,
    setError,
    gamePhase,           // NOVO
    submitSlots,         // NOVO
    waitingOpponent,     // NOVO
  } = useGameSocket()

  const [userName, setUserName] = useState('')
  const [roomInput, setRoomInput] = useState('')
  const [showJoinInput, setShowJoinInput] = useState(false)
  const [copied, setCopied] = useState(false)

  // Estados do Setup
  const [frontSlots, setFrontSlots] = useState(5)
  const [backSlots, setBackSlots] = useState(5)
  const [setupError, setSetupError] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    const userStr = localStorage.getItem('user')

    if (!token || !userStr) {
      router.push('/')
      return
    }

    const user = JSON.parse(userStr)
    setUserName(user.firstName || user.name)

    connect()
  }, [])

  // Handlers do Lobby
  const handleCreateRoom = () => {
    setError('')
    createRoom()
  }

  const handleJoinRoom = () => {
    setError('')
    
    if (!roomInput.trim()) {
      setError('Digite o código da sala')
      return
    }

    joinRoom(roomInput)
  }

  const handleCopyRoomId = () => {
    if (roomId) {
      navigator.clipboard.writeText(roomId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    router.push('/')
  }

  // Handler do Setup (NOVO)
  const handleSubmitSlots = () => {
    setSetupError('')
    
    // Validação local
    if (frontSlots + backSlots > 10) {
      setSetupError('O total de slots não pode passar de 10')
      return
    }
    
    if (frontSlots < 1 || backSlots < 1) {
      setSetupError('É necessário pelo menos 1 slot em cada linha')
      return
    }

    submitSlots(frontSlots, backSlots)
  }

  return (
    <main className="w-screen h-screen bg-neutral-950 flex">
      {/* SIDEBAR ESQUERDA */}
      <aside className="w-80 bg-neutral-900 border-r border-neutral-800 flex flex-col p-6">
        
        {/* Perfil do Jogador */}
        <div className="flex items-center gap-4 mb-8 p-4 bg-neutral-800 rounded-xl">
          <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-xl font-bold text-white">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-white font-bold">{userName}</h2>
            <p className="text-neutral-400 text-sm">Jogador</p>
            
            {/* Indicador de Conexão */}
            <div className="flex items-center gap-1 mt-1">
              <div className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <span className="text-xs text-neutral-500">
                {isConnected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <nav className="flex flex-col gap-3 flex-1">
          
          {/* Botão Criar Sala */}
          <button
            onClick={handleCreateRoom}
            disabled={!isConnected}
            className="w-full py-4 px-4 bg-indigo-600 hover:bg-indigo-500 
                       disabled:bg-neutral-700 disabled:cursor-not-allowed 
                       text-white font-bold rounded-xl transition-all 
                       transform hover:scale-[1.02] active:scale-[0.98] 
                       flex items-center justify-center gap-2"
          >
            <span>🏰</span>
            Criar Sala
          </button>

          {/* Botão Entrar em Sala */}
          <button
            onClick={() => setShowJoinInput(!showJoinInput)}
            disabled={!isConnected}
            className="w-full py-4 px-4 bg-neutral-800 hover:bg-neutral-700 
                       disabled:bg-neutral-700 disabled:cursor-not-allowed 
                       text-white font-bold rounded-xl transition-all 
                       border border-neutral-700 flex items-center justify-center gap-2"
          >
            <span>🚪</span>
            Entrar em Sala
          </button>

          {showJoinInput && (
            <div className="space-y-2">
              <input
                type="text"
                value={roomInput}
                onChange={(e) => setRoomInput(e.target.value)}
                placeholder="Código da sala"
                className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 
                           rounded-xl text-white placeholder-neutral-500 
                           focus:outline-none focus:ring-2 focus:ring-indigo-500 
                           transition-all"
                onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
              />
              <button
                onClick={handleJoinRoom}
                className="w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-500 
                           text-white font-bold rounded-xl transition-all text-sm"
              >
                Entrar
              </button>
            </div>
          )}
        </nav>

        {error && (
          <div className="mt-4 bg-red-500/10 border border-red-500/20 
                          text-red-400 text-sm rounded-xl px-4 py-3">
            ⚠️ {error}
          </div>
        )}

        <button
          onClick={handleLogout}
          className="mt-auto w-full py-3 px-4 bg-neutral-800 
                     hover:bg-red-900/50 text-neutral-400 hover:text-red-400 
                     rounded-xl transition-all text-sm border border-neutral-700 
                     hover:border-red-800"
        >
          Sair
        </button>
      </aside>

      {/* ÁREA CENTRAL */}
      <section className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-32 h-32 mx-auto mb-6 bg-neutral-800 rounded-full 
                          flex items-center justify-center">
            <span className="text-6xl">⚔️</span>
          </div>
          <h1 className="text-3xl font-black text-white mb-2">
            Bem-vindo, {userName}!
          </h1>
          <p className="text-neutral-400">
            Crie uma nova sala ou entre em uma existente
          </p>
        </div>
      </section>

      {/* MODAL 1 - AGUARDANDO OPONENTE (LOBBY) */}
      {isWaiting && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm 
                        flex items-center justify-center z-50">
          <div className="bg-neutral-900 border border-neutral-700 
                          rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center">
              
              <div className="w-20 h-20 mx-auto mb-6 border-4 border-indigo-600 
                              border-t-transparent rounded-full animate-spin" />
              
              <h2 className="text-2xl font-bold text-white mb-2">
                Aguardando Oponente
              </h2>
              <p className="text-neutral-400 mb-6">
                Compartilhe o código da sala com seu oponente
              </p>

              <div className="bg-neutral-800 rounded-xl p-4 mb-4">
                <p className="text-xs text-neutral-500 mb-1">
                  Código da Sala
                </p>
                <p className="text-3xl font-mono font-bold text-indigo-400 
                              tracking-wider">
                  {roomId}
                </p>
              </div>

              <button
                onClick={handleCopyRoomId}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 
                           text-white font-bold rounded-xl transition-all 
                           flex items-center justify-center gap-2"
              >
                {copied ? (
                  <>
                    <span>✅</span>
                    Copiado!
                  </>
                ) : (
                  <>
                    <span>📋</span>
                    Copiar Código
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2 - ESCOLHA DE SLOTS (SETUP) - NOVO */}
      {gamePhase === 'SETUP' && !waitingOpponent && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm 
                        flex items-center justify-center z-50">
          <div className="bg-neutral-900 border border-neutral-700 
                          rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center">
              
              <div className="text-6xl mb-4">⚔️</div>
              
              <h2 className="text-2xl font-bold text-white mb-2">
                Selecione seu Campo de Batalha
              </h2>
              <p className="text-neutral-400 mb-6">
                Distribua seus slots entre as linhas (máx. 10 no total)
              </p>

              {/* Inputs de Slots */}
              <div className="space-y-4 mb-6">
                {/* Linha de Frente */}
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    🗡️ LINHA DE FRENTE
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="9"
                    value={frontSlots}
                    onChange={(e) => setFrontSlots(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 
                               rounded-xl text-white text-center text-2xl font-bold
                               focus:outline-none focus:ring-2 focus:ring-red-500 
                               transition-all"
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    Cartas aqui podem atacar diretamente
                  </p>
                </div>

                {/* Retaguarda */}
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    🛡️ RETAGUARDA
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="9"
                    value={backSlots}
                    onChange={(e) => setBackSlots(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 
                               rounded-xl text-white text-center text-2xl font-bold
                               focus:outline-none focus:ring-2 focus:ring-blue-500 
                               transition-all"
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    Cartas aqui ficam protegidas
                  </p>
                </div>

                {/* Total */}
                <div className="bg-neutral-800 rounded-xl p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400">Total de Slots:</span>
                    <span className={`text-xl font-bold ${
                      frontSlots + backSlots > 10 
                        ? 'text-red-500' 
                        : 'text-emerald-500'
                    }`}>
                      {frontSlots + backSlots} / 10
                    </span>
                  </div>
                </div>
              </div>

              {/* Erro de validação */}
              {setupError && (
                <div className="mb-4 bg-red-500/10 border border-red-500/20 
                                text-red-400 text-sm rounded-xl px-4 py-3">
                  ⚠️ {setupError}
                </div>
              )}

              {/* Botão Confirmar */}
              <button
                onClick={handleSubmitSlots}
                disabled={frontSlots + backSlots > 10}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 
                           disabled:bg-neutral-700 disabled:cursor-not-allowed 
                           text-white font-bold rounded-xl transition-all 
                           flex items-center justify-center gap-2"
              >
                <span>✅</span>
                Confirmar Escolha
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3 - AGUARDANDO OPONENTE (SETUP) - NOVO */}
      {waitingOpponent && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm 
                        flex items-center justify-center z-50">
          <div className="bg-neutral-900 border border-neutral-700 
                          rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center">
              
              <div className="w-20 h-20 mx-auto mb-6 border-4 border-indigo-600 
                              border-t-transparent rounded-full animate-spin" />
              
              <h2 className="text-2xl font-bold text-white mb-2">
                Escolha Confirmada!
              </h2>
              <p className="text-neutral-400">
                Aguardando o oponente escolher os slots...
              </p>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}