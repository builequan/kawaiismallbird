#!/usr/bin/env tsx

import fs from 'fs';
import { Client } from 'pg';

async function createCompleteExport() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: '2801',
    database: 'golfer'
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Get all tables and their data
    const tables = ['categories', 'media', 'posts', 'posts_rels', 'users', 'tags'];
    let sqlOutput = '';

    for (const table of tables) {
      console.log(`📊 Exporting ${table}...`);

      // Get table structure first
      const structureResult = await client.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [table]);

      const columns = structureResult.rows.map(row => row.column_name);

      // Get all data
      const dataResult = await client.query(`SELECT * FROM ${table}`);

      sqlOutput += `-- Data for table: ${table}\n`;
      sqlOutput += `DELETE FROM ${table};\n`;

      for (const row of dataResult.rows) {
        const values = columns.map(col => {
          const value = row[col];
          if (value === null) return 'NULL';
          if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
          if (typeof value === 'object') return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
          return value;
        });

        sqlOutput += `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
      }

      sqlOutput += `\n`;
      console.log(`✅ Exported ${dataResult.rows.length} rows from ${table}`);
    }

    // Write to file
    fs.writeFileSync('current-complete-data-352-posts.sql', sqlOutput);
    console.log('✅ Complete export saved to current-complete-data-352-posts.sql');

  } catch (error) {
    console.error('❌ Export failed:', error);
  } finally {
    await client.end();
  }
}

createCompleteExport();