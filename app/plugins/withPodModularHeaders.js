const { withPodfile } = require("@expo/config-plugins");

// Firebase's transitive deps (AppCheckCore, pulled in via GoogleUtilities/
// RecaptchaInterop) don't define Swift modules, which CocoaPods needs to
// import them when building as static libraries — `pod install` fails with
// "do not define modules" otherwise. This survives `expo prebuild`
// regenerating ios/, unlike hand-editing the generated Podfile (gitignored,
// rebuilt from app.config.js every time).
const MODULAR_HEADER_PODS = ["GoogleUtilities", "RecaptchaInterop", "AppCheckCore"];

module.exports = function withPodModularHeaders(config) {
  return withPodfile(config, (config) => {
    const marker = "use_expo_modules!";
    if (!config.modResults.contents.includes(marker)) return config;

    const podLines = MODULAR_HEADER_PODS.map((pod) => `  pod '${pod}', :modular_headers => true`).join("\n");
    config.modResults.contents = config.modResults.contents.replace(marker, `${marker}\n\n${podLines}`);
    return config;
  });
};
