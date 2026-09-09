import { useState } from 'react'
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native'
import { borderWidth, color, radius, space, text } from '@revv/tokens'

import { AppText } from './Text'
import { resolveFontFamily } from './typography'

export interface FieldProps extends Omit<TextInputProps, 'style'> {
  label: string
  /** Inline validation / hint — shown in amber only when it's an error. */
  error?: string
  /** Render the value in the mono data font (VIN, mileage). */
  data?: boolean
}

/**
 * A labelled text input. One field per concept, stacked with generous space — never a
 * dense grid (design-system.md §Simplicity). Inputs use `radius.xs`; the border goes
 * navy on focus (open-design.ai-DESIGN.md §states). Errors are inline, not a toast.
 */
export function Field({ label, error, data = false, testID, onFocus, onBlur, ...input }: FieldProps) {
  const [focused, setFocused] = useState(false)
  const hasError = error != null && error.length > 0
  // A stable id derived from the label so e2e (Maestro) can target the input
  // without matching on layout. An explicit `testID` still wins.
  const inputTestID = testID ?? `field-${label}`

  return (
    <View style={styles.wrap}>
      <AppText token="label" tone="secondary">
        {label}
      </AppText>
      <TextInput
        testID={inputTestID}
        placeholderTextColor={color.hairline}
        onFocus={(e) => {
          setFocused(true)
          onFocus?.(e)
        }}
        onBlur={(e) => {
          setFocused(false)
          onBlur?.(e)
        }}
        style={[
          styles.input,
          { fontFamily: resolveFontFamily(data ? 'data' : 'ui', 400) },
          focused && !hasError ? styles.inputActive : undefined,
          hasError ? styles.inputError : undefined,
        ]}
        {...input}
      />
      {hasError ? (
        <AppText token="caption" tone="attention">
          {error}
        </AppText>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: space.xxs, alignSelf: 'stretch' },
  input: {
    borderWidth: borderWidth.thin,
    borderColor: color.hairline,
    borderRadius: radius.xs,
    paddingHorizontal: space.sm,
    paddingVertical: space.sm,
    fontSize: text.body.fontSize,
    color: color.ink,
    backgroundColor: color.white,
    minHeight: 48,
  },
  inputActive: { borderColor: color.navy },
  inputError: { borderColor: color.amber },
})
