import { getUnlockedHintCount, censorWord, type WordEntry } from '../lib/utils'

interface HintPanelProps {
  word: WordEntry
  guessCount: number
  gameOver: boolean
}

export default function HintPanel({ word, guessCount, gameOver }: HintPanelProps) {
  const unlockedCount = getUnlockedHintCount(guessCount, gameOver)
  const definitions = word.definitions.slice(0, 3)

  return (
    <div className="w-full max-w-sm mx-auto space-y-2 px-4">
      <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wide">
        Hints
      </h3>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`
            text-sm rounded px-3 py-2
            ${i < unlockedCount
              ? 'bg-neutral-800 text-neutral-200'
              : 'bg-neutral-800/50 text-neutral-600'}
          `}
        >
          {i < unlockedCount && definitions[i]
            ? `${i + 1}. ${gameOver ? definitions[i] : censorWord(definitions[i], word.word)}`
            : `${i + 1}. ???`}
        </div>
      ))}
      {gameOver && word.example && (
        <div className="text-xs text-neutral-500 italic px-1">
          "{word.example}"
        </div>
      )}
    </div>
  )
}
