import { useEffect, useCallback, useState } from 'react'
import { useGame } from '../hooks/useGame'
import { MAX_GUESSES } from '../lib/utils'
import Grid from './Grid'
import Keyboard from './Keyboard'
import HintPanel from './HintPanel'
import GameOver from './GameOver'

export default function Game() {
  const {
    todayWord,
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
  } = useGame()

  const [showModal, setShowModal] = useState(false)

  // Show modal after a delay when game ends
  useEffect(() => {
    if (gameStatus !== 'playing') {
      const timer = setTimeout(() => setShowModal(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [gameStatus])

  // Physical keyboard support
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return

      if (e.key === 'Enter') {
        e.preventDefault()
        submitGuess()
      } else if (e.key === 'Backspace') {
        e.preventDefault()
        deleteLetter()
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        addLetter(e.key)
      }
    },
    [submitGuess, deleteLetter, addLetter]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  function handleShare() {
    const text = generateShareText()
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
    }
  }

  const gameOver = gameStatus !== 'playing'

  return (
    <div className="flex flex-col items-center gap-4 sm:gap-6 w-full">
      <div className="text-sm text-neutral-500">
        {wordLength} letters &middot; {MAX_GUESSES} guesses
      </div>

      <Grid
        evaluatedGuesses={evaluatedGuesses}
        currentGuess={currentGuess}
        wordLength={wordLength}
        shakeRow={shakeRow}
      />

      <HintPanel
        word={todayWord}
        guessCount={guesses.length}
        gameOver={gameOver}
      />

      <Keyboard
        guesses={guesses}
        target={target}
        onKey={addLetter}
        onEnter={submitGuess}
        onDelete={deleteLetter}
      />

      {showModal && (
        <GameOver
          status={gameStatus}
          target={target}
          guessCount={guesses.length}
          maxGuesses={MAX_GUESSES}
          onShare={handleShare}
        />
      )}
    </div>
  )
}
