import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { FullPageSpinner } from '../../components/FullPageSpinner'
import { useAuth } from './context'
import { safeRedirectTarget } from './redirect'

/** Only signed-in users. Others are sent to /login and returned afterwards. */
export function ProtectedRoute() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <FullPageSpinner />
  if (status === 'anonymous') {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }
  return <Outlet />
}

/**
 * Only signed-out users (login/register). Signed-in users go to the app, back to
 * the page ProtectedRoute sent them away from. This also runs the moment login
 * succeeds, so it must honor `state.from` too, or it overrides LoginPage's redirect.
 */
export function GuestRoute() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <FullPageSpinner />
  if (status === 'authenticated') {
    const from = (location.state as { from?: unknown } | null)?.from
    return <Navigate to={safeRedirectTarget(from)} replace />
  }
  return <Outlet />
}
