import sql from 'mssql'
import { FastifyBaseLogger } from 'fastify'

export default class Suppliers {
  schema: string = '[dbo].'
  _logger: FastifyBaseLogger
  _pool: sql.ConnectionPool

  constructor(logger: FastifyBaseLogger, pool: sql.ConnectionPool) {
    this._logger = logger
    this._pool = pool
  }

  async query(query: string, user_id?: string) {
    const r = new sql.Request(this._pool)
    r.input('query', sql.VarChar, query)
    r.input('user_id', sql.Int, user_id)
    const resp = await r.execute(this.schema + '[QuerySuppliers]')

    const { error, verified } = resp.recordset[0]

    if (!error) {
      return {
        error,
        verified,
        result: resp.recordsets[1] || []
      }
    } else {
      throw new Error(error)
    }
  }
}