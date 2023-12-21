import main from './src'
const cfg = require('./config')

(async function () {
  const fastify = await main(cfg);

  ['SIGTERM', 'SIGINT'].forEach(signal => {
    process.on(signal, async () => {
      await fastify?.close()
      process.exit(0)
    })
  })
})()