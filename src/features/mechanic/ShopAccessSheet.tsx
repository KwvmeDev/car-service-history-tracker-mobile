import { useState } from 'react'
import { Share, View } from 'react-native'
import { borderWidth, radius, space, type ColorPalette } from '@revv/tokens'

import { AppText, Button, ErrorState, Sheet, Skeleton, useThemedStyles } from '@/ui'

import { useCreateMechanicLink, useMechanicLinks, useRevokeMechanicLink } from './hooks'
import type { MechanicLink } from './types'

const expiry = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })

export interface ShopAccessSheetProps {
  vehicleId: string
  vehicleLabel: string
  visible: boolean
  onDismiss: () => void
}

/**
 * Generate and manage the shop links for a vehicle (Sprint 11, ADR 0015). A link
 * lets a mechanic add a service straight to this vehicle — held for the owner's
 * review. Share the URL (a shop opens it, or prints it as a QR from the web).
 */
export function ShopAccessSheet({ vehicleId, vehicleLabel, visible, onDismiss }: ShopAccessSheetProps) {
  const { styles } = useThemedStyles(buildStyles)
  const links = useMechanicLinks(vehicleId, visible)
  const create = useCreateMechanicLink(vehicleId)
  const revoke = useRevokeMechanicLink(vehicleId)
  const [freshUrl, setFreshUrl] = useState<string | null>(null)

  const active = (links.data ?? []).filter((l) => l.status === 'active')

  const generate = (): void => {
    create.mutate(undefined, {
      onSuccess: (created) => {
        setFreshUrl(created.url)
      },
    })
  }

  const shareUrl = async (url: string): Promise<void> => {
    await Share.share({ message: `Add ${vehicleLabel}'s service here: ${url}`, url })
  }

  return (
    <Sheet visible={visible} onDismiss={onDismiss} title="Shop access">
      <View style={styles.body}>
        <AppText token="body" tone="secondary">
          Give a shop a link to add a service to {vehicleLabel}. You review every entry before it
          joins the record.
        </AppText>

        {freshUrl != null ? (
          <View style={styles.fresh}>
            <AppText token="mono" selectable style={styles.url}>
              {freshUrl}
            </AppText>
            <Button label="Share link" onPress={() => void shareUrl(freshUrl)} />
          </View>
        ) : null}

        <Button
          label={create.isPending ? 'Generating…' : 'Generate a shop link'}
          variant="secondary"
          loading={create.isPending}
          onPress={generate}
        />
        {create.isError ? (
          <AppText token="caption" tone="attention">
            We couldn&rsquo;t create a link. Try again.
          </AppText>
        ) : null}

        {links.isLoading ? (
          <Skeleton width="60%" height={14} />
        ) : links.isError ? (
          <ErrorState message="We couldn't load your links." onRetry={() => void links.refetch()} />
        ) : active.length === 0 ? (
          <AppText token="caption" tone="secondary">
            No active links.
          </AppText>
        ) : (
          active.map((l) => (
            <LinkRow key={l.id} link={l} onRevoke={() => { revoke.mutate(l.id) }} />
          ))
        )}
      </View>
    </Sheet>
  )
}

function LinkRow({ link, onRevoke }: { link: MechanicLink; onRevoke: () => void }) {
  const { styles } = useThemedStyles(buildStyles)
  return (
    <View style={styles.row}>
      <View>
        <AppText token="body">{link.label}</AppText>
        <AppText token="caption" tone="secondary">
          Expires {expiry(link.expiresAt)} · used {link.useCount}×
        </AppText>
      </View>
      <Button label="Revoke" variant="text" onPress={onRevoke} />
    </View>
  )
}

function buildStyles(color: ColorPalette) {
  return {
    body: { gap: space.md, paddingBottom: space.md },
    fresh: {
      gap: space.sm,
      padding: space.sm,
      borderRadius: radius.xs,
      backgroundColor: color.amberWash,
    },
    url: { fontSize: 12 },
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      gap: space.sm,
      paddingVertical: space.sm,
      borderTopWidth: borderWidth.thin,
      borderTopColor: color.hairline,
    },
  }
}
