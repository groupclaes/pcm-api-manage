// External dependencies
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'

// Internal deps
import AccessLog from '../repositories/access-log.repository'

export default async function (fastify: FastifyInstance) {
  /**
   * Get all access log entries from DB
   * @route GET /{APP_VERSION}/manage/access-log
   */
  fastify.get('', async function (request: FastifyRequest, reply: FastifyReply) {
    const start = performance.now()

    if (!request.jwt?.sub)
      return reply.fail({ jwt: 'missing authorization' }, 401)

    if (!request.hasPermission('read_all', 'GroupClaes.PCM/access-log'))
      return reply.fail({ role: 'missing permission' }, 403)

    try {
      const pool = await fastify.getSqlPool()
      const repo = new AccessLog(request.log, pool)

      const result = await repo.get(request.jwt.sub)

      if (result.verified) {
        if (result.error) return reply.error(result.error)

        return reply.success({ log: result.result })
      }
      return reply.error('Session has expired!', 401, performance.now() - start)
    } catch (err) {
      request.log.error({ err }, 'failed to get access logs!')
      return reply.error('failed to get access logs!')
    }
  })
}