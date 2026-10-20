import { useLocation } from 'react-router-dom'

/** Shows the current path and query, so tests can assert on navigation and URL-synced state. */
export function LocationProbe() {
  const { pathname, search } = useLocation()
  return <output aria-label="location">{pathname + search}</output>
}
