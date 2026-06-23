import { createContext, useEffect, useMemo, useState } from 'react'
import { observeAuthState } from '../services/auth'
import { ensureProductProfiles } from '../services/productBootstrap'
import { ensureUserProfile, subscribeToUserProfile } from '../services/users'

const initialState = {
  authUser: null,
  profile: null,
  isAuthReady: false,
  isProfileReady: false,
  error: '',
}

const AuthContext = createContext(initialState)

export function AuthProvider({ children }) {
  const [state, setState] = useState(initialState)

  useEffect(() => {
    let unsubscribeProfile = () => {}

    const unsubscribeAuth = observeAuthState(
      async (authUser) => {
        unsubscribeProfile()

        if (!authUser) {
          setState({
            authUser: null,
            profile: null,
            isAuthReady: true,
            isProfileReady: true,
            error: '',
          })
          return
        }

        setState((current) => ({
          ...current,
          authUser,
          isAuthReady: true,
          isProfileReady: false,
          error: '',
        }))

        try {
          await ensureUserProfile(authUser)
          await ensureProductProfiles(authUser)

          unsubscribeProfile = subscribeToUserProfile(
            authUser.uid,
            (profile) => {
              setState({
                authUser,
                profile,
                isAuthReady: true,
                isProfileReady: true,
                error: '',
              })
            },
            (error) => {
              setState((current) => ({
                ...current,
                isProfileReady: true,
                error: error.message,
              }))
            },
          )
        } catch (error) {
          setState((current) => ({
            ...current,
            isProfileReady: true,
            error: error.message,
          }))
        }
      },
      (error) => {
        setState({
          authUser: null,
          profile: null,
          isAuthReady: true,
          isProfileReady: true,
          error: error.message,
        })
      },
    )

    return () => {
      unsubscribeProfile()
      unsubscribeAuth()
    }
  }, [])

  const value = useMemo(
    () => ({
      ...state,
      isAdmin: state.profile?.role === 'admin',
      isRecruiter: state.profile?.role === 'recruiter',
      isAuthenticated: Boolean(state.authUser),
    }),
    [state],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export { AuthContext }
