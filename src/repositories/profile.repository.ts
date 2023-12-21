import sql from 'mssql'
import db from '../db'
import { FastifyBaseLogger } from 'fastify'

const DB_NAME = 'PCM'

export default class Profile {
  schema: string = '[manage].'
  _logger: FastifyBaseLogger

  constructor(logger: FastifyBaseLogger) { this._logger = logger }

  /**
   * Get dashboard for user associated with session token
   */
  async getDashboard(user_id?: string) {
    const r = new sql.Request(await db.get(DB_NAME))
    r.input('user_id', sql.Int, user_id)
    const result = await r.execute(`GetProfileDashboard`)

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