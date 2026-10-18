// Expo'nun varsayılan Metro ayarı.
// E2E_MOCK=1 ile derlenirse Firebase yerine e2e/firebase-mock kullanılır
// (sadece otomatik testler için; normal derlemeyi etkilemez).
const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

if (process.env.E2E_MOCK === "1") {
  const mockDir = path.resolve(__dirname, "e2e/firebase-mock");
  const mocks = {
    "firebase/app": path.join(mockDir, "app.js"),
    "firebase/auth": path.join(mockDir, "auth.js"),
    "firebase/firestore": path.join(mockDir, "firestore.js"),
  };
  const upstream = config.resolver.resolveRequest;
  config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (mocks[moduleName]) return { type: "sourceFile", filePath: mocks[moduleName] };
    return (upstream ?? context.resolveRequest)(context, moduleName, platform);
  };
}

module.exports = config;
