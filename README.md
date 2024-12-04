![Seneca Tillo-Provider](http://senecajs.org/files/assets/seneca-logo.png)

> _Seneca Tillo-Provider_ is a plugin for [Seneca](http://senecajs.org)


Provides access to the Tillo API using the Seneca *provider*
convention. Tillo API entities are represented as Seneca entities so
that they can be accessed using the Seneca entity API and messages.

See [seneca-entity](senecajs/seneca-entity) and the [Seneca Data
Entities
Tutorial](https://senecajs.org/docs/tutorials/understanding-data-entities.html) for more details on the Seneca entity API.

NOTE: underlying third party SDK needs to be replaced as out of date and has a security issue.

[![npm version](https://img.shields.io/npm/v/@seneca/tillo-provider.svg)](https://npmjs.com/package/@seneca/tillo-provider)
[![build](https://github.com/senecajs/seneca-tillo-provider/actions/workflows/build.yml/badge.svg)](https://github.com/senecajs/seneca-tillo-provider/actions/workflows/build.yml)
[![Coverage Status](https://coveralls.io/repos/github/senecajs/seneca-tillo-provider/badge.svg?branch=main)](https://coveralls.io/github/senecajs/seneca-tillo-provider?branch=main)
[![Known Vulnerabilities](https://snyk.io/test/github/senecajs/seneca-tillo-provider/badge.svg)](https://snyk.io/test/github/senecajs/seneca-tillo-provider)
[![DeepScan grade](https://deepscan.io/api/teams/5016/projects/19462/branches/505954/badge/grade.svg)](https://deepscan.io/dashboard#view=project&tid=5016&pid=19462&bid=505954)
[![Maintainability](https://api.codeclimate.com/v1/badges/f76e83896b731bb5d609/maintainability)](https://codeclimate.com/github/senecajs/seneca-tillo-provider/maintainability)


| ![Voxgig](https://www.voxgig.com/res/img/vgt01r.png) | This open source module is sponsored and supported by [Voxgig](https://www.voxgig.com). |
|---|---|


## Quick Example


```js

// Setup - get the key value (<SECRET>) separately from a vault or
// environment variable.
Seneca()
  // Get API keys using the seneca-env plugin
  .use('env', {
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
  .use('tillo-provider')

const brands = await seneca.entity("provider/tillo/brand").list$({
  detail: true,
  currency: "GBP",
  country: "GB"
})

console.log('BRANDS', brands)

```

## Install

```sh
$ npm install @seneca/tillo-provider @seneca/env
```



<!--START:options-->


## Options

* `debug` : boolean <i><small>false</small></i>


Set plugin options when loading with:
```js


seneca.use('TilloProvider', { name: value, ... })


```


<small>Note: <code>foo.bar</code> in the list above means 
<code>{ foo: { bar: ... } }</code></small> 



<!--END:options-->

<!--START:action-list-->


## Action Patterns

* [role:entity,base:tillo,cmd:load,name:repo,zone:provider](#-roleentitybasetillocmdloadnamerepozoneprovider-)
* [role:entity,base:tillo,cmd:save,name:repo,zone:provider](#-roleentitybasetillocmdsavenamerepozoneprovider-)
* [sys:provider,get:info,provider:tillo](#-sysprovidergetinfoprovidertillo-)


<!--END:action-list-->

<!--START:action-desc-->


## Action Descriptions

### &laquo; `role:entity,base:tillo,cmd:load,name:repo,zone:provider` &raquo;

Load Tillo repository data into an entity.



----------
### &laquo; `role:entity,base:tillo,cmd:save,name:repo,zone:provider` &raquo;

Update Tillo repository data from an entity.



----------
### &laquo; `sys:provider,get:info,provider:tillo` &raquo;

Get information about the provider.



----------


<!--END:action-desc-->
