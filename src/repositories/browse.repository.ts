import sql from 'mssql'
import { FastifyBaseLogger } from 'fastify'

export default class Browse {
  schema: string = 'manage.'
  _logger: FastifyBaseLogger
  _pool: sql.ConnectionPool

  constructor(logger: FastifyBaseLogger, pool: sql.ConnectionPool) {
    this._logger = logger
    this._pool = pool
  }

  async getContent(page: number, itemCount: number, directoryId: number | undefined, query: string, onlyInvalid: boolean, user_id?: string): Promise<any> {
    const r = new sql.Request(this._pool)
    r.input('page', sql.Int, page)
    r.input('itemCount', sql.Int, itemCount)
    r.input('directoryId', sql.Int, directoryId)
    r.input('query', sql.VarChar, query)
    r.input('onlyInvalid', sql.Bit, onlyInvalid)
    r.input('user_id', sql.Int, user_id)
    this._logger.debug({ sqlParam: { user_id }, sqlSchema: this.schema, sqlProc: 'GetUiPageV2' }, 'running procedure')

    const result = await r.execute('GetUiPageV2')
    this._logger.debug({ result }, 'procedure result')

    const { error, verified } = result.recordset[0]

    if (!error) {
      return {
        error,
        verified,
        result: {
          directories: result.recordsets[1][0] || [],
          documents: result.recordsets[2][0] || [],
          breadcrumbs: result.recordsets[3] || []
        }
      }
    } else {
      throw new Error(error)
    }
  }
}