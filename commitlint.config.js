// Keeps commit messages parseable by release-please. A message it cannot parse
// produces no release and no error, so this is the only place that failure is visible.
module.exports = {
  extends: ['@commitlint/config-conventional'],
};
