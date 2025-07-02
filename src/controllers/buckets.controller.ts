// External dependencies
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'

// Internal deps
import BucketRepository from '../repositories/bucket.repository'
import { ConnectionPool } from 'mssql'

export default async function (fastify: FastifyInstance): Promise<void> {
  /**
   * Get all buckets
   * @route GET /{APP_VERSION}/manage/buckets
   */
  fastify.get('', async function (request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    const start: number = performance.now()

    if (!request.jwt?.sub)
      return reply.fail({ jwt: 'missing authorization' }, 401)


    // buckets => add field private (private means single user)
    // otherwise show everyone in team the bucket
    // team is everyone in the same department and company
    // admins remain access to all

    if (!request.hasPermission('read', 'GroupClaes.PCM/buckets'))
      return reply.fail({ role: 'missing permission' }, 403)

    try {
      const pool: ConnectionPool = await fastify.getSqlPool()
      const repo = new BucketRepository(request.log, pool)

      const result: any = await repo.get(request.jwt.sub)

      if (result.verified) {
        if (result.error) return reply.error(result.error)

        return reply.success({
          buckets: result.result
        }, 200, performance.now() - start)
      }
      return reply.error('Session has expired!', 401, performance.now() - start)
    } catch (err) {
      request.log.error({ err }, 'Failed to get buckets!')
      return reply.error('Failed to get buckets!', 500, performance.now() - start)
    }
  })

  /**
   * Get a specific bucket
   * @route GET /{APP_VERSION}/manage/buckets/:id
   */
  fastify.get('/:id', async function (request: FastifyRequest<{ Params: { id: number } }>, reply: FastifyReply): Promise<FastifyReply> {
    const start: number = performance.now()

    if (!request.jwt?.sub)
      return reply.fail({ jwt: 'missing authorization' }, 401)

    if (!request.hasPermission('read', 'GroupClaes.PCM/buckets'))
      return reply.fail({ role: 'missing permission' }, 403)

    try {
      const pool: ConnectionPool = await fastify.getSqlPool()
      const repo = new BucketRepository(request.log, pool)

      const result: any = await repo.get(request.jwt.sub, request.params.id)

      if (result.verified) {
        if (result.error) return reply.error(result.error)

        return reply.success({
          buckets: result.result
        }, 200, performance.now() - start)
      }
      return reply.error('Session has expired!', 401, performance.now() - start)
    } catch (err) {
      request.log.error({ err }, 'Failed to get buckets!')
      return reply.error('Failed to get buckets!', 500, performance.now() - start)
    }
  })

  /**
   * Add a bucket
   * @route POST /{APP_VERSION}/manage/buckets
   */
  fastify.post('', async function (request: FastifyRequest<{ Body: { name: string, expire?: Date } }>, reply: FastifyReply): Promise<FastifyReply> {
    const start: number = performance.now()

    if (!request.jwt?.sub)
      return reply.fail({ jwt: 'missing authorization' }, 401)

    if (!request.hasPermission('write', 'GroupClaes.PCM/buckets'))
      return reply.fail({ role: 'missing permission' }, 403)

    try {
      const pool: ConnectionPool = await fastify.getSqlPool()
      const repo = new BucketRepository(request.log, pool)

      const result: any = await repo.create(request.jwt.sub, request.body.name, request.body.expire)

      if (result.verified) {
        if (result.error) return reply.error(result.error)

        return reply.success({
          buckets: result.result
        }, 200, performance.now() - start)
      }
      return reply.error('Session has expired!', 401, performance.now() - start)
    } catch (err) {
      request.log.error({ err }, 'Failed to get buckets!')
      return reply.error('Failed to get buckets!', 500, performance.now() - start)
    }
  })

  /**
   * Update a specific bucket
   * @route PUT /{APP_VERSION}/manage/buckets/:id
   */
  fastify.put('/:id', async function (request: FastifyRequest<{ Params: { id: number }, Body: { name: string } }>, reply: FastifyReply): Promise<FastifyReply> {
    const start: number = performance.now()

    if (!request.jwt?.sub)
      return reply.fail({ jwt: 'missing authorization' }, 401)

    if (!request.hasPermission('write', 'GroupClaes.PCM/buckets'))
      return reply.fail({ role: 'missing permission' }, 403)

    try {
      const pool: ConnectionPool = await fastify.getSqlPool()
      const repo = new BucketRepository(request.log, pool)

      const result: any = await repo.update(request.jwt.sub, request.params.id, request.body.name)

      if (result.verified) {
        if (result.error) return reply.error(result.error)

        return reply.success({
          success: result.result
        }, 200, performance.now() - start)
      }
      return reply.error('Session has expired!', 401, performance.now() - start)
    } catch (err) {
      request.log.error({ err }, 'Failed to get buckets!')
      return reply.error('Failed to get buckets!', 500, performance.now() - start)
    }
  })

  /**
   * remove a specific bucket
   * @route DELETE /{APP_VERSION}/manage/buckets/:id
   */
  fastify.delete('/:id', async function (request: FastifyRequest<{ Params: { id: number } }>, reply: FastifyReply): Promise<FastifyReply> {
    const start: number = performance.now()

    if (!request.jwt?.sub)
      return reply.fail({ jwt: 'missing authorization' }, 401)

    if (!request.hasPermission('delete', 'GroupClaes.PCM/buckets'))
      return reply.fail({ role: 'missing permission' }, 403)

    try {
      const pool: ConnectionPool = await fastify.getSqlPool()
      const repo = new BucketRepository(request.log, pool)

      const result: any = await repo.delete(request.jwt.sub, request.params.id)

      if (result.verified) {
        if (result.error) return reply.error(result.error)

        return reply.success({
          success: result.result
        }, 200, performance.now() - start)
      }
      return reply.error('Session has expired!', 401, performance.now() - start)
    } catch (err) {
      request.log.error({ err }, 'Failed to get buckets!')
      return reply.error('Failed to get buckets!', 500, performance.now() - start)
    }
  })

  /**
   * Add a document to a bucket
   * @route POST /{APP_VERSION}/manage/buckets/:id/:document_id
   */
  fastify.post('/:id/:document_id', async function (request: FastifyRequest<{ Params: { id: number, document_id: number } }>, reply: FastifyReply): Promise<FastifyReply> {
    const start: number = performance.now()

    if (!request.jwt?.sub)
      return reply.fail({ jwt: 'missing authorization' }, 401)

    if (!request.hasPermission('write', 'GroupClaes.PCM/buckets'))
      return reply.fail({ role: 'missing permission' }, 403)

    try {
      const pool: ConnectionPool = await fastify.getSqlPool()
      const repo = new BucketRepository(request.log, pool)

      const result: any = await repo.addDocument(request.jwt.sub, request.params.id, request.params.document_id)

      if (result.verified) {
        if (result.error) return reply.error(result.error)

        return reply.success({
          success: result.result
        }, 200, performance.now() - start)
      }
      return reply.error('Session has expired!', 401, performance.now() - start)
    } catch (err) {
      request.log.error({ err }, 'Failed to get buckets!')
      return reply.error('Failed to get buckets!', 500, performance.now() - start)
    }
  })

  /**
   * remove a document from a bucket
   * @route DELETE /{APP_VERSION}/manage/buckets/:id/:document_id
   */
  fastify.delete('/:id/:document_id', async function (request: FastifyRequest<{ Params: { id: number, document_id: number } }>, reply: FastifyReply): Promise<FastifyReply> {
    const start: number = performance.now()

    if (!request.jwt?.sub)
      return reply.fail({ jwt: 'missing authorization' }, 401)

    if (!request.hasPermission('write', 'GroupClaes.PCM/buckets'))
      return reply.fail({ role: 'missing permission' }, 403)

    try {
      const pool: ConnectionPool = await fastify.getSqlPool()
      const repo = new BucketRepository(request.log, pool)

      const result: any = await repo.deleteDocument(request.jwt.sub, request.params.id, request.params.document_id)

      if (result.verified) {
        if (result.error) return reply.error(result.error)

        return reply.success({
          success: result.result
        }, 200, performance.now() - start)
      }
      return reply.error('Session has expired!', 401, performance.now() - start)
    } catch (err) {
      request.log.error({ err }, 'Failed to get buckets!')
      return reply.error('Failed to get buckets!', 500, performance.now() - start)
    }
  })
}
