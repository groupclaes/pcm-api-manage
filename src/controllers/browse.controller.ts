// External dependencies
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'

// Internal deps
import Browse from '../repositories/browse.repository'

export default async function (fastify: FastifyInstance) {
  /**
   * Get browse page content
   * @route GET /{APP_VERSION}/manage/browse
   */
  fastify.get('', async function (request: FastifyRequest<{
    Querystring: {
      page?: number,
      itemCount?: number,
      directory?: number,
      query: string,
      onlyInvalid?: boolean
    }
  }>, reply: FastifyReply) {
    const start = performance.now()

    if (!request.jwt?.sub)
      return reply.fail({ jwt: 'missing authorization' }, 401)

    if (!request.hasPermission('read', 'GroupClaes.PCM/browse'))
      return reply.fail({ role: 'missing permission' }, 403)

    try {
      const pool = await fastify.getSqlPool()
      const repo = new Browse(request.log, pool)

      const result = await repo.getContent(request.query.page ?? 0, request.query.itemCount ?? 100, request.query.directory, request.query.query, request.query.onlyInvalid ?? false, request.jwt.sub)

      if (result.verified) {
        if (result.error) return reply.error(result.error)

        return reply.success({ ...result.result })
      }
      return reply.error('Session has expired!', 401, performance.now() - start)
    } catch (err) {
      request.log.error({ err }, 'failed to get browse view!')
      return reply.error('failed to get browse view!')
    }
  })
}