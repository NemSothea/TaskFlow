export type GreetingKey = 'greetingMorning' | 'greetingAfternoon' | 'greetingEvening'

/** Picks the greeting for a local hour (0-23). */
export function greetingKey(hour: number): GreetingKey {
  if (hour < 12) return 'greetingMorning'
  if (hour < 18) return 'greetingAfternoon'
  return 'greetingEvening'
}
