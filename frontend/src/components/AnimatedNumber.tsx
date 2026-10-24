import { animate, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import * as m from 'motion/react-m'
import { useEffect } from 'react'

import { EASE_OUT } from '../lib/motion'

interface Props {
  value: number
  className?: string
}

/** Counts up from 0 on mount, then from the previous value on each change. */
export function AnimatedNumber({ value, className }: Props) {
  const reduceMotion = useReducedMotion()
  const current = useMotionValue(reduceMotion ? value : 0)
  const rounded = useTransform(current, (v) => Math.round(v))

  useEffect(() => {
    if (reduceMotion) {
      current.set(value)
      return
    }
    const controls = animate(current, value, { duration: 0.9, ease: EASE_OUT })
    return () => controls.stop()
  }, [current, value, reduceMotion])

  return <m.span className={className}>{rounded}</m.span>
}
