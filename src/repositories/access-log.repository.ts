import sql from 'mssql'
import db from '../db'
import { FastifyBaseLogger } from 'fastify'

const DB_NAME = 'PCM'

export default class AccessLog {
  schema: string = '[audit].'
  _logger: FastifyBaseLogger

  constructor(logger: FastifyBaseLogger) { this._logger = logger }

  async get(user_id?: string) {
    const r = new sql.Request(await db.get(DB_NAME))
    r.input('user_id', sql.Int, user_id)
    this._logger.debug({ sqlParam: { user_id }, sqlDb: DB_NAME, sqlSchema: this.schema, sqlProc: '[uspGetAccessLogs]' }, 'running procedure')

    const result = await r.execute(this.schema + '[uspGetAccessLogs]')
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