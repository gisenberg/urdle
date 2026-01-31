import Row from './Row'
import type { EvaluatedLetter } from '../lib/utils'
import { MAX_GUESSES } from '../lib/utils'

interface GridProps {
  evaluatedGuesses: EvaluatedLetter[][]
  currentGuess: string
  wordLength: number
  shakeRow: boolean
  revealedPositions: Set<number>
  target: string
}

export default function Grid({
  evaluatedGuesses,
  currentGuess,
  wordLength,
  shakeRow,
  revealedPositions,
  target,
}: GridProps) {
  const rows: EvaluatedLetter[][] = []

  // Submitted guesses
  for (const guess of evaluatedGuesses) {
    rows.push(guess)
  }

  // Current guess row
  if (rows.length < MAX_GUESSES) {
    const currentRow: EvaluatedLetter[] = []
    let typedIdx = 0
    for (let i = 0; i < wordLength; i++) {
      if (revealedPositions.has(i)) {
        currentRow.push({
          letter: target[i],
          state: 'revealed',
        })
      } else {
        currentRow.push({
          letter: currentGuess[typedIdx] || '',
          state: 'empty',
        })
        typedIdx++
      }
    }
    rows.push(currentRow)
  }

  // Empty remaining rows
  while (rows.length < MAX_GUESSES) {
    const emptyRow: EvaluatedLetter[] = []
    for (let i = 0; i < wordLength; i++) {
      if (revealedPositions.has(i)) {
        emptyRow.push({
          letter: target[i],
          state: 'revealed',
        })
      } else {
        emptyRow.push({
          letter: '',
          state: 'empty',
        })
      }
    }
    rows.push(emptyRow)
  }

  // Find the cursor position in the current guess row (first empty non-revealed tile)
  const currentRowIndex = evaluatedGuesses.length
  let cursorPos = -1
  if (currentRowIndex < MAX_GUESSES) {
    const currentRow = rows[currentRowIndex]
    for (let i = 0; i < currentRow.length; i++) {
      if (currentRow[i].state === 'empty' && currentRow[i].letter === '') {
        cursorPos = i
        break
      }
    }
  }

  const tileSize: 'sm' | 'md' | 'lg' =
    wordLength >= 10 ? 'sm' : wordLength >= 7 ? 'md' : 'lg'

  return (
    <div className="flex flex-col gap-1 sm:gap-1.5 items-center">
      {rows.map((row, i) => (
        <Row
          key={i}
          letters={row}
          shake={shakeRow && i === currentRowIndex}
          tileSize={tileSize}
          cursorIndex={i === currentRowIndex ? cursorPos : -1}
        />
      ))}
    </div>
  )
}
