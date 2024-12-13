import sql from 'mssql'
import { FastifyBaseLogger } from 'fastify'

export default class Document {
  schema: string = 'document.'
  _logger: FastifyBaseLogger
  _pool: sql.ConnectionPool

  constructor(logger: FastifyBaseLogger, pool: sql.ConnectionPool) {
    this._logger = logger
    this._pool = pool
  }

  async findOne(filters) {
    const r = new sql.Request(this._pool)
    r.input('id', sql.Int, filters.id)
    r.input('guid', sql.UniqueIdentifier, filters.guid)
    r.input('company', sql.Char, filters.company)
    r.input('company_oe', sql.Char, filters.companyOe)
    r.input('object_type', sql.VarChar, filters.objectType)
    r.input('document_type', sql.VarChar, filters.documentType)
    r.input('object_id', sql.BigInt, filters.objectId)
    r.input('culture', sql.VarChar, filters.culture)

    let result = await r.execute(`${this.schema}usp_findOne`)

    if (result.recordset && result.recordset.length === 1) {
      return result.recordset[0]
    } else if (result.recordset && result.recordset.length > 1) {
      console.error('Wrong number of records, return first result')
      return result.recordset[0]
    }
    return undefined
  }

  async get(id: string | number, user_id?: string) {
    const r = new sql.Request(this._pool)
    r.input('user_id', sql.Int, user_id)

    let result
    if (/^{?[0-9abcdefABCDEF]{8}-([0-9abcdefABCDEF]{4}-){3}[0-9abcdefABCDEF]{12}}?$/.test(id.toString(10))) {
      r.input('guid', sql.UniqueIdentifier, id)
      result = await r.execute('[GetDocumentByGuid]')
    } else {
      r.input('id', sql.Int, id)
      result = await r.execute('[GetDocument]')
    }

    if (result) {
      const { error, verified } = result.recordset[0]

      if (!error) {
        return {
          error,
          verified,
          result: result.recordsets[1][0][0] || [],
          breadcrumbs: result.recordsets[2] || []
        }
      } else {
        throw new Error(error)
      }
    }

    return undefined
  }

  async getPreview(id: number, user_id?: string) {
    const r = new sql.Request(this._pool)
    r.input('id', sql.Int, id)
    r.input('user_id', sql.Int, user_id)

    const result = await r.execute('[GetDocumentPreview]')
    const { error, verified } = result.recordset[0]

    if (!error) {
      return {
        error,
        verified,
        result: result.recordsets[1][0][0] || []
      }
    } else {
      throw new Error(error)
    }
  }

  async create(id: undefined | number, document: IPostedDocument, user_id?: string, type?: 'Version' | 'Update'): Promise<DBResultSet> {
    const r = new sql.Request(this._pool)
    if (id !== undefined)
      r.input('id', sql.Int, id)
    r.input('uuid', sql.UniqueIdentifier, document.uuid)
    r.input('directory_id', sql.Int, document.directory_id)
    r.input('name', sql.VarChar, document.name)
    r.input('mime_type', sql.VarChar, document.mime_type)
    r.input('size', sql.BigInt, document.size)
    r.input('object_type', sql.VarChar, document.object_type)
    r.input('document_type', sql.VarChar, document.document_type)
    r.input('deleted_on', sql.DateTime, document.deleted_on)
    r.input('user_id', sql.Int, user_id)

    const result = await r.execute(`${this.schema}usp_create${type ?? ''}`)

    const { error, verified } = result.recordset[0]

    if (!error) {
      return {
        error,
        verified,
        result: result.recordsets[1] || []
      }
    } else {
      throw new Error(error)
    }
  }

  async update(id: number, document: IDocument, user_id?: string) {
    const r = new sql.Request(this._pool)
    r.input('user_id', sql.Int, user_id)
    r.input('id', sql.Int, id)
    r.input('name', sql.VarChar, document.name)
    r.input('object_type', sql.VarChar, document.objectType)
    r.input('document_type', sql.VarChar, document.documentType)
    r.input('mime_type', sql.VarChar, document.mimeType)
    r.input('version_collection', sql.UniqueIdentifier, document.versionCollection)
    r.input('version_number', sql.Numeric, document.versionNumber)
    r.input('deleted_on', sql.DateTime, document.deletedOn)
    // when one of the following porperties is not defined we clear them
    r.input('objects', sql.VarChar, JSON.stringify(document.objectIds ? document.objectIds.map(e => ({ id: e })) : []))
    r.input('languages', sql.VarChar, JSON.stringify(document.languages ? document.languages.map(e => ({ id: e })) : []))
    r.input('attributes', sql.VarChar, JSON.stringify(document.attributes ? document.attributes.map(e => ({ id: e })) : []))
    r.input('meta', sql.VarChar, document.meta ? JSON.stringify([document.meta]) : null)

    const result = await r.execute(`${this.schema}usp_update`)

    const { error, verified } = result.recordset[0]

    if (!error) {
      return {
        error,
        verified,
        result: result.rowsAffected[1] > 0
      }
    } else {
      throw new Error(error)
    }
  }

