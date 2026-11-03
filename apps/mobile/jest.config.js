module.exports = {
  preset: "jest-expo",
  setupFiles: ["./src/test/setup.ts"],
  // pnpm keeps packages under node_modules/.pnpm; transform React Native packages there too.
  transformIgnorePatterns: [
    "node_modules/(?!(?:\\.pnpm/[^/]+/node_modules/)?((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|nativewind|react-native-css-interop|@bibi/.*))",
  ],
  testPathIgnorePatterns: ["/node_modules/"],
};
