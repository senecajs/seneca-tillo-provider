![Seneca](http://senecajs.org/files/assets/seneca-logo.png)
> A [Seneca.js](http://senecajs.org) plugin

# @seneca/tillo-provider

[![npm version](https://img.shields.io/npm/v/@seneca/tillo-provider.svg)](https://npmjs.com/package/@seneca/tillo-provider)
[![build](https://github.com/senecajs/seneca-tillo-provider/actions/workflows/build.yml/badge.svg)](https://github.com/senecajs/seneca-tillo-provider/actions/workflows/build.yml)
[![Coverage Status](https://coveralls.io/repos/github/senecajs/seneca-tillo-provider/badge.svg?branch=main)](https://coveralls.io/github/senecajs/seneca-tillo-provider?branch=main)
[![Known Vulnerabilities](https://snyk.io/test/github/senecajs/seneca-tillo-provider/badge.svg)](https://snyk.io/test/github/senecajs/seneca-tillo-provider)

| ![Voxgig](https://www.voxgig.com/res/img/vgt01r.png) | This open source module is sponsored and supported by [Voxgig](https://www.voxgig.com). |
|---|---|

Provides access to the Tillo API using the Seneca _provider_

convention. Tillo API entities are represented as Seneca entities so

that they can be accessed using the Seneca entity API and messages.

## Install

```sh
npm install @seneca/tillo-provider @seneca/provider @seneca/env seneca-entity seneca-promisify
```

## Quick Example

```js
// Setup - get the key value (<SECRET>) separately from a vault or
// environment variable.
const seneca = Seneca({ legacy: false })
  .use('promisify')
  .use('entity')
  // Get API keys using the seneca-env plugin
  .use('env', {
    var: {
      $TILLO_API_KEY: String,
      $TILLO_SECRET: String,
    },
  })
  .use('provider', {
    provider: {
      tillo: {
        keys: {
          apikey: { value: '$TILLO_API_KEY' },
          secret: { value: '$TILLO_SECRET' },
        },
      },
    },
  })
  .use('tillo-provider')

await seneca.ready()

const brands = await seneca.entity('provider/tillo/brand').list$({
  detail: true,
  currency: 'GBP',
  country: 'GB',
})

console.log('BRANDS', brands)
```

## More Examples

See [test/](test/) for more usage examples.

## Motivation

A [Seneca.js](http://senecajs.org) plugin.


## Support

If you're using this module and need help, you can:

- Post a [github issue](https://github.com/senecajs/seneca-tillo-provider/issues)
- Tweet to [@senecajs](http://twitter.com/senecajs)
- Ask on the [Gitter](https://gitter.im/senecajs/seneca)

## API

### Entities

Each Tillo resource is a Seneca entity in the `provider/tillo` zone, so
it is reached with the normal entity API rather than a bespoke client.
Request signing and the `Timestamp`/`Signature` headers are handled by
the plugin.

| Entity                 | Operation | Tillo API            | Query fields                                                                                           |
| ---------------------- | --------- | -------------------- | ------------------------------------------------------------------------------------------------------ |
| `provider/tillo/brand` | `list$`   | `GET brands`         | `detail`, `currency`, `country`                                                                        |
| `provider/tillo/float` | `list$`   | `GET check-floats`   | `currency`                                                                                             |
| `provider/tillo/dgc`   | `save$`   | `POST digital/issue` | `brand`, `value`, `user_id`, `clientRequestId`, `currency` (default `GBP`), `sector` (default `other`) |

```js
// Available float balances, one entity per currency.
const floats = await seneca.entity('provider/tillo/float').list$({
  currency: 'GBP',
})

// Issue a digital gift card.
const card = await seneca.entity('provider/tillo/dgc').save$({
  user_id: 'user01',
  brand: 'hobbycraft',
  value: 10.0,
})
```

### Options

- `url` : string <i><small>'https://app.tillo.io/'</small></i>

The Tillo API base URL. Include the trailing `/`. Point this at
`https://sandbox.tillo.dev/api/v2/` to use the sandbox.

Set plugin options when loading with:

```js
seneca.use('tillo-provider', { name: value, ... })
```

### Action Patterns

- [base:tillo,cmd:list,name:brand,sys:entity,zone:provider](#-basetillocmdlistnamebrandsysentityzoneprovider-)
- [base:tillo,cmd:list,name:float,sys:entity,zone:provider](#-basetillocmdlistnamefloatsysentityzoneprovider-)
- [base:tillo,cmd:save,name:dgc,sys:entity,zone:provider](#-basetillocmdsavenamedgcsysentityzoneprovider-)
- [sys:provider,get:info,provider:tillo](#-sysprovidergetinfoprovidertillo-)

### Action Descriptions

### &laquo; `base:tillo,cmd:list,name:brand,sys:entity,zone:provider` &raquo;

List available gift card brands from Tillo.

---

### &laquo; `base:tillo,cmd:list,name:float,sys:entity,zone:provider` &raquo;

List available float balances per currency.

---

### &laquo; `base:tillo,cmd:save,name:dgc,sys:entity,zone:provider` &raquo;

Issue a new digital gift card via Tillo.

---

### &laquo; `sys:provider,get:info,provider:tillo` &raquo;

Get information about the Tillo provider.

---

## Contributing

The [Senecajs org](https://github.com/senecajs/) encourages open participation. If you feel you can help in any way, be it with documentation, examples, extra testing, or new features please get in touch.

The [Senecajs org](https://github.com/senecajs/) encourages open
participation. If you feel you can help in any way, be it with
documentation, examples, extra testing, or new features please get in
touch.

The plugin is written in TypeScript under `src/` and published from
`dist/` — run `npm run build` (or `npm run watch`) after changing
sources, since the tests import the built plugin.

### Running tests

```sh
npm run test
```

```sh
npm run build                        # required before tests see your changes
TEST_PATTERN=brand-entity npm run test-some
```

The tests that call the Tillo sandbox are skipped unless credentials are
present. To run them, copy
[`test/local-config-template.js`](test/local-config-template.js) to
`test/local-config.js` and fill in your API key and secret — that file is
gitignored.

## Background

Built on [@seneca/provider](https://github.com/senecajs/seneca-provider),
which supplies the shared provider conventions: the keymap that resolves
API credentials, and the entity builder and HTTP helpers that turn each
Tillo resource into a Seneca entity. Tillo's HMAC request signing is done
by this plugin.

Modelling a third party API as entities means the same `list$`/`save$`
calls, message patterns and debugging tools work here as for any other
Seneca data source, so calling code does not need to know that Tillo is
remote.
