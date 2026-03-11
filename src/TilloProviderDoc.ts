/* Copyright © 2022-2026 Seneca Project Contributors, MIT License. */

const docs = {
  messages: {
    get_info: {
      desc: 'Get information about the Tillo provider.',
    },
  },

  entity: {
    brand: {
      desc: 'Tillo brand entity for listing available gift card brands.',
      cmd: {
        list: {
          desc: 'List available gift card brands from Tillo.',
        },
      },
    },
    float: {
      desc: 'Tillo float entity for checking available float balances.',
      cmd: {
        list: {
          desc: 'List available float balances per currency.',
        },
      },
    },
    dgc: {
      desc: 'Tillo digital gift card entity for issuing gift cards.',
      cmd: {
        save: {
          desc: 'Issue a new digital gift card via Tillo.',
        },
      },
    },
  },
}

export default docs

if ('undefined' !== typeof module) {
  module.exports = docs
}
