import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from parent .env
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
// Also try loading from current directory (for Next.js API routes)
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Load database profiles - handle both development and production paths
let databaseProfiles: any = {};
try {
  // Try loading from the scripts directory first (for CLI usage)
  const profilesPath = path.join(process.cwd(), 'scripts/content-db-migration/database-profiles.json');
  if (fs.existsSync(profilesPath)) {
    databaseProfiles = JSON.parse(fs.readFileSync(profilesPath, 'utf-8'));
  } else {
    // Fallback to relative path (for development)
    const fallbackPath = path.join(__dirname, 'database-profiles.json');
    if (fs.existsSync(fallbackPath)) {
      databaseProfiles = JSON.parse(fs.readFileSync(fallbackPath, 'utf-8'));
    } else {
      // If no file exists, use default profiles
      console.warn('Database profiles file not found, using defaults');
      databaseProfiles = {
        profiles: {
          content_creation_db: {
            name: 'Content Creation Database',
            description: 'Main content creation database',
            connection: {
              host: process.env.DB_HOST || 'localhost',
              port: parseInt(process.env.DB_PORT || '5432'),
              database: process.env.DB_NAME || 'content_creation_db',
              user: process.env.DB_USER || 'postgres',
              password: process.env.DB_PASSWORD || '2801'
            },
            tables: {
              articles: 'articles',
              categories: 'categories',
              tags: 'tags',
              authors: 'authors'
            },
            fieldMappings: {
              id: 'id',
              website_id: 'site_id',
              language: 'language',
              title: 'title',
              content: 'content',
              meta_description: 'meta_description',
              keywords: 'primary_keyword',
              category: 'category',
              tags: 'target_keywords',
              author: 'author',
              status: 'status',
              featured_image: 'featured_image_url',
              slug: 'url_slug',
              published_at: 'published_at',
              created_at: 'created_at',
              updated_at: 'updated_at'
            }
          }
        },
        defaultProfile: 'content_creation_db'
      };
    }
  }
} catch (error) {
  console.error('Error loading database profiles:', error);
  // Use default configuration as fallback
  databaseProfiles = {
    profiles: {
      content_creation_db: {
        name: 'Content Creation Database',
        description: 'Main content creation database',
        connection: {
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '5432'),
          database: process.env.DB_NAME || 'content_creation_db',
          user: process.env.DB_USER || 'postgres',
          password: process.env.DB_PASSWORD || '2801'
        },
        tables: {
          articles: 'articles',
          categories: 'categories',
          tags: 'tags',
          authors: 'authors'
        },
        fieldMappings: {
          id: 'id',
          website_id: 'site_id',
          language: 'language',
          title: 'title',
          content: 'content',
          meta_description: 'meta_description',
          keywords: 'primary_keyword',
          category: 'category',
          tags: 'target_keywords',
          author: 'author',
          status: 'status',
          featured_image: 'featured_image_url',
          slug: 'url_slug',
          published_at: 'published_at',
          created_at: 'created_at',
          updated_at: 'updated_at'
        }
      }
    },
    defaultProfile: 'content_creation_db'
  };
}

// Connection pools cache
const connectionPools = new Map<string, Pool>();

// Generic article interface that works with any database
export interface GenericArticle {
  id: number | string;
  site_id: number | string;  // Changed from website_id to match actual database
  language: string;
  title: string;
  content: string;
  meta_description?: string;
  keywords?: string;
  category?: string;
  tags?: string[] | string;
  author?: string;
  status?: string;
  featured_image_url?: string;  // Changed to match actual database
  slug?: string;
  published_at?: Date | string;
  created_at?: Date | string;
  updated_at?: Date | string;
  [key: string]: any; // Allow additional fields
}

// Database profile interface
export interface DatabaseProfile {
  name: string;
  description: string;
  connection: {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
  };
  tables: {
    articles: string;
    categories?: string;
    tags?: string;
    authors?: string;
  };
  fieldMappings: Record<string, string>;
}

// Get database connection pool
export function getDatabaseConnection(profileName: string): Pool {
  if (connectionPools.has(profileName)) {
    return connectionPools.get(profileName)!;
  }

  const profile = databaseProfiles.profiles[profileName];
  if (!profile) {
    throw new Error(`Database profile '${profileName}' not found`);
  }

  const pool = new Pool(profile.connection);
  connectionPools.set(profileName, pool);
  return pool;
}

