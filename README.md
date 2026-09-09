# revv-mobile

Expo SDK 55 + Expo Router app for Revv. Sprint 0 scope only: one screen showing the
`GET /v1/health` response through the generated API client. New Architecture on. No
auth, no navigation surface, no domain content.

## Develop

```
nvm use                 # Node 22
npm install
npm run client:generate # writes src/api/generated/** from openapi/revv-api.json
npm start               # expo start — open in Expo Go or a dev client
```

> **Versions:** the `expo`/`react-native`/`expo-router` versions in `package.json` are
> the intended SDK 55 set. Run `npx expo install --fix` once after the first install to
> reconcile them with the exact SDK 55 releases, then commit the lockfile.

| Script | What |
|---|---|
| `npm start` | Expo dev server (runs `client:generate` first) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint (flat config from the hub's `config-base`) |
| `npm test` | jest-expo — unit + component + hook tests |
| `npm run test:e2e:maestro` | Maestro flows (local only — see below) |
| `npm run client:generate` | regenerate `src/api/generated/**` + `openapi/.spec-hash` |

## e2e (Maestro)

`.maestro/` has flows for the critical journeys (sign-in, add vehicle → log service,
generate resale report). **Local only** — Maestro needs a dev/EAS build + a
device/emulator, so it is not in CI. Setup and the reasoning are in
[`.maestro/README.md`](.maestro/README.md); the hub `docs/e2e.md` is the cross-repo
runbook.

## API contract

`openapi/revv-api.json` is a pinned copy of the document `revv-api` emits (ADR 0005).
`scripts/generate-client.mjs` runs `openapi-typescript` + an `openapi-fetch` wrapper as
a `prestart`/`pretest` step; the generated client is committed. `tools/check-openapi-drift.mjs`
fails CI if the committed client and spec disagree — the fix is `npm run client:generate`.
The generated `api` client is the only way this app calls revv-api.

## Design tokens

Every colour, space, radius and type value comes from `@revv/tokens` (pinned). Raw
literals are banned and enforced by `tools/check-design-tokens.mjs`. In Sprint 0 the
package is consumed via `file:../revv-tokens`; switch to the pinned GitHub Packages
version (`@revv/tokens@0.1.0`) once it is published (scaffold-plan §0 / subtask 05).

## EAS build

`eas.json` defines `preview` (internal distribution, `preview` channel) and
`production` profiles, each with its own `EXPO_PUBLIC_API_BASE_URL`. Bundle id
`com.revv.app`, `newArchEnabled: true` in `app.json`.

```
npx eas build --profile preview --platform android
npx eas build --profile production --platform all
```

**Needs the Expo account + EAS project from scaffold-plan §0** (human one-time). An
actual preview build on Expo's servers is that setup step; nothing here provisions it.

## Agents

`.claude/agents/`: `frontend-engineer`, `design-system`, `security-guard`,
`test-engineer` (copied from the hub — `agents/README.md` there is the source of truth).
