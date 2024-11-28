import { env } from 'process'
import { readFileSync, existsSync, statSync, rmSync } from 'fs'

/**
 * Returns the content of the given `filename` for document `guid`
 */
export const readFile = (guid: string, filename: string): string | undefined => {
  if (fileExists(guid, filename))
    return readFileSync(`${env['DATA_PATH']}/content/${guid.substring(0, 2)}/${guid}/${filename}`, { encoding: 'utf8' }).toString()
  return undefined
}

/**
 * Returns `true` if the given `filename` for document `guid` exists
 */
export const fileExists = (guid: string, filename: string): boolean => {
  return existsSync(`${env['DATA_PATH']}/content/${guid.substring(0, 2)}/${guid}/${filename}`)
}

/**
 * Returns the last modify date of the given `filename` for document `guid`
 */
export const fileDate = (guid: string, filename: string): Date | undefined => {
  if (fileExists(guid, filename))
    return statSync(`${env['DATA_PATH']}/content/${guid.substring(0, 2)}/${guid}/${filename}`).mtime
  return undefined
}

/**
 * Returns the last modify date of the given `filename` for document `guid`
 */
export const removeFolder = (guid: string): boolean => {
  if (fileExists(guid, 'file')) {
    rmSync(`${env['DATA_PATH']}/content/${guid.substring(0, 2)}/${guid}`, { recursive: true, force: true })
    return true
  }
  return false
}

export const translateDocumentProperty = (bytes, type) => {
  if (bytes === null) {
    throw new Error(`ArgumentNullException `)
  }

  const buffer: Buffer = Buffer.from(bytes, 'base64')
  let result = '<< null >>'
  try {
    switch (type) {
      case 0:
        if (buffer[buffer.length - 1] == 0)
          buffer[buffer.length - 1] = 10
        result = buffer.toString('utf8').trim()
        break
      case 1:
        result = `${buffer.readUInt16LE(0)}`
        break
      case 2:
        result = buffer.length == 4 ? `${buffer.readUInt32LE(0)}` : `${buffer.readUInt16LE(0)}`
        break
      case 3:
        result = `${buffer.readBigUint64LE(0)}`
        break

      case 5:
        result = `${bytes[0]}`
        break

      case 12:
        result = `${buffer.readUInt32LE(0)}/${buffer.readUInt32LE(4)}`
        break
      case 13:
        result = `${buffer.readUInt32LE(2)}`
        break

      case 18:
        result = `[${buffer.readUInt32LE(0)},${buffer.readUInt32LE(8)},${buffer.readUInt32LE(16)},${buffer.readUInt32LE(24)}]`
        break
    }
  } catch (err) {
    console.error(err)
  }
  return result
}

const BitConverter = {
  toUInt16: (src, index = 0) => {
    // swap bytes
    src = [src[index + 1], src[index]]
    return src[index] << 8
      | src[index + 1]
  },
  toUInt32: (src, index = 0) => {
    // swap bytes
    src = [src[index + 3], src[index + 2], src[index + 1], src[index]]
    return src[index] << 24
      | src[index + 1] << 16
      | src[index + 2] << 8
      | src[index + 3]
  },
  toUInt64: (src, index = 0) => {
    // swap bytes
    src = [src[index + 7], src[index + 6], src[index + 5], src[index + 4], src[index + 3], src[index + 2], src[index + 1], src[index]]
    return src[index] << 56
      | src[index + 1] << 48
      | src[index + 2] << 40
      | src[index + 3] << 32
      | src[index + 4] << 24
      | src[index + 5] << 16
      | src[index + 6] << 8
      | src[index + 7]
  }
}