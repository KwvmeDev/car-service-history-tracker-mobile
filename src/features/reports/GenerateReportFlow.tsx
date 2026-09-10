import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Animated, Modal, Share, StyleSheet, View } from 'react-native'
import * as WebBrowser from 'expo-web-browser'
import { color, radius, space, stagger } from '@revv/tokens'

import { AppText, Button } from '@/ui'
import { easeEnter } from '@/ui/motion'

import { pdfDownloadUrl } from './api'
import { pdfState } from './format'
import { useGenerateReport, useRegenerateReport, useReportPdfStatus } from './hooks'
import type { GeneratedReport } from './types'

export interface GenerateReportFlowProps {
  vehicleId: string
  vehicleTitle: string
  visible: boolean
  onDismiss: () => void
  /** Present → regenerate this report instead of generating a new one. */
  regenerateId?: string
}

// The "record composes top to bottom" lines of the printing animation (widths).
const DOC_LINES = ['90%', '52%', '72%', '40%', '84%', '56%', '66%', '46%'] as const
/** Hold the theatrical moment even if the API is instant. */
const MIN_PRINT_MS = 1600

/**
 * The theatrical "generate resale report" moment (design-system.md §Delight — the
 * one Theatrical action). Full-screen: the record "prints" line by line, then the
 * share link and the PDF slot in. Not a toast, not a sheet.
 */