// List available database profiles
export function listDatabaseProfiles(): Array<{ id: string; name: string; description: string }> {
  return Object.entries(databaseProfiles.profiles).map(([id, profile]: [string, any]) => ({
    id,
    name: profile.name,
    description: profile.description,
  }));
}

// Get database profile
export function getDatabaseProfile(profileName: string): DatabaseProfile {
  const profile = databaseProfiles.profiles[profileName];
  if (!profile) {
    throw new Error(`Database profile '${profileName}' not found`);
  }
  return profile;
}

// Map database fields to generic article
function mapFieldsToGeneric(row: any, fieldMappings: Record<string, string>): GenericArticle {
  const article: GenericArticle = {} as GenericArticle;

  // Reverse mapping: generic field -> database field
  const reverseMapping: Record<string, string> = {};
  Object.entries(fieldMappings).forEach(([generic, db]) => {
    reverseMapping[db] = generic;
  });

  // Map all fields
  Object.entries(row).forEach(([dbField, value]) => {
    const genericField = reverseMapping[dbField];
    if (genericField) {
      article[genericField as keyof GenericArticle] = value;
    } else {
      // Keep unmapped fields as is
      article[dbField] = value;
    }
  });

  // Parse tags if they're a string
  if (typeof article.tags === 'string') {
    try {
      article.tags = JSON.parse(article.tags);
    } catch {
      article.tags = article.tags.split(',').map(t => t.trim());
    }
  }

  return article;
}

// Get database statistics
export async function getDatabaseStats(profileName: string): Promise<{
  totalArticles: number;
  websites: Array<{ id: string | number; count: number }>;
  languages: Array<{ language: string; count: number }>;
  categories: Array<{ category: string; count: number }>;
  dateRange: { oldest: Date; newest: Date };
}> {
  const pool = getDatabaseConnection(profileName);
  const profile = getDatabaseProfile(profileName);
  const mappings = profile.fieldMappings;

  // Total articles
  const totalQuery = `SELECT COUNT(*) as total FROM ${profile.tables.articles}`;
  const totalResult = await pool.query(totalQuery);
  const totalArticles = parseInt(totalResult.rows[0].total);

  // Websites breakdown
  const websiteQuery = `
    SELECT ${mappings.website_id} as website_id, COUNT(*) as count
    FROM ${profile.tables.articles}
    GROUP BY ${mappings.website_id}
    ORDER BY count DESC
  `;
  const websiteResult = await pool.query(websiteQuery);

  // Languages breakdown
  const languageQuery = `
    SELECT ${mappings.language} as language, COUNT(*) as count
    FROM ${profile.tables.articles}
    WHERE ${mappings.language} IS NOT NULL
    GROUP BY ${mappings.language}
    ORDER BY count DESC
  `;
  const languageResult = await pool.query(languageQuery);

  // Categories breakdown
  const categoryQuery = `
    SELECT ${mappings.category} as category, COUNT(*) as count
    FROM ${profile.tables.articles}
    WHERE ${mappings.category} IS NOT NULL
    GROUP BY ${mappings.category}
    ORDER BY count DESC
    LIMIT 10
  `;
  const categoryResult = await pool.query(categoryQuery);

  // Date range
  const dateQuery = `
    SELECT
      MIN(${mappings.created_at}) as oldest,
      MAX(${mappings.created_at}) as newest
    FROM ${profile.tables.articles}
  `;
  const dateResult = await pool.query(dateQuery);

  return {
    totalArticles,
    websites: websiteResult.rows.map(r => ({ id: r.website_id, count: parseInt(r.count) })),
    languages: languageResult.rows.map(r => ({ language: r.language, count: parseInt(r.count) })),
    categories: categoryResult.rows.map(r => ({ category: r.category, count: parseInt(r.count) })),
    dateRange: {
      oldest: dateResult.rows[0].oldest,
      newest: dateResult.rows[0].newest,
    },
  };
}

// Advanced article query
export interface ArticleQuery {
  profileName: string;
  websiteId?: number | string;
  language?: string;
  categories?: string[];
  authors?: string[];
  status?: string[];
  dateRange?: { from?: Date; to?: Date };
  searchText?: string;
  hasImages?: boolean;
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
}

