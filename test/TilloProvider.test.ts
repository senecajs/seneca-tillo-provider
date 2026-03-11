/* Copyright © 2022-2026 Seneca Project Contributors, MIT License. */

import { test, describe } from 'node:test'
import { strict as assert } from 'node:assert'
import path from 'path'
import * as Fs from 'fs'

const Seneca = require('seneca')
const SenecaMsgTest = require('seneca-msg-test')

import TilloProvider from '../dist/TilloProvider.js'
import TilloProviderDoc from '../dist/TilloProviderDoc.js'

const testDir = path.join(__dirname, '..', 'test')

const BasicMessages = require(path.join(testDir, 'basic.messages.js'))

const CONFIG: any = {}

if (Fs.existsSync(path.join(testDir, 'local-config.js'))) {
  Object.assign(CONFIG, require(path.join(testDir, 'local-config')))
}

describe('TilloProvider', () => {
  test('happy', async () => {
    const seneca = await makeSeneca()

    assert.ok(TilloProvider)
    assert.ok(TilloProviderDoc)

    const info = await seneca.post('sys:provider,provider:tillo,get:info')
    assert.equal(info.ok, true)
    assert.equal(info.name, 'tillo')
  })

  test('messages', async () => {
    const seneca = await makeSeneca()
    await SenecaMsgTest(seneca, BasicMessages)()
  })

  test('float-entity', async () => {
    const seneca = await makeSeneca()

    // Verify the float entity is registered and can be referenced.
    const floatEntity = seneca.entity('provider/tillo/float')
    assert.ok(floatEntity)
    assert.equal(floatEntity.entity$, 'provider/tillo/float')
  })

  test('brand-entity', async () => {
    const seneca = await makeSeneca()

    const brandEntity = seneca.entity('provider/tillo/brand')
    assert.ok(brandEntity)
    assert.equal(brandEntity.entity$, 'provider/tillo/brand')
  })

  test('dgc-entity', async () => {
    const seneca = await makeSeneca()

    const dgcEntity = seneca.entity('provider/tillo/dgc')
    assert.ok(dgcEntity)
    assert.equal(dgcEntity.entity$, 'provider/tillo/dgc')
  })

  test('list-float', async () => {
    if (!CONFIG.TILLO_API_KEY) return;
    const seneca = await makeSeneca()

    const list = await seneca.entity("provider/tillo/float").list$({
      currency: "GBP",
    })
    console.log('FLOATS', list[0])

    assert.ok(list.length > 0)
  })

  test('list-brand', async () => {
    if (!CONFIG.TILLO_API_KEY) return;
    const seneca = await makeSeneca()

    const list = await seneca.entity("provider/tillo/brand").list$({
      detail: true,
      currency: "GBP",
      country: "GB"
    })
    console.log('BRANDS', list)

    assert.ok(list.length > 0)
  })

  test('issue-gc', async () => {
    if (!CONFIG.TILLO_API_KEY) return;
    const seneca = await makeSeneca()

    const redeemTemplate = await seneca.entity("provider/tillo/dgc").save$({
      user_id: "user01",
      brand: "hobbycraft",
      value: 10.00,
    })
    console.log('REDEEM TEMPLATE ', redeemTemplate)

    assert.ok(redeemTemplate)
  })
})

async function makeSeneca() {
  const seneca = Seneca({ legacy: false })
    .test()
    .use('promisify')
    .use('entity')
    .use('provider', {
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
      url: 'https://sandbox.tillo.dev/api/v2/',
    })

  return seneca.ready()
}
