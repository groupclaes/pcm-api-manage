import sql from 'mssql'
import db from '../db'
import { FastifyBaseLogger } from 'fastify'

const DB_NAME = 'PCM'

export default class Search {
  schema: string = '[search].'
  _logger: FastifyBaseLogger

  constructor(logger: FastifyBaseLogger) { this._logger = logger }

  async query(query: string, user_id?: string, directory_id?: number) {
    const r = new sql.Request(await db.get(DB_NAME))
    r.input('user_id', sql.Int, user_id)
    r.input('query', sql.VarChar, query)

    if (directory_id)
      r.input('directory_id', directory_id)

    const resp = await r.execute(this.schema + '[usp_search]')

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