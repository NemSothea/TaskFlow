import type { Transition } from 'motion/react'

/**
 * Shared motion tokens. Keep motion short and purposeful: it should explain a
 * change (something appeared, moved or left), never decorate.
 * Reduced-motion users get instant changes via <MotionConfig reducedMotion="user">.
 */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const

export const transitions = {
  /** Small UI feedback: hover, press, value ticks. */
  fast: { duration: 0.15, ease: EASE_OUT },
  /** Elements entering the view. */
  enter: { duration: 0.3, ease: EASE_OUT },
  /** Items leaving a list, and siblings closing the gap. */
  layout: { type: 'spring', stiffness: 500, damping: 40, mass: 1 },
} satisfies Record<string, Transition>

/** Delay between siblings in a staggered entrance, in seconds. */
export const STAGGER = 0.05

export const loadMotionFeatures = () => import('./motionFeatures').then((mod) => mod.default)
