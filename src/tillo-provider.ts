/* Copyright © 2022-2023 Seneca Project Contributors, MIT License. */

const crypto = require('crypto');

const Pkg = require('../package.json')


type TilloProviderOptions = {
  url: string
  fetch: any
  entity: Record<string, any>
  debug: boolean
}

function generateAuthSign(signData: Map<string, string>) {
  const sd = new Map(signData)
  sd.delete("apiSecret")
  const sdList: any = []


  sd.forEach((v: any) => {
    sdList.push(v)
  })

  return sdList.join('-')
}

function getAuthSignature(signData: Map<string, string>) {
  const authSign = generateAuthSign(signData)

  const hashedSign = crypto.createHmac('sha256', signData.get("apiSecret"))
    .update(authSign).digest('hex')
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
      brand: {
        cmd: {
          list: {
            action: async function(this: any, entize: any, msg: any) {
              const path = "brands"
              const timestamp = new Date().getTime().toString()

              const options: Map<string, string> = new Map([
                ["apikey", this.shared.headers["API-Key"]],
                ["method", "GET"],
                ["path", path],
                ["timestamp", timestamp],
                ["apiSecret", this.shared.secret],
              ])

              this.shared.headers.Signature = getAuthSignature(options)
              this.shared.headers.Timestamp = timestamp
              this.shared.headers.Accept = "application/json"

              let json: any =
                await getJSON(makeUrl(path + "?detail=true", msg.q), makeConfig())
              let brands = json.data.brands
              let list = Object.entries(brands).map(([name, value]: any) => entize({ name, value }))
              return list
            },
          }
        }
      },
      digitalGC: {
        cmd: {
          save: {
            action: async function(this: any, entize: any, msg: any) {
              const timestamp = new Date().getTime().toString()
              const clientRequestId = `${msg.q.user_id}-digitalissue-${timestamp}`
              const brand = msg.q.brand
              const currency = msg.q?.currency || "GBP"
              const value = msg.q.value
              const sector = msg.q?.sector || "other"

              const options: Map<string, string> = new Map([
                ["apikey", this.shared.headers["API-Key"]],
                ["method", "POST"],
                ["path", "digital-issue"],
                ["clientRequestId", clientRequestId],
                ["brand", brand],
                ["currency", currency],
                ["value", value],
                ["timestamp", timestamp],
                ["apiSecret", this.shared.secret],
              ])

              this.shared.headers.Signature = getAuthSignature(options)
              this.shared.headers.Timestamp = timestamp
              this.shared.headers.Accept = "application/json"

              let json: any =
                await postJSON(makeUrl('digital/issue'), makeConfig({
                  body: {
                    client_request_id: clientRequestId,
                    brand: brand,
                    face_value: {
                      amount: value,
                      currency,
                    },
                    delivery_method: 'url',
                    fulfilment_by: 'partner',
                    sector: sector
                  }
                }))

              let order = json
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
