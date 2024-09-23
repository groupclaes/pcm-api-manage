import sql from 'mssql'
import { FastifyBaseLogger } from 'fastify'

export default class AccessLog {
  schema: string = 'audit.'
  _logger: FastifyBaseLogger
  _pool: sql.ConnectionPool

  constructor(logger: FastifyBaseLogger, pool: sql.ConnectionPool) {
    this._logger = logger
    this._pool = pool
  }

  async get(user_id?: string) {
    const r = new sql.Request(this._pool)
    r.input('user_id', sql.Int, user_id)
    this._logger.debug({ sqlParam: { user_id }, sqlSchema: this.schema, sqlProc: '[uspGetAccessLogs]' }, 'running procedure')

    const result = await r.execute(this.schema + 'uspGetAccessLogs')
    this._logger.debug({ result }, 'procedure result')
    
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