const path = require("path");

// Resolve singletons from the app so workspace packages share one React and one React Query.
const fromApp = (name) =>
  path.dirname(require.resolve(`${name}/package.json`, { paths: [__dirname] }));

module.exports = {
  preset: "jest-expo",
  setupFiles: ["./src/test/setup.ts"],
  // pnpm keeps packages under node_modules/.pnpm; transform React Native packages there too.
  transformIgnorePatterns: [
    "node_modules/(?!(?:\\.pnpm/[^/]+/node_modules/)?((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|nativewind|react-native-css-interop|@bibi/.*|standard-navigation))",
  ],
  moduleNameMapper: {
    "\\.css$": "<rootDir>/src/test/styleMock.js",
    "^react$": fromApp("react"),
    "^react/(.*)$": `${fromApp("react")}/$1`,
    "^@tanstack/react-query$": fromApp("@tanstack/react-query"),
  },
  testPathIgnorePatterns: ["/node_modules/"],
};
