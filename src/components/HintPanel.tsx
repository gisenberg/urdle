import { useRef, useEffect, useState } from 'react'
import { getUnlockedHintCount, censorWord, type WordEntry } from '../lib/utils'

interface HintPanelProps {
  word: WordEntry
  guessCount: number
  gameOver: boolean
  elapsedSeconds: number
}

const HINT_THRESHOLDS = [0, 30, 60] // seconds until hint 1, 2, 3 unlock

export default function HintPanel({ word, guessCount, gameOver, elapsedSeconds }: HintPanelProps) {
  const unlockedCount = getUnlockedHintCount(guessCount, gameOver, elapsedSeconds)
  const definitions = word.definitions
  const totalSlots = Math.max(definitions.length, 3)

  // Track which hints have been flipped so the animation only plays once
  const [flippedHints, setFlippedHints] = useState<Set<number>>(() => {
    // Hints already unlocked on mount should start flipped (no animation)
    const initial = new Set<number>()
    for (let i = 0; i < unlockedCount; i++) initial.add(i)
    return initial
  })

  const prevUnlockedRef = useRef(unlockedCount)

  useEffect(() => {
    if (unlockedCount > prevUnlockedRef.current) {
      // New hints unlocked — add them to the flipped set
      setFlippedHints((prev) => {
        const next = new Set(prev)
        for (let i = prevUnlockedRef.current; i < unlockedCount; i++) {
          next.add(i)
        }
        return next
      })
    }
    prevUnlockedRef.current = unlockedCount
  }, [unlockedCount])

  return (
    <div className="w-full max-w-sm mx-auto space-y-2 px-4">
      <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wide">
        Hints
      </h3>
      {Array.from({ length: totalSlots }, (_, i) => {
        const unlocked = i < unlockedCount
        const isFlipped = flippedHints.has(i)
        const text = definitions[i]
        const threshold = HINT_THRESHOLDS[i] ?? 0

        // Progress for locked hints — only show once the previous hint is unlocked
        const showProgress = threshold > 0 && !unlocked && i < unlockedCount + 1
        const prevThreshold = HINT_THRESHOLDS[i - 1] ?? 0
        const progress = showProgress
          ? Math.min(Math.max(elapsedSeconds - prevThreshold, 0) / (threshold - prevThreshold), 1)
          : 0

        return (
          <div key={i} className="hint-card">
            <div className={`hint-card-inner ${isFlipped && i > 0 ? 'flipped' : ''}`}>
              {/* Front face — locked state */}
              <div
                className={`hint-card-front text-sm rounded px-3 py-2 relative overflow-hidden ${
                  i === 0
                    ? 'bg-neutral-800 text-neutral-200'
                    : 'bg-neutral-800/50 text-neutral-600'
                }`}
              >
                {i === 0 && text
                  ? `1. ${gameOver ? text : censorWord(text, word.word)}`
                  : `${i + 1}. ???`}
                {/* Progress bar for locked hints with time thresholds */}
                {showProgress && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-700">
                    <div
                      className="h-full bg-amber-500 transition-all duration-1000 ease-linear"
                      style={{ width: `${progress * 100}%` }}
                    />
                  </div>
                )}
              </div>
              {/* Back face — unlocked state (only for hints 2 and 3) */}
              {i > 0 && (
                <div className="hint-card-back text-sm rounded px-3 py-2 bg-neutral-800 text-neutral-200">
                  {unlocked && text
                    ? `${i + 1}. ${gameOver ? text : censorWord(text, word.word)}`
                    : `${i + 1}. ???`}
                </div>
              )}
            </div>
          </div>
        )
      })}
      {gameOver && word.example && (
        <div className="text-xs text-neutral-500 italic px-1">
          "{word.example}"
        </div>
      )}
    </div>
  )
}
