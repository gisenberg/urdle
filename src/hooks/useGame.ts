import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  getTodayKey,
  getRandomWord,
  evaluateGuess,
  encodeWordId,
  getWordIndex,
  getRevealedPositions,
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
}

function loadState(key: string): SavedState | null {
  try {
    const raw = localStorage.getItem(`urdle-${key}`)
    if (!raw) return null
    return JSON.parse(raw) as SavedState
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
  const inputLength = wordLength - revealedPositions.size

  const [guesses, setGuesses] = useState<string[]>([])
  const [currentGuess, setCurrentGuess] = useState('')
  const [gameStatus, setGameStatus] = useState<GameStatus>('playing')
  const [shakeRow, setShakeRow] = useState(false)

  // Load saved state on mount (daily only)
  useEffect(() => {
    if (!isDaily) return
    const saved = loadState(dateKey)
    if (saved) {
      setGuesses(saved.guesses)
      setGameStatus(saved.gameStatus)
    }
  }, [dateKey, isDaily])

  // Save state on changes (daily only)
  useEffect(() => {
    if (!isDaily) return
    if (guesses.length > 0 || gameStatus !== 'playing') {
      saveState(dateKey, { guesses, gameStatus })
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

    const fullGuess = buildFullGuess(currentGuess.toLowerCase(), target, revealedPositions)
    const newGuesses = [...guesses, fullGuess]
    setGuesses(newGuesses)
    setCurrentGuess('')

    if (fullGuess === target) {
      setGameStatus('won')
    } else if (newGuesses.length >= MAX_GUESSES) {
      setGameStatus('lost')
    }
  }, [currentGuess, guesses, target, inputLength, gameStatus, revealedPositions])

  const addLetter = useCallback(
    (letter: string) => {
      if (gameStatus !== 'playing') return
      if (currentGuess.length >= inputLength) return

      const l = letter.toLowerCase()

      // Find the visual cursor position (next non-revealed slot in the full word)
      let visualPos = wordLength
      let typed = 0
      for (let i = 0; i < wordLength; i++) {
        if (revealedPositions.has(i)) continue
        if (typed === currentGuess.length) {
          visualPos = i
          break
        }
        typed++
      }

      // If the user types a letter matching a revealed position just before
      // the cursor, consume it silently so typing the full word feels natural
      for (let i = visualPos - 1; i >= 0 && revealedPositions.has(i); i--) {
        if (target[i] === l) return
      }

      setCurrentGuess((prev) => prev + l)
    },
    [currentGuess, inputLength, gameStatus, revealedPositions, target, wordLength]
  )

  const deleteLetter = useCallback(() => {
    if (gameStatus !== 'playing') return
    setCurrentGuess((prev) => prev.slice(0, -1))
  }, [gameStatus])

  const evaluatedGuesses: EvaluatedLetter[][] = guesses.map((g) =>
    evaluateGuess(g, target, revealedPositions)
  )

  // Build the full display guess (with revealed letters inserted) for the current row
  const displayGuess = useMemo(() => {
    return buildFullGuess(currentGuess, target, revealedPositions)
  }, [currentGuess, target, revealedPositions])

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
    return `${label} ${score}\n\n${grid}\n\n${shareUrl}`
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
    addLetter,
    deleteLetter,
    submitGuess,
    generateShareText,
    startRandomGame,
  }
}
