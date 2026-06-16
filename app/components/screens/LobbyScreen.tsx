'use client'

import { useState, useEffect } from 'react'

interface LobbyScreenProps {
  isConnected: boolean
  onConnect: () => void                    // NOVO
  onCreateRoom: () => void
  onJoinRoom: (roomId: string) => void
  roomId: string | null
  isWaiting: boolean
  error: string | null
  onClearError: () => void
  onLogout: () => void
}

export default function LobbyScreen({
  isConnected,
  onConnect,           // NOVO
  onCreateRoom,
  onJoinRoom,
  roomId,
  isWaiting,
  error,
  onClearError,
  onLogout,
}: LobbyScreenProps) {
  const [userName, setUserName] = useState('')
  const [roomInput, setRoomInput] = useState('')
  const [showJoinInput, setShowJoinInput] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const user = JSON.parse(userStr)
      setUserName(user.firstName || user.name)
    }
  }, [])

  const handleCreateRoom = () => {
    onClearError()
    
    if (!isConnected) {
      // Conecta primeiro, depois cria
      onConnect()
      // Pequeno delay para garantir conexão
      setTimeout(() => {
        onCreateRoom()
      }, 500)
    } else {
      onCreateRoom()
    }
  }

  const handleJoinRoom = () => {
    onClearError()
    
    if (!roomInput.trim()) {
      return
    }

    if (!isConnected) {
      // Conecta primeiro, depois entra
      onConnect()
      setTimeout(() => {
        onJoinRoom(roomInput)
      }, 500)
    } else {
      onJoinRoom(roomInput)
    }
  }

  const handleCopyRoomId = () => {
    if (roomId) {
      navigator.clipboard.writeText(roomId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="w-full h-full flex">
      {/* Sidebar */}
      <aside className="w-80 bg-neutral-900 border-r border-neutral-800 flex flex-col p-6">
        <div className="flex items-center gap-4 mb-8 p-4 bg-neutral-800 rounded-xl">
          <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-xl font-bold text-white">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-white font-bold">{userName}</h2>
            <p className="text-neutral-400 text-sm">Jogador</p>
            <div className="flex items-center gap-1 mt-1">
              <div className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-yellow-500'
              }`} />
              <span className="text-xs text-neutral-500">
                {isConnected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
          </div>
        </div>

        <nav className="flex flex-col gap-3 flex-1">
          <button
            onClick={handleCreateRoom}
            className="w-full py-4 px-4 bg-indigo-600 hover:bg-indigo-500 
                       text-white font-bold rounded-xl transition-all 
                       flex items-center justify-center gap-2"
          >
            <span>🏰</span>
            Criar Sala
          </button>

          <button
            onClick={() => setShowJoinInput(!showJoinInput)}
            className="w-full py-4 px-4 bg-neutral-800 hover:bg-neutral-700 
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
                           focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
          onClick={onLogout}
          className="mt-auto w-full py-3 px-4 bg-neutral-800 
                     hover:bg-red-900/50 text-neutral-400 hover:text-red-400 
                     rounded-xl transition-all text-sm border border-neutral-700"
        >
          Sair
        </button>
      </aside>

      {/* Área Central */}
      <section className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-32 h-32 mx-auto mb-6 bg-neutral-800 rounded-full flex items-center justify-center">
            <span className="text-6xl">⚔️</span>
          </div>
          <h1 className="text-3xl font-black text-white mb-2">
            Bem-vindo, {userName}!
          </h1>
          <p className="text-neutral-400">
            {isConnected 
              ? 'Crie uma nova sala ou entre em uma existente' 
              : 'Clique em um dos botões para começar'}
          </p>
        </div>
      </section>

      {/* Modal - Compartilhar Sala */}
      {isWaiting && roomId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center">
              <div className="text-6xl mb-4">🏰</div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Sala Criada!
              </h2>
              <p className="text-neutral-400 mb-6">
                Compartilhe o código com seu oponente
              </p>
              <div className="bg-neutral-800 rounded-xl p-4 mb-4">
                <p className="text-xs text-neutral-500 mb-1">Código da Sala</p>
                <p className="text-3xl font-mono font-bold text-indigo-400 tracking-wider">
                  {roomId}
                </p>
              </div>
              <button
                onClick={handleCopyRoomId}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 
                           text-white font-bold rounded-xl transition-all 
                           flex items-center justify-center gap-2"
              >
                {copied ? '✅ Copiado!' : '📋 Copiar Código'}
              </button>
              <p className="text-neutral-500 text-sm mt-4">
                Aguardando oponente entrar na sala...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}