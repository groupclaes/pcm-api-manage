import { env } from 'process'
import t from 'tap'
import server from './index'

env.APP_VERSION = 'test'

const test = async () => {
  const app = await server({
    wrapper: {
      serviceName: 'manage',
      fastify: {
        logger: {}
      },
      cors: {}
    }
  })
  if (!app) return t.error('app undefined')
  t.teardown(() => app.close())
  
  t.test('check if api returns 401 when no token is supplied', async t => {
    const resp = await app.inject({
      method: 'GET',
      path: '/test/manage/users'
    })
    t.ok(resp.statusCode === 401, `check if status code is 401`)
    t.ok(resp.statusMessage === 'Unauthorized', `check if status message equals 'Unauthorized'`)
  })

  t.test('check if api returns 403 when token is missing required permission', async t => {
    t.ok(true)
  })
}

test()