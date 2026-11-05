import mysql from 'mysql2/promise';
import 'dotenv/config';

// Support TiDB Cloud / SSL or connection URL if provided
const sslOption = process.env.DB_SSL === 'true' || process.env.TIDB_ENABLE_SSL === 'true'
  ? { rejectUnauthorized: true }
  : (process.env.DB_SSL ? JSON.parse(process.env.DB_SSL) : undefined);

export const pool = mysql.createPool(
  process.env.DATABASE_URL
    ? {
        uri: process.env.DATABASE_URL,
        ssl: sslOption,
        waitForConnections: true,
        connectionLimit: 10,
        decimalNumbers: true,
      }
    : {
        host: process.env.DB_HOST || '127.0.0.1',
        port: Number(process.env.DB_PORT || 3306),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'sampada',
        ssl: sslOption,
        waitForConnections: true,
        connectionLimit: 10,
        decimalNumbers: true,
        charset: 'utf8mb4',
      }
);

export async function query(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

