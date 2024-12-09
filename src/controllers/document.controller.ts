import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify"
import { JWTPayload } from "jose"
import oe from '@groupclaes/oe-connector'

import Document, { IDocument } from "../repositories/document.repository"
import * as helper from '../helper'
import Directory from "../repositories/directory.repository"
import sql from 'mssql'
import Browse from '../repositories/browse.repository'

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
  fastify.get('/:id', async function (request: FastifyRequest<{
    Params: {
      id: number
    },
    Querystring: {
      mode?: string
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
      const browse_repo = new Browse(request.log, pool)
      const mode = request.query.mode ?? 'full'
      const result: any = (mode === 'preview') ? await repo.getPreview(request.params.id, request.jwt.sub) : await repo.get(request.params.id, request.jwt.sub)
      if (result.error) return reply.error(result.error)

      if (result.verified) {
        if (result.result) {
          // flatten arrays
          if (result.result.languages)
            result.result.languages = result.result.languages.map(e => e.id)
          else result.result.languages = []

          if (result.result.attributes)
            result.result.attributes = result.result.attributes.map(e => e.id)
          else result.result.attributes = []

          if (result.result.objectIds)
            result.result.objectIds = result.result.objectIds.map(e => e.id)
          else result.result.objectIds = []

          if (result.result.properties)
            result.result.properties = result.result.properties.map(e => ({
              id: e.id,
              name: e.name,
              value: helper.translateDocumentProperty(e.value, e.type)
            }))

          if (mode === 'full') {
            // get fsinfo
            result.result.color = helper.readFile(result.result.guid, 'color_code')
            result.result.borderColor = helper.readFile(result.result.guid, 'border-color_code')

            // check if preprocessed files exist
            result.result.hasSmallImage = helper.fileDate(result.result.guid, 'image_small')
            result.result.hasThumb = helper.fileDate(result.result.guid, 'thumb')
            result.result.hasThumbM = helper.fileDate(result.result.guid, 'thumb_m')
            result.result.hasThumbL = helper.fileDate(result.result.guid, 'thumb_l')
            result.result.hasThumbLarge = helper.fileDate(result.result.guid, 'thumb_large')
            result.result.hasMiniature = helper.fileDate(result.result.guid, 'miniature')
            result.result.hasImage = helper.fileDate(result.result.guid, 'image')
            result.result.hasLargeImage = helper.fileDate(result.result.guid, 'image_large')
          }
        }

        let response: { document: any, breadcrumbs?: any } = {
          document: result.result
        }
        if (result.breadcrumbs)
          response.breadcrumbs = result.breadcrumbs

        return reply.success(response, 200, performance.now() - start)
      }

      return reply.error('Session has expired!', 401, performance.now() - start)
    } catch (err) {
      request.log.error({ err }, 'failed to get document!')
      return reply.error('failed to get document!')
    }
  })
  fastify.put('/:id', async function (request: FastifyRequest<{
    Params: {
      id: number
    },
    Body: {
      document: IDocument
    }
  }>, reply: FastifyReply) {
    const start = performance.now()

    if (!request.jwt?.sub)
      return reply.fail({ jwt: 'missing authorization' }, 401)

    if (!request.hasPermission('write', 'GroupClaes.PCM/document'))
      return reply.fail({ role: 'missing permission' }, 403)

    try {
      const pool = await fastify.getSqlPool()
      const repo = new Document(request.log, pool)

      if (request.body.document.deletedYear && request.body.document.deletedMonth && request.body.document.deletedDay) {
        let date = new Date(Date.UTC(request.body.document.deletedYear, request.body.document.deletedMonth - 1, request.body.document.deletedDay))
        if (date) {
          request.body.document.deletedOn = date
          delete request.body.document.deletedYear
          delete request.body.document.deletedMonth
          delete request.body.document.deletedDay
        }
      }

      if (request.body.document.meta !== undefined) {
        const meta = request.body.document.meta
        const keys = Object.keys(meta)
        if (keys.every(key => meta[key] === null)) {
          delete request.body.document.meta
        }
      }
      const result = await repo.update(request.params.id, request.body.document, request.jwt.sub)
      if (result.error) return reply.error(result.error)

      if (result.verified)
        return reply.success({ result: result.result, document: request.body.document }, 200, performance.now() - start)

      return reply.error('Session has expired!', 401, performance.now() - start)
    } catch (err) {
      request.log.error({ err }, 'failed to update document!')
      return reply.error('failed to update document!')
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

    if (!request.hasPermission('delete', 'GroupClaes.PCM/document'))
      return reply.fail({ role: 'missing permission' }, 403)

    try {
      const pool = await fastify.getSqlPool()
      const repo = new Document(request.log, pool)
      const result = await repo.delete(request.params.id, request.jwt.sub)
      if (result.error) return reply.error(result.error)

      if (result.verified) {
        if (helper.removeFolder(result.result.guid.toLowerCase()))
          return reply.success(null, 200, performance.now() - start)
        return reply.error(`Document ${result.result.guid.toLowerCase()} deleted but files still exists, contact your administrator!`, 500, performance.now() - start)
      }

      return reply.error('Session has expired!', 401, performance.now() - start)
    } catch (err) {
      request.log.error({ err }, 'failed to delete document!')
      return reply.error('failed to delete document!')
    }
  })

  // Meta data link
  fastify.get('/:id/meta-data-links', async function (request: FastifyRequest<{
    Params: {
      id: number
    }
  }>, reply: FastifyReply) {
    const start = performance.now()

    if (!request.jwt?.sub)
      return reply.fail({ jwt: 'missing authorization' }, 401)

    if (!request.hasPermission('delete', 'GroupClaes.PCM/document-links'))
      return reply.fail({ role: 'missing permission' }, 403)

    try {
      const pool = await fastify.getSqlPool()
      const repo = new Document(request.log, pool)

      const result = await repo.getMetaDataLinks(request.params.id, request.jwt.sub)
      if (result.error) return reply.error(result.error)

      if (result.verified)
        return reply.success({ ...result.result }, 200, performance.now() - start)

      return reply.error('Session has expired!', 401, performance.now() - start)
    } catch (err) {
      request.log.error({ err }, 'failed to get document-links!')
      return reply.error('failed to get document-links!')
    }
  })
  fastify.post('/:id/meta-data-links', async function (request: FastifyRequest<{
    Params: {
      id: number
    },
    Body: {
      id: number
    }
  }>, reply: FastifyReply) {
    const start = performance.now()

    if (!request.jwt?.sub)
      return reply.fail({ jwt: 'missing authorization' }, 401)

    if (!request.hasPermission('delete', 'GroupClaes.PCM/document-links'))
      return reply.fail({ role: 'missing permission' }, 403)

    try {
      const pool = await fastify.getSqlPool()
      const repo = new Document(request.log, pool)

      const result = await repo.postMetaDataLink(request.params.id, request.body.id, request.jwt.sub)
      if (result.error) return reply.error(result.error)

      if (result.verified)
        return reply.success({ ...result.result }, 200, performance.now() - start)

      return reply.error('Session has expired!', 401, performance.now() - start)
    } catch (err) {
      request.log.error({ err }, 'failed to create document-links!')
      return reply.error('failed to create document-links!')
    }
  })
  fastify.delete('/:id/meta-data-links/:slave_id', async function (request: FastifyRequest<{
    Params: {
      id: number
      slave_id: number
    }
  }>, reply: FastifyReply) {
    const start = performance.now()

    if (!request.jwt?.sub)
      return reply.fail({ jwt: 'missing authorization' }, 401)

    if (!request.hasPermission('delete', 'GroupClaes.PCM/document-links'))
      return reply.fail({ role: 'missing permission' }, 403)

    try {
      const pool = await fastify.getSqlPool()
      const repo = new Document(request.log, pool)

      const result = await repo.deleteMetaDataLink(request.params.id, request.params.slave_id, request.jwt.sub)
      if (result.error) return reply.error(result.error)

      if (result.verified)
        return reply.success({ ...result.result }, 200, performance.now() - start)

      return reply.error('Session has expired!', 401, performance.now() - start)
    } catch (err) {
      request.log.error({ err }, 'failed to delete document-links!')
      return reply.error('failed to delete document-links!')
    }
  })

  // Next object id
  fastify.get('/tools/next-object-id', async function (request: FastifyRequest<{
    Querystring: {
      directory_id: number
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
      const result = await repo.getNextObjectId(request.query.directory_id, request.jwt.sub)

      if (result.verified) {
        if (result.error) return reply.error(result.error)

        return reply.success({ next_id: result.result }, 200, performance.now() - start)
      }

      return reply.error('Session has expired!', 401, performance.now() - start)
    } catch (err) {
      request.log.error({ err }, 'failed to get next object id!')
      return reply.error('failed to get next object id!')
    }
  })

  // valid ids
  fastify.put('/tools/check-valid-ids', async function (request: FastifyRequest<{
    Querystring: {
      directory_id: number
    },
    Body: {
      itemNums: number[]
    }
  }>, reply: FastifyReply) {
    const start = performance.now()

    if (!request.jwt?.sub)
      return reply.fail({ jwt: 'missing authorization' }, 401)

    if (!request.hasPermission('read', 'GroupClaes.PCM/document'))
      return reply.fail({ role: 'missing permission' }, 403)

    try {
      const pool = await fastify.getSqlPool()
      const repo = new Directory(request.log, pool)
      const itemNums = request.body.itemNums.map(e => ({ id: e.toString() }))

      oe.configure({
        c: false
      })

      const company = await repo.getCompany(request.query.directory_id)
      let compName = 'GRO'
      if (company.result.length > 0)
        compName = company.result[0].rawName || 'GRO'

      const oeResponse = await oe.run('putCheckItemNums', [
        'pcm-web',
        compName,
        { items: itemNums },
        undefined
      ], {
        tw: -1,
        simpleParameters: true
      })

      request.log.info({ oeResponse }, 'putCheckItemNums result')

      if (oeResponse && oeResponse.result) {
        return reply.success(oeResponse.result, oeResponse.status, performance.now() - start)
      }

      request.log.error({ oeResponse }, 'got a non 200 response from oe')
      return reply.error('Session has expired!', 401, performance.now() - start)
    } catch (err) {
      request.log.error({ err }, 'failed to check validity of object ids!')
      return reply.error('failed to check validity of object ids!')
    }
  })
}