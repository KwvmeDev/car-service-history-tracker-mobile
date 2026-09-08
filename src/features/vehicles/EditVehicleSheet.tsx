import { useEffect, useState } from 'react'
import { space } from '@revv/tokens'
import { View } from 'react-native'

import { AppText, Button, Field, Sheet } from '@/ui'
import { useUpdateVehicle } from './hooks'
import type { Vehicle } from './types'

/**
 * Edit the user-set fields. Optimistic (useUpdateVehicle) — the sheet closes as soon
 * as the write is applied to the cache; a failure rolls the change back and the row
 * shows "not synced" until it lands.
 */
export function EditVehicleSheet({
  vehicle,
  visible,
  onDismiss,
}: {
  vehicle: Vehicle
  visible: boolean
  onDismiss: () => void
}) {
  const update = useUpdateVehicle(vehicle.id)
  const [nickname, setNickname] = useState(vehicle.nickname ?? '')
  const [mileage, setMileage] = useState(
    vehicle.currentMileage != null ? String(vehicle.currentMileage) : '',
  )

  useEffect(() => {
    if (visible) {
      setNickname(vehicle.nickname ?? '')
      setMileage(vehicle.currentMileage != null ? String(vehicle.currentMileage) : '')
    }
  }, [visible, vehicle])

  const save = () => {
    const parsedMileage = mileage.trim().length > 0 ? Number(mileage.replace(/[^0-9]/g, '')) : null
    update.mutate(
      {
        nickname: nickname.trim().length > 0 ? nickname.trim() : null,
        currentMileage: parsedMileage,
      },
      { onSuccess: onDismiss },
    )
    onDismiss()
  }

  return (
    <Sheet visible={visible} onDismiss={onDismiss} title="Edit vehicle">
      <View style={{ gap: space.md }}>
        <Field label="Nickname" value={nickname} onChangeText={setNickname} />
        <Field
          label="Current mileage"
          value={mileage}
          onChangeText={(t) => {
            setMileage(t.replace(/[^0-9]/g, ''))
          }}
          keyboardType="number-pad"
          data
        />
        {update.isError ? (
          <AppText token="caption" tone="attention">
            That didn't save. It'll retry — check back in a moment.
          </AppText>
        ) : null}
        <Button label="Save" block onPress={save} />
      </View>
    </Sheet>
  )
}
