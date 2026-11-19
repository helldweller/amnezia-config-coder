# amnezia-config-coder

Encode and decode AmneziaVPN `vpn://` keys in the browser: https://helldweller.github.io/amnezia-config-coder/

A key is `vpn://` + base64url(qCompress(config JSON)), where qCompress is a 4-byte big-endian length followed by a zlib stream. Everything runs locally in a single `index.html`; nothing is sent anywhere.

Test: `node test.mjs`
