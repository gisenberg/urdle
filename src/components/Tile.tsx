import type { LetterState } from '../lib/utils'

interface TileProps {
  letter: string
  state: LetterState
  delay?: number
  size?: 'sm' | 'md' | 'lg'
  isCursor?: boolean
}

const stateColors: Record<LetterState, string> = {
  correct: 'bg-green-600 border-green-600',
  present: 'bg-yellow-500 border-yellow-500',
  absent: 'bg-neutral-700 border-neutral-700',
  empty: 'bg-transparent border-neutral-600',
  revealed: 'bg-neutral-600 border-neutral-500',
  hinted: 'bg-neutral-600 border-neutral-500',
}

const sizeClasses: Record<string, string> = {
  sm: 'w-7 h-8 sm:w-8 sm:h-9 text-sm sm:text-base',
  md: 'w-9 h-10 sm:w-10 sm:h-11 text-base sm:text-lg',
  lg: 'w-12 h-12 sm:w-14 sm:h-14 text-xl sm:text-2xl',
}

const spaceSizeClasses: Record<string, string> = {
  sm: 'w-3 h-8 sm:w-3 sm:h-9',
  md: 'w-3 h-10 sm:w-4 sm:h-11',
  lg: 'w-4 h-12 sm:w-5 sm:h-14',
}

export default function Tile({ letter, state, delay = 0, size = 'lg', isCursor = false }: TileProps) {
  // Space tiles render as narrow gaps
  if (letter === ' ') {
    return <div className={spaceSizeClasses[size]} />
  }

  const hasLetter = letter !== ''
  const isRevealed = state !== 'empty' && state !== 'revealed' && state !== 'hinted'
  const isHinted = state === 'hinted'

  return (
    <div
      className={`
        border-2 flex items-center justify-center
        font-bold uppercase select-none
        ${sizeClasses[size]}
        ${stateColors[state]}
        ${hasLetter && !isRevealed && !isHinted ? 'border-neutral-400 tile-pop' : ''}
        ${isRevealed ? 'tile-flip text-white' : 'text-white'}
        ${isHinted ? 'tile-flip text-white' : ''}
        ${isCursor ? 'border-neutral-300 tile-cursor' : ''}
      `}
      style={isRevealed || isHinted ? { animationDelay: `${delay * 100}ms` } : undefined}
    >
      {letter}
    </div>
  )
}
