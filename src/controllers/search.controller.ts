// External dependencies
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { JWTPayload } from 'jose'
import Search from '../repositories/search.repository'
import sql from 'mssql'
import { env } from 'process'

declare module 'fastify' {
  export interface FastifyInstance {
    getSqlPool: (name?: string) => Promise<sql.ConnectionPool>
  }
  
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
   * Get all attribute entries from DB
   * @route GET /{APP_VERSION}/manage/languages
   */
  fastify.get('', async function (request: FastifyRequest<{
    Querystring: {
      query: string,
      directory_id?: number
    }
  }>, reply: FastifyReply) {
    const start = performance.now()

    if (!request.jwt?.sub)
      return reply.fail({ jwt: 'missing authorization' }, 401)

    if (!request.hasPermission('read', 'GroupClaes.PCM/browse'))
      return reply.fail({ role: 'missing permission' }, 403)

    try {
      const pool = await fastify.getSqlPool()
      const repo = new Search(request.log, pool)
      const result = await repo.query(request.query.query, request.jwt.sub, request.query.directory_id)

      if (result.verified) {
        if (result.error) return reply.error(result.error)

        return reply.success({ suggestions: result.result })
      }
      return reply.error('Session has expired!', 401, performance.now() - start)
    } catch (err) {
      request.log.error({ err }, 'failed to get languages!')
      return reply.error('failed to get languages!')
    }
  })
}