const { version } = require('./package.json');

// The user-facing version is owned by package.json so `npm version <patch|minor|major>`
// bumps it and tags the release in one step. EAS owns buildNumber/versionCode remotely.
module.exports = ({ config }) => ({
  ...config,
  version,
});
