import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  getTodayKey,
  getRandomWord,
  evaluateGuess,
  encodeWordId,
  getWordIndex,
  getRevealedPositions,
  getUnlockedHintCount,
  getLetterHints,
  getUnlockedLetterHintCount,
  MAX_GUESSES,
  getDayIndex,
  type WordEntry,
  type EvaluatedLetter,
} from '../lib/utils'
import type { GameMode } from '../components/App'

export type GameStatus = 'playing' | 'won' | 'lost'

interface SavedState {
  guesses: string[]
  gameStatus: GameStatus
  target?: string
}

function loadState(key: string, target: string): SavedState | null {
  try {
    const raw = localStorage.getItem(`urdle-${key}`)
    if (!raw) return null
    const state = JSON.parse(raw) as SavedState
    // Discard saved state if the target word changed (e.g. word pool was updated)
    if (state.target && state.target !== target) return null
    return state
  } catch {
    return null
  }
}

function saveState(key: string, state: SavedState) {
  localStorage.setItem(`urdle-${key}`, JSON.stringify(state))
}

/** Merge typed letters into a full-length string, inserting revealed chars at their positions. */
function buildFullGuess(typed: string, target: string, revealedPositions: Set<number>): string {
  const full: string[] = []
  let ti = 0
  for (let i = 0; i < target.length; i++) {
    if (revealedPositions.has(i)) {
      full.push(target[i])
    } else {
      full.push(typed[ti] ?? '')
      ti++
    }
  }
  return full.join('')
}

export function useGame(wordEntry: WordEntry, mode: GameMode) {
  const isDaily = mode === 'daily'
  const target = wordEntry.word.toLowerCase()
  const wordLength = target.length
  const dateKey = getTodayKey()

  const revealedPositions = useMemo(() => getRevealedPositions(target), [target])
  const [hintedPositions, setHintedPositions] = useState<Set<number>>(new Set())

  const allRevealedPositions = useMemo(() => {
    const merged = new Set(revealedPositions)
    for (const p of hintedPositions) merged.add(p)
    return merged
  }, [revealedPositions, hintedPositions])

  const inputLength = wordLength - allRevealedPositions.size

  const [guesses, setGuesses] = useState<string[]>([])
  const [currentGuess, setCurrentGuess] = useState('')
  const [gameStatus, setGameStatus] = useState<GameStatus>('playing')
  const [shakeRow, setShakeRow] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const hintsUsedRef = useRef<{ used: number; total: number } | null>(null)

  // Timer that ticks every second while playing
  useEffect(() => {
    if (gameStatus === 'playing') {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1)
      }, 1000)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [gameStatus])

  // When a hint reveals a new position, clear current guess to avoid cursor misalignment
  const revealHintPosition = useCallback((pos: number) => {
    setHintedPositions((prev) => {
      if (prev.has(pos)) return prev
      const next = new Set(prev)
      next.add(pos)
      return next
    })
    setCurrentGuess('')
  }, [])

  // Snapshot hints used when game ends
  useEffect(() => {
    if (gameStatus !== 'playing' && !hintsUsedRef.current) {
      const letterHints = getLetterHints(target, revealedPositions)
      const defCount = getUnlockedHintCount(guesses.length, true, elapsedSeconds)
      const letterCount = getUnlockedLetterHintCount(true, elapsedSeconds, letterHints.length)
      hintsUsedRef.current = {
        used: defCount + letterCount,
        total: 3 + letterHints.length,
      }
    }
  }, [gameStatus, guesses.length, elapsedSeconds, target, revealedPositions])

  // Load saved state on mount (daily only)
  useEffect(() => {
    if (!isDaily) return
    const saved = loadState(dateKey, target)
    if (saved) {
      setGuesses(saved.guesses)
      setGameStatus(saved.gameStatus)
    }
  }, [dateKey, isDaily, target])

  // Save state on changes (daily only)
  useEffect(() => {
    if (!isDaily) return
    if (guesses.length > 0 || gameStatus !== 'playing') {
      saveState(dateKey, { guesses, gameStatus, target })
    }
  }, [guesses, gameStatus, dateKey, isDaily])

  const startRandomGame = useCallback(() => {
    const next = getRandomWord(wordEntry.word)
    const id = encodeWordId(getWordIndex(next))
    window.location.hash = `#/w/${id}`
  }, [wordEntry.word])

  const submitGuess = useCallback(() => {
    if (gameStatus !== 'playing') return
    if (currentGuess.length !== inputLength) {
      setShakeRow(true)
      setTimeout(() => setShakeRow(false), 300)
      return
    }

    const fullGuess = buildFullGuess(currentGuess.toLowerCase(), target, allRevealedPositions)
    const newGuesses = [...guesses, fullGuess]
    setGuesses(newGuesses)
    setCurrentGuess('')

    if (fullGuess === target) {
      setGameStatus('won')
    } else if (newGuesses.length >= MAX_GUESSES) {
      setGameStatus('lost')
    }
  }, [currentGuess, guesses, target, inputLength, gameStatus, allRevealedPositions])

  const addLetter = useCallback(
    (letter: string) => {
      if (gameStatus !== 'playing') return
      if (currentGuess.length >= inputLength) return

      const l = letter.toLowerCase()

      // Find the visual cursor position (next non-revealed slot in the full word)
      let visualPos = wordLength
      let typed = 0
      for (let i = 0; i < wordLength; i++) {
        if (allRevealedPositions.has(i)) continue
        if (typed === currentGuess.length) {
          visualPos = i
          break
        }
        typed++
      }

      // If the user types a letter matching a revealed position just before
      // the cursor, consume it silently so typing the full word feels natural
      for (let i = visualPos - 1; i >= 0 && allRevealedPositions.has(i); i--) {
        if (target[i] === l) return
      }

      setCurrentGuess((prev) => prev + l)
    },
    [currentGuess, inputLength, gameStatus, allRevealedPositions, target, wordLength]
  )

  const deleteLetter = useCallback(() => {
    if (gameStatus !== 'playing') return
    setCurrentGuess((prev) => prev.slice(0, -1))
  }, [gameStatus])

  const evaluatedGuesses: EvaluatedLetter[][] = guesses.map((g) =>
    evaluateGuess(g, target, allRevealedPositions)
  )

  // Build the full display guess (with revealed letters inserted) for the current row
  const displayGuess = useMemo(() => {
    return buildFullGuess(currentGuess, target, allRevealedPositions)
  }, [currentGuess, target, allRevealedPositions])

  const generateShareText = useCallback(() => {
    const wordIdx = getWordIndex(wordEntry)
    const encodedId = encodeWordId(wordIdx)
    const shareUrl = `https://gisenberg.github.io/urdle/#/w/${encodedId}`

    const dayIndex = getDayIndex()
    const label = isDaily ? `Urdle #${dayIndex}` : 'Urdle'
    const score = gameStatus === 'won' ? `${guesses.length}/${MAX_GUESSES}` : `X/${MAX_GUESSES}`
    const grid = evaluatedGuesses
      .map((row) =>
        row
          .map(({ letter, state }) => {
            if (letter === ' ') return '  '
            switch (state) {
              case 'correct': return '🟩'
              case 'present': return '🟨'
              case 'absent': return '⬛'
              default: return '⬜'
            }
          })
          .join('')
      )
      .join('\n')
    const hints = hintsUsedRef.current
    const hintText = hints ? ` (${hints.used}/${hints.total} hints)` : ''
    return `${label} ${score}${hintText}\n\n${grid}\n\n${shareUrl}`
  }, [evaluatedGuesses, guesses.length, gameStatus, wordEntry, isDaily])

  return {
    todayWord: wordEntry,
    isDaily,
    target,
    wordLength,
    guesses,
    currentGuess,
    displayGuess,
    gameStatus,
    evaluatedGuesses,
    shakeRow,
    revealedPositions,
    hintedPositions,
    allRevealedPositions,
    revealHintPosition,
    addLetter,
    deleteLetter,
    submitGuess,
    generateShareText,
    startRandomGame,
    elapsedSeconds,
  }
}
