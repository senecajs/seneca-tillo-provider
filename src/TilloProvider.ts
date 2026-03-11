/* Copyright © 2022-2026 Seneca Project Contributors, MIT License. */

import crypto from 'crypto'

import type {
  TilloProviderOptions,
  DgcSaveParams,
} from './TilloProviderTypes.js'

const Pkg = require('../package.json')

function generateAuthSign(signData: Map<string, string>) {
  const sd = new Map(signData)
  sd.delete('apiSecret')
  const sdList: string[] = []

  sd.forEach((v: string) => {
    sdList.push(v)
  })

  return sdList.join('-')
}

function getAuthSignature(signData: Map<string, string>) {
  const authSign = generateAuthSign(signData)

  const hashedSign = crypto
    .createHmac('sha256', signData.get('apiSecret')!)
    .update(authSign)
    .digest('hex')
  return hashedSign
}

function TilloProvider(this: any, options: TilloProviderOptions) {
  const seneca: any = this

  const makeUtils = this.export('provider/makeUtils')

  const { makeUrl, getJSON, postJSON, entityBuilder } = makeUtils({
    name: 'tillo',
    url: options.url,
  })

  seneca.message('sys:provider,provider:tillo,get:info', get_info)

  const makeConfig = (config?: any) =>
    seneca.util.deep(
      {
        headers: {
          ...seneca.shared.headers,
        },
      },
      config,
    )

  async function get_info(this: any, _msg: any) {
    return {
      ok: true,
      name: 'tillo',
      version: Pkg.version,
    }
  }

  entityBuilder(this, {
    provider: {
      name: 'tillo',
    },
    entity: {
      brand: {
        cmd: {
          list: {
            action: async function (this: any, entize: any, msg: any) {
              const path = 'brands'
              const timestamp = new Date().getTime().toString()

              const signData: Map<string, string> = new Map([
                ['apikey', this.shared.headers['API-Key']],
                ['method', 'GET'],
                ['path', path],
                ['timestamp', timestamp],
                ['apiSecret', this.shared.secret],
              ])

              this.shared.headers.Signature = getAuthSignature(signData)
              this.shared.headers.Timestamp = timestamp

              let json: any = await getJSON(makeUrl(path, msg.q), makeConfig())
              let brands = json.data.brands
              let list = Object.entries(brands).map(([name, value]: any) =>
                entize({ name, value }),
              )
              return list
            },
          },
        },
      },
      // Check available float balances per currency.
      // Tillo API: GET /check-floats
      float: {
        cmd: {
          list: {
            action: async function (this: any, entize: any, msg: any) {
              const path = 'check-floats'
              const timestamp = new Date().getTime().toString()

              const signData: Map<string, string> = new Map([
                ['apikey', this.shared.headers['API-Key']],
                ['method', 'GET'],
                ['path', path],
                ['timestamp', timestamp],
                ['apiSecret', this.shared.secret],
              ])

              this.shared.headers.Signature = getAuthSignature(signData)
              this.shared.headers.Timestamp = timestamp

              let json: any = await getJSON(makeUrl(path, msg.q), makeConfig())
              let floats = json.data.floats
              let list = Object.entries(floats).map(([currency, value]: any) =>
                entize({ currency, ...value }),
              )
              return list
            },
          },
        },
      },
      dgc: {
        cmd: {
          save: {
            action: async function (this: any, entize: any, msg: any) {
              const timestamp = new Date().getTime().toString()

              const {
                clientRequestId,
                brand,
                currency,
                value,
                sector,
              }: DgcSaveParams = msg.q

              const clientRId =
                clientRequestId ||
                `${msg.q.user_id}-${brand}-digitalissue-${value}-${timestamp}`

              const curr = currency || 'GBP'

              const signData: Map<string, string> = new Map([
                ['apikey', this.shared.headers['API-Key']],
                ['method', 'POST'],
                ['path', 'digital-issue'],
                ['clientRequestId', clientRId],
                ['brand', brand],
                ['currency', curr],
                ['value', String(value)],
                ['timestamp', timestamp],
                ['apiSecret', this.shared.secret],
              ])

              this.shared.headers.Signature = getAuthSignature(signData)
              this.shared.headers.Timestamp = timestamp

              let json: any = await postJSON(
                makeUrl('digital/issue'),
                makeConfig({
                  body: {
                    client_request_id: clientRId,
                    brand: brand,
                    face_value: {
                      amount: value,
                      currency: curr,
                    },
                    delivery_method: 'url',
                    fulfilment_by: 'partner',
                    sector: sector || 'other',
                  },
                }),
              )

              let order = json
              return entize(order)
            },
          },
        },
      },
    },
  })

  seneca.prepare(async function (this: any) {
    let res = await this.post('sys:provider,get:keymap,provider:tillo')

    if (!res.ok) {
      throw this.fail('keymap')
    }

    this.shared.headers = {
      'API-Key': res.keymap.apikey.value,
      Accept: 'application/json',
    }

    this.shared.secret = res.keymap.secret.value
  })

  return {
    exports: {
      sdk() {
        return null
      },
    },
  }
}

// Default options.
const defaults: TilloProviderOptions = {
  // NOTE: include trailing /
  url: 'https://app.tillo.io/',

  // Use global fetch by default - if exists
  fetch: 'undefined' === typeof fetch ? undefined : fetch,

  entity: {
    order: {
      save: {
        // Default fields
      },
    },
  },

  debug: false,
}

Object.assign(TilloProvider, { defaults })

export default TilloProvider

if ('undefined' !== typeof module) {
  module.exports = TilloProvider
}
