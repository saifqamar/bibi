# Bibi mobile app

Expo (SDK 58) listener app with Expo Router, NativeWind and TanStack Query.

- Native modules (audio, secure storage) need a development build, not Expo Go:
  `pnpm --filter @bibi/mobile android` or `ios`.
- Set the API address in `app.json` → `expo.extra.apiUrl`.
- `pnpm --filter @bibi/mobile test` runs the Jest suite (`jest-expo`).
