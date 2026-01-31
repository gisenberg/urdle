import { useState, useEffect, useSyncExternalStore } from 'react'
import Game from './Game'
import {
  getTodayWord,
  getRandomWord,
  encodeWordId,
  getWordIndex,
  decodeWordId,
  getWordByIndex,
  type WordEntry,
} from '../lib/utils'

export type GameMode = 'daily' | 'random' | 'specific'

interface RouteState {
  mode: GameMode
  wordEntry: WordEntry
}

function parseHash(): RouteState {
  const hash = window.location.hash.replace(/^#\/?/, '')

  if (hash === 'random') {
    const entry = getRandomWord()
    const id = encodeWordId(getWordIndex(entry))
    window.location.replace(`#/w/${id}`)
    return { mode: 'random', wordEntry: entry }
  }

  if (hash.startsWith('w/')) {
    const id = hash.slice(2)
    const index = decodeWordId(id)
    if (index !== null) {
      const entry = getWordByIndex(index)
      if (entry) {
        return { mode: 'specific', wordEntry: entry }
      }
    }
    // Invalid ID — fall through to daily
  }

  return { mode: 'daily', wordEntry: getTodayWord() }
}

function subscribeToHash(callback: () => void) {
  window.addEventListener('hashchange', callback)
  return () => window.removeEventListener('hashchange', callback)
}

function getHashSnapshot() {
  return window.location.hash
}

export default function App() {
  const hash = useSyncExternalStore(subscribeToHash, getHashSnapshot)
  const [route, setRoute] = useState<RouteState>(parseHash)

  useEffect(() => {
    setRoute(parseHash())
  }, [hash])

  return (
    <div className="min-h-screen bg-neutral-900 text-white flex flex-col">
      <header className="border-b border-neutral-700 py-3 px-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-center tracking-wider">
          <a href="#/" className="hover:opacity-80 transition-opacity">
            <span className="text-green-400">U</span>RDLE
          </a>
        </h1>
        <p className="text-xs text-neutral-500 text-center mt-0.5">
          Urban Dictionary Wordle
        </p>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center py-4 sm:py-6 px-2">
        <Game key={route.wordEntry.word} wordEntry={route.wordEntry} mode={route.mode} />
      </main>
    </div>
  )
}
