module.exports = {
  preset: 'jest-puppeteer',
  testMatch: ['**/tests/**/*.test.js'],
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  testTimeout: 30000
}; 