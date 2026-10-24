import { useReducedMotion } from 'motion/react'
import * as m from 'motion/react-m'

const COLORS = ['#fde047', '#f472b6', '#a5b4fc', '#6ee7b7', '#fff']
const PARTICLES = 24

interface Props {
  /** Non-zero shows the burst. Render with `key={trigger}` so each increment replays it. */
  trigger: number
}

/** Decorative particle burst, centred on its positioned parent. */
export function Burst({ trigger }: Props) {
  const reduceMotion = useReducedMotion()
  if (trigger === 0 || reduceMotion) return null
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
      {Array.from({ length: PARTICLES }, (_, i) => {
        const angle = (i / PARTICLES) * Math.PI * 2
        const distance = 90 + (i % 4) * 22
        return (
          <m.span
            key={i}
            className={`absolute rounded-full ${i % 2 ? 'size-2' : 'size-3'}`}
            style={{ background: COLORS[i % COLORS.length] }}
            initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
            animate={{
              x: Math.cos(angle) * distance,
              y: Math.sin(angle) * distance,
              scale: [0, 1.4, 0.6],
              opacity: [1, 1, 0],
            }}
            transition={{ duration: 1.1, ease: 'easeOut', delay: (i % 4) * 0.03 }}
          />
        )
      })}
    </span>
  )
}
