import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify"
import { JWTPayload } from "jose"
import { IRepositoryBooleanResult } from "../repositories"
import Directory from "../repositories/directory.repository"

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
   * @route GET /{APP_VERSION}/directories
   */
  fastify.get('/:id?', async function (request: FastifyRequest<{
    Params: {
      id?: number
    }
  }>, reply: FastifyReply) {
    const start = performance.now()

    if (!request.jwt?.sub)
      return reply.fail({ jwt: 'missing authorization' }, 401)

    if (!request.hasPermission('read', 'GroupClaes.PCM/directory'))
      return reply.fail({ role: 'missing permission' }, 403)

    try {
      const repo = new Directory(request.log)
      let result = await repo.get(request.params.id, request.jwt.sub)

      if (result.verified) {
        if (result.error) return reply.error(result.error)

        if (request.params.id && result.result.length === 1)
          return reply.success({ directories: result.result[0] }, 200, performance.now() - start)
        return reply.success({ directories: result.result }, 200, performance.now() - start)
      }

      return reply.error('Session has expired!', 401, performance.now() - start)
    } catch (err) {
      request.log.error({ err }, 'failed to get directories!')
      return reply.error('failed to get directories!')
    }
  })

  fastify.post('', async function (request: FastifyRequest<{
    Body: {
      name: string
      parent_id: number
    }
  }>, reply: FastifyReply) {
    const start = performance.now()

    if (!request.jwt?.sub)
      return reply.fail({ jwt: 'missing authorization' }, 401)

    if (!request.hasPermission('write', 'GroupClaes.PCM/directory'))
      return reply.fail({ role: 'missing permission' }, 403)

    try {
      const repo = new Directory(request.log)
      const result = await repo.post(request.body.parent_id, request.body.name, request.jwt.sub)

      if (result.verified) {
        if (result.error) return reply.error(result.error)

        return reply.success(null, 200, performance.now() - start)
      }

      return reply.error('Session has expired!', 401, performance.now() - start)
    } catch (err) {
      request.log.error({ err }, 'failed to create directory!')
      return reply.error('failed to create directory!')
    }
  })

  fastify.put('/:id', async function (request: FastifyRequest<{
    Params: {
      id: number
    }, Body: {
      id: number,
      name: string,
      cache_expire_duration?: number
    }
  }>, reply: FastifyReply) {
    const start = performance.now()

    if (!request.jwt?.sub)
      return reply.fail({ jwt: 'missing authorization' }, 401)

    if (!request.hasPermission('write', 'GroupClaes.PCM/directory'))
      return reply.fail({ role: 'missing permission' }, 403)

    try {
      const repo = new Directory(request.log)
      let result: IRepositoryBooleanResult

      if (request.body.id !== request.params.id)
        result = await repo.move(request.body.id, request.params.id, request.jwt.sub)
      else
        result = await repo.update(request.params.id, request.body.name, request.body.cache_expire_duration, request.jwt.sub)

      if (result.verified) {
        if (result.error) return reply.error(result.error)

        return reply.success(null, 200, performance.now() - start)
      }

      return reply.error('Session has expired!', 401, performance.now() - start)
    } catch (err) {
      request.log.error({ err }, 'failed to update directory!')
      return reply.error('failed to update directory!')
    }
  })

  fastify.delete('/:id', async function (request: FastifyRequest<{
    Params: {
      id: number
    }
  }>, reply: FastifyReply) {
    const start = performance.now()

    if (!request.jwt?.sub)
      return reply.fail({ jwt: 'missing authorization' }, 401)

    if (!request.hasPermission('delete', 'GroupClaes.PCM/directory'))
      return reply.fail({ role: 'missing permission' }, 403)

    try {
      const repo = new Directory(request.log)
      const result = await repo.delete(request.params.id, request.jwt.sub)

      if (result.verified) {
        if (result.error) return reply.error(result.error)

        return reply.success(null, 200, performance.now() - start)
      }

      return reply.error('Session has expired!', 401, performance.now() - start)
    } catch (err) {
      request.log.error({ err }, 'failed to delete directory!')
      return reply.error('failed to delete directory!')
    }
  })
}