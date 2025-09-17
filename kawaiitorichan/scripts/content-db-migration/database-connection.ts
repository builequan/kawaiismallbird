import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

// Content creation database configuration
export const contentDbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'content_creation_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '2801',
};

// Create connection pool for content creation database
export const contentDb = new Pool(contentDbConfig);

// Article interface based on typical content database structure
export interface ContentArticle {
  id: number;
  website_id: number;
  language: string;
  title: string;
  content: string;
  meta_description?: string;
  keywords?: string;
  category?: string;
  tags?: string[];
  author?: string;
  status?: 'draft' | 'published';
  published_at?: Date;
  created_at: Date;
  updated_at: Date;
  featured_image?: string;
  slug?: string;
}

// Website configuration interface
export interface WebsiteConfig {
  id: number;
  name: string;
  domain: string;
  languages: string[];
  default_category?: string;
  payload_collection?: string; // Which Payload collection to use
}

// Get all websites from database
export async function getWebsites(): Promise<WebsiteConfig[]> {
  try {
    const query = `
      SELECT DISTINCT
        website_id as id,
        website_name as name,
        website_domain as domain,
        array_agg(DISTINCT language) as languages
      FROM articles
      GROUP BY website_id, website_name, website_domain
      ORDER BY website_id
    `;

    const result = await contentDb.query(query);
    return result.rows;
  } catch (error) {
    console.error('Error fetching websites:', error);
    // Fallback query if structure is different
    const fallbackQuery = `
      SELECT DISTINCT website_id as id, language
      FROM articles
      ORDER BY website_id
    `;
    const result = await contentDb.query(fallbackQuery);

    // Group by website_id
    const websites = new Map<number, WebsiteConfig>();
    result.rows.forEach(row => {
      if (!websites.has(row.id)) {
        websites.set(row.id, {
          id: row.id,
          name: `Website ${row.id}`,
          domain: `website${row.id}.com`,
          languages: [],
          payload_collection: 'posts'
        });
      }
      websites.get(row.id)!.languages.push(row.language);
    });

    return Array.from(websites.values());
  }
}

// Get articles by website and language
export async function getArticles(
  websiteId: number,
  language?: string,
  limit?: number
): Promise<ContentArticle[]> {
  try {
    let query = `
      SELECT
        id,
        website_id,
        language,
        title,
        content,
        meta_description,
        keywords,
        category,
        tags,
        author,
        status,
        published_at,
        created_at,
        updated_at,
        featured_image,
        slug
      FROM articles
      WHERE website_id = $1
    `;

    const params: any[] = [websiteId];

    if (language) {
      query += ` AND language = $2`;
      params.push(language);
    }

    query += ` ORDER BY created_at DESC`;

    if (limit) {
      query += ` LIMIT ${limit}`;
    }

    const result = await contentDb.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Error fetching articles:', error);
    throw error;
  }
}

// Test database connection
export async function testConnection(): Promise<boolean> {
  try {
    const result = await contentDb.query('SELECT NOW()');
    console.log('✅ Content database connected:', result.rows[0].now);

    // Try to get table structure
    const tableInfo = await contentDb.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'articles'
      ORDER BY ordinal_position
    `);

    console.log('\n📋 Articles table structure:');
    tableInfo.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(required)' : ''}`);
    });

    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}