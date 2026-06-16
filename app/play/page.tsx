'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGameSocket } from '../hooks/useGameSocket';
import useGameStore from '../store/gameStore';

// Screens
import LobbyScreen from '../components/screens/LobbyScreen';
import GameScreen from '../components/screens/GameScreen';
import SetupScreen from '../components/screens/SetupScreen';

export default function PlayPage() {
  const router = useRouter()
  
  const game = useGameSocket()
  const phase = useGameStore((state) => state.phase)

  // Verificar autenticação
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) router.push('/')
  }, [router])

  // Determinar qual tela mostrar
  const getScreen = () => {
    // Setup (escolha de slots)
    if (game.gamePhase === 'SETUP' || phase === 'SETUP') {
      return (
        <SetupScreen
          onSubmitSlots={game.submitSlots}
          waitingOpponent={game.waitingOpponent}
          error={game.error}
        />
      )
    }

    // Jogo rodando
    if (phase === 'DECLARATION' || phase === 'STANDBY' || phase === 'RESOLUTION') {
      return <GameScreen />
    }

    // Jogo finalizado
    if (phase === 'FINISHED') {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-black text-white mb-4">
              🏆 Jogo Finalizado!
            </h1>
            <button
              onClick={() => router.push('/play')}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold"
            >
              Nova Partida
            </button>
          </div>
        </div>
      )
    }

    // Padrão: Lobby
    return (
      <LobbyScreen
        isConnected={game.isConnected}
        onConnect={game.connect}
        onCreateRoom={game.createRoom}
        onJoinRoom={game.joinRoom}
        roomId={game.roomId}
        isWaiting={game.isWaiting}
        error={game.error}
        onClearError={() => game.setError(null)}
        onLogout={() => {
          localStorage.removeItem('access_token')
          localStorage.removeItem('user')
          router.push('/')
        }}
      />
    )
  }

  return (
    <main className="w-screen h-screen bg-neutral-950">
      {getScreen()}
    </main>
  )
}