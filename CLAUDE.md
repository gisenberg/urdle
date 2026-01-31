# CLAUDE.md — Urdle Project Guide

## What is Urdle?

Urdle is an Urban Dictionary Wordle clone. Players guess vulgar words and phrases with hint definitions written in an over-the-top, comedically filthy style. Deployed to GitHub Pages at `gisenberg.github.io/urdle`.

## Stack

- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- No backend — fully static SPA with hash-based routing

## Project Structure

```
src/
  components/
    App.tsx          # Root — hash router, daily/random/specific modes
    Game.tsx         # Main game controller — keyboard events, modal state
    Grid.tsx         # 6-row guess grid with revealed position support
    Row.tsx          # Single row of tiles
    Tile.tsx         # Individual letter tile (handles space gaps, revealed style)
    Keyboard.tsx     # On-screen keyboard with color states
    HintPanel.tsx    # Progressive hint definitions with flip card animation
    GameOver.tsx     # End-of-game modal with all 3 definitions
  hooks/
    useGame.ts       # Core game state — guess logic, revealed positions, elapsed timer, share text
  lib/
    utils.ts         # Word selection, evaluation, keyboard states, routing helpers
  data/
    words.json       # Word list with definitions and quality scores
```

## Tone and Content

This is an intentionally vulgar, adult humor game. All content is meant to be as obscene, crude, and funny as possible.

- **Definitions** are written in Urban Dictionary style — maximum vulgarity, absurd imagery, creative profanity. Every definition should make someone laugh or cringe.
- **Words and phrases** are drawn from profanity, sex acts, body parts, insults, and Urban Dictionary's most infamous entries (dirty sanchez, blumpkin, cleveland steamer, etc.).
- When adding new words or rewriting definitions, push the vulgarity as far as it can go. The bar is "would this make a 14-year-old laugh and a grandma faint."
- Each word entry has 3 definitions. Definitions should NOT contain the word itself (it gets censored in hints, but still).

## Word List Format

```json
{
  "word": "dirty sanchez",
  "definitions": [
    "First definition...",
    "Second definition...",
    "Third definition..."
  ],
  "quality": 3
}
```

- `word`: lowercase, spaces allowed for multi-word phrases
- `definitions`: array of exactly 3 strings
- `quality`: 1 (filler), 2 (solid), 3 (peak comedy)

### Quality Scores

Words are scored 1-3. Selection is weighted so better words appear more often:
- **Quality 3** (5x weight): Iconic, hilarious, instantly recognizable vulgar terms
- **Quality 2** (2x weight): Solid entries with good gameplay and decent humor
- **Quality 1** (1x weight): Weaker/generic terms that still belong but shouldn't dominate

Current stats: 334 entries (61 Q3, 236 Q2, 37 Q1), 75 multi-word phrases.

## Key Game Mechanics

### Revealed Positions (vowels + spaces)
- **Spaces** in phrases are always pre-filled as narrow gaps. Players never type spaces.
- **Vowels** (a, e, i, o, u) are pre-filled on the grid when the target is 8+ characters. They show with a dimmed "revealed" style.
- Both spaces and vowels are "given" — the player's typed input only fills non-revealed positions.
- Typing a revealed letter (e.g., the vowel the cursor just skipped over) is silently consumed so typing feels natural.
- All five vowels are dimmed on the keyboard when reveals are active, not just vowels in the target.

### Hints
- 1st hint shown immediately
- 2nd hint unlocks at 2 guesses OR 30 seconds elapsed (whichever first)
- 3rd hint unlocks at 4 guesses OR 60 seconds elapsed (whichever first)
- Game over modal shows all 3 definitions uncensored
- Locked hints show a thin amber progress bar filling toward their time threshold
- The 3rd hint's progress bar only appears after the 2nd hint is revealed, and starts from 0%
- Unlocking triggers a CSS 3D flip card animation (rotateX with backface-visibility)
- Timer (`elapsedSeconds` in `useGame.ts`) ticks every second while `gameStatus === 'playing'` and pauses on game end
- Flip card CSS lives in `src/index.css` (`.hint-card`, `.hint-card-inner`, `.flipped`)

### Modes
- **Daily** (`#/`): Deterministic word-of-the-day, saved to localStorage
- **Random** (`#/random`): Redirects to a specific word URL
- **Specific** (`#/w/{id}`): Shareable encoded word ID (XOR + base36)

### Share Text
Emoji grid (green/yellow/black squares), spaces render as double-space gaps. Includes shareable URL.

## Build & Deploy

```bash
npm run build    # TypeScript check + Vite build
npm run dev      # Local dev server
```

Deployed via GitHub Pages from the `dist/` directory. Base path is `/urdle/`.

## Common Tasks

### Adding words
Add entries to `src/data/words.json`. Each needs `word`, 3 `definitions`, and a `quality` score. Run `npm run build` to validate JSON.

### Changing game mechanics
Core logic lives in `src/hooks/useGame.ts` (input handling, guess submission) and `src/lib/utils.ts` (evaluation, keyboard states, word selection).

### Styling
Tailwind classes throughout. Tile colors defined in `Tile.tsx` and `Keyboard.tsx` via `stateColors` maps. Key states: `correct` (green), `present` (yellow), `absent` (dark), `revealed` (dimmed), `empty` (transparent).
