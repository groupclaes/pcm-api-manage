// External dependencies
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { JWTPayload } from 'jose'
import fs from 'fs'
import util from 'util'
import path from 'path'
import crypto from 'crypto'
import { pipeline } from 'stream'
import sharp from 'sharp'

const pump = util.promisify(pipeline)
const deleteOnDirs = [
  87,
  200,
  208,
  209,
  230,
  231
]

import Document, { DBResultSet } from '../repositories/document.repository'
import sql from 'mssql'
import { env } from 'process'

declare module 'fastify' {
  export interface FastifyInstance {
    getSqlPool: (name: string) => Promise<sql.ConnectionPool>
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
   * @route GET /{APP_VERSION}/manage/upload
   */

  fastify.post('', async function (request: FastifyRequest<{
    Querystring: {
      directory_id: number,
      id?: number,
      mode?: 'update' | 'version'
    }
  }>, reply: FastifyReply) {
    const start = performance.now()

    if (!request.jwt?.sub)
      return reply.fail({ jwt: 'missing authorization' }, 401)

    if (!request.hasPermission('write', 'GroupClaes.PCM/document'))
      return reply.fail({ role: 'missing permission', permission: 'write' }, 403)

    try {
      const pool = await fastify.getSqlPool(env['DB_NAME'] ?? 'PCM')
      const repo = new Document(request.log, pool)

      const parts: {
        filename: string,
        encoding: string,
        mimetype: string,
        file: any,
        fields: Set<any>
      }[] = (request as any).files()

      const relativePath = await repo.getRelativePath(request.query.directory_id)
      if (!relativePath)
        return reply.error('relativePath not set')

      const relativePathParts = relativePath.split('/')
      const object_type = relativePathParts.length > 1 ? relativePathParts[1] : 'none'
      const document_type = relativePathParts.length > 2 ? relativePathParts[2] : 'none'

      let results: DBResultSet[] = []
      for await (const data of parts) {
        let uuid = crypto.randomUUID()
        const _fn = `${env['DATA_PATH']}/content/${uuid.substring(0, 2)}/${uuid}/file`

        // upload and save the file
        fs.mkdirSync(`${env['DATA_PATH']}/content/${uuid.substring(0, 2)}/${uuid}`, { recursive: true })
        await pump(data.file, fs.createWriteStream(_fn))

        let dt: Date | undefined

        if (deleteOnDirs.some(e => e == request.query.directory_id)) {
          // try parse date
          const fn = path.parse(data.filename).name
          const last8 = fn.substring(fn.length - 8)
          if (/^[0-9]{8}$/.test(last8.toLocaleLowerCase())) {
            const year = parseInt(last8.substring(0, 4))
            const month = parseInt(last8.substring(4, 6))
            const day = parseInt(last8.substring(6, 8))

            dt = new Date(Date.UTC(year, month - 1, day))
          }
        }

        let mimetype = data.mimetype
        let filename = data.filename
        let filesize = data.file.bytesRead

        // check if the uploaded file is a jpg or png, if so convert the file to webp.
        // converted files will have an extra file in directory for safekeeping: file_source
        //if (request.jwt.sub === '1') {
        if ([
          'image/png',
          'image/jpeg',
          'image/tiff',
          'image/pjpeg'
        ].includes(data.mimetype)) {
          // move file to file_source
          try {
            const _ofn = `${env['DATA_PATH']}/content/${uuid.substring(0, 2)}/${uuid}/file_source`
            fs.copyFileSync(_fn, _ofn)
            let buffer = await sharp(_ofn)
              .withMetadata()
              .webp({
                lossless: true
              })
              .toBuffer()

            // http://pcm.groupclaes.be/v4/i/mac/artikel/foto/ ?s=thumb_large&swp
            // const is_smaller = buffer.length < filesize
            // if (!is_smaller)
            //   buffer = await sharp(_ofn)
            //     .withMetadata()
            //     .webp({
            //       effort: 6
            //     })
            //     .toBuffer()

            fs.writeFileSync(_fn, buffer)
            // remove file_source
            fs.unlinkSync(_ofn)

            mimetype = 'image/webp'
            filename = filename
              .replace('.png', '')
              .replace('.jpeg', '')
              .replace('.jpg', '')
              .replace('.pjpg', '')
              .replace('.pjpeg', '')
              .replace('.tif', '')
              .replace('.tiff', '')
              .replace('.PNG', '')
              .replace('.JPEG', '')
              .replace('.JPG', '')
              .replace('.PJPG', '')
              .replace('.PJPEG', '')
              .replace('.TIF', '')
              .replace('.TIFF', '') + '.webp'
            filesize = buffer.length
          } catch (err) {
            request.log.error({ err }, 'error while trying to convert image to webp')
          } finally {
            // check if the file was not deleted
          }
        }
        //}

        if (!request.query.mode) {
          results.push(await repo.create(uuid, request.query.directory_id, filename, mimetype, filesize, object_type, document_type, dt, request.jwt.sub))
        } else if (request.query.id) {
          switch (request.query.mode) {
            case 'update':
              const result = await repo.createUpdate(request.query.id, uuid, request.query.directory_id, filename, mimetype, filesize, object_type, document_type, dt, request.jwt.sub)
              if (result.result.length > 0) {
                const _ouuid = result.result[0].guid.toLocaleLowerCase()
                const _ofn = `${env['DATA_PATH']}/content/${_ouuid.substring(0, 2)}/${_ouuid}/file`
                fs.copyFileSync(_fn, _ofn)
                fs.rmdirSync(`${env['DATA_PATH']}/content/${uuid.substring(0, 2)}/${uuid}`, { recursive: true })
              }
              results.push(result)
              break

            case 'version':
              results.push(await repo.createVersion(request.query.id, uuid, request.query.directory_id, filename, mimetype, filesize, object_type, document_type, dt, request.jwt.sub))
              break
          }
        }
      }

      if (results.length > 0 && results[0].verified) {
        return results.length > 1 ? results : results[0]
      }
      return reply.error('Session has expired!', 401, performance.now() - start)
    } catch (err) {
      request.log.error({ err }, 'failed to upload document!')
      return reply.error('failed to upload document!')
    }
  })
}