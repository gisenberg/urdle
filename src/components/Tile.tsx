import type { LetterState } from '../lib/utils'

interface TileProps {
  letter: string
  state: LetterState
  delay?: number
  size?: 'sm' | 'md' | 'lg'
}

const stateColors: Record<LetterState, string> = {
  correct: 'bg-green-600 border-green-600',
  present: 'bg-yellow-500 border-yellow-500',
  absent: 'bg-neutral-700 border-neutral-700',
  empty: 'bg-transparent border-neutral-600',
}

const sizeClasses: Record<string, string> = {
  sm: 'w-7 h-8 sm:w-8 sm:h-9 text-sm sm:text-base',
  md: 'w-9 h-10 sm:w-10 sm:h-11 text-base sm:text-lg',
  lg: 'w-12 h-12 sm:w-14 sm:h-14 text-xl sm:text-2xl',
}

export default function Tile({ letter, state, delay = 0, size = 'lg' }: TileProps) {
  const hasLetter = letter !== ''
  const isRevealed = state !== 'empty'

  return (
    <div
      className={`
        border-2 flex items-center justify-center
        font-bold uppercase select-none
        ${sizeClasses[size]}
        ${stateColors[state]}
        ${hasLetter && !isRevealed ? 'border-neutral-400 tile-pop' : ''}
        ${isRevealed ? 'tile-flip text-white' : 'text-white'}
      `}
      style={isRevealed ? { animationDelay: `${delay * 100}ms` } : undefined}
    >
      {letter}
    </div>
  )
}
