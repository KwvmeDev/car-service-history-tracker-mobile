import type { Ionicons } from '@expo/vector-icons'

type IconName = React.ComponentProps<typeof Ionicons>['name']

/** Falls back to this same glyph for any custom/unrecognised key. */
const FALLBACK_ICON: IconName = 'ellipsis-horizontal-circle-outline'

/** Stock Ionicons per system service type — placeholders until the real icon set
 *  lands (then this becomes a key → asset map instead). */
const ICONS: Record<string, IconName> = {
  oil_change: 'water-outline',
  brakes: 'disc-outline',
  tires: 'ellipse-outline',
  battery: 'battery-half-outline',
  inspection: 'checkmark-circle-outline',
  fluids: 'flask-outline',
  filters: 'funnel-outline',
  scheduled_service: 'calendar-outline',
  repair: 'construct-outline',
  other: FALLBACK_ICON,
}

export function serviceTypeIcon(key: string): IconName {
  return ICONS[key] ?? FALLBACK_ICON
}
