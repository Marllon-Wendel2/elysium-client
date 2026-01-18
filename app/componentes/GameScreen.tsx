'use client'

import PlayerHand from './PlayerHand'
import BoardMonster from './BoardMonster'
import Image from 'next/image'

import { 
  DndContext, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'

export default function GameScreen() {

  return (
    <div>
      <section className="flex items-center justify-center flex-1">
        <div className="relative h-[90%] aspect-2/3 max-w-full">
          <Image
            src="/Cards/bord.jpg"
            alt="Board"
            fill
            className="object-cover pointer-events-none select-none"
          />

          <div className="relative z-50 flex justify-center items-end">
            <BoardMonster owner="CPU" position="BACK" />
            <BoardMonster owner="CPU" position="FRONT" />
            <BoardMonster owner="PLAYER" position="FRONT" />
            <BoardMonster owner="PLAYER" position="BACK" />
          </div>
        </div>
      </section>

      <PlayerHand />
</div>
  )
}
