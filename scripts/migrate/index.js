#!/usr/bin/env node
// Data migrations for the F2 schema (SRS §5).
//
//   node scripts/migrate                 dry-run every migration (default, changes nothing)
//   node scripts/migrate --apply         apply every migration
//   node scripts/migrate 003 --apply     only migrations whose id starts with "003"
//
// Every migration is idempotent and only fills fields that are still empty, so
// re-running never overwrites edits made in the admin panel. Before changing a
// document, its current state is written to backups/migrate-<time>.json.
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const APPLY = process.argv.includes('--apply');
const filter = process.argv.slice(2).find(a => !a.startsWith('--'));
const ROOT = path.join(__dirname, '..', '..');

const migrations = fs
  .readdirSync(__dirname)
  .filter(f => /^\d{3}-.+\.js$/.test(f) && (!filter || f.startsWith(filter)))
  .sort()
  .map(f => require(path.join(__dirname, f)));

const backupFile = path.join(ROOT, 'backups', `migrate-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
const backups = {};
const backup = (label, docs) => {
  if (!APPLY || !docs.length) return;
  backups[label] = [...(backups[label] || []), ...docs];
  fs.mkdirSync(path.dirname(backupFile), { recursive: true });
  fs.writeFileSync(backupFile, JSON.stringify(backups, null, 2));
};

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log(`${APPLY ? 'APPLY' : 'DRY-RUN (tambahkan --apply untuk menerapkan)'} · database: ${mongoose.connection.name}\n`);

  const reviewItems = [];
  for (const migration of migrations) {
    console.log(`── ${migration.id}: ${migration.title}`);
    const lines = [];
    const log = msg => lines.push(`   ${msg}`);
    const review = msg => {
      lines.push(`   ⚠ ${msg}`);
      reviewItems.push(`[${migration.id}] ${msg}`);
    };
    const result = await migration.run({ apply: APPLY, log, review, backup, db: mongoose.connection.db });
    lines.forEach(l => console.log(l));
    console.log(`   → ${result}\n`);
    if (APPLY) {
      await mongoose.connection.db.collection('schemamigrations').updateOne(
        { _id: migration.id },
        { $set: { title: migration.title, result, appliedAt: new Date() } },
        { upsert: true }
      );
    }
  }

  console.log(`Perlu ditinjau manusia: ${reviewItems.length}`);
  reviewItems.forEach(item => console.log(`  - ${item}`));
  if (APPLY && Object.keys(backups).length) console.log(`\nBackup: ${path.relative(ROOT, backupFile)}`);
  await mongoose.disconnect();
})().catch(err => {
  console.error(err);
  process.exit(1);
});
