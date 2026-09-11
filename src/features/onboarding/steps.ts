import type { ImageSourcePropType } from 'react-native'

export interface OnboardingStep {
  key: string
  image: ImageSourcePropType
  eyebrow: string
  title: string
  body: string
  cta: string
}

/**
 * Copy and illustrations reused verbatim from the "how it works" section of the
 * web landing page (revv-web src/features/landing/sections.tsx) — already
 * sentence-cased, already tested, already the app's own pitch. The illustrations
 * are the same line-art PNGs exported from revv-web's public/landing/*.svg
 * (assets/onboarding/) rather than new art commissioned for mobile.
 */
export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    key: '1',
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- Metro requires a static require() for images
    image: require('../../../assets/onboarding/step-1-vin.png') as ImageSourcePropType,
    eyebrow: 'Getting started',
    title: 'Add your car by VIN',
    body: 'Revv decodes the year, make, model and trim from the VIN and starts the record.',
    cta: 'Continue',
  },
  {
    key: '2',
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    image: require('../../../assets/onboarding/step-2-log.png') as ImageSourcePropType,
    eyebrow: 'Every service, logged',
    title: 'Log every service',
    body: 'Oil changes, brakes, tyres, with the mileage, the shop, the cost and a photo of the receipt. It works offline and syncs when you are back.',
    cta: 'Continue',
  },
  {
    key: '3',
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    image: require('../../../assets/onboarding/step-3-report.png') as ImageSourcePropType,
    eyebrow: "When you're ready to sell",
    title: 'Share a report when you sell',
    body: 'One tap turns the whole history into a document a buyer opens in any browser. No account, no app, and you can revoke the link anytime.',
    cta: 'Get started',
  },
]
