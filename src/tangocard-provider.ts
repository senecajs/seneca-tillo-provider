/* Copyright © 2022-2023 Seneca Project Contributors, MIT License. */


const Pkg = require('../package.json')


type TangocardProviderOptions = {
  url: string
  fetch: any
  entity: Record<string, any>
  debug: boolean
}


function TangocardProvider(this: any, options: TangocardProviderOptions) {
  const seneca: any = this

  const makeUtils = this.export('provider/makeUtils')

  const {
    makeUrl,
    getJSON,
    postJSON,
    entityBuilder
  } = makeUtils({
    name: 'tangocard',
    url: options.url,
  })


  seneca
    .message('sys:provider,provider:tangocard,get:info', get_info)


  const makeConfig = (config?: any) => seneca.util.deep({
    headers: {
      ...seneca.shared.headers
    }
  }, config)



  async function get_info(this: any, _msg: any) {
    return {
      ok: true,
      name: 'tangocard',
      version: Pkg.version,
    }
  }


  entityBuilder(this, {
    provider: {
      name: 'tangocard'
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
              let json: any =
                await getJSON(makeUrl('catalogs', msg.q), makeConfig())
              let brands = json.brands
              let list = brands.map((data: any) => entize(data))
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
      await this.post('sys:provider,get:keymap,provider:tangocard')

    if (!res.ok) {
      throw this.fail('keymap')
    }

    let src = res.keymap.name.value + ':' + res.keymap.key.value
    let auth = Buffer.from(src).toString('base64')

    this.shared.headers = {
      Authorization: 'Basic ' + auth
    }

    this.shared.primary = {
      customerIdentifier: res.keymap.cust.value,
      accountIdentifier: res.keymap.acc.value,
    }

  })


  return {
    exports: {
    }
  }
}


// Default options.
const defaults: TangocardProviderOptions = {

  // NOTE: include trailing /
  url: 'https://integration-api.tangocard.com/raas/v2/',

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


Object.assign(TangocardProvider, { defaults })

export default TangocardProvider

if ('undefined' !== typeof (module)) {
  module.exports = TangocardProvider
}
