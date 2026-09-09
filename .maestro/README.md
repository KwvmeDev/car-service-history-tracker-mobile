# Maestro flows (revv-mobile e2e)

Three flows covering the critical mobile journeys:

| Flow | Covers |
|---|---|
| `sign-in.yaml` | email sign-in of a pre-seeded verified user → lands in the garage |
| `add-vehicle-and-log-service.yaml` | add a vehicle (no VIN) → log a service → see it on the timeline |
| `generate-resale-report.yaml` | generate a resale report → the printing moment → shareable link |

They run in that order (`config.yaml` `executionOrder`), each assuming the state
the previous one left.

## Why this is local-only, not in CI

Unlike the `revv-web` Playwright suite, these are **not** wired into
`.github/workflows/ci.yml`. Maestro needs:

- a **dev / EAS build** of the app (Expo Go can't load the native modules Sprint 8–9
  added — `@react-native-ml-kit/text-recognition`, `expo-notifications`), and
- a **running device** — an Android emulator or iOS simulator.

Standing that up in CI means a `reactivecircus/android-emulator-runner` job plus a
built `.apk` artifact (from `eas build --local` or an EAS cloud build), which is a
separate infrastructure task. When that lands, add an `e2e-mobile` job that:
downloads/builds the debug `.apk`, boots the emulator, starts a local `revv-api`
with `TEST_SUPPORT_ENABLED=1`, seeds a user, `maestro test .maestro`.

## Running the flows locally

1. **Start `revv-api` with the test-support seam** (ADR 0016):

   ```bash
   cd ../revv-api
   npm run db:up && npm run migrate:deploy && npm run db:seed
   TEST_SUPPORT_ENABLED=1 npm run dev        # http://localhost:3000
   ```

2. **Seed the verified user the flows sign in as:**

   ```bash
   curl -sX POST http://localhost:3000/v1/_test/users \
     -H 'content-type: application/json' \
     -d '{"email":"maestro@revv.test","password":"maestro-Zx9-passphrase"}'
   ```

   Re-run `POST /v1/_test/reset` first if you want a clean slate.

3. **Run a dev build** pointed at that API. On an emulator, `localhost` on the host
   is `10.0.2.2` from inside the Android emulator, so:

   ```bash
   EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:3000 npx expo run:android
   ```

   (iOS simulator can use `http://localhost:3000`.)

4. **Install Maestro** (<https://maestro.mobile.dev>) and run:

   ```bash
   npm run test:e2e:maestro          # maestro test .maestro
   ```

   Override the seeded creds per run with `-e`:

   ```bash
   maestro test .maestro/sign-in.yaml -e EMAIL=other@revv.test -e PASSWORD=…
   ```

## Selectors

Flows target **button labels** (`tapOn: "Sign in"`) and **`testID`s on text
inputs** — `src/ui/Field.tsx` emits `testID="field-<label>"` for every field
(`field-Email`, `field-Password`, `field-VIN`, `field-Nickname (optional)`,
`field-Date`, `field-Mileage`, `field-Shop`, …). No layout / index matching.

These flows were authored against the current screens but have not been run on a
device in this environment — expect to adjust a selector or two on the first real
run, and prefer adding a `testID` to the offending control over a brittle matcher.
