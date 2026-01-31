import words from '../data/words.json'

export interface WordEntry {
  word: string
  definitions: string[]
  example?: string
}

export type LetterState = 'correct' | 'present' | 'absent' | 'empty'

export interface EvaluatedLetter {
  letter: string
  state: LetterState
}

const EPOCH = new Date(2025, 0, 1).getTime()
const DAY_MS = 86400000

export function getDayIndex(): number {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  return Math.floor((today - EPOCH) / DAY_MS)
}

export function getTodayKey(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export function getTodayWord(): WordEntry {
  const index = getDayIndex() % words.length
  return words[index] as WordEntry
}

export function getRandomWord(exclude?: string): WordEntry {
  let entry: WordEntry
  do {
    entry = words[Math.floor(Math.random() * words.length)] as WordEntry
  } while (exclude && entry.word === exclude)
  return entry
}

export function evaluateGuess(guess: string, target: string): EvaluatedLetter[] {
  const result: EvaluatedLetter[] = Array.from(guess, (letter) => ({
    letter,
    state: 'absent' as LetterState,
  }))

  const targetChars = target.split('')
  const remaining: (string | null)[] = [...targetChars]

  // First pass: mark correct positions
  for (let i = 0; i < guess.length; i++) {
    if (guess[i] === targetChars[i]) {
      result[i].state = 'correct'
      remaining[i] = null
    }
  }

  // Second pass: mark present letters
  for (let i = 0; i < guess.length; i++) {
    if (result[i].state === 'correct') continue
    const idx = remaining.indexOf(guess[i])
    if (idx !== -1) {
      result[i].state = 'present'
      remaining[idx] = null
    }
  }

  return result
}

export function getKeyboardStates(
  guesses: string[],
  target: string
): Record<string, LetterState> {
  const states: Record<string, LetterState> = {}

  for (const guess of guesses) {
    const evaluation = evaluateGuess(guess, target)
    for (const { letter, state } of evaluation) {
      const current = states[letter]
      if (!current || statePriority(state) > statePriority(current)) {
        states[letter] = state
      }
    }
  }

  return states
}

function statePriority(state: LetterState): number {
  switch (state) {
    case 'correct': return 3
    case 'present': return 2
    case 'absent': return 1
    case 'empty': return 0
  }
}

export function getUnlockedHintCount(guessCount: number, gameOver: boolean): number {
  if (gameOver) return 3
  if (guessCount >= 4) return 3
  if (guessCount >= 2) return 2
  return 1
}

export function censorWord(text: string, word: string): string {
  const re = new RegExp(word, 'gi')
  return text.replace(re, '_'.repeat(word.length))
}

export const MAX_GUESSES = 6
