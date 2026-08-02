const fs = require("fs");
const path = require("path");
const { withDangerousMod } = require("@expo/config-plugins");

// Copies the local StoreKit Configuration file into ios/<target>/ on every
// prebuild, since ios/ itself is gitignored and fully regenerated — without
// this the file would only exist until the next `expo prebuild`. This only
// copies the file; pointing Xcode's scheme at it (Product > Scheme > Edit
// Scheme > Run > Options > StoreKit Configuration) is still a one-time
// manual step per machine — editing the generated .xcscheme XML here would
// risk producing a scheme Xcode can't parse, and the manual step survives
// `expo prebuild` once set (scheme selection isn't stored in ios/, it's in
// gitignored xcuserdata).
module.exports = function withStoreKitConfig(config) {
  return withDangerousMod(config, [
    "ios",
    (config) => {
      const source = path.join(config.modRequest.projectRoot, "ios-storekit", "Raiz.storekit");
      const destinationDir = path.join(config.modRequest.platformProjectRoot, config.modRequest.projectName ?? "Raiz");
      const destination = path.join(destinationDir, "Raiz.storekit");

      if (fs.existsSync(source)) {
        fs.mkdirSync(destinationDir, { recursive: true });
        fs.copyFileSync(source, destination);
      }

      return config;
    },
  ]);
};
