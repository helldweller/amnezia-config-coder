// Run: node test.mjs
// Fixtures were made with Python zlib + struct, byte-identical to Qt's qCompress output.
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const { encode, decode } = new Function(html.match(/<script id="core">([\s\S]*?)<\/script>/)[1] + 'return { encode, decode };')();

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
console.log('ok');
