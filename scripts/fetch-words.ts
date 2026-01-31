/**
 * Fetches popular words from Urban Dictionary's API and filters them
 * for use in Urdle. Run with: npm run fetch-words
 *
 * The Urban Dictionary API endpoint used:
 *   https://api.urbandictionary.com/v0/random
 *
 * This script fetches multiple batches, filters for quality,
 * and outputs src/data/words.json
 */

interface UDDefinition {
  definition: string
  permalink: string
  thumbs_up: number
  thumbs_down: number
  word: string
  example: string
}

interface UDResponse {
  list: UDDefinition[]
}

interface WordEntry {
  word: string
  definitions: string[]
  example?: string
}

const MIN_THUMBS_UP = 500
const MIN_WORD_LENGTH = 3
const MAX_WORD_LENGTH = 15
const TARGET_COUNT = 400
const BATCH_COUNT = 200

function isValidWord(word: string): boolean {
  return (
    word.length >= MIN_WORD_LENGTH &&
    word.length <= MAX_WORD_LENGTH &&
    /^[a-zA-Z]+$/.test(word)
  )
}

function cleanDefinition(def: string): string {
  // Remove brackets that Urban Dictionary uses for links
  return def.replace(/\[|\]/g, '').trim()
}

async function fetchBatch(): Promise<UDDefinition[]> {
  const res = await fetch('https://api.urbandictionary.com/v0/random')
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  const data: UDResponse = await res.json()
  return data.list
}

async function main() {
  const wordMap = new Map<string, WordEntry>()

  console.log(`Fetching ${BATCH_COUNT} batches from Urban Dictionary...`)

  for (let i = 0; i < BATCH_COUNT; i++) {
    try {
      const defs = await fetchBatch()

      for (const def of defs) {
        const word = def.word.toLowerCase()
        if (!isValidWord(word)) continue
        if (def.thumbs_up < MIN_THUMBS_UP) continue

        const existing = wordMap.get(word)
        const cleaned = cleanDefinition(def.definition)

        if (existing) {
          if (!existing.definitions.includes(cleaned)) {
            existing.definitions.push(cleaned)
          }
        } else {
          wordMap.set(word, {
            word,
            definitions: [cleaned],
            example: def.example ? cleanDefinition(def.example) : undefined,
          })
        }
      }

      if ((i + 1) % 10 === 0) {
        console.log(`  Batch ${i + 1}/${BATCH_COUNT} — ${wordMap.size} unique words`)
      }

      // Rate limit: ~1 request per second
      await new Promise((r) => setTimeout(r, 1000))
    } catch (e) {
      console.error(`  Batch ${i} failed:`, e)
      await new Promise((r) => setTimeout(r, 2000))
    }
  }

  // Sort by word and take up to TARGET_COUNT
  const words = Array.from(wordMap.values())
    .sort((a, b) => a.word.localeCompare(b.word))
    .slice(0, TARGET_COUNT)

  console.log(`\nCollected ${words.length} words. Writing to src/data/words.json`)

  const { writeFileSync, mkdirSync } = await import('fs')
  const { join } = await import('path')

  const outDir = join(import.meta.dirname, '..', 'src', 'data')
  mkdirSync(outDir, { recursive: true })
  writeFileSync(join(outDir, 'words.json'), JSON.stringify(words, null, 2))

  console.log('Done!')
}

main().catch(console.error)
