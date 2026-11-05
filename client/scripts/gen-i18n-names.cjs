// Builds src/data/names-np.json: every site name -> its Nepali name, taken from the seed data.
// Run after the seed data changes: node scripts/gen-i18n-names.cjs
const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '../../server/db/data/');
const out = {};
for (const f of fs.readdirSync(dir).filter((x) => /^monuments-.*\.json$/.test(x))) {
  for (const m of JSON.parse(fs.readFileSync(dir + f, 'utf8'))) {
    if (m.name && m.name_np) out[m.name] = m.name_np;
    for (const a of m.alt_names || []) if (a && m.name_np && !out[a]) out[a] = m.name_np;
  }
}
fs.writeFileSync(path.join(__dirname, '../src/data/names-np.json'), JSON.stringify(out, null, 1));
console.log(Object.keys(out).length, 'names');
