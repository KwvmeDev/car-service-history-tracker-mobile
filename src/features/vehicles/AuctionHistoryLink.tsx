import { useEffect, useRef, useState } from 'react'
import { Linking } from 'react-native'
import * as Clipboard from 'expo-clipboard'

import { AppText, Button } from '@/ui'

/** Bidfax mirrors Copart/IAAI's own pre-shipment auction photos by VIN — useful for
 *  an imported car's condition history. Revv never fetches or stores that data
 *  itself (no API is cleanly licensed for it — see the design discussion); this
 *  just copies the VIN and hands the user off to the public site in their own
 *  browser, the same way any other app would open an external link. */
const BIDFAX_URL = 'https://bidfax.info'
const COPIED_NOTE_MS = 3000

export function AuctionHistoryLink({ vin }: { vin: string }) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  const open = () => {
    void Clipboard.setStringAsync(vin)
    void Linking.openURL(BIDFAX_URL)
    setCopied(true)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      setCopied(false)
    }, COPIED_NOTE_MS)
  }

  return (
    <>
      <Button label="Check auction history ↗" variant="text" onPress={open} />
      {copied ? (
        <AppText token="caption" tone="secondary">
          VIN copied — paste it into the search box.
        </AppText>
      ) : null}
    </>
  )
}
