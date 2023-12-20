import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { JWTPayload } from 'jose'
import Check from '../repositories/check.repository'
import Suppliers from '../repositories/suppliers.repository'

declare module 'fastify' {
  export interface FastifyRequest {
    jwt: JWTPayload
    hasRole: (role: string) => boolean
    hasPermission: (permission: string, scope?: string) => boolean
  }

  export interface FastifyReply {
    success: (data?: any, code?: number, executionTime?: number) => FastifyReply
    fail: (data?: any, code?: number, executionTime?: number) => FastifyReply
    error: (message?: string, code?: number, executionTime?: number) => FastifyReply
  }
}

export default async function (fastify: FastifyInstance) {
  /**
   * @route GET /{APP_VERSION}/manage/check
   */
  fastify.get('', async function (request: FastifyRequest<{
    Querystring: {
      query: string
    }
  }>, reply: FastifyReply) {
    const start = performance.now()

    if (!request.jwt?.sub)
      return reply.fail({ jwt: 'missing authorization' }, 401)

    if (!request.hasPermission('read', 'GroupClaes.PCM/datasheet-check'))
      return reply.fail({ role: 'missing permission' }, 403)

    try {
      const repo = new Check(request.log)
      const result = await repo.get(request.query.query, request.jwt.sub)

      if (result.verified) {
        if (result.error) return reply.error(result.error)

        if (result.result.length > 0)
          return result.result
        return [result.result]
      }
      return reply.error('Session has expired!', 401, performance.now() - start)
    } catch (err) {
      request.log.error({ err }, 'failed to get attributes!')
      return reply.error('failed to get attributes!')
    }
  })

  /**
   * @route POST /{APP_VERSION}/manage/check/export
   */
  fastify.post('/export', async function (request: FastifyRequest<{ Body: any[] }>, reply: FastifyReply) {
    if (!request.jwt?.sub)
      return reply.fail({ jwt: 'missing authorization' }, 401)

    if (!request.hasPermission('read', 'GroupClaes.PCM/datasheet-check'))
      return reply.fail({ role: 'missing permission' }, 403)
    try {
      const repo = new Check(request.log)
      const csv = await repo.post(request.body)

      reply
        .code(200)
        .header('Content-Type', 'text/csv')
        .header('Content-Length', csv.length)
        .header('Content-Disposition', `attachment; filename=export_check_${new Date().getTime()}.csv`)
        .send(csv)
    } catch (err) {
      request.log.error({ err }, 'failed to get attributes!')
      return reply.error('failed to get attributes!')
    }
  })

  fastify.get('/search', async function (request: FastifyRequest<{
    Querystring: {
      query: string
    }
  }>, reply: FastifyReply) {
    const start = performance.now()

    if (!request.jwt?.sub)
      return reply.fail({ jwt: 'missing authorization' }, 401)

    if (!request.hasPermission('read', 'GroupClaes.PCM/datasheet-check'))
      return reply.fail({ role: 'missing permission' }, 403)

    try {
      const repo = new Suppliers(request.log)
      const result = await repo.query(request.query.query, request.jwt.sub)

      if (result.verified) {
        if (result.error) return reply.error(result.error)

        return reply.success({ suppliers: result.result })
      }
      return reply.error('Session has expired!', 401, performance.now() - start)
    } catch (err) {
      request.log.error({ err }, 'failed to search supplier!')
      return reply.error('failed to search supplier!')
    }
  })
}