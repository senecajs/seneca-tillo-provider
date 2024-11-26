/* Copyright © 2022-2023 Seneca Project Contributors, MIT License. */

const crypto = require('crypto');

const Pkg = require('../package.json')


type TilloProviderOptions = {
  url: string
  fetch: any
  entity: Record<string, any>
  debug: boolean
}

type TilloSignatureOptions = {
  apiKey: string
  apiSecret: string
  method: string
  path?: string
  timestamp: string
}


function getAuthSignature(signData: TilloSignatureOptions) {
  const authSign = `${signData.apiKey}-${signData.method}-${signData.path}-${signData.timestamp}`
  const hashedSign = crypto.createHmac('sha256', signData.apiSecret).update(authSign).digest('hex')
  return hashedSign
}

function TilloProvider(this: any, options: TilloProviderOptions) {
  const seneca: any = this

  const makeUtils = this.export('provider/makeUtils')

  const {
    makeUrl,
    getJSON,
    postJSON,
    entityBuilder
  } = makeUtils({
    name: 'tillo',
    url: options.url,
  })


  seneca
    .message('sys:provider,provider:tillo,get:info', get_info)


  const makeConfig = (config?: any) => seneca.util.deep({
    headers: {
      ...seneca.shared.headers
    }
  }, config)



  async function get_info(this: any, _msg: any) {
    return {
      ok: true,
      name: 'tillo',
      version: Pkg.version,
    }
  }


  entityBuilder(this, {
    provider: {
      name: 'tillo'
    },
    entity: {
      customer: {
        cmd: {
          list: {
            action: async function(this: any, entize: any, msg: any) {
              let json: any =
                await getJSON(makeUrl('customers', msg.q), makeConfig())
              let customers = json
              let list = customers.map((data: any) => entize(data))
              return list
            },
          }
        }
      },
      brand: {
        cmd: {
          list: {
            action: async function(this: any, entize: any, msg: any) {
              const path = "brands"
              const timestamp = new Date().getTime().toString()
              const options: TilloSignatureOptions = {
                apiKey: this.shared.headers["API-Key"],
                method: "GET",
                path,
                timestamp,
                apiSecret: this.shared.secret
              }

              this.shared.headers.Signature = getAuthSignature(options)
              this.shared.headers.Timestamp = timestamp
              this.shared.headers.Accept = "application/json"

              let json: any =
                await getJSON(makeUrl(path, msg.q), makeConfig())
              let brands = json.data.brands
              let list = Object.entries(brands).map(([name, value]: any) => entize({ name, value }))
              return list
            },
          }
        }
      },
      order: {
        cmd: {
          list: {
            action: async function(this: any, entize: any, msg: any) {
              let json: any =
                await getJSON(makeUrl('orders', msg.q), makeConfig())
              let orders = json.orders
              let list = orders.map((data: any) => entize(data))

              // TODO: ensure seneca-transport preserves array props
              list.page = json.page

              return list
            },
          },
          save: {
            action: async function(this: any, entize: any, msg: any) {
              let body = this.util.deep(
                this.shared.primary,
                options.entity.order.save,
                msg.ent.data$(false)
              )

              let json: any =
                await postJSON(makeUrl('orders', msg.q), makeConfig({
                  body
                }))

              let order = json
              order.id = order.referenceOrderID
              return entize(order)
            },
          }
        }
      }
    }
  })



  seneca.prepare(async function(this: any) {
    let res =
      await this.post('sys:provider,get:keymap,provider:tillo')

    if (!res.ok) {
      throw this.fail('keymap')
    }

    this.shared.headers = {
      'API-Key': res.keymap.key.value,
    }

    this.shared.secret = res.keymap.secret.value
  })


  return {
    exports: {
    }
  }
}


// Default options.
const defaults: TilloProviderOptions = {

  // NOTE: include trailing /
  url: 'https://sandbox.tillo.dev/api/v2/',

  // Use global fetch by default - if exists
  fetch: ('undefined' === typeof fetch ? undefined : fetch),

  entity: {
    order: {
      save: {
        // Default fields
      }
    }
  },

  // TODO: Enable debug logging
  debug: false
}


Object.assign(TilloProvider, { defaults })

export default TilloProvider

if ('undefined' !== typeof (module)) {
  module.exports = TilloProvider
}
