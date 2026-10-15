/** Top-level routes whose first row is a blue header, so the status bar sits on blue. */
const BLUE_TOP_ROUTES = new Set(['sign-up', 'verify-email', 'vehicle', 'dev-health'])

/**
 * Status-bar icon colour. Icons must contrast with whatever is behind them: blue
 * (stack headers, the Home hero) always takes light icons; everywhere else it is the
 * canvas, which is dark in dark mode and white in light mode.
 */
export function statusBarStyle(segments: readonly string[], dark: boolean): 'light' | 'dark' {
  const first = segments[0] ?? ''
  const onBlue = BLUE_TOP_ROUTES.has(first) || (first === '(tabs)' && segments[1] === 'home')
  return onBlue || dark ? 'light' : 'dark'
}
