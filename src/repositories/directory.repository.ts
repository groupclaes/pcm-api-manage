import { IRepositoryBooleanResult, IRepositoryResult } from "."

import sql from 'mssql'
import { FastifyBaseLogger } from 'fastify'

export default class Directory {
  schema: string = 'directory.'
  _logger: FastifyBaseLogger
  _pool: sql.ConnectionPool

  constructor(logger: FastifyBaseLogger, pool: sql.ConnectionPool) {
    this._logger = logger
    this._pool = pool
  }

  async get(id?: number, user_id?: string): Promise<IRepositoryResult> {
    const r = new sql.Request(this._pool)
    r.input('user_id', sql.Int, user_id)
    if (id)
      r.input('id', sql.Int, id)
    const result = await r.execute(`${this.schema}usp_get`)

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

  async post(id: number, name: string, user_id?: string): Promise<IRepositoryBooleanResult> {
    console.debug(`Running procedure ${this.schema}usp_add with user_id: ${user_id} and id: ${id} and name: "${name}"`)
    const r = new sql.Request(this._pool)
    r.input('user_id', sql.Int, user_id)
    r.input('id', sql.Int, id)
    r.input('name', sql.VarChar, name)
    const result = await r.execute(`${this.schema}usp_add`)

    const { error, verified } = result.recordset[0]

    return {
      error,
      verified,
      result: result.rowsAffected.length > 0 ? result.rowsAffected[0] > 0 : false
    }
  }

  async update(id: number, name: string, cache_expire_duration?: number, user_id?: string): Promise<IRepositoryBooleanResult> {
    const r = new sql.Request(this._pool)
    r.input('user_id', sql.Int, user_id)
    r.input('id', sql.Int, id)
    r.input('name', sql.VarChar, name)
    r.input('cache_expire_duration', sql.BigInt, cache_expire_duration)
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

  async move(id: number, parent_id: number, user_id?: string): Promise<IRepositoryBooleanResult> {
    const r = new sql.Request(this._pool)
    r.input('user_id', sql.Int, user_id)
    r.input('id', sql.Int, id)
    r.input('parent_id', sql.Int, parent_id)
    const result = await r.execute(`${this.schema}usp_move`)

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

  async delete(id: number, user_id?: string): Promise<IRepositoryBooleanResult> {
    const r = new sql.Request(this._pool)
    r.input('user_id', sql.Int, user_id)
    r.input('id', sql.Int, id)
    const result = await r.execute(`${this.schema}usp_delete`)

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

  async getCompany(directory_id: number): Promise<IRepositoryResult> {
    const r = new sql.Request(this._pool)
    r.input('directoryId', sql.Int, directory_id)
    const result = await r.execute(`GetDirectoryCompanyById`)

    return {
      error: result.recordset[0].error,
      verified: result.recordset[0].verified,
      result: result.recordsets[1][0] || []
    }
  }
}