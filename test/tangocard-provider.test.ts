/* Copyright © 2022 Seneca Project Contributors, MIT License. */

import * as Fs from 'fs'

// const Fetch = require('node-fetch')


const Seneca = require('seneca')
const SenecaMsgTest = require('seneca-msg-test')

import TangocardProvider from '../src/tangocard-provider'
import TangocardProviderDoc from '../src/TangocardProvider-doc'

const BasicMessages = require('./basic.messages.js')


// Only run some tests locally (not on Github Actions).
let Config = undefined
if (Fs.existsSync(__dirname + '/local-config.js')) {
  Config = require('./local-config')
}


describe('tangocard-provider', () => {

  test('happy', async () => {
    expect(TangocardProvider).toBeDefined()
    expect(TangocardProviderDoc).toBeDefined()

    const seneca = await makeSeneca()

    expect(await seneca.post('sys:provider,provider:tangocard,get:info'))
      .toMatchObject({
        ok: true,
        name: 'tangocard',
      })
  })


  test('messages', async () => {
    const seneca = await makeSeneca()
    await (SenecaMsgTest(seneca, BasicMessages)())
  })


  test('list-brand', async () => {
    if (!Config) return;
    const seneca = await makeSeneca()

    const list = await seneca.entity("provider/tangocard/brand").list$()
    // console.log('BRANDS', list)

    expect(list.length > 0).toBeTruthy()
  })

})


async function makeSeneca() {
  const seneca = Seneca({ legacy: false })
    .test()
    .use('promisify')
    .use('entity')
    .use('env', {
      // debug: true,
      file: [__dirname + '/local-env.js;?'],
      var: {
        $TANGOCARD_KEY: String,
        $TANGOCARD_NAME: String,
        $TANGOCARD_CUSTID: String,
        $TANGOCARD_ACCID: String,
      }
    })
    .use('provider', {
      provider: {
        tangocard: {
          keys: {
            key: { value: '$TANGOCARD_KEY' },
            name: { value: '$TANGOCARD_NAME' },
            cust: { value: '$TANGOCARD_CUSTID' },
            acc: { value: '$TANGOCARD_ACCID' },
          }
        }
      }
    })
    .use(TangocardProvider, {
      // fetch: Fetch,
    })

  return seneca.ready()
}

