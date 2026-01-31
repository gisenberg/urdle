import words from '../data/words.json'

export interface WordEntry {
  word: string
  definitions: string[]
  example?: string
  quality?: number
}

export type LetterState = 'correct' | 'present' | 'absent' | 'empty' | 'revealed'

export interface EvaluatedLetter {
  letter: string
  state: LetterState
}

const VOWELS = new Set(['a', 'e', 'i', 'o', 'u'])

export function getRevealedPositions(target: string): Set<number> {
  const positions = new Set<number>()
  for (let i = 0; i < target.length; i++) {
    if (target[i] === ' ') {
      positions.add(i)
    } else if (target.length > 7 && VOWELS.has(target[i].toLowerCase())) {
      positions.add(i)
    }
  }
  return positions
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

// Pre-build a weighted word list: quality 3 appears 5x, quality 2 appears 2x, quality 1 appears 1x
const weightedWords: WordEntry[] = []
for (const w of words) {
  const q = (w as WordEntry).quality ?? 2
  const repeats = q === 3 ? 5 : q === 2 ? 2 : 1
  for (let i = 0; i < repeats; i++) {
    weightedWords.push(w as WordEntry)
  }
}

// Deterministic shuffle seeded from word content so daily order is stable
function seededShuffle(arr: WordEntry[]): WordEntry[] {
  const result = [...arr]
  let seed = 0
  for (const w of words) {
    for (let i = 0; i < w.word.length; i++) seed = (seed * 31 + w.word.charCodeAt(i)) | 0
  }
  for (let i = result.length - 1; i > 0; i--) {
    seed = (seed * 1103515245 + 12345) | 0
    const j = ((seed >>> 16) & 0x7fff) % (i + 1);
    [result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

const dailyPool = seededShuffle(weightedWords)

export function getTodayWord(): WordEntry {
  const index = getDayIndex() % dailyPool.length
  return dailyPool[index]
}

export function getRandomWord(exclude?: string): WordEntry {
  let entry: WordEntry
  do {
    entry = weightedWords[Math.floor(Math.random() * weightedWords.length)]
  } while (exclude && entry.word === exclude)
  return entry
}

export function evaluateGuess(guess: string, target: string, revealedPositions?: Set<number>): EvaluatedLetter[] {
  const result: EvaluatedLetter[] = Array.from(guess, (letter) => ({
    letter,
    state: 'absent' as LetterState,
  }))

  const targetChars = target.split('')
  const remaining: (string | null)[] = [...targetChars]

  // First pass: mark revealed and correct positions
  for (let i = 0; i < guess.length; i++) {
    if (revealedPositions?.has(i)) {
      result[i].state = 'correct'
      remaining[i] = null
    } else if (guess[i] === targetChars[i]) {
      result[i].state = 'correct'
      remaining[i] = null
    }
  }

  // Second pass: mark present letters (skip revealed)
  for (let i = 0; i < guess.length; i++) {
    if (result[i].state === 'correct') continue
    if (revealedPositions?.has(i)) continue
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
  target: string,
  revealedPositions?: Set<number>
): Record<string, LetterState> {
  const states: Record<string, LetterState> = {}

  // If target is 8+ chars, dim all vowels on keyboard (not just ones in the target)
  if (revealedPositions && target.length > 7) {
    for (const v of VOWELS) {
      states[v] = 'revealed'
    }
  }

  for (const guess of guesses) {
    const evaluation = evaluateGuess(guess, target, revealedPositions)
    for (let i = 0; i < evaluation.length; i++) {
      if (revealedPositions?.has(i)) continue
      const { letter, state } = evaluation[i]
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
    case 'revealed': return 0
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
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(escaped, 'gi')
  return text.replace(re, '_'.repeat(word.length))
}

export const MAX_GUESSES = 6

// --- Routing utilities ---

const XOR_KEY = 0x5A3C

export function encodeWordId(index: number): string {
  return (index ^ XOR_KEY).toString(36)
}

export function decodeWordId(id: string): number | null {
  const num = parseInt(id, 36)
  if (isNaN(num)) return null
  const index = num ^ XOR_KEY
  if (index < 0 || index >= words.length) return null
  return index
}

export function getWordByIndex(index: number): WordEntry | null {
  if (index < 0 || index >= words.length) return null
  return words[index] as WordEntry
}

export function getWordIndex(entry: WordEntry): number {
  return words.findIndex((w) => w.word === entry.word)
}

export function getWordByName(name: string): WordEntry | null {
  const lower = name.toLowerCase()
  const entry = words.find((w) => w.word.toLowerCase() === lower)
  return (entry as WordEntry) ?? null
}
