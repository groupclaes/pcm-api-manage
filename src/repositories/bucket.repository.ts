import { FastifyBaseLogger } from 'fastify'
import sql, { ConnectionPool, IProcedureResult } from 'mssql'

export default class BucketRepository {
  schema: string = 'bucket.'
  _logger: FastifyBaseLogger
  _pool: ConnectionPool

  constructor(logger: FastifyBaseLogger, pool: ConnectionPool) {
    this._logger = logger
    this._pool = pool
  }


  async get(user_id: string, id?: number) {
    const r = new sql.Request(this._pool)
    r.input('user_id', sql.Int, user_id)
    if (id)
      r.input('id', sql.Int, id)
    this._logger.debug({ sqlParam: { user_id, id }, sqlSchema: this.schema, sqlProc: 'usp_getBucket' }, 'running procedure')

    const result: IProcedureResult<any> = await r.execute(this.schema + 'usp_getBucket')
    this._logger.debug({ result }, 'procedure result')

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

  async create(user_id: string, name: string, expire?: Date) {
    const r = new sql.Request(this._pool)
    r.input('user_id', sql.Int, user_id)
    r.input('name', sql.VarChar, name)
    if (expire)
      r.input('expire', sql.DateTime, expire)
    this._logger.debug({ sqlParam: { user_id, name, expire }, sqlSchema: this.schema, sqlProc: 'usp_addBucket' }, 'running procedure')
    const result: IProcedureResult<any> = await r.execute(`${this.schema}usp_addBucket`)

    const { error, verified } = result.recordset[0]

    if (!error) {
      return {
        error,
        verified,
        result: result.recordsets[1][0] || undefined
      }
    } else {
      throw new Error(error)
    }
  }

  async update(user_id: string, id: number, name: string) {
    const r = new sql.Request(this._pool)
    r.input('user_id', sql.Int, user_id)
    r.input('id', sql.Int, id)
    r.input('name', sql.VarChar, name)
    this._logger.debug({ sqlParam: { user_id, id, name }, sqlSchema: this.schema, sqlProc: 'usp_updateBucket' }, 'running procedure')
    const result: IProcedureResult<any> = await r.execute(`${this.schema}usp_updateBucket`)

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

  async delete(user_id: string, id: number) {
    const r = new sql.Request(this._pool)
    r.input('user_id', sql.Int, user_id)
    r.input('id', sql.Int, id)
    this._logger.debug({ sqlParam: { user_id, id }, sqlSchema: this.schema, sqlProc: 'usp_removeBucket' }, 'running procedure')
    const result: IProcedureResult<any> = await r.execute(`${this.schema}usp_removeBucket`)

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

  async addDocument(user_id: string, id: number, document_id: number) {
    const r = new sql.Request(this._pool)
    r.input('user_id', sql.Int, user_id)
    r.input('id', sql.Int, id)
    r.input('document_id', sql.Int, document_id)
    this._logger.debug({ sqlParam: { user_id, id, document_id }, sqlSchema: this.schema, sqlProc: 'usp_addDocument' }, 'running procedure')
    const result: IProcedureResult<any> = await r.execute(`${this.schema}usp_addDocument`)

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

  async deleteDocument(user_id: string, id: number, document_id: number) {
    const r = new sql.Request(this._pool)
    r.input('user_id', sql.Int, user_id)
    r.input('id', sql.Int, id)
    r.input('document_id', sql.Int, document_id)
    this._logger.debug({ sqlParam: { user_id, id, document_id }, sqlSchema: this.schema, sqlProc: 'usp_removeDocument' }, 'running procedure')
    const result: IProcedureResult<any> = await r.execute(`${this.schema}usp_removeDocument`)

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
}