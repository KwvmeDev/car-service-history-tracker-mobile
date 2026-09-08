import { useMemo, useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'
import { space } from '@revv/tokens'

import { AppText, Button, Card, Field } from '@/ui'
import { newId } from '@/data/ids'
import { useCreateVehicle, useDecodeVin } from '@/features/vehicles/hooks'
import { VinReveal } from '@/features/vehicles/VinReveal'
import type { Vehicle } from '@/features/vehicles/types'

const VIN_LENGTH = 17

type Phase =
  | { step: 'form' }
  | { step: 'decoding'; id: string }
  | { step: 'decoded'; vehicle: Vehicle; decoded: boolean }

export default function AddVehicleScreen() {
  const router = useRouter()
  const [id] = useState(newId)
  const [vin, setVin] = useState('')
  const [nickname, setNickname] = useState('')
  const [phase, setPhase] = useState<Phase>({ step: 'form' })

  const create = useCreateVehicle()
  const decode = useDecodeVin(id)

  const vinReady = vin.length === 0 || vin.length === VIN_LENGTH
  const canSubmit = vinReady && phase.step === 'form' && !create.isPending

  const submit = () => {
    create.mutate(
      {
        id,
        vin: vin.length === VIN_LENGTH ? vin.toUpperCase() : null,
        nickname: nickname.trim().length > 0 ? nickname.trim() : null,
      },
      {
        onSuccess: (vehicle) => {
          if (vehicle.vin == null) {
            router.replace({ pathname: '/vehicle/[id]', params: { id: vehicle.id } })
            return
          }
          setPhase({ step: 'decoding', id: vehicle.id })
          decode.mutate(undefined, {
            onSuccess: (res) => {
              setPhase({ step: 'decoded', vehicle: res.vehicle, decoded: res.decoded })
            },
            onError: () => {
              router.replace({ pathname: '/vehicle/[id]', params: { id: vehicle.id } })
            },
          })
        },
      },
    )
  }

  const revealFields = useMemo(() => {
    if (phase.step !== 'decoded') return []
    const v = phase.vehicle
    return [
      { label: 'Year', value: v.year != null ? String(v.year) : '—' },
      { label: 'Make', value: v.make ?? '—' },
      { label: 'Model', value: v.model ?? '—' },
      { label: 'Trim', value: v.trim ?? '—' },
    ]
  }, [phase])

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {phase.step === 'form' ? (
          <>
            <AppText token="body" tone="secondary">
              Add the VIN and we'll fill in the year, make and model. You can skip it and
              add details yourself.
            </AppText>
            <Field
              label="VIN"
              value={vin}
              onChangeText={(t) => {
                setVin(t.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, VIN_LENGTH))
              }}
              autoCapitalize="characters"
              autoCorrect={false}
              data
              error={!vinReady ? `A VIN is ${String(VIN_LENGTH)} characters.` : undefined}
            />
            <Field label="Nickname (optional)" value={nickname} onChangeText={setNickname} />
            {create.isError ? (
              <AppText token="caption" tone="attention">
                We couldn't save that. Check your connection and try again.
              </AppText>
            ) : null}
            <Button label="Add vehicle" block loading={create.isPending} disabled={!canSubmit} onPress={submit} />
          </>
        ) : null}

        {phase.step === 'decoding' ? (
          <View style={styles.center}>
            <AppText token="body" tone="secondary">
              Reading the VIN…
            </AppText>
          </View>
        ) : null}

        {phase.step === 'decoded' ? (
          <>
            <Card surface="white">
              <AppText token="title" weight="medium">
                {phase.vehicle.nickname ??
                  [phase.vehicle.year, phase.vehicle.make, phase.vehicle.model]
                    .filter(Boolean)
                    .join(' ') ??
                  'New vehicle'}
              </AppText>
              <VinReveal fields={revealFields} />
              {!phase.decoded ? (
                <AppText token="caption" tone="secondary">
                  We couldn't reach the VIN service. The vehicle is saved — add the
                  details yourself or try decoding again from the profile.
                </AppText>
              ) : null}
            </Card>
            <Button
              label="Go to the vehicle"
              block
              onPress={() => {
                router.replace({ pathname: '/vehicle/[id]', params: { id: phase.vehicle.id } })
              }}
            />
          </>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: space[5], gap: space[4], flexGrow: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
})
