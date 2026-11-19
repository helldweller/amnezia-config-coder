// Run: node test.mjs
// Fixtures were made with Python zlib + struct, byte-identical to Qt's qCompress output.
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const { encode, decode, qrSeries, wgConf, i1Size, i1Dns, i1Stun, i1Quic, quicKeys } = new Function(html.match(/<script id="core">([\s\S]*?)<\/script>/)[1] + 'return { encode, decode, qrSeries, wgConf, i1Size, i1Dns, i1Stun, i1Quic, quicKeys };')();

const cfg = {"containers": [{"awg": {"last_config": "{\"H1\": \"1\", \"Jc\": \"4\", \"config\": \"[Interface]\\nPrivateKey = FAKE\\n\"}", "port": "51820", "transport_proto": "udp"}, "container": "amnezia-awg"}], "defaultContainer": "amnezia-awg", "description": "Тест", "dns1": "1.1.1.1", "hostName": "203.0.113.1"};

const fixtures = {
  qt: 'vpn://AAABt3jadZDBSgMxEIbvfYplznXZtAoieBBRbAvivSll2GY10CZLMlV02YM-iu_ge7RvZCahK4vt5DAz__9NhqQZZCGgtIZQG-U8XGXzqHE0XRUpfHsOdl-Mxho9LcMdlWYAGgkPQoZKQkjDkKZlas9Tm9AkzSeGlKuwVAspzZPTr0hqpt6z6-z-ZnYXNAktDP8vra0j3nYhLkfFMYAcGs_UsnaWLLPbVQ09sO3P_X0E07gx6kPjGb-7w9pYLdIcrFSF2zXdnhrrMF86XZO2hond9-5n_7n_6mzjBesij-cgv1hPj7hRbI2KcV7kQoyDPWh_AUOob7w',
  api: 'vpn://AAAA_3icdZDBSgMxEIbvfYplznXZtAoieBBRbAvivSll2GY10CZLMlV02YM-iu_ge7RvZCahK4vt5DAz__9NhqQZZCGgtIZQG-U8XGXzqHE0XRUpfHsOdl-Mxho9LcMdlWYAGgkPQoZKQkjDkKZlas9Tm9AkzSeGlKuwVAspzZPTr0hqpt6z6-z-ZnYXNAktDP8vra0j3nYhLkfFMYAcGs_UsnaWLLPbVQ09sO3P_X0E07gx6kPjGb-7w9pYLdIcrFSF2zXdnhrrMF86XZO2hond9-5n_7n_6mzjBesij-cgv1hPj7hRbI2KcV7kQoyDPWh_AUOob7w=',
  raw: 'vpn://ewogICAgImNvbnRhaW5lcnMiOiBbCiAgICAgICAgewogICAgICAgICAgICAiYXdnIjogewogICAgICAgICAgICAgICAgImxhc3RfY29uZmlnIjogIntcIkgxXCI6IFwiMVwiLCBcIkpjXCI6IFwiNFwiLCBcImNvbmZpZ1wiOiBcIltJbnRlcmZhY2VdXFxuUHJpdmF0ZUtleSA9IEZBS0VcXG5cIn0iLAogICAgICAgICAgICAgICAgInBvcnQiOiAiNTE4MjAiLAogICAgICAgICAgICAgICAgInRyYW5zcG9ydF9wcm90byI6ICJ1ZHAiCiAgICAgICAgICAgIH0sCiAgICAgICAgICAgICJjb250YWluZXIiOiAiYW1uZXppYS1hd2ciCiAgICAgICAgfQogICAgXSwKICAgICJkZWZhdWx0Q29udGFpbmVyIjogImFtbmV6aWEtYXdnIiwKICAgICJkZXNjcmlwdGlvbiI6ICLQotC10YHRgiIsCiAgICAiZG5zMSI6ICIxLjEuMS4xIiwKICAgICJob3N0TmFtZSI6ICIyMDMuMC4xMTMuMSIKfQ',
};
for (const [name, key] of Object.entries(fixtures)) assert.deepEqual(JSON.parse(await decode(key)), cfg, name);

const key = await encode(JSON.stringify(cfg, null, 4));
const json = JSON.stringify(cfg);
const header = Buffer.from(key.slice(6), 'base64url').readUInt32BE(0);
assert.equal(header, Buffer.byteLength(json), 'qCompress length header');
assert.ok(!key.includes('='), 'no padding');
assert.deepEqual(JSON.parse(await decode(key)), cfg, 'roundtrip');
assert.equal(await decode(await encode('[Interface]\nAddress = 10.0.0.2/32\n')), '[Interface]\nAddress = 10.0.0.2/32\n', 'raw text');
await assert.rejects(decode('vpn://!!!'), /invalid base64/);
await assert.rejects(decode('vpn://AAAA_3icxx'), /neither zlib nor text/);
await assert.rejects(encode('{bad json'));
await assert.rejects(encode(fixtures.qt), /already a vpn:\/\/ key/);

