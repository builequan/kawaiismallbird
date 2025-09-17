#!/usr/bin/env node

import { getDatabaseConnection } from './content-db-migration/multi-database-connection';

async function checkSchema() {
  const pool = getDatabaseConnection('content_creation_db');

  try {
    // Query to get column information
    const query = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'articles'
      ORDER BY ordinal_position;
    `;

    const result = await pool.query(query);

    console.log('Articles table structure:');
    console.log('------------------------');
    result.rows.forEach(row => {
      console.log(`${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

    // Get a sample row to see actual data
    console.log('\nSample data from site_id = 19:');
    console.log('------------------------------');
    const sampleQuery = `
      SELECT * FROM articles
      WHERE site_id = 19
      LIMIT 1
    `;

    const sampleResult = await pool.query(sampleQuery);
    if (sampleResult.rows.length > 0) {
      const sample = sampleResult.rows[0];
      Object.keys(sample).forEach(key => {
        const value = sample[key];
        if (value !== null && value !== undefined) {
          const displayValue = typeof value === 'string' && value.length > 50
            ? value.substring(0, 50) + '...'
            : value;
          console.log(`${key}: ${displayValue}`);
        }
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkSchema();