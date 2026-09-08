import { useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { space } from '@revv/tokens'

import { AppText, Button, Field } from '@/ui'
import { signUpWithEmail } from '@/features/auth/email-auth'
import { useAuthAction } from '@/features/auth/use-auth-actions'

const MIN_PASSWORD = 8

export default function SignUpScreen() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { pending, error, run } = useAuthAction()

  const passwordShort = password.length > 0 && password.length < MIN_PASSWORD

  const submit = () => {
    if (passwordShort) return
    void run(
      () => signUpWithEmail({ name: name.trim(), email: email.trim(), password }),
      () => {
        router.replace({ pathname: '/verify-email', params: { email: email.trim() } })
      },
    )
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <AppText token="body" tone="secondary">
          Your service history lives in one place, ready to become a resale report when
          you sell.
        </AppText>

        <Field label="Name" value={name} onChangeText={setName} autoComplete="name" />
        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          textContentType="emailAddress"
        />
        <Field
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
          error={passwordShort ? `At least ${String(MIN_PASSWORD)} characters.` : undefined}
        />

        {error != null ? (
          <AppText token="caption" tone="attention">
            {error}
          </AppText>
        ) : null}

        <Button label="Create account" block loading={pending} onPress={submit} />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: space[5], gap: space[4] },
})
