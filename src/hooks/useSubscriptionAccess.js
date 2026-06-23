import { useEffect, useMemo, useState } from 'react'
import { useAuth } from './useAuth'
import { subscribeToSubscription } from '../services/subscriptions'
import { getSubscriptionAccessState } from '../utils/subscriptionAccess'

export function useSubscriptionAccess() {
  const session = useAuth()
  const [subscription, setSubscription] = useState(null)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!session.isAuthenticated) {
      setSubscription(null)
      setIsReady(true)
      return undefined
    }

    setIsReady(false)

    return subscribeToSubscription(
      session.authUser.uid,
      (nextSubscription) => {
        setSubscription(nextSubscription)
        setIsReady(true)
      },
      (nextError) => setError(nextError.message),
    )
  }, [session.authUser?.uid, session.isAuthenticated])

  const access = useMemo(
    () => getSubscriptionAccessState(subscription),
    [subscription],
  )

  return {
    ...access,
    error,
    isReady,
    subscription,
  }
}
