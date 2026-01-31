import { getKeyboardStates, type LetterState } from '../lib/utils'

interface KeyboardProps {
  guesses: string[]
  target: string
  onKey: (key: string) => void
  onEnter: () => void
  onDelete: () => void
}

const ROWS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['Enter', 'z', 'x', 'c', 'v', 'b', 'n', 'm', '⌫'],
]

const stateColors: Record<LetterState | 'unused', string> = {
  correct: 'bg-green-600',
  present: 'bg-yellow-500',
  absent: 'bg-neutral-700',
  empty: 'bg-neutral-500',
  unused: 'bg-neutral-500',
}

export default function Keyboard({
  guesses,
  target,
  onKey,
  onEnter,
  onDelete,
}: KeyboardProps) {
  const keyStates = getKeyboardStates(guesses, target)

  function handleClick(key: string) {
    if (key === 'Enter') {
      onEnter()
    } else if (key === '⌫') {
      onDelete()
    } else {
      onKey(key)
    }
  }

  return (
    <div className="flex flex-col gap-1.5 items-center w-full max-w-lg mx-auto">
      {ROWS.map((row, ri) => (
        <div key={ri} className="flex gap-1 sm:gap-1.5 justify-center w-full">
          {row.map((key) => {
            const isSpecial = key === 'Enter' || key === '⌫'
            const state = isSpecial ? 'unused' : (keyStates[key] || 'unused')
            return (
              <button
                key={key}
                onClick={() => handleClick(key)}
                className={`
                  ${stateColors[state]}
                  ${isSpecial ? 'px-2 sm:px-4 text-xs sm:text-sm' : 'w-8 sm:w-10 text-sm sm:text-base'}
                  h-12 sm:h-14 rounded font-bold uppercase
                  flex items-center justify-center
                  text-white select-none
                  active:brightness-75 transition-colors
                `}
              >
                {key}
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}
