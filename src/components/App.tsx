import Game from './Game'

export default function App() {
  return (
    <div className="min-h-screen bg-neutral-900 text-white flex flex-col">
      <header className="border-b border-neutral-700 py-3 px-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-center tracking-wider">
          <span className="text-green-400">U</span>RDLE
        </h1>
        <p className="text-xs text-neutral-500 text-center mt-0.5">
          Urban Dictionary Wordle
        </p>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center py-4 sm:py-6 px-2">
        <Game />
      </main>
    </div>
  )
}
