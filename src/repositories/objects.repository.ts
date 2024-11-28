import sql from 'mssql'
import { FastifyBaseLogger } from 'fastify'

export default class Objects {
  schema: string = 'manage.'
  _logger: FastifyBaseLogger
  _pool: sql.ConnectionPool

  constructor(logger: FastifyBaseLogger, pool: sql.ConnectionPool) {
    this._logger = logger
    this._pool = pool
  }

  async getLanguages(user_id?: string) {
    const r = new sql.Request(this._pool)
    r.input('user_id', sql.Int, user_id)

    const result = await r.execute(`${this.schema}usp_getActiveLanguages`)

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

  async getAttributes(user_id?: string) {
    const r = new sql.Request(this._pool)
    r.input('user_id', sql.Int, user_id)

    const result = await r.execute(`${this.schema}usp_getActiveAttributes`)

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

  async getUsers(user_id?: string) {
    const r = new sql.Request(this._pool)
    r.input('user_id', sql.Int, user_id)

    const result = await r.execute(`${this.schema}usp_getActiveUsers`)

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
}