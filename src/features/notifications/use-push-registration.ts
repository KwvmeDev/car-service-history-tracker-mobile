import { useEffect, useRef } from 'react'

import { registerForPush, watchPushTokenChanges } from './push-registration'

/**
 * Registers this device for reminder push once per authenticated session, and
 * keeps the registration current if Expo rotates the token. Mount inside the
 * authenticated area (never before sign-in). No-op on web.
 */
export function usePushRegistration(enabled: boolean): void {
  const started = useRef(false)

  useEffect(() => {
    if (!enabled || started.current) return
    started.current = true
    void registerForPush()
    const unwatch = watchPushTokenChanges()
    return unwatch
  }, [enabled])
}
