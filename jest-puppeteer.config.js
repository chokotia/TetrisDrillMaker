module.exports = {
  launch: {
    headless: 'new',
    args: ['--no-sandbox']
  },
  server: {
    command: 'http-server -p 3000',
    port: 3000,
    launchTimeout: 10000,
  },
} 