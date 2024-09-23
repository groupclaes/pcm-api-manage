import sql from 'mssql'
import { FastifyBaseLogger } from 'fastify'

export default class Profile {
  schema: string = 'manage.'
  _logger: FastifyBaseLogger
  _pool: sql.ConnectionPool

  constructor(logger: FastifyBaseLogger, pool: sql.ConnectionPool) {
    this._logger = logger
    this._pool = pool
  }

  /**
   * Get dashboard for user associated with session token
   */
  async getDashboard(user_id?: string) {
    const r = new sql.Request(this._pool)
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