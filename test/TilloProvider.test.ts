/* Copyright © 2022-2026 Seneca Project Contributors, MIT License. */

import { describe, test, before, after } from 'node:test'
import { expect } from '@hapi/code'
import path from 'path'
import * as Fs from 'fs'
import * as Http from 'http'
import crypto from 'crypto'

import Seneca from 'seneca'
import type {} from '@seneca/entity'
import SenecaMsgTest from 'seneca-msg-test'

import TilloProvider from '..'
import TilloProviderDoc from '../dist/TilloProviderDoc'
import BasicMessages from './basic.messages'

type TilloTestConfig = {
  TILLO_API_KEY?: string
  TILLO_SECRET?: string
}

const testDir = path.join(__dirname, '..', 'test')

// Live tests call the Tillo sandbox. They need Tillo credentials:
// test/local-config.js (see local-config-template.js), or the environment
// variables TILLO_API_KEY and TILLO_SECRET. Without them the same tests run
// against a local mock of the Tillo API, with dummy keys.
const CONFIG: TilloTestConfig = {}

if (Fs.existsSync(path.join(testDir, 'local-config.js'))) {
  Object.assign(CONFIG, require(path.join(testDir, 'local-config')))
}

CONFIG.TILLO_API_KEY ??= process.env.TILLO_API_KEY
CONFIG.TILLO_SECRET ??= process.env.TILLO_SECRET

const LIVE = !!CONFIG.TILLO_API_KEY

if (!LIVE) {
  CONFIG.TILLO_API_KEY = 'test-api-key'
  CONFIG.TILLO_SECRET = 'test-secret'
}

let mock: MockTilloApi | null = null

before(async () => {
  if (!LIVE) {
    mock = await makeMockTilloApi(CONFIG.TILLO_API_KEY!, CONFIG.TILLO_SECRET!)
  }
})

after(async () => {
  if (mock) {
    await mock.close()
  }
})

describe('TilloProvider', () => {
  test('happy', async () => {
    const seneca = await makeSeneca()

    expect(TilloProvider).exist()
    expect(TilloProviderDoc).exist()

    const info = await seneca.post('sys:provider,provider:tillo,get:info')
    expect(info.ok).to.equal(true)
    expect(info.name).to.equal('tillo')

    await seneca.close()
  })

  test('messages', async () => {
    const seneca = await makeSeneca()
    await SenecaMsgTest(seneca, BasicMessages)()
    await seneca.close()
  })

  test('float-entity', async () => {
    const seneca = await makeSeneca()
    expectEntityCmd(seneca, 'float', 'list')
    await seneca.close()
  })

  test('brand-entity', async () => {
    const seneca = await makeSeneca()
    expectEntityCmd(seneca, 'brand', 'list')
    await seneca.close()
  })

  test('dgc-entity', async () => {
    const seneca = await makeSeneca()
    expectEntityCmd(seneca, 'dgc', 'save')
    await seneca.close()
  })

  test('list-float', async () => {
    const seneca = await makeSeneca()

    const list: any[] = await seneca.entity('provider/tillo/float').list$({
      currency: 'GBP',
    })
    console.log('FLOATS', list[0])

    expect(list.length).to.be.above(0)

    if (mock) {
      expect(list[0].currency).to.equal('GBP')
      expect(mock.calls[mock.calls.length - 1]).to.include({
        method: 'GET',
        url: '/api/v2/check-floats?currency=GBP',
        signed: true,
      })
    }

    await seneca.close()
  })

  test('list-brand', async () => {
    const seneca = await makeSeneca()

    const list: any[] = await seneca.entity('provider/tillo/brand').list$({
      detail: true,
      currency: 'GBP',
      country: 'GB',
    })
    console.log('BRANDS', list)

    expect(list.length).to.be.above(0)

    if (mock) {
      expect(list[0].name).to.equal('hobbycraft')
      expect(mock.calls[mock.calls.length - 1]).to.include({
        method: 'GET',
        url: '/api/v2/brands?detail=true&currency=GBP&country=GB',
        signed: true,
      })
    }

    await seneca.close()
  })

  test('issue-gc', async () => {
    const seneca = await makeSeneca()

    const redeemTemplate = await seneca.entity('provider/tillo/dgc').save$({
      user_id: 'user01',
      brand: 'hobbycraft',
      value: 10.0,
    })
    console.log('REDEEM TEMPLATE ', redeemTemplate)

    expect(redeemTemplate).exist()

    if (mock) {
      expect(redeemTemplate.data.url).to.exist()
      const call = mock.calls[mock.calls.length - 1]!
      expect(call).to.include({
        method: 'POST',
        url: '/api/v2/digital/issue',
        signed: true,
      })
      expect(call.body).to.include({
        brand: 'hobbycraft',
        delivery_method: 'url',
        fulfilment_by: 'partner',
        sector: 'other',
      })
      expect(call.body.face_value).to.equal({ amount: 10, currency: 'GBP' })
      const clientRequestId: string = call.body.client_request_id
      expect(clientRequestId).to.startWith('user01-hobbycraft-digitalissue-10-')
    }

    await seneca.close()
  })
})