// WireGuard .conf from the container, DNS placeholders filled like the app's export.
const tpl = '[Interface]\nDNS = $PRIMARY_DNS, $SECONDARY_DNS\nPrivateKey = FAKE\n';
const proto = conf => ({ last_config: JSON.stringify({ config: conf, hostName: '203.0.113.1' }) });
const two = { defaultContainer: 'amnezia-awg', dns1: '9.9.9.9', dns2: '149.112.112.112', containers: [
  { container: 'amnezia-wireguard', wireguard: proto('[Interface]\nPrivateKey = WG\n') },
  { container: 'amnezia-awg', awg: proto(tpl) },
] };
assert.equal(wgConf(JSON.stringify(two)), '[Interface]\nDNS = 9.9.9.9, 149.112.112.112\nPrivateKey = FAKE\n', 'default container, DNS filled');
assert.equal(wgConf(JSON.stringify({ containers: [{ container: 'amnezia-awg', awg: proto(tpl) }] })), '[Interface]\nDNS = 1.1.1.1, 1.0.0.1\nPrivateKey = FAKE\n', 'app default DNS');
assert.equal(wgConf(JSON.stringify({ containers: [{ container: 'amnezia-awg', awg: { port: '1' } }] })), '', 'no client config');
assert.equal(wgConf('[Interface]\nPrivateKey = X\n'), '[Interface]\nPrivateKey = X\n', 'raw .conf passes through');

// QR series: random payload so the compressed key spans several 850-byte chunks.
const { randomBytes } = await import('node:crypto');
const bigKey = await encode(JSON.stringify({ ...cfg, junk: randomBytes(2000).toString('base64') }));
const chunks = qrSeries(bigKey).map(c => Buffer.from(c, 'base64url'));
const bytes = Buffer.from(bigKey.slice(6), 'base64url');
assert.equal(chunks.length, Math.ceil(bytes.length / 850));
chunks.forEach((c, i) => {
  assert.equal(c.readInt16BE(0), 1984, 'magic');
  assert.equal(c[2], chunks.length, 'count');
  assert.equal(c[3], i, 'index');
  assert.equal(c.readUInt32BE(4), c.length - 8, 'QByteArray length');
});
assert.deepEqual(Buffer.concat(chunks.map(c => c.subarray(8))), bytes, 'chunks reassemble into the key bytes');
// I1 generator.
assert.equal(i1Dns('Google.com', 'A'), '<r 2><b 0x0100000100000000000106676f6f676c6503636f6d00000100010000290' + '4d0000000000000>', 'DNS query bytes');
const idn = '0c' + Buffer.from('xn--e1afmkfd').toString('hex') + '08' + Buffer.from('xn--p1ai').toString('hex') + '00' + '0041';
assert.ok(i1Dns('пример.рф', 'HTTPS').includes(idn), 'IDN goes out as punycode, HTTPS type 65');
for (const bad of ['', '1.2.3.4', 'localhost', 'bad_name.com', '-a.com']) assert.throws(() => i1Dns(bad, 'A'), /Enter a domain/, bad);
assert.equal(i1Size(i1Stun()), 20, 'STUN size');
assert.equal(i1Size('<b 0x0102><r 10><rc 3><rd 2><t>'), 21, 'tag sizes');

// QUIC: key schedule against the RFC 9001 Appendix A vector, then decrypt a generated Initial with node:crypto.
const { createCipheriv, createDecipheriv } = await import('node:crypto');
const rfc = await quicKeys(Buffer.from('8394c8f03e515708', 'hex'));
assert.deepEqual([rfc.key, rfc.iv, rfc.hp].map(b => Buffer.from(b).toString('hex')),
  ['1f369613dd76d5467730efcbe3b1a22d', 'fa044b2f42a3fd3b46fb255c', '9f50449e04a0e810283a1e9933adedd2'], 'RFC 9001 keys');
const quic = await i1Quic('Example.org');
const pkt = Buffer.from(quic.slice(5, -1), 'hex');
assert.equal(pkt.length, 1250);
assert.equal(i1Size(quic), 1250);
const keys = await quicKeys(pkt.subarray(6, 14));
const mask = createCipheriv('aes-128-ecb', Buffer.from(keys.hp), null).update(pkt.subarray(22, 38));
const first = pkt[0] ^ (mask[0] & 0x0f), pn = pkt[18] ^ mask[1];
assert.equal(first, 0xc0, 'Initial, 1-byte packet number');
const nonce = Buffer.from(keys.iv);
nonce[11] ^= pn;
const gcm = createDecipheriv('aes-128-gcm', Buffer.from(keys.key), nonce);
gcm.setAAD(Buffer.concat([Buffer.from([first]), pkt.subarray(1, 18), Buffer.from([pn])]));
gcm.setAuthTag(pkt.subarray(1234));
const plain = Buffer.concat([gcm.update(pkt.subarray(19, 1234)), gcm.final()]); // final() throws on a bad tag
assert.equal(plain[0], 6, 'CRYPTO frame first');
assert.ok(plain.includes(Buffer.from('example.org')), 'SNI inside the ClientHello');
await assert.rejects(i1Quic('not a domain'), /Enter a domain/);
console.log('ok');
