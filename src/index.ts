import Fastify from '@groupclaes/fastify-elastic'
import multipart from '@fastify/multipart'
const cfg = require('./config')
import { env } from 'process'

import accessLogController from './controllers/access-log.controller'
import { FastifyInstance } from 'fastify'
import attributesController from './controllers/attributes.controller'
import browseController from './controllers/browse.controller'
import checkController from './controllers/check.controller'
import directoriesController from './controllers/directories.controller'
import documentController from './controllers/document.controller'
import languagesController from './controllers/languages.controller'
import profileController from './controllers/profile.controller'
import searchController from './controllers/search.controller'
import usersController from './controllers/users.controller'
import uploadController from './controllers/upload.controller'

const LOGLEVEL = 'debug'

let fastify: FastifyInstance | undefined

/** Main loop */
async function main(config: any): Promise<FastifyInstance | undefined> {
  if (!config || !config.wrapper) return
  // add jwt configuration object to config since we want to force JWT
  fastify = await Fastify({ ...config.wrapper, jwt: {} })
  const version_prefix = (env.APP_VERSION ? '/' + env.APP_VERSION : '')
  await fastify.register(multipart, {
    // file size 100Mb
    limits: {
      fileSize: 100000000
    }
  })
  await fastify.register(accessLogController, { prefix: `${version_prefix}/${config.wrapper.serviceName}/access-logs`, logLevel: LOGLEVEL })
  await fastify.register(attributesController, { prefix: `${version_prefix}/${config.wrapper.serviceName}/attributes`, logLevel: LOGLEVEL })
  await fastify.register(browseController, { prefix: `${version_prefix}/${config.wrapper.serviceName}/browse`, logLevel: LOGLEVEL })
  await fastify.register(checkController, { prefix: `${version_prefix}/${config.wrapper.serviceName}/check`, logLevel: LOGLEVEL })
  await fastify.register(directoriesController, { prefix: `${version_prefix}/${config.wrapper.serviceName}/directories`, logLevel: LOGLEVEL })
  await fastify.register(documentController, { prefix: `${version_prefix}/${config.wrapper.serviceName}/documents`, logLevel: LOGLEVEL })
  await fastify.register(languagesController, { prefix: `${version_prefix}/${config.wrapper.serviceName}/languages`, logLevel: LOGLEVEL })
  await fastify.register(profileController, { prefix: `${version_prefix}/${config.wrapper.serviceName}/profile`, logLevel: LOGLEVEL })
  await fastify.register(searchController, { prefix: `${version_prefix}/${config.wrapper.serviceName}/search`, logLevel: LOGLEVEL })
  await fastify.register(uploadController, { prefix: `${version_prefix}/${config.wrapper.serviceName}/upload`, logLevel: LOGLEVEL })
  await fastify.register(usersController, { prefix: `${version_prefix}/${config.wrapper.serviceName}/users`, logLevel: LOGLEVEL })
  await fastify.listen({ port: +(env['PORT'] ?? 80), host: '::' })

  return fastify
}

['SIGTERM', 'SIGINT'].forEach(signal => {
  process.on(signal, async () => {
    await fastify?.close()
    process.exit(0)
  })
})

export default main

main(cfg)