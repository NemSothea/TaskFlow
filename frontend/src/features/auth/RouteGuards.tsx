import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { FullPageSpinner } from '../../components/FullPageSpinner'
import { useAuth } from './context'

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

/** Only signed-out users (login/register). Signed-in users go to the app. */
export function GuestRoute() {
  const { status } = useAuth()

  if (status === 'loading') return <FullPageSpinner />
  if (status === 'authenticated') return <Navigate to="/" replace />
  return <Outlet />
}
