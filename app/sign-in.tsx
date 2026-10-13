import { useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native'
import { Link, useRouter } from 'expo-router'
import { space } from '@revv/tokens'

import { AppText, Button, Field } from '@/ui'
import { signInWithEmail } from '@/features/auth/email-auth'
import { SocialButtons } from '@/features/auth/SocialButtons'
import { TwoFactorChallenge } from '@/features/security/TwoFactorChallenge'

export default function SignInScreen() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [challenge, setChallenge] = useState(false)

  const toHome = () => {
    router.replace('/home')
  }

  const submit = () => {
    setPending(true)
    setError(null)
    void (async () => {
      try {
        const result = await signInWithEmail({ email: email.trim(), password })
        if (result.ok && 'twoFactorRequired' in result) {
          setChallenge(true)
        } else if (result.ok) {
          toHome()
        } else {
          setError(result.message)
        }
      } catch {
        setError("We couldn't reach the server. Check your connection and try again.")
      } finally {
        setPending(false)
      }
    })()
  }

  if (challenge) {
    return (
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TwoFactorChallenge onVerified={toHome} />
          <Button
            label="Back to sign in"
            variant="text"
            onPress={() => {
              setChallenge(false)
            }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    )
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <AppText token="display">
            Revv
          </AppText>
          <AppText token="body" tone="secondary">
            Sign in to your garage.
          </AppText>
        </View>

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
          autoComplete="current-password"
          textContentType="password"
        />

        {error != null ? (
          <AppText token="caption" tone="attention">
            {error}
          </AppText>
        ) : null}

        <Button label="Sign in" block loading={pending} onPress={submit} />

        <SocialButtons
          onSignedIn={() => {
            router.replace('/home')
          }}
        />

        <View style={styles.footer}>
          <AppText token="body" tone="secondary">
            New here?{' '}
          </AppText>
          <Link href="/sign-up">
            <AppText token="body" weight="medium">
              Create an account
            </AppText>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: space.xl, gap: space.md, flexGrow: 1, justifyContent: 'center' },
  header: { gap: space.xxs, marginBottom: space.xs },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
})
