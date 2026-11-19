# amnezia-config-coder

Encode and decode AmneziaVPN `vpn://` keys in the browser: https://awg.helldweller.dev/

A key is `vpn://` + base64url(qCompress(config JSON)), where qCompress is a 4-byte big-endian length followed by a zlib stream. The decoder also pulls the WireGuard/AmneziaWG `.conf` out of the container (DNS filled in like the app's export) for copying or download. Both tabs draw QR codes the way the app does: a series of codes (850-byte chunks of the key, cycled every second) for AmneziaVPN, or one plain code of the `.conf` text for AmneziaWG/WireGuard.

The I1 generator builds AmneziaWG signature packets: a real, encrypted QUIC v1 Initial with a TLS ClientHello for a chosen SNI, a STUN Binding Request, or a DNS query for a chosen domain, with the protocol's random fields left as random tags.

Everything runs locally in a single `index.html`; nothing is sent anywhere.

Test: `node test.mjs`
