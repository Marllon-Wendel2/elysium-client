'use client'

import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'

export function useGameSocket() {
  const socketRef = useRef<Socket | null>(null)
  
  // Estados de conexão
  const [isConnected, setIsConnected] = useState(false)
  const [roomId, setRoomId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Estados do jogo
  const [isWaiting, setIsWaiting] = useState(false)
  const [gamePhase, setGamePhase] = useState<string>('LOBBY')  // NOVO
  const [waitingOpponent, setWaitingOpponent] = useState(false)  // NOVO

  const connect = () => {
    const token = localStorage.getItem('access_token')
    
    if (!token) {
      setError('Token não encontrado. Faça login novamente.')
      return
    }

    console.log('🔌 Tentando conectar ao WebSocket...')

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
      setIsWaiting(true)
      setError(null)
    })

    // ==========================================
    // EVENTOS DO SETUP (NOVOS)
    // ==========================================
    
    // Ambos jogadores recebem quando entram na sala
    socket.on('ROOM_JOINED', () => {
      console.log('🚪 Entrou na sala!')
      setIsWaiting(false)
      // Não redireciona ainda, espera o SLOT_CHOICE
    })

    // Servidor pede para escolher slots
    socket.on('SLOT_CHOICE', () => {
      console.log('🎯 Servidor pediu escolha de slots!')
      setGamePhase('SETUP')  // Muda para fase de setup
      setIsWaiting(false)
      setWaitingOpponent(false)
    })

    // Confirmação individual de que seus slots foram recebidos
    socket.on('SLOTS_CONFIRMED', () => {
      console.log('✅ Seus slots foram confirmados!')
      setWaitingOpponent(true)  // Mostra "aguardando oponente"
    })

    // Ambos jogadores recebem quando o setup termina
    socket.on('SETUP_FINISHED', () => {
      console.log('🎮 Setup finalizado! Iniciando jogo...')
      setWaitingOpponent(false)
      setGamePhase('GAME')
      window.location.href = '/game'
    })

    // Mensagens de erro
    socket.on('ERROR', (message: string) => {
      console.error('❌ Erro do servidor:', message)
      setError(message)
    })

    // Erro específico do setup
    socket.on('SETUP_ERROR', (message: string) => {
      console.error('❌ Erro no setup:', message)
      setError(message)
      setWaitingOpponent(false)
    })

    socketRef.current = socket
  }

  // ==========================================
  // FUNÇÕES DO LOBBY
  // ==========================================
  const createRoom = () => {
    if (!socketRef.current || !isConnected) {
      setError('Não está conectado ao servidor')
      return
    }

    console.log('📤 Enviando CREATE_ROOM')
    socketRef.current.emit('CREATE_ROOM')
  }

  const joinRoom = (roomId: string) => {
    if (!socketRef.current || !isConnected) {
      setError('Não está conectado ao servidor')
      return
    }

    console.log('📤 Enviando JOIN_ROOM:', roomId)
    socketRef.current.emit('JOIN_ROOM', roomId)
  }

  // ==========================================
  // FUNÇÃO DO SETUP (NOVA)
  // ==========================================
  const submitSlots = (front: number, back: number) => {
    if (!socketRef.current || !isConnected) {
      setError('Não está conectado ao servidor')
      return
    }

    // Validação: máximo 10 slots no total
    if (front + back > 10) {
      setError('O total de slots não pode passar de 10')
      return
    }

    // Validação: mínimo 1 em cada
    if (front < 1 || back < 1) {
      setError('É necessário pelo menos 1 slot em cada linha')
      return
    }

    console.log('📤 Enviando SUBMIT_SLOTS:', { front, back })
    socketRef.current.emit('SUBMIT_SLOTS', { front, back })
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

  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [])

  return {
    // Conexão
    connect,
    disconnect,
    isConnected,
    error,
    setError,
    
    // Lobby
    createRoom,
    joinRoom,
    roomId,
    isWaiting,
    setIsWaiting,
    
    // Setup (NOVOS)
    gamePhase,
    submitSlots,
    waitingOpponent,
  }
}