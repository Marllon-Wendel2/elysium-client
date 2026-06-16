'use client'

import { useEffect, useRef } from 'react'
import * as PIXI from 'pixi.js'

export default function PixiGame() {
  const containerRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<PIXI.Application | null>(null)

  useEffect(() => {
    // Evitar criar múltiplas instâncias
    if (appRef.current || !containerRef.current) return

    // Criar aplicação PixiJS
    const app = new PIXI.Application({
      width: 800,
      height: 600,
      backgroundColor: 0x1a1a2e,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    })

    // Adicionar canvas ao container
    containerRef.current.appendChild(app.view as HTMLCanvasElement)
    appRef.current = app

    // Cleanup
    return () => {
      if (appRef.current) {
        appRef.current.destroy(true)
        appRef.current = null
      }
    }
  }, [])

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full flex items-center justify-center"
    />
  )
}