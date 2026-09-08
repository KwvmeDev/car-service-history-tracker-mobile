/**
 * Web has no `expo-notifications` build we use, so push registration is a set of
 * no-ops here. Keep these signatures in step with `push-registration.ts`.
 */

export function registerForPush(): Promise<void> {
  return Promise.resolve()
}

export function unregisterFromPush(): Promise<void> {
  return Promise.resolve()
}

export function watchPushTokenChanges(): () => void {
  return () => undefined
}
