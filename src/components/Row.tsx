import Tile from './Tile'
import type { EvaluatedLetter } from '../lib/utils'

interface RowProps {
  letters: EvaluatedLetter[]
  shake?: boolean
  tileSize?: 'sm' | 'md' | 'lg'
}

export default function Row({ letters, shake = false, tileSize = 'lg' }: RowProps) {
  return (
    <div className={`flex gap-1 sm:gap-1.5 ${shake ? 'row-shake' : ''}`}>
      {letters.map((tile, i) => (
        <Tile key={i} letter={tile.letter} state={tile.state} delay={i} size={tileSize} />
      ))}
    </div>
  )
}
