/* Copyright © 2022 Seneca Project Contributors, MIT License. */

import * as Fs from 'fs'

// const Fetch = require('node-fetch')


const Seneca = require('seneca')
const SenecaMsgTest = require('seneca-msg-test')

import TilloProvider from '../src/tillo-provider'
import TilloProviderDoc from '../src/TilloProvider-doc'

const BasicMessages = require('./basic.messages.js')


// Only run some tests locally (not on Github Actions).
let Config = undefined
if (Fs.existsSync(__dirname + '/local-config.js')) {
  Config = require('./local-config')
}


describe('tillo-provider', () => {

  test('happy', async () => {
    expect(TilloProvider).toBeDefined()
    expect(TilloProviderDoc).toBeDefined()

    const seneca = await makeSeneca()

    expect(await seneca.post('sys:provider,provider:tillo,get:info'))
      .toMatchObject({
        ok: true,
        name: 'tillo',
      })
  })


  test('messages', async () => {
    const seneca = await makeSeneca()
    await (SenecaMsgTest(seneca, BasicMessages)())
  })


  // test('list-brand', async () => {
  //   if (!Config) return;
  //   const seneca = await makeSeneca()
  //
  //   const list = await seneca.entity("provider/tillo/brand").list$({
  //     detail: true,
  //     currency: "GBP",
  //     country: "GB"
  //   })
  //   console.log('BRANDS', list)
  //
  //   expect(list.length > 0).toBeTruthy()
  // })

  // test('issue-gc', async () => {
  //   if (!Config) return;
  //   const seneca = await makeSeneca()
  //
  //   const redeemTemplate = await seneca.entity("provider/tillo/dgc").save$({
  //     user_id: "user01",
  //     brand: "hobbycraft",
  //     value: 10.00,
  //   })
  //   console.log('REDEEM TEMPLATE ', redeemTemplate)
  //
  //   expect(redeemTemplate).toBeTruthy()
  // })

})


async function makeSeneca() {
  const seneca = Seneca({ legacy: false })
    .test()
    .use('promisify')
    .use('entity')
    .use('env', {
      // debug: true,
      file: [__dirname + '/local-config.js;?'],
      var: {
        $TILLO_API_KEY: String,
        $TILLO_SECRET: String,
      }
    })
    .use('provider', {
      provider: {
        tillo: {
          keys: {
            apikey: { value: '$TILLO_API_KEY' },
            secret: { value: '$TILLO_SECRET' },
          }
        }
      }
    })
    .use(TilloProvider, {
      url: 'https://sandbox.tillo.dev/api/v2/',
    })

  return seneca.ready()
}

