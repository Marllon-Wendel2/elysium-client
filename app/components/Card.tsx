'use client'

import Image from 'next/image'
import useGameStore from '../store/gameStore'
import type { CardInstance } from '../types/game'

// Mapeamento de classes para cores de borda
const CARD_BORDER_BY_CLASS: Record<string, string> = {
  citizen: 'border-blue-400',
  army: 'border-red-500',
  mage: 'border-purple-500',
  noble: 'border-yellow-400',
  // Classes antigas (mantendo compatibilidade)
  cidadao: 'border-blue-400',
  exercito: 'border-red-500',
  mago: 'border-purple-500',
  nobre: 'border-yellow-400',
}

interface CardProps {
  card: CardInstance        // Mudou: Card → CardInstance
  index: number
  overlap: number
  showInfos: boolean
  onSelect: (card: CardInstance) => void  // Mudou: Card → CardInstance
}

export default function Card({
  card,
  index,
  overlap,
  showInfos,
  onSelect,
}: CardProps) {
  const manaAvailable = useGameStore((state) => state.player.manaAvailable)
  
  // Acessa os dados pela nova estrutura
  const { base, state } = card
  
  // Verifica se a carta pode ser jogada (mana suficiente)
  const cardAvaible = manaAvailable >= (base.mana ?? 0) || 
    (base.class !== 'magic' && base.class !== 'equipment')

  const borderColor =
    CARD_BORDER_BY_CLASS[base.class] ?? 'border-neutral-400'

  return (
    <div
      style={{
        marginLeft: index === 0 ? 0 : -overlap,
        zIndex: index,
      }}
      className={`
        relative group cursor-pointer
        hover:-translate-y-6 transition-transform
      `}
      onClick={() => onSelect(card)}
    >
      <div
        className={`
          relative
          border-2 ${borderColor}
          rounded-lg shadow-lg overflow-hidden
          transition-[width,height,top] duration-200
          ${
            showInfos
              ? 'absolute -top-6 w-32 h-48 z-50'
              : 'w-24 h-36 group-hover:w-32 group-hover:h-48 group-hover:-top-6 group-hover:z-50'
          }
        `}
      >
        <Image
          src={base.artUrl}         // Mudou: card.art → base.artUrl
          alt={base.name}           // Mudou: card.name → base.name
          fill
          className={`object-cover pointer-events-none ${cardAvaible ? 'opacity-100' : 'opacity-50'}`}
        />

        {/* STATUS - Usa os valores do state (atuais, não os base) */}
        <div
          className={`
            absolute inset-0 flex flex-col justify-between p-2
            text-xs font-bold text-white pointer-events-none
            transition-opacity duration-200
            ${showInfos ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
          `}
        >
          <div className="flex justify-between">
            <span className="bg-indigo-600/80 px-2 py-1 rounded-full">
              🔮 {base.mana}        // Mana é do base (não muda)
            </span>
            <span className="bg-yellow-500/80 px-2 py-1 rounded-full">
              🔋 {state.currentEnergy}  // Energia atual
            </span>
          </div>

          <div className="flex justify-between">
            <span className="bg-red-600/80 px-2 py-1 rounded-full">
              ⚔️ {state.currentAttack}  // Ataque atual
            </span>
            <span className="bg-emerald-600/80 px-2 py-1 rounded-full">
              🛡️ {state.currentLife}    // Vida atual
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}