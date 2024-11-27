"use strict";
/* Copyright © 2022-2023 Seneca Project Contributors, MIT License. */
Object.defineProperty(exports, "__esModule", { value: true });
const crypto = require('crypto');
const Pkg = require('../package.json');
function generateAuthSign(signData) {
    const sd = new Map(signData);
    sd.delete("apiSecret");
    const sdList = [];
    sd.forEach((v) => {
        sdList.push(v);
    });
    return sdList.join('-');
}
function getAuthSignature(signData) {
    const authSign = generateAuthSign(signData);
    const hashedSign = crypto.createHmac('sha256', signData.get("apiSecret"))
        .update(authSign).digest('hex');
    return hashedSign;
}
function TilloProvider(options) {
    const seneca = this;
    const makeUtils = this.export('provider/makeUtils');
    const { makeUrl, getJSON, postJSON, entityBuilder } = makeUtils({
        name: 'tillo',
        url: options.url,
    });
    seneca
        .message('sys:provider,provider:tillo,get:info', get_info);
    const makeConfig = (config) => seneca.util.deep({
        headers: {
            ...seneca.shared.headers
        }
    }, config);
    async function get_info(_msg) {
        return {
            ok: true,
            name: 'tillo',
            version: Pkg.version,
        };
    }
    entityBuilder(this, {
        provider: {
            name: 'tillo'
        },
        entity: {
            brand: {
                cmd: {
                    list: {
                        action: async function (entize, msg) {
                            const path = "brands";
                            const timestamp = new Date().getTime().toString();
                            const options = new Map([
                                ["apikey", this.shared.headers["API-Key"]],
                                ["method", "GET"],
                                ["path", path],
                                ["timestamp", timestamp],
                                ["apiSecret", this.shared.secret],
                            ]);
                            this.shared.headers.Signature = getAuthSignature(options);
                            this.shared.headers.Timestamp = timestamp;
                            this.shared.headers.Accept = "application/json";
                            let json = await getJSON(makeUrl(path + "?detail=true", msg.q), makeConfig());
                            let brands = json.data.brands;
                            let list = Object.entries(brands).map(([name, value]) => entize({ name, value }));
                            return list;
                        },
                    }
                }
            },
            digitalGC: {
                cmd: {
                    save: {
                        action: async function (entize, msg) {
                            var _a, _b;
                            const timestamp = new Date().getTime().toString();
                            const clientRequestId = `${msg.q.user_id}-digitalissue-${timestamp}`;
                            const brand = msg.q.brand;
                            const currency = ((_a = msg.q) === null || _a === void 0 ? void 0 : _a.currency) || "GBP";
                            const value = msg.q.value;
                            const sector = ((_b = msg.q) === null || _b === void 0 ? void 0 : _b.sector) || "other";
                            const options = new Map([
                                ["apikey", this.shared.headers["API-Key"]],
                                ["method", "POST"],
                                ["path", "digital-issue"],
                                ["clientRequestId", clientRequestId],
                                ["brand", brand],
                                ["currency", currency],
                                ["value", value],
                                ["timestamp", timestamp],
                                ["apiSecret", this.shared.secret],
                            ]);
                            this.shared.headers.Signature = getAuthSignature(options);
                            this.shared.headers.Timestamp = timestamp;
                            this.shared.headers.Accept = "application/json";
                            let json = await postJSON(makeUrl('digital/issue'), makeConfig({
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
                            }));
                            let order = json;
                            return entize(order);
                        },
                    }
                }
            }
        }
    });
    seneca.prepare(async function () {
        let res = await this.post('sys:provider,get:keymap,provider:tillo');
        if (!res.ok) {
            throw this.fail('keymap');
        }
        this.shared.headers = {
            'API-Key': res.keymap.key.value,
        };
        this.shared.secret = res.keymap.secret.value;
    });
    return {
        exports: {}
    };
}
// Default options.
const defaults = {
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
};
Object.assign(TilloProvider, { defaults });
exports.default = TilloProvider;
if ('undefined' !== typeof (module)) {
    module.exports = TilloProvider;
}
//# sourceMappingURL=tillo-provider.js.map