  async delete(id: number, user_id?: string) {
    const r = new sql.Request(this._pool)
    r.input('id', sql.Int, id)
    r.input('user_id', sql.Int, user_id)

    const result = await r.execute('[DeleteDocument]')

    const { error, verified } = result.recordset[0]

    if (!error) {
      return {
        error,
        verified,
        result: result.recordsets[1][0] || []
      }
    } else {
      throw new Error(error)
    }
  }

  async getMetaDataLinks(id: number, user_id?: string) {
    const r = new sql.Request(this._pool)
    r.input('id', sql.Int, id)
    r.input('user_id', sql.Int, user_id)

    const result = await r.execute('[GetDocumentMetaDataLinks]')

    const { error, verified } = result.recordset[0]

    if (!error) {
      return {
        error,
        verified,
        result: result.recordsets[1][0] || {
          documents: []
        }
      }
    } else {
      throw new Error(error)
    }
  }

  async postMetaDataLink(id: number, slave_id: number, user_id?: string) {
    const r = new sql.Request(this._pool)
    r.input('id', sql.Int, id)
    r.input('slaveId', sql.Int, slave_id)
    r.input('user_id', sql.Int, user_id)

    const result = await r.execute('[dbo].[PostDocumentMetaDataLink]')

    const { error, verified } = result.recordset[0]

    if (!error) {
      return {
        error,
        verified,
        result: result.recordsets[1][0] || {
          document: undefined
        }
      }
    } else {
      throw new Error(error)
    }
  }

  async deleteMetaDataLink(id: number, slave_id: number, user_id?: string) {
    const r = new sql.Request(this._pool)
    r.input('id', sql.Int, id)
    r.input('slaveId', sql.Int, slave_id)
    r.input('user_id', sql.Int, user_id)

    const result = await r.execute('[dbo].[DeleteDocumentMetaDataLink]')

    const { error, verified } = result.recordset[0]

    if (!error) {
      return {
        error,
        verified,
        result: result.recordsets[1][0] || false
      }
    } else {
      throw new Error(error)
    }
  }

  async getNextObjectId(directory_id: number, user_id?: string) {
    const r = new sql.Request(this._pool)
    r.input('directoryId', sql.Int, directory_id)
    r.input('user_id', sql.Int, user_id)

    const result = await r.execute('[dbo].[GetNextObjectId]')

    const { error, verified } = result.recordset[0]

    if (!error) {
      return {
        error,
        verified,
        result: result.recordsets[1][0] || {
          nextObjectId: undefined
        }
      }
    } else {
      throw new Error(error)
    }
  }

  async itemExists(object_id: number, company_id: number): Promise<boolean> {
    const r = new sql.Request(this._pool)
    r.input('object_id', sql.BigInt, object_id)
    r.input('company_id', sql.Int, company_id)

    const result = await r.query('SELECT [count] = COUNT(*) FROM items WHERE Id = @object_id AND CompanyId = @company_id')

    return result.recordset[0]?.count > 0 || false
  }

  async getRelativePath(directory_id: number): Promise<string> {
    const r = new sql.Request(this._pool)
    r.input('directory_id', sql.Int, directory_id)

    const result = await r.query('SELECT [path] = [dbo].[GetFolderPath](@directory_id)')

    const { path } = result.recordset[0]
    return path
  }
}

export interface DBResultSet {
  error: string
  verified: boolean
  result: any[]
}

export interface IDocument {
  id: number
  name: string
  guid: string
  companyId: number
  directoryId: number
  size: number
  mimeType: string
  versionNumber: number
  versionCollection: string
  documentType: string
  objectType: string
  deletedOn?: Date
  deletedYear?: number
  deletedMonth?: number
  deletedDay?: number
  meta?: {
    title: string | null
    titleFr: string | null
    description: string | null
    descriptionFr: string | null
    keywords: string | null
    keywordsFr: string | null
    altText: string | null
    altTextFr: string | null
    type: string | null
    url: string | null
    urlFr: string | null
    duration: number | null
  }
  languages?: number[]
  objectIds?: number[]
  attributes?: number[]
}

export interface IPostedDocument {
  uuid: string
  directory_id: number
  name: string
  mime_type: string
  size: number
  object_type: string
  document_type: string
  deleted_on: Date | undefined
}