export function GenerateReportFlow({
  vehicleId,
  vehicleTitle,
  visible,
  onDismiss,
  regenerateId,
}: GenerateReportFlowProps) {
  const generate = useGenerateReport(vehicleId)
  const regenerate = useRegenerateReport(vehicleId)
  const run = regenerateId != null ? regenerate : generate

  const [result, setResult] = useState<GeneratedReport | null>(null)
  const [printDone, setPrintDone] = useState(false)
  const startedAt = useRef(0)

  const lineAnims = useRef(DOC_LINES.map(() => new Animated.Value(0))).current
  const settle = useRef(new Animated.Value(0)).current

  // Kick off on open; reset on close. Runs once per `visible` flip.
  useEffect(() => {
    if (!visible) {
      setResult(null)
      setPrintDone(false)
      run.reset()
      lineAnims.forEach((a) => {
        a.setValue(0)
      })
      settle.setValue(0)
      return
    }
    startedAt.current = Date.now()
    Animated.stagger(
      stagger.item * 2,
      lineAnims.map((a) =>
        Animated.timing(a, { toValue: 1, duration: 260, easing: easeEnter, useNativeDriver: true }),
      ),
    ).start()

    const payload = regenerateId ?? undefined
    const promise = payload != null ? regenerate.mutateAsync(payload) : generate.mutateAsync()
    promise
      .then((r) => {
        setResult(r)
      })
      .catch(() => undefined)
    // Intentionally keyed on `visible` only — this is the once-per-open kickoff.
  }, [visible])

  // When both the print animation minimum and the API have completed, "settle".
  useEffect(() => {
    if (!visible || !result) return
    const wait = Math.max(0, MIN_PRINT_MS - (Date.now() - startedAt.current))
    const t = setTimeout(() => {
      setPrintDone(true)
      Animated.timing(settle, {
        toValue: 1,
        duration: 320,
        easing: easeEnter,
        useNativeDriver: true,
      }).start()
    }, wait)
    return () => {
      clearTimeout(t)
    }
  }, [visible, result, settle])

  const done = printDone && result != null
  const live = useReportPdfStatus(vehicleId, result?.report.id, visible && done)
  const pdf = pdfState(live.data?.pdfStatus ?? result?.report.pdfStatus ?? 'pending')
  const failed = run.isError && !result

  const shareLink = async (): Promise<void> => {
    if (!result) return
    await Share.share({
      message: `${vehicleTitle} — service history report\n${result.shareUrl}`,
      url: result.shareUrl,
    }).catch(() => undefined)
  }

  const openPdf = (): void => {
    if (!result) return
    void WebBrowser.openBrowserAsync(pdfDownloadUrl(result.shareToken))
  }

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.screen}>
        {failed ? (
          <View style={styles.center}>
            <AppText token="title" tone="onBlue">
              That didn&rsquo;t generate
            </AppText>
            <AppText token="body" tone="onBlueSubtle" style={styles.centerText}>
              Something went wrong building the report. Nothing was shared.
            </AppText>
            <View style={styles.actions}>
              <Button
                label="Try again"
                onPress={() => {
                  setResult(null)
                  setPrintDone(false)
                  startedAt.current = Date.now()
                  const payload = regenerateId ?? undefined
                  void (payload != null
                    ? regenerate.mutateAsync(payload)
                    : generate.mutateAsync()
                  )
                    .then(setResult)
                    .catch(() => undefined)
                }}
              />
              <Button label="Close" variant="text" onPress={onDismiss} />
            </View>
          </View>
        ) : !done ? (
          <View style={styles.center}>
            <AppText token="label" tone="onBlueSubtle">
              Composing the record
            </AppText>
            <View style={styles.doc}>
              {DOC_LINES.map((w, i) => {
                const anim = lineAnims[i] ?? settle
                return (
                  <Animated.View
                    key={w + String(i)}
                    style={[
                      styles.docLine,
                      {
                        width: w,
                        opacity: anim,
                        transform: [
                          {
                            translateY: anim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [6, 0],
                            }),
                          },
                        ],
                      },
                    ]}
                  />
                )
              })}
            </View>
            <AppText token="title" tone="onBlue" style={styles.printingTitle}>
              {vehicleTitle}
            </AppText>
          </View>
        ) : (
          <Animated.View style={[styles.ready, { opacity: settle }]}>
            <AppText token="display" tone="onBlue">
              Report ready
            </AppText>
            <AppText token="body" tone="onBlueSubtle" style={styles.readyLead}>
              {vehicleTitle}&rsquo;s history is a shareable document. Send the link; you can revoke
              it any time.
            </AppText>

            <View style={styles.linkBox}>
              <AppText token="mono" tone="onBlueSubtle" numberOfLines={1}>
                {result.shareUrl.replace(/^https?:\/\//, '')}
              </AppText>
            </View>

            <Button label="Share link" block onPress={() => void shareLink()} />

            <View style={styles.pdfRow}>
              {pdf === 'ready' ? (
                <Button label="Download PDF" variant="secondary" block onPress={openPdf} />
              ) : pdf === 'failed' ? (
                <AppText token="label" tone="onBlueSubtle">
                  PDF unavailable — the link still works.
                </AppText>
              ) : (
                <View style={styles.pdfPending}>
                  <ActivityIndicator size="small" color={color.blueSubtle} />
                  <AppText token="label" tone="onBlueSubtle">
                    Preparing the PDF…
                  </AppText>
                </View>
              )}
            </View>

            <Button label="Done" variant="text" onPress={onDismiss} />
          </Animated.View>
        )}
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.blue, padding: space.xl, justifyContent: 'center' },
  center: { alignItems: 'center', gap: space.md },
  centerText: { textAlign: 'center' },
  actions: { gap: space.sm, alignSelf: 'stretch', marginTop: space.md },
  doc: {
    alignSelf: 'stretch',
    backgroundColor: color.white,
    borderRadius: radius.sm,
    padding: space.lg,
    gap: space.sm,
    marginVertical: space.lg,
  },
  docLine: { height: 8, borderRadius: radius.full, backgroundColor: color.hairline },
  printingTitle: { textAlign: 'center' },
  ready: { gap: space.md },
  readyLead: { marginBottom: space.sm },
  linkBox: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.blueSubtle,
    borderRadius: radius.xs,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  pdfRow: { minHeight: 44, justifyContent: 'center' },
  pdfPending: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
})
