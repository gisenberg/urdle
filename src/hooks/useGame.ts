import { useState, useEffect, useCallback } from 'react'
import {
  getTodayKey,
  evaluateGuess,
  encodeWordId,
  getWordIndex,
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

export function useGame(wordEntry: WordEntry, mode: GameMode) {
  const isDaily = mode === 'daily'
  const target = wordEntry.word.toLowerCase()
  const wordLength = target.length
  const dateKey = getTodayKey()

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
    window.location.hash = '#/random'
  }, [])

  const submitGuess = useCallback(() => {
    if (gameStatus !== 'playing') return
    if (currentGuess.length !== wordLength) {
      setShakeRow(true)
      setTimeout(() => setShakeRow(false), 300)
      return
    }

    const guess = currentGuess.toLowerCase()
    const newGuesses = [...guesses, guess]
    setGuesses(newGuesses)
    setCurrentGuess('')

    if (guess === target) {
      setGameStatus('won')
    } else if (newGuesses.length >= MAX_GUESSES) {
      setGameStatus('lost')
    }
  }, [currentGuess, guesses, target, wordLength, gameStatus])

  const addLetter = useCallback(
    (letter: string) => {
      if (gameStatus !== 'playing') return
      if (currentGuess.length < wordLength) {
        setCurrentGuess((prev) => prev + letter.toLowerCase())
      }
    },
    [currentGuess, wordLength, gameStatus]
  )

  const deleteLetter = useCallback(() => {
    if (gameStatus !== 'playing') return
    setCurrentGuess((prev) => prev.slice(0, -1))
  }, [gameStatus])

  const evaluatedGuesses: EvaluatedLetter[][] = guesses.map((g) =>
    evaluateGuess(g, target)
  )

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
          .map(({ state }) => {
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
    gameStatus,
    evaluatedGuesses,
    shakeRow,
    addLetter,
    deleteLetter,
    submitGuess,
    generateShareText,
    startRandomGame,
  }
}
