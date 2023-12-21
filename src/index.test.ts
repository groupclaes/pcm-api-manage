import { env } from 'process'
import t from 'tap'
import server from './index'

env.APP_VERSION = 'test'

const test = async () => {
  t.test('get users', async t => {
    const app = await server()
    t.teardown(() => app.close())

    const resp = await app.inject({
      method: 'GET',
      path: '/test/users'
    })

    t.debug(resp.body)
    t.ok(resp.statusCode === 200)
  })
}

test()