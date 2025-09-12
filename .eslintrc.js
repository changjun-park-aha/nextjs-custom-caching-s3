// This configuration only applies to the package manager root.
/** biome-ignore-all lint/style/noCommonJs: biome적용안하고싶은 파일 */
/** @type {import("eslint").Linter.Config} */
module.exports = {
  ignorePatterns: ['apps/**', 'packages/**'],
  extends: ['@workspace/eslint-config/library.js'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: true,
  },
}
