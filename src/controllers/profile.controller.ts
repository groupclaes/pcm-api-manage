// External dependencies
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'

// Internal deps
import Profile from '../repositories/profile.repository'

export default async function (fastify: FastifyInstance) {
  /**
   * Get all attribute entries from DB
   * @route GET /{APP_VERSION}/manage/profile/dashboard
   */
  fastify.get('/dashboard', async function (request: FastifyRequest, reply: FastifyReply) {
    const start = performance.now()

    if (!request.jwt?.sub)
      return reply.fail({ jwt: 'missing authorization' }, 401)

    if (!request.hasPermission('read', 'GroupClaes.PCM/dashboard'))
      return reply.fail({ role: 'missing permission' }, 403)

    try {
      const pool = await fastify.getSqlPool()
      const repo = new Profile(request.log, pool)

      const result = await repo.getDashboard(request.jwt.sub)

      if (result.verified) {
        if (result.error) return reply.error(result.error)

        return reply.success({ dashboard: result.result })
      }
      return reply.error('Session has expired!', 401, performance.now() - start)
    } catch (err) {
      request.log.error({ err }, 'failed to get dashboard!')
      return reply.error('failed to get dashboard!')
    }
  })
}