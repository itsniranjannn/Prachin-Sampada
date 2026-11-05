// Helper script to import schema and seed data into TiDB Cloud
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import 'dotenv/config';

const here = path.dirname(fileURLToPath(import.meta.url));
const sqlPath = path.resolve(here, '..', '..', 'database', 'sampada.sql');


async function pushToTiDB() {
  const user = process.argv[2] || process.env.TIDB_USER;
  const password = process.argv[3] || process.env.TIDB_PASSWORD || 'S9dcVSY3h13RqNKn';
  const host = process.argv[4] || process.env.TIDB_HOST || 'gateway01.ap-northeast-1.prod.aws.tidbcloud.com';
  const port = Number(process.argv[5] || process.env.TIDB_PORT || 4000);
  const database = process.argv[6] || process.env.TIDB_DATABASE || 'sampada';

  if (!user) {
    console.error('Usage: node scripts/push-tidb.mjs <TIDB_USER> [PASSWORD] [HOST] [PORT] [DATABASE]');
    console.error('Example: node scripts/push-tidb.mjs 2aXXXXX.root S9dcVSY3h13RqNKn');
    process.exit(1);
  }

  console.log(`Connecting to TiDB (${host}:${port}) as user "${user}"...`);
  
  // 1. Connect and create database if not exists
  const rootConn = await mysql.createConnection({
    host,
    port,
    user,
    password,
    ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true },
    multipleStatements: true,
  });

  console.log(`Ensuring database "${database}" exists...`);
  await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`; USE \`${database}\`;`);

  console.log(`Reading SQL file from ${sqlPath}...`);
  const rawSql = fs.readFileSync(sqlPath, 'utf8');

  console.log('Executing schema and seeds on TiDB (this may take a few moments)...');
  await rootConn.query(rawSql);

  const [tables] = await rootConn.query('SHOW TABLES;');
  const [monuments] = await rootConn.query('SELECT COUNT(*) as count FROM monuments;');
  console.log(`Success! ${tables.length} tables created. Monuments loaded: ${monuments[0].count}`);

  await rootConn.end();
}

pushToTiDB().catch((err) => {
  console.error('TiDB import failed:', err.message);
  process.exit(1);
});
