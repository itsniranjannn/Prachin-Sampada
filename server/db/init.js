// Creates the database, loads the schema and seeds the verified monument dataset (db/data/*.json),
// plus a demo explorer and an admin account. Safe to re-run: it drops and recreates everything.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import 'dotenv/config';
import { difficultyToRating } from '../src/algorithms/adaptive.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const DB = process.env.DB_NAME || 'sampada';

/** Interest tags used by search, the recommender and the walk planner. */
function tagsFor(m) {
  const t = new Set([m.type, String(m.religion || '').toLowerCase(), String(m.dynasty || '').toLowerCase(), String(m.city || '').toLowerCase()]);
  if (m.religion === 'Both') { t.add('hindu'); t.add('buddhist'); }
  if (m.unesco) t.add('unesco');
  if (m.legend) t.add('legend');
  if (['pond'].includes(m.type) || /hiti|pokhari|pond|spout|water/i.test(`${m.name} ${m.architecture}`)) t.add('water');
  if (['palace', 'square', 'courtyard', 'museum', 'gate', 'window'].includes(m.type)) t.add('palace');
  if (['courtyard', 'bahal', 'museum'].includes(m.type)) t.add('courtyard');
  if (/carv|wood|window|gilt|gold|bronze|stone|sculpt|art|metal|repouss/i.test(`${m.architecture} ${m.short} ${(m.facts || []).join(' ')}`)) t.add('art');
  if (/festival|jatra|chariot|dashain|indra|teej|shivaratri|bisket/i.test(`${m.story} ${(m.facts || []).join(' ')}`)) t.add('festival');
  if (m.type === 'bahal') t.add('buddhist');
  if (m.province) t.add(m.province.toLowerCase());
  t.delete('unknown'); t.delete('');
  return [...t].join(',');
}

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1', port: Number(process.env.DB_PORT || 3307),
    user: process.env.DB_USER || 'root', password: process.env.DB_PASSWORD || '', multipleStatements: true, charset: 'utf8mb4',
  });
  await conn.query(`DROP DATABASE IF EXISTS \`${DB}\`; CREATE DATABASE \`${DB}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; USE \`${DB}\`;`);
  await conn.query(fs.readFileSync(path.join(here, 'schema.sql'), 'utf8'));

  const files = fs.readdirSync(path.join(here, 'data')).filter((f) => /^monuments-.*.json$/.test(f)).sort();
  const sites = files.flatMap((f) => JSON.parse(fs.readFileSync(path.join(here, 'data', f), 'utf8')));
  let questions = 0, clues = 0;
  for (const m of sites) {
    const v = m.visit || {};
    const img = m.image || {};
    const credit = [img.author, img.license].filter(Boolean).join(' · ').replace(/<[^>]+>/g, '').slice(0, 250);
    const [r] = await conn.query(
      `INSERT INTO monuments (slug, name, name_np, city, province, district, zone_slug, lat, lng, type, religion, deity, built_year, built_text, dynasty, architecture, unesco,
         short_text, story, legend, facts, open_time, close_time, fee_foreigner, fee_saarc, fee_nepali, visit_minutes, quake_2015, image_url, image_page, image_credit, tags, sources, festivals, gallery, model, short_np, story_np, legend_np, facts_np, quake_np)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [m.slug, String(m.name).slice(0, 120), String(m.name_np || '').slice(0, 120), String(m.city).slice(0, 60), m.province || 'Bagmati', m.district || null, m.zone || null, m.lat, m.lng, m.type, m.religion || 'Hindu', m.deity ? String(m.deity).slice(0, 120) : null, m.built_year || null,
        String(m.built_century_text || '').slice(0, 300), String(m.dynasty || 'unknown').slice(0, 80), String(m.architecture || '').slice(0, 400), m.unesco ? 1 : 0, String(m.short || '').slice(0, 200),
        m.story, m.legend || null, JSON.stringify(m.facts || []), v.open || null, v.close || null,
        v.entry_fee_foreigner_npr ?? null, v.entry_fee_saarc_npr ?? null, v.entry_fee_nepali_npr ?? null, v.visit_minutes || 30,
        m.earthquake_2015 ? String(m.earthquake_2015).slice(0, 400) : null, img.url || '', img.file_page || '', credit, tagsFor(m).slice(0, 255), JSON.stringify(m.sources || []),
        JSON.stringify(m.festivals || []), JSON.stringify((m.gallery || []).filter((g) => g && g.url)), m.model ? JSON.stringify(m.model) : null,
        m.short_np || null, m.story_np || null, m.legend_np || null, JSON.stringify(m.facts_np || []), m.quake_np || null],
    );
    for (const q of m.quiz || []) {
      await conn.query('INSERT INTO questions (monument_id, question, options, answer_index, difficulty, rating, explanation, question_np, options_np, explanation_np) VALUES (?,?,?,?,?,?,?,?,?,?)',
        [r.insertId, String(q.q).slice(0, 400), JSON.stringify(q.options), q.answer_index, q.difficulty || 2, difficultyToRating(q.difficulty || 2), String(q.explanation || '').slice(0, 400),
          q.q_np ? String(q.q_np).slice(0, 800) : null, q.options_np ? JSON.stringify(q.options_np) : null, q.explanation_np ? String(q.explanation_np).slice(0, 800) : null]);
      questions++;
    }
    for (const [ci, c] of (m.clues || []).entries()) { await conn.query('INSERT INTO clues (monument_id, clue, clue_np) VALUES (?, ?, ?)', [r.insertId, String(c).slice(0, 300), m.clues_np?.[ci] ? String(m.clues_np[ci]).slice(0, 500) : null]); clues++; }
  }

  const demoHash = await bcrypt.hash('explorer123', 10);
  const adminHash = await bcrypt.hash('admin123', 10);
  await conn.query("INSERT INTO users (name, email, password_hash, role, interests, email_verified) VALUES ('Demo Explorer', 'demo@sampada.np', ?, 'explorer', 'pagoda,buddhist,legend', 1), ('Sampada Admin', 'admin@sampada.np', ?, 'admin', '', 1)", [demoHash, adminHash]);
  await conn.end();
  console.log(`Database "${DB}" ready: ${sites.length} monuments, ${questions} questions, ${clues} clues.`);
  console.log('Demo explorer: demo@sampada.np / explorer123   Admin: admin@sampada.np / admin123');
}

main().catch((e) => { console.error('db:init failed:', e.message); process.exit(1); });
