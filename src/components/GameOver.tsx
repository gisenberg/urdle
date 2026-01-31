import type { GameStatus } from '../hooks/useGame'

interface GameOverProps {
  status: GameStatus
  target: string
  guessCount: number
  maxGuesses: number
  onShare: () => void
  onRandomWord: () => void
}

export default function GameOver({
  status,
  target,
  guessCount,
  maxGuesses,
  onShare,
  onRandomWord,
}: GameOverProps) {
  if (status === 'playing') return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-800 rounded-xl p-6 max-w-sm w-full text-center space-y-4">
        <h2 className="text-2xl font-bold">
          {status === 'won' ? 'Nice!' : 'Better luck tomorrow'}
        </h2>

        <p className="text-lg">
          The word was{' '}
          <span className="font-bold text-green-400 uppercase">{target}</span>
        </p>

        {status === 'won' && (
          <p className="text-neutral-400">
            Solved in {guessCount}/{maxGuesses} guesses
          </p>
        )}

        <div className="flex gap-3 justify-center">
          <button
            onClick={onShare}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            Share Results
          </button>
          <button
            onClick={onRandomWord}
            className="bg-neutral-600 hover:bg-neutral-500 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            Random Word
          </button>
        </div>
      </div>
    </div>
  )
}
