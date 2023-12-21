// External dependencies
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { JWTPayload } from 'jose'
import Browse from '../repositories/browse.repository'
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

  /**
   * Get browse page content
   * @route GET /{APP_VERSION}/manage/browse/breadcrumbs
   */
  fastify.get('/breadcrumbs', async function (request: FastifyRequest<{
    Querystring: {
      directory: number
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

      const result = await repo.getBreadcrumbs(request.query.directory, request.jwt.sub)

      if (result.verified) {
        if (result.error) return reply.error(result.error)

        return reply.success({ breadcrumbs: result.breadcrumbs })
      }
      return reply.error('Session has expired!', 401, performance.now() - start)
    } catch (err) {
      request.log.error({ err }, 'failed to get breadcrumbs!')
      return reply.error('failed to get breadcrumbs!')
    }
  })
}