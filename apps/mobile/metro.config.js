const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Workspace packages (e.g. @bibi/query-hooks) carry their own dev copies of React and React
// Query; always resolve these singletons from the app so there is exactly one of each.
const SINGLETONS = ["react", "@tanstack/react-query"];
const upstream = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const singleton = SINGLETONS.find(
    (name) => moduleName === name || moduleName.startsWith(`${name}/`),
  );
  const ctx = singleton
    ? { ...context, originModulePath: path.join(__dirname, "package.json") }
    : context;
  return (upstream ?? context.resolveRequest)(ctx, moduleName, platform);
};

module.exports = withNativeWind(config, { input: "./src/global.css" });
