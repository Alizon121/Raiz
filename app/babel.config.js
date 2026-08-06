module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    env: {
      // Metro (real app builds) supports native `import()` directly, but
      // Jest's CommonJS test runtime doesn't without --experimental-vm-modules.
      // Only under test, downlevel dynamic import to a Promise-wrapped
      // require() so authService's lazy Google Sign-In import is testable
      // without changing how it loads in the actual app.
      test: {
        plugins: ["babel-plugin-dynamic-import-node"],
      },
    },
  };
};
