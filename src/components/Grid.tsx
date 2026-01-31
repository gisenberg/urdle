import Row from './Row'
import type { EvaluatedLetter } from '../lib/utils'
import { MAX_GUESSES } from '../lib/utils'

interface GridProps {
  evaluatedGuesses: EvaluatedLetter[][]
  currentGuess: string
  wordLength: number
  shakeRow: boolean
}

export default function Grid({
  evaluatedGuesses,
  currentGuess,
  wordLength,
  shakeRow,
}: GridProps) {
  const rows: EvaluatedLetter[][] = []

  // Submitted guesses
  for (const guess of evaluatedGuesses) {
    rows.push(guess)
  }

  // Current guess row
  if (rows.length < MAX_GUESSES) {
    const currentRow: EvaluatedLetter[] = []
    for (let i = 0; i < wordLength; i++) {
      currentRow.push({
        letter: currentGuess[i] || '',
        state: 'empty',
      })
    }
    rows.push(currentRow)
  }

  // Empty remaining rows
  while (rows.length < MAX_GUESSES) {
    rows.push(
      Array.from({ length: wordLength }, () => ({
        letter: '',
        state: 'empty' as const,
      }))
    )
  }

  const tileSize: 'sm' | 'md' | 'lg' =
    wordLength >= 10 ? 'sm' : wordLength >= 7 ? 'md' : 'lg'

  return (
    <div className="flex flex-col gap-1 sm:gap-1.5 items-center">
      {rows.map((row, i) => (
        <Row
          key={i}
          letters={row}
          shake={shakeRow && i === evaluatedGuesses.length}
          tileSize={tileSize}
        />
      ))}
    </div>
  )
}
