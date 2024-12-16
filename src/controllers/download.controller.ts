// External dependencies
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { env } from 'process'

// Internal dependencies
import Document from '../repositories/document.repository'

export default async function (fastify: FastifyInstance) {
  fastify.get('/:guid', async function (request: FastifyRequest<{
    Params: {
      guid: string
    },
    Querystring: {
      extension: string,
      format: string
    }
  }>, reply: FastifyReply) {
    const start = performance.now()

    if (!request.jwt?.sub)
      return reply.fail({ jwt: 'missing authorization' }, 401)

    if (!request.hasPermission('read', 'GroupClaes.PCM/document'))
      return reply.fail({ role: 'missing permission' }, 403)

    try {
      const pool = await fastify.getSqlPool()
      const repo = new Document(request.log, pool)
      const _guid = request.params.guid.toLowerCase()

      let version = env.APP_VERSION || 'v4'
      // there is no full test setup currently
      // if (version === 'test') version = 'v4'

      let document = await repo.findOne({ guid: _guid })

      if (document) {
        if (document.mimeType.startsWith('image/'))
          return reply.redirect(`https://pcm.groupclaes.be/${version}/i/${_guid}?s=${request.query.format}&ext=${request.query.extension}`, 307)

        return reply.redirect(`https://pcm.groupclaes.be/${version}/content/file/${_guid}`, 307)
      }

      return reply.error('Session has expired!', 401, performance.now() - start)
    } catch (err) {
      request.log.error({ err }, 'failed to get document!')
      return reply.error('failed to get document!')
    }
  })
}