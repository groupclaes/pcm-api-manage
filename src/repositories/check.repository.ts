import sql from 'mssql'
import { FastifyBaseLogger } from 'fastify'

export default class Check {
  schema: string = 'manage.'
  _logger: FastifyBaseLogger
  _pool: sql.ConnectionPool

  constructor(logger: FastifyBaseLogger, pool: sql.ConnectionPool) {
    this._logger = logger
    this._pool = pool
  }

  async get(supplier_id: string, user_id?: string): Promise<any> {
    const r = new sql.Request(this._pool)
    r.input('supplier_id', sql.Int, supplier_id)
    r.input('user_id', sql.Int, user_id)
    this._logger.debug({ sqlParam: { user_id, supplier_id }, sqlSchema: this.schema, sqlProc: 'usp_getCheck' }, 'running procedure')

    const result = await r.execute(`${this.schema}usp_getCheck`)
    this._logger.debug({ result }, 'procedure result')

    const { error, verified } = result.recordset[0]

    if (!error) {
      return {
        error,
        verified,
        result: result.recordsets[1][0]
      }
    } else {
      throw new Error(error)
    }
  }

  async post(items: any[]) {
    return items.map(csvBuilder).join('\n')
  }
}

/**
 * @param {*} item
 * @returns {string[]}
 */
const csvBuilder = (item) => {
  /** @type {string[]} */
  const items = item.items
  let lines: string[] = []

  if (items) {
    lines.push(stringBuilder(item, items.splice(0, 1)[0]))

    for (const document of items) {
      lines.push(stringBuilder(undefined, document))
    }
  } else {
    lines.push(stringBuilder(item, undefined))
  }

  return lines.join('\n')
}

const stringBuilder = (item: undefined | any, document: undefined | any): string => {
  if (item)
    return item.itemNum + ';' + item.description + ';' + item.shipperItemNum + ';' + item.ean + ';' + ((document) ? document.name + ';' : ';')

  return ';;;;' + ((document) ? document.name + ';' : ';')
}

const groupResult = (previousValue, secondValue) => {
  if (!previousValue.length) {
    const first = { ...previousValue }
    previousValue = [{
      itemNum: first.itemNum,
      description: first.description,
      shipperItemNum: first.shipperItemNum,
      ean: first.ean,
      items: [{
        name: first.name,
        guid: first.guid,
        deletedOn: first.deletedOn
      }]
    }]
    // check if second item has same itemNum as the previous item
    if (first.itemNum === secondValue.itemNum) {
      previousValue[0].items.push({
        name: secondValue.name,
        guid: secondValue.guid,
        deletedOn: secondValue.deletedOn
      })
    } else {
      previousValue.push({
        itemNum: secondValue.itemNum,
        description: secondValue.description,
        shipperItemNum: secondValue.shipperItemNum,
        ean: secondValue.ean,
        items: [{
          name: secondValue.name,
          guid: secondValue.guid,
          deletedOn: secondValue.deletedOn
        }]
      })
    }
  } else {
    const found = previousValue.find(e => e.itemNum === secondValue.itemNum)
    if (found) {
      if (!found.items.find(e => e.guid === secondValue.guid)) {
        found.items.push({
          name: secondValue.name,
          guid: secondValue.guid,
          deletedOn: secondValue.deletedOn
        })
      }
    } else {
      previousValue.push({
        itemNum: secondValue.itemNum,
        description: secondValue.description,
        shipperItemNum: secondValue.shipperItemNum,
        ean: secondValue.ean,
        items: [{
          name: secondValue.name,
          guid: secondValue.guid,
          deletedOn: secondValue.deletedOn
        }]
      })
    }
  }
  return previousValue
}