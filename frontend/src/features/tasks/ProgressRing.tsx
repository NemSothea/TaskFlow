import * as m from 'motion/react-m'

import { AnimatedNumber } from '../../components/AnimatedNumber'
import { EASE_OUT } from '../../lib/motion'

interface Props {
  percent: number
  label: string
  size?: number
}

const STROKE = 9

/** Circular progress drawn for a coloured background (white stroke on a translucent track). */
export function ProgressRing({ percent, label, size = 112 }: Props) {
  const radius = (size - STROKE) / 2
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      aria-label={label}
      className="relative shrink-0"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth={STROKE} />
        <m.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#fff"
          strokeWidth={STROKE}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: percent / 100 }}
          transition={{ duration: 1.1, ease: EASE_OUT }}
        />
      </svg>
      <span aria-hidden className="absolute inset-0 flex items-center justify-center text-2xl font-bold">
        <AnimatedNumber value={percent} />%
      </span>
    </div>
  )
}
