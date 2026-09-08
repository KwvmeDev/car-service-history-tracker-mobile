import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native'
import { color, radius, space, text } from '@revv/tokens'

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
 * dense grid (design-system.md §Simplicity). Errors are inline, not a toast.
 */
export function Field({ label, error, data = false, ...input }: FieldProps) {
  return (
    <View style={styles.wrap}>
      <AppText token="label" tone="secondary">
        {label}
      </AppText>
      <TextInput
        placeholderTextColor={color.ink}
        style={[
          styles.input,
          { fontFamily: resolveFontFamily(data ? 'data' : 'ui', 400) },
          error != null && error.length > 0 ? styles.inputError : undefined,
        ]}
        {...input}
      />
      {error != null && error.length > 0 ? (
        <AppText token="caption" tone="attention">
          {error}
        </AppText>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: space[1], alignSelf: 'stretch' },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.ink,
    borderRadius: radius.sm,
    paddingHorizontal: space[3],
    paddingVertical: space[3],
    fontSize: text.body.fontSize,
    color: color.ink,
    minHeight: 48,
  },
  inputError: { borderColor: color.amber },
})