export async function queryArticles(query: ArticleQuery): Promise<GenericArticle[]> {
  const pool = getDatabaseConnection(query.profileName);
  const profile = getDatabaseProfile(query.profileName);
  const mappings = profile.fieldMappings;

  let sql = `SELECT * FROM ${profile.tables.articles} WHERE 1=1`;
  const params: any[] = [];
  let paramIndex = 1;

  // Build WHERE clause
  if (query.websiteId !== undefined) {
    sql += ` AND ${mappings.website_id} = $${paramIndex++}`;
    params.push(query.websiteId);
  }

  if (query.language) {
    sql += ` AND ${mappings.language} = $${paramIndex++}`;
    params.push(query.language);
  }

  if (query.categories && query.categories.length > 0) {
    sql += ` AND ${mappings.category} = ANY($${paramIndex++})`;
    params.push(query.categories);
  }

  if (query.authors && query.authors.length > 0) {
    sql += ` AND ${mappings.author} = ANY($${paramIndex++})`;
    params.push(query.authors);
  }

  if (query.status && query.status.length > 0) {
    sql += ` AND ${mappings.status} = ANY($${paramIndex++})`;
    params.push(query.status);
  }

  if (query.dateRange) {
    if (query.dateRange.from) {
      sql += ` AND ${mappings.created_at} >= $${paramIndex++}`;
      params.push(query.dateRange.from);
    }
    if (query.dateRange.to) {
      sql += ` AND ${mappings.created_at} <= $${paramIndex++}`;
      params.push(query.dateRange.to);
    }
  }

  if (query.searchText) {
    sql += ` AND (${mappings.title} ILIKE $${paramIndex} OR ${mappings.content} ILIKE $${paramIndex})`;
    params.push(`%${query.searchText}%`);
    paramIndex++;
  }

  if (query.hasImages !== undefined) {
    if (query.hasImages) {
      sql += ` AND ${mappings.featured_image} IS NOT NULL AND ${mappings.featured_image} != ''`;
    } else {
      sql += ` AND (${mappings.featured_image} IS NULL OR ${mappings.featured_image} = '')`;
    }
  }

  // Add ORDER BY
  const orderField = query.orderBy ? mappings[query.orderBy] || query.orderBy : mappings.created_at;
  const orderDirection = query.orderDirection || 'DESC';
  sql += ` ORDER BY ${orderField} ${orderDirection}`;

  // Add LIMIT and OFFSET
  if (query.limit) {
    sql += ` LIMIT ${query.limit}`;
  }
  if (query.offset) {
    sql += ` OFFSET ${query.offset}`;
  }

  const result = await pool.query(sql, params);
  return result.rows.map(row => mapFieldsToGeneric(row, mappings));
}

// Get unique values for filters
export async function getFilterOptions(
  profileName: string,
  field: 'categories' | 'authors' | 'languages' | 'status'
): Promise<string[]> {
  const pool = getDatabaseConnection(profileName);
  const profile = getDatabaseProfile(profileName);
  const mappings = profile.fieldMappings;

  const fieldMapping: Record<string, string> = {
    categories: mappings.category,
    authors: mappings.author,
    languages: mappings.language,
    status: mappings.status,
  };

  const dbField = fieldMapping[field];
  if (!dbField) {
    return [];
  }

  const query = `
    SELECT DISTINCT ${dbField} as value
    FROM ${profile.tables.articles}
    WHERE ${dbField} IS NOT NULL
    ORDER BY value
  `;

  const result = await pool.query(query);
  return result.rows.map(r => r.value).filter(Boolean);
}

// Test connection to a database profile
export async function testDatabaseConnection(profileName: string): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  try {
    const pool = getDatabaseConnection(profileName);
    const profile = getDatabaseProfile(profileName);

    // Test basic connection
    const testResult = await pool.query('SELECT NOW() as time');

    // Check if articles table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = $1
      ) as exists
    `, [profile.tables.articles]);

    if (!tableCheck.rows[0].exists) {
      return {
        success: false,
        message: `Table '${profile.tables.articles}' not found in database`,
      };
    }

    // Get table structure
    const columnsQuery = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = $1
      ORDER BY ordinal_position
    `, [profile.tables.articles]);

    return {
      success: true,
      message: `Connected to '${profile.name}' successfully`,
      details: {
        time: testResult.rows[0].time,
        table: profile.tables.articles,
        columns: columnsQuery.rows,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: `Connection failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

// Close all connections
export async function closeAllConnections(): Promise<void> {
  for (const [name, pool] of connectionPools.entries()) {
    await pool.end();
    connectionPools.delete(name);
  }
}