function expectEntityCmd(seneca: any, name: string, cmd: string) {
  const msg = {
    sys: 'entity',
    cmd,
    zone: 'provider',
    base: 'tillo',
    name,
  }

  expect(seneca.find(msg).pattern).to.equal(
    `base:tillo,cmd:${cmd},name:${name},sys:entity,zone:provider`,
  )
}

async function makeSeneca() {
  const seneca = Seneca({ legacy: false })
    .test()
    .use('@seneca/entity')
    .use('@seneca/provider', {
      provider: {
        tillo: {
          keys: {
            apikey: { value: CONFIG.TILLO_API_KEY },
            secret: { value: CONFIG.TILLO_SECRET },
          },
        },
      },
    })
    .use(TilloProvider, {
      url: mock ? mock.url : 'https://sandbox.tillo.dev/api/v2/',
    })

  return seneca.ready()
}

type MockCall = {
  method?: string
  url?: string
  signed: boolean
  body: any
}

type MockTilloApi = {
  url: string
  calls: MockCall[]
  close: () => Promise<void>
}

// A local stand-in for the Tillo API (v2) calls that the plugin makes:
// GET brands, GET check-floats and POST digital/issue. Like Tillo, it
// checks the API-Key header and the HMAC-SHA256 Signature over the
// hyphen-joined request fields and Timestamp, and refuses a request that
// fails. The responses have the shape of the Tillo API reference, with
// only a few fields.
async function makeMockTilloApi(
  apikey: string,
  secret: string,
): Promise<MockTilloApi> {
  const calls: MockCall[] = []

  const sign = (parts: string[]) =>
    crypto.createHmac('sha256', secret).update(parts.join('-')).digest('hex')

  const server = Http.createServer((req, res) => {
    let body = ''
    req.on('data', (chunk) => (body += chunk))
    req.on('end', () => {
      const data = '' === body ? undefined : JSON.parse(body)
      const url = new URL(req.url || '/', 'http://127.0.0.1')
      const route = url.pathname.replace(/^\/api\/v2\//, '')
      const timestamp = String(req.headers['timestamp'])

      // Tillo signs the path with a hyphen in place of a slash.
      const signParts = [apikey, String(req.method), route.replace('/', '-')]
      if ('POST' === req.method && 'digital/issue' === route) {
        signParts.push(
          data?.client_request_id,
          data?.brand,
          data?.face_value?.currency,
          String(data?.face_value?.amount),
        )
      }
      signParts.push(timestamp)

      const signed =
        apikey === req.headers['api-key'] &&
        sign(signParts) === req.headers['signature']

      calls.push({ method: req.method, url: req.url, signed, body: data })

      let status = 200
      let out: any

      if (!signed) {
        status = 401
        out = {
          code: '060',
          status: 'error',
          message: 'Authentication failed',
        }
      } else if ('GET' === req.method && 'brands' === route) {
        out = {
          code: '000',
          status: 'success',
          message: 'Request Successful',
          data: {
            brands: {
              hobbycraft: {
                name: 'Hobbycraft',
                slug: 'hobbycraft',
                currency: 'GBP',
                countries_served: ['GB'],
              },
            },
          },
        }
      } else if ('GET' === req.method && 'check-floats' === route) {
        out = {
          code: '000',
          status: 'success',
          message: 'Request Successful',
          data: {
            floats: {
              GBP: {
                float: 'universal-float',
                balance: '1000.00',
              },
            },
          },
        }
      } else if ('POST' === req.method && 'digital/issue' === route) {
        out = {
          code: '000',
          status: 'success',
          message: 'Card created successfully',
          data: {
            brand: data.brand,
            face_value: data.face_value,
            url: 'https://example.com/redeem/mock-card',
            reference: data.client_request_id,
          },
        }
      } else {
        status = 404
        out = { code: '404', status: 'error', message: 'Not Found' }
      }

      res.writeHead(status, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(out))
    })
  })

  await new Promise<void>((resolve) =>
    server.listen(0, '127.0.0.1', () => resolve()),
  )

  const port = (server.address() as { port: number }).port

  return {
    // NOTE: the plugin option url needs the trailing /
    url: `http://127.0.0.1:${port}/api/v2/`,
    calls,
    close: () =>
      new Promise<void>((resolve) => {
        server.closeAllConnections()
        server.close(() => resolve())
      }),
  }
}
