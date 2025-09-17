#!/usr/bin/env tsx

import readline from 'readline';
import {
  contentDb,
  testConnection,
  getWebsites,
  getArticles,
  type WebsiteConfig,
} from './database-connection';
import { batchUpload, type MigrationConfig } from './upload-to-payload';

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Helper to prompt user
function prompt(question: string): Promise<string> {
  return new Promise(resolve => {
    rl.question(question, answer => resolve(answer.trim()));
  });
}

// Helper to select from options
async function selectOption<T>(
  options: T[],
  displayFn: (item: T) => string,
  promptText: string
): Promise<T | null> {
  if (options.length === 0) {
    console.log('❌ No options available');
    return null;
  }

  console.log('\nAvailable options:');
  options.forEach((option, index) => {
    console.log(`  ${index + 1}. ${displayFn(option)}`);
  });

  const selection = await prompt(`\n${promptText} (1-${options.length}): `);
  const index = parseInt(selection) - 1;

  if (index >= 0 && index < options.length) {
    return options[index];
  }

  console.log('❌ Invalid selection');
  return null;
}

// Main migration workflow
async function main() {
  console.log('🚀 Content Database to Payload CMS Migration Tool');
  console.log('================================================\n');

  // Test database connection
  console.log('📡 Testing database connection...');
  const connected = await testConnection();

  if (!connected) {
    console.log('\n❌ Failed to connect to content database.');
    console.log('Please check your .env configuration:');
    console.log('  DB_HOST=localhost');
    console.log('  DB_PORT=5432');
    console.log('  DB_NAME=content_creation_db');
    console.log('  DB_USER=postgres');
    console.log('  DB_PASSWORD=2801');
    process.exit(1);
  }

  // Get available websites
  console.log('\n🌐 Fetching available websites...');
  const websites = await getWebsites();

  if (websites.length === 0) {
    console.log('❌ No websites found in the database');
    process.exit(1);
  }

  // Select website
  const selectedWebsite = await selectOption(
    websites,
    (w: WebsiteConfig) => `${w.name} (ID: ${w.id}) - Languages: ${w.languages.join(', ')}`,
    'Select a website to migrate'
  );

  if (!selectedWebsite) {
    process.exit(1);
  }

  // Select language
  const selectedLanguage = await selectOption(
    selectedWebsite.languages,
    (lang: string) => lang,
    'Select a language'
  );

  if (!selectedLanguage) {
    process.exit(1);
  }

  // Ask for number of articles
  const limitStr = await prompt('\nHow many articles to migrate? (leave empty for all): ');
  const limit = limitStr ? parseInt(limitStr) : undefined;

  // Fetch articles
  console.log('\n📚 Fetching articles...');
  const articles = await getArticles(selectedWebsite.id, selectedLanguage, limit);

  if (articles.length === 0) {
    console.log('❌ No articles found for the selected criteria');
    process.exit(1);
  }

  console.log(`✅ Found ${articles.length} articles`);

  // Migration options
  console.log('\n⚙️  Migration Configuration:');

  const collectionName = await prompt('Target Payload collection (default: posts): ') || 'posts';
  const batchSize = parseInt(await prompt('Batch size (default: 10): ') || '10');

  // Category mapping
  const setupCategoryMapping = await prompt('Setup category mapping? (y/n): ');
  const categoryMapping: Record<string, string> = {};

  if (setupCategoryMapping.toLowerCase() === 'y') {
    // Get unique categories from articles
    const uniqueCategories = Array.from(new Set(articles.map(a => a.category).filter(Boolean)));

    console.log('\nMap content database categories to Payload categories:');
    for (const category of uniqueCategories) {
      const mapped = await prompt(`  ${category} → `);
      if (mapped) {
        categoryMapping[category!] = mapped;
      }
    }
  }

  // Prepare migration config
  const config: MigrationConfig = {
    websiteId: selectedWebsite.id,
    language: selectedLanguage,
    collectionName,
    batchSize,
    categoryMapping: Object.keys(categoryMapping).length > 0 ? categoryMapping : undefined,
  };

  // Confirm migration
  console.log('\n📋 Migration Summary:');
  console.log(`  Website: ${selectedWebsite.name} (ID: ${selectedWebsite.id})`);
  console.log(`  Language: ${selectedLanguage}`);
  console.log(`  Articles: ${articles.length}`);
  console.log(`  Target Collection: ${collectionName}`);
  console.log(`  Batch Size: ${batchSize}`);

  if (Object.keys(categoryMapping).length > 0) {
    console.log('  Category Mapping:');
    Object.entries(categoryMapping).forEach(([from, to]) => {
      console.log(`    ${from} → ${to}`);
    });
  }

  const confirm = await prompt('\nProceed with migration? (y/n): ');

  if (confirm.toLowerCase() !== 'y') {
    console.log('Migration cancelled');
    process.exit(0);
  }

  // Run migration
  console.log('\n🚀 Starting migration...');
  const result = await batchUpload(articles, config);

  // Save results to file
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const resultFile = `migration-results-${timestamp}.json`;

  const fs = await import('fs');
  fs.writeFileSync(
    resultFile,
    JSON.stringify(result, null, 2)
  );

  console.log(`\n💾 Results saved to: ${resultFile}`);

  // Close connections
  await contentDb.end();
  rl.close();

  console.log('\n✨ Migration complete!');
  process.exit(0);
}

// Error handling
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});

// Run main function
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});