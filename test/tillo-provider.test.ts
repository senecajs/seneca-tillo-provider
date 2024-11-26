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
  //   const list = await seneca.entity("provider/tillo/brand").list$()
  //   console.log('BRANDS', list)
  //
  //   expect(list.length > 0).toBeTruthy()
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
        $TILLO_KEY: String,
        $TILLO_SECRET: String,
      }
    })
    .use('provider', {
      provider: {
        tillo: {
          keys: {
            key: { value: '$TILLO_KEY' },
            secret: { value: '$TILLO_SECRET' },
          }
        }
      }
    })
    .use(TilloProvider, {
      // fetch: Fetch,
    })

  return seneca.ready()
}

