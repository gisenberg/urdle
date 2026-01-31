import { useRef, useEffect, useState, useMemo } from 'react'
import {
  getUnlockedHintCount,
  censorWord,
  getLetterHints,
  getLetterHintThreshold,
  getUnlockedLetterHintCount,
  type WordEntry,
} from '../lib/utils'

interface HintPanelProps {
  word: WordEntry
  guessCount: number
  gameOver: boolean
  elapsedSeconds: number
  target: string
  revealedPositions: Set<number>
}

const HINT_THRESHOLDS = [0, 30, 60] // seconds until hint 1, 2, 3 unlock

export default function HintPanel({
  word,
  guessCount,
  gameOver,
  elapsedSeconds,
  target,
  revealedPositions,
}: HintPanelProps) {
  const defUnlockedCount = getUnlockedHintCount(guessCount, gameOver, elapsedSeconds)
  const definitions = word.definitions

  const letterHints = useMemo(
    () => getLetterHints(target, revealedPositions),
    [target, revealedPositions]
  )

  const letterUnlockedCount = getUnlockedLetterHintCount(gameOver, elapsedSeconds, letterHints.length)

  const totalUnlocked = defUnlockedCount + letterUnlockedCount
  const totalSlots = 3 + letterHints.length

  // Track which hints have been flipped so the animation only plays once
  const [flippedHints, setFlippedHints] = useState<Set<number>>(() => {
    const initial = new Set<number>()
    for (let i = 0; i < totalUnlocked; i++) initial.add(i)
    return initial
  })

  const prevUnlockedRef = useRef(totalUnlocked)

  useEffect(() => {
    if (totalUnlocked > prevUnlockedRef.current) {
      setFlippedHints((prev) => {
        const next = new Set(prev)
        for (let i = prevUnlockedRef.current; i < totalUnlocked; i++) {
          next.add(i)
        }
        return next
      })
    }
    prevUnlockedRef.current = totalUnlocked
  }, [totalUnlocked])

  return (
    <div className="w-full max-w-sm mx-auto space-y-2 px-4">
      <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wide">
        Hints
      </h3>
      {Array.from({ length: totalSlots }, (_, i) => {
        const isDefinitionSlot = i < 3
        const unlocked = isDefinitionSlot ? i < defUnlockedCount : (i - 3) < letterUnlockedCount
        const isFlipped = flippedHints.has(i)

        // Compute threshold and progress
        let threshold: number
        let prevThreshold: number
        if (isDefinitionSlot) {
          threshold = HINT_THRESHOLDS[i] ?? 0
          prevThreshold = HINT_THRESHOLDS[i - 1] ?? 0
        } else {
          const letterIdx = i - 3
          threshold = getLetterHintThreshold(letterIdx)
          prevThreshold = letterIdx === 0 ? 60 : getLetterHintThreshold(letterIdx - 1)
        }

        // Show progress bar for the next locked hint (only one at a time)
        const showProgress = threshold > 0 && !unlocked && (() => {
          if (isDefinitionSlot) {
            return i < defUnlockedCount + 1
          } else {
            // Only show letter hint progress if all 3 definitions are unlocked
            if (defUnlockedCount < 3) return false
            const letterIdx = i - 3
            return letterIdx < letterUnlockedCount + 1
          }
        })()

        const progress = showProgress
          ? Math.min(Math.max(elapsedSeconds - prevThreshold, 0) / (threshold - prevThreshold), 1)
          : 0

        if (isDefinitionSlot) {
          const text = definitions[i]
          return (
            <div key={i} className="hint-card">
              <div className={`hint-card-inner ${isFlipped && i > 0 ? 'flipped' : ''}`}>
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
                  {showProgress && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-700">
                      <div
                        className="h-full bg-amber-500 transition-all duration-1000 ease-linear"
                        style={{ width: `${progress * 100}%` }}
                      />
                    </div>
                  )}
                </div>
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
        } else {
          // Letter hint slot
          const letterIdx = i - 3
          const hint = letterHints[letterIdx]
          return (
            <div key={i} className="hint-card">
              <div className={`hint-card-inner ${isFlipped ? 'flipped' : ''}`}>
                <div className="hint-card-front text-sm rounded px-3 py-2 relative overflow-hidden bg-neutral-800/50 text-neutral-600">
                  🔤 ???
                  {showProgress && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-700">
                      <div
                        className="h-full bg-amber-500 transition-all duration-1000 ease-linear"
                        style={{ width: `${progress * 100}%` }}
                      />
                    </div>
                  )}
                </div>
                <div className="hint-card-back text-sm rounded px-3 py-2 bg-neutral-800 text-neutral-200">
                  {unlocked && hint
                    ? `Letter ${hint.inputIndex}: ${hint.letter}`
                    : '🔤 ???'}
                </div>
              </div>
            </div>
          )
        }
      })}
      {gameOver && word.example && (
        <div className="text-xs text-neutral-500 italic px-1">
          "{word.example}"
        </div>
      )}
    </div>
  )
}
