# amnezia-config-coder

Encode and decode AmneziaVPN `vpn://` keys in the browser: https://awg.helldweller.dev/

A key is `vpn://` + base64url(qCompress(config JSON)), where qCompress is a 4-byte big-endian length followed by a zlib stream. The encoder also draws QR codes the way the app does: a series of codes (850-byte chunks of the key, cycled every second) for AmneziaVPN, or one plain code of the `.conf` text for AmneziaWG/WireGuard.

Everything runs locally in a single `index.html`; nothing is sent anywhere.

Test: `node test.mjs`
