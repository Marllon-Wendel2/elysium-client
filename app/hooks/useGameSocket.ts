'use client'

import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import useGameStore from '../store/gameStore'
import type { GameSyncEvent } from '../types/game'

export function useGameSocket() {
  const socketRef = useRef<Socket | null>(null)
  
  const [isConnected, setIsConnected] = useState(false)
  const [roomId, setRoomId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isWaiting, setIsWaiting] = useState(false)
  const [gamePhase, setGamePhase] = useState<string>('LOBBY')
  const [waitingOpponent, setWaitingOpponent] = useState(false)

  const connect = () => {
    // Se já está conectado, não conecta de novo
    if (socketRef.current?.connected) {
      console.log('⚠️ Já está conectado!')
      return
    }

    const token = localStorage.getItem('access_token')
    
    if (!token) {
      setError('Token não encontrado. Faça login novamente.')
      return
    }

    console.log('🔌 Conectando ao WebSocket...')

    const socket = io('ws://localhost:3002', {
      auth: {
        token: `Bearer ${token}`
      }
    })

    // Eventos de conexão
    socket.on('connect', () => {
      console.log('✅ WebSocket conectado!')
      console.log('   ID do socket:', socket.id)
      setIsConnected(true)
      setError(null)
    })

    socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket desconectado:', reason)
      setIsConnected(false)
    })

    socket.on('connect_error', (err) => {
      console.error('❌ Erro na conexão:', err.message)
      setError(`Erro ao conectar: ${err.message}`)
      setIsConnected(false)
    })

    // ==========================================
    // EVENTOS DO LOBBY
    // ==========================================
    socket.on('ROOM_CREATED', (data: string) => {
      console.log('🏰 Sala criada com código:', data)
      setRoomId(data)
      setIsWaiting(true)  // Mostra modal de compartilhar
      setError(null)
    })

    socket.on('ROOM_JOINED', () => {
      console.log('🚪 Entrou na sala!')
      setIsWaiting(false)
      setError(null)
      // Aguarda SLOT_CHOICE
    })

    // ==========================================
    // EVENTOS DO SETUP
    // ==========================================
    socket.on('SLOT_CHOICE', (data: { side: string }) => {
      console.log('🎯 Servidor pediu escolha de slots! Lado:', data.side)
      const store = useGameStore.getState()
      store.setPlayerSide(data.side as 'PLAYERONE' | 'PLAYERTWO')
      setGamePhase('SETUP')
      setIsWaiting(false)
      setWaitingOpponent(false)
    })

    socket.on('SLOTS_CONFIRMED', () => {
      console.log('✅ Seus slots foram confirmados!')
      setWaitingOpponent(true)
    })

    socket.on('SETUP_FINISHED', () => {
      console.log('🎮 Setup finalizado! Aguardando GAME_SYNC...')
      setWaitingOpponent(false)
    })

    // ==========================================
    // EVENTOS DO JOGO
    // ==========================================
    socket.on('GAME_SYNC', (event: GameSyncEvent) => {
      console.log('🎮 Recebeu GAME_SYNC')
      console.log('   Fase:', event.state.phase)
      
      const store = useGameStore.getState()
      store.syncGameState(event)
      
      setGamePhase(event.state.phase)
    })

    socket.on('ERROR', (message: string) => {
      console.error('❌ Erro do servidor:', message)
      setError(message)
    })

    socket.on('SETUP_ERROR', (message: string) => {
      console.error('❌ Erro no setup:', message)
      setError(message)
      setWaitingOpponent(false)
    })

    socketRef.current = socket
  }

  // ==========================================
  // FUNÇÕES DO JOGO
  // ==========================================
  const createRoom = () => {
    if (!socketRef.current?.connected) {
      setError('Conecte-se primeiro')
      return
    }

    console.log('📤 Enviando CREATE_ROOM')
    socketRef.current.emit('CREATE_ROOM')
  }

  const joinRoom = (roomId: string) => {
    if (!socketRef.current?.connected) {
      setError('Conecte-se primeiro')
      return
    }

    console.log('📤 Enviando JOIN_ROOM:', roomId)
    socketRef.current.emit('JOIN_ROOM', roomId)
  }

  const submitSlots = (front: number, back: number) => {
    if (!socketRef.current?.connected) {
      setError('Não está conectado ao servidor')
      return
    }

    if (front + back > 10) {
      setError('O total de slots não pode passar de 10')
      return
    }

    if (front < 1 || back < 1) {
      setError('É necessário pelo menos 1 slot em cada linha')
      return
    }

    console.log('📤 Enviando SUBMIT_SLOTS:', { front, back })
    socketRef.current.emit('SUBMIT_SLOTS', { front, back })
  }

  const sendActions = (actions: unknown[]) => {
    if (!socketRef.current?.connected) {
      setError('Não está conectado ao servidor')
      return
    }

    console.log('📤 Enviando SEND_ACTIONS:', actions)
    socketRef.current.emit('SEND_ACTIONS', { actions })
  }

  const disconnect = () => {
    if (socketRef.current) {
      console.log('🔌 Desconectando WebSocket...')
      socketRef.current.disconnect()
      socketRef.current = null
      setIsConnected(false)
      setRoomId(null)
      setIsWaiting(false)
      setGamePhase('LOBBY')
      setWaitingOpponent(false)
    }
  }

  // Limpeza ao desmontar
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [])

  return {
    connect,
    disconnect,
    createRoom,
    joinRoom,
    submitSlots,
    sendActions,
    isConnected,
    roomId,
    isWaiting,
    gamePhase,
    waitingOpponent,
    error,
    setError,
    setIsWaiting,
  }
}