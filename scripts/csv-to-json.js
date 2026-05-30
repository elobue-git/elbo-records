#!/usr/bin/env node
// ── Configure source CSV path here ──────────────────────────────────────────
const CSV_PATH = process.env.CSV_PATH || `${process.env.HOME}/Documents/elbo-records/catalog.csv`;
// ────────────────────────────────────────────────────────────────────────────

const fs   = require('fs');
const path = require('path');
const os   = require('os');

const OUT_PATH = path.join(__dirname, '..', 'data', 'catalog.json');

// Resolve ~ in path
const csvPath = CSV_PATH.replace(/^~/, os.homedir());

if (!fs.existsSync(csvPath)) {
  console.error(`CSV not found: ${csvPath}`);
  console.error('Set CSV_PATH env var or edit the CSV_PATH constant at the top of this script.');
  process.exit(1);
}

const raw = fs.readFileSync(csvPath, 'utf8');
const lines = raw.split(/\r?\n/).filter(Boolean);
const headers = parseCSVLine(lines[0]);

const col = name => headers.findIndex(h => h.trim().toLowerCase() === name.toLowerCase());

// Column indices
const iArtist  = col('Artist');
const iTitle   = col('Title');
const iLabel   = col('Label');
const iFormat  = col('Format');
const iYear    = col('Released');
const iFolder  = col('CollectionFolder');
const iMedia   = col('Collection Media Condition');
const iSleeve  = col('Collection Sleeve Condition');
const iPrice   = col('Collection My Price');
const iPhoto   = col('photo_file');
const iNotes   = col('Collection Notes');

let total = 0, excluded = 0;
const catCounts = {};
const items = [];

for (let i = 1; i < lines.length; i++) {
  const row = parseCSVLine(lines[i]);
  if (row.length < 3) continue;
  total++;

  const price = (row[iPrice] || '').trim();
  if (!price) { excluded++; continue; }

  const folder = (row[iFolder] || '').trim();
  catCounts[folder] = (catCounts[folder] || 0) + 1;

  items.push({
    artist:          (row[iArtist]  || '').trim(),
    title:           (row[iTitle]   || '').trim(),
    label:           (row[iLabel]   || '').trim(),
    format:          (row[iFormat]  || '').trim(),
    year:            (row[iYear]    || '').trim(),
    folder,
    mediaCondition:  (row[iMedia]   || '').trim(),
    sleeveCondition: (row[iSleeve]  || '').trim(),
    price,
    photo:           (row[iPhoto]   || '').trim(),
    notes:           (row[iNotes]   || '').trim(),
    sold:            false,
  });
}

fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
fs.writeFileSync(OUT_PATH, JSON.stringify(items, null, 2));

console.log(`\nElbo Records — catalog build`);
console.log(`  Source:   ${csvPath}`);
console.log(`  Output:   ${OUT_PATH}`);
console.log(`  Total rows:  ${total}`);
console.log(`  Excluded (no price): ${excluded}`);
console.log(`  Included: ${items.length}`);
console.log(`\n  By folder:`);
Object.entries(catCounts).sort().forEach(([k, v]) => console.log(`    ${k}: ${v}`));
console.log('');

// ── Minimal CSV parser (handles quoted fields with commas) ──
function parseCSVLine(line) {
  const fields = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      fields.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  fields.push(cur);
  return fields;
}
