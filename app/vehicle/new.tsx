import { useMemo, useState } from 'react'
import { Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native'
import { useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { radius, space, type ColorPalette } from '@revv/tokens'

import { AppText, Button, Card, Field, useThemedStyles } from '@/ui'
import { newId } from '@/data/ids'
import { uploadVehiclePhoto } from '@/features/vehicles/cloudinary'
import { useCreateVehicle, useDecodeVin } from '@/features/vehicles/hooks'
import { defaultMileageUnit } from '@/features/vehicles/mileage-unit'
import { MileageUnitToggle } from '@/features/vehicles/MileageUnitToggle'
import { VinReveal } from '@/features/vehicles/VinReveal'
import type { Vehicle } from '@/features/vehicles/types'

const VIN_LENGTH = 17
const PHOTO_SIZE = 148

type Phase =
  | { step: 'form' }
  | { step: 'decoding'; id: string }
  | { step: 'decoded'; vehicle: Vehicle; decoded: boolean }

interface PickedPhoto {
  uri: string
  mimeType: string
}

function buildStyles(color: ColorPalette) {
  return {
    flex: { flex: 1 },
    content: { padding: space.xl, gap: space.md, flexGrow: 1 },
    center: { flex: 1, alignItems: 'center' as const, justifyContent: 'center' as const },
    photoPicker: { alignSelf: 'center' as const },
    photoPreview: { width: PHOTO_SIZE, height: PHOTO_SIZE, borderRadius: radius.md },
    photoPlaceholder: {
      width: PHOTO_SIZE,
      height: PHOTO_SIZE,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: color.hairline,
      backgroundColor: color.canvas,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: space.xxs,
    },
  }
}

export default function AddVehicleScreen() {
  const { styles } = useThemedStyles(buildStyles)
  const router = useRouter()
  const [id] = useState(newId)
  const [vin, setVin] = useState('')
  const [nickname, setNickname] = useState('')
  const [mileageUnit, setMileageUnit] = useState<'mi' | 'km'>(defaultMileageUnit)
  const [photo, setPhoto] = useState<PickedPhoto | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [phase, setPhase] = useState<Phase>({ step: 'form' })

  const create = useCreateVehicle()
  const decode = useDecodeVin(id)

  const vinReady = vin.length === 0 || vin.length === VIN_LENGTH
  const canSubmit = vinReady && phase.step === 'form' && !create.isPending && !uploadingPhoto

  const pickPhoto = (source: 'camera' | 'library') => {
    void (async () => {
      const permission =
        source === 'camera'
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (!permission.granted) return

      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync({ quality: 0.8, exif: false })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              quality: 0.8,
              exif: false,
            })
      if (result.canceled || result.assets.length === 0) return
      const asset = result.assets[0]
      if (!asset) return
      setPhoto({ uri: asset.uri, mimeType: asset.mimeType ?? 'image/jpeg' })
    })()
  }

  const choosePhoto = () => {
    Alert.alert('Add a photo', undefined, [
      {
        text: 'Take a photo',
        onPress: () => {
          pickPhoto('camera')
        },
      },
      {
        text: 'Choose from library',
        onPress: () => {
          pickPhoto('library')
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ])
  }

  const submit = () => {
    void (async () => {
      let photoUrl: string | null = null
      if (photo) {
        setUploadingPhoto(true)
        try {
          photoUrl = await uploadVehiclePhoto(photo.uri, photo.mimeType)
        } catch {
          // Optional field — the vehicle is still worth creating without its photo.
        } finally {
          setUploadingPhoto(false)
        }
      }

      create.mutate(
        {
          id,
          vin: vin.length === VIN_LENGTH ? vin.toUpperCase() : null,
          nickname: nickname.trim().length > 0 ? nickname.trim() : null,
          mileageUnit,
          photoUrl,
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
    })()
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
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={photo ? 'Change vehicle photo' : 'Add a vehicle photo'}
              onPress={choosePhoto}
              style={styles.photoPicker}
            >
              {photo ? (
                <Image source={{ uri: photo.uri }} style={styles.photoPreview} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <AppText token="title" tone="secondary">
                    +
                  </AppText>
                  <AppText token="caption" tone="secondary">
                    Add a photo
                  </AppText>
                </View>
              )}
            </Pressable>
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
            <MileageUnitToggle value={mileageUnit} onChange={setMileageUnit} />
            {create.isError ? (
              <AppText token="caption" tone="attention">
                We couldn't save that. Check your connection and try again.
              </AppText>
            ) : null}
            <Button
              label="Add vehicle"
              block
              loading={create.isPending || uploadingPhoto}
              disabled={!canSubmit}
              onPress={submit}
            />
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
              <AppText token="title">
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

