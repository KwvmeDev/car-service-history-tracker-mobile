import { useState } from 'react'
import { Alert, Image, Pressable, View } from 'react-native'
import { radius, space, type ColorPalette } from '@revv/tokens'

import { AppText, useThemedStyles } from '@/ui'

import { queuedFor } from './queue'
import { useAttachToRecord, useRemoveAttachment } from './hooks'
import type { Attachment } from '@/features/service-records/types'

export interface AttachmentGalleryProps {
  vehicleId: string
  serviceRecordId: string
  attachments: Attachment[]
}

/**
 * Thumbnails for a record's receipts / photos: synced ones from their signed URL,
 * plus any still sitting in the offline queue (shown dimmed with a "pending" tag).
 */
export function AttachmentGallery({ vehicleId, serviceRecordId, attachments }: AttachmentGalleryProps) {
  const { styles } = useThemedStyles(buildStyles)
  const attach = useAttachToRecord(vehicleId, serviceRecordId)
  const remove = useRemoveAttachment(vehicleId)
  const [busy, setBusy] = useState(false)
  const pending = queuedFor(serviceRecordId)

  const pick = (source: 'camera' | 'library') => {
    setBusy(true)
    void attach(source).finally(() => {
      setBusy(false)
    })
  }

  return (
    <View style={styles.wrap}>
      <AppText token="label" tone="secondary">
        Receipts & photos
      </AppText>
      <View style={styles.grid}>
        {attachments.map((a) => (
          <Pressable
            key={a.id}
            accessibilityRole="button"
            accessibilityLabel="Remove attachment"
            onLongPress={() => {
              Alert.alert('Remove this attachment?', undefined, [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Remove', style: 'destructive', onPress: () => void remove(a.id) },
              ])
            }}
          >
            <Image source={{ uri: a.url }} style={styles.thumb} />
          </Pressable>
        ))}
        {pending.map((p) => (
          <View key={p.id} style={[styles.thumb, styles.pending]}>
            <AppText token="caption" tone="secondary">
              pending
            </AppText>
          </View>
        ))}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add a photo"
          disabled={busy}
          onPress={() => {
            Alert.alert('Add a photo', undefined, [
              {
                text: 'Take a photo',
                onPress: () => {
                  pick('camera')
                },
              },
              {
                text: 'Choose from library',
                onPress: () => {
                  pick('library')
                },
              },
              { text: 'Cancel', style: 'cancel' },
            ])
          }}
          style={[styles.thumb, styles.add, busy ? styles.busy : undefined]}
        >
          <AppText token="title" tone="secondary">
            +
          </AppText>
        </Pressable>
      </View>
    </View>
  )
}

const SIZE = 72

function buildStyles(color: ColorPalette) {
  return {
    wrap: { gap: space.xs },
    grid: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: space.xs },
    thumb: {
      width: SIZE,
      height: SIZE,
      borderRadius: radius.sm,
      backgroundColor: color.hairline,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    pending: { opacity: 0.5 },
    add: { borderWidth: 1, borderColor: color.hairline, backgroundColor: color.canvas },
    busy: { opacity: 0.5 },
  }
}
