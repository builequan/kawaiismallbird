#!/usr/bin/env tsx

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';
import {
  listDatabaseProfiles,
  getDatabaseProfile,
  testDatabaseConnection,
  getDatabaseStats,
  queryArticles,
  closeAllConnections,
  type GenericArticle,
} from './multi-database-connection';
import { ArticleSelectionManager } from './article-selection-manager';
import { ImportQueueManager } from './import-queue-system';
import { batchUpload, type MigrationConfig } from './upload-to-payload';

// CLI program
const program = new Command();

program
  .name('import')
  .description('Enhanced article import tool for Payload CMS')
  .version('2.0.0');

// List databases command
program
  .command('list-databases')
  .alias('db')
  .description('List available database profiles')
  .action(async () => {
    const profiles = listDatabaseProfiles();

    if (profiles.length === 0) {
      console.log(chalk.yellow('No database profiles found.'));
      return;
    }

    const table = new Table({
      head: ['ID', 'Name', 'Description'],
      style: { head: ['cyan'] },
    });

    profiles.forEach(profile => {
      table.push([profile.id, profile.name, profile.description]);
    });

    console.log('\n' + chalk.bold('Available Database Profiles:'));
    console.log(table.toString());
  });

// Test database connection
program
  .command('test <database>')
  .description('Test connection to a database profile')
  .action(async (database: string) => {
    const spinner = ora(`Testing connection to ${database}...`).start();

    const result = await testDatabaseConnection(database);

    if (result.success) {
      spinner.succeed(chalk.green(result.message));
      if (result.details) {
        console.log(chalk.gray(`  Connected at: ${result.details.time}`));
        console.log(chalk.gray(`  Table: ${result.details.table}`));
        console.log(chalk.gray(`  Columns: ${result.details.columns.length}`));
      }
    } else {
      spinner.fail(chalk.red(result.message));
    }

    await closeAllConnections();
  });

// Database statistics
program
  .command('stats <database>')
  .description('Show statistics for a database')
  .action(async (database: string) => {
    const spinner = ora('Fetching database statistics...').start();

    try {
      const stats = await getDatabaseStats(database);
      spinner.succeed('Statistics fetched');

      console.log('\n' + chalk.bold('Database Statistics:'));
      console.log(chalk.cyan('Total Articles:'), stats.totalArticles);

      if (stats.websites.length > 0) {
        console.log('\n' + chalk.bold('Websites:'));
        stats.websites.forEach(w => {
          console.log(`  Website ${w.id}: ${w.count} articles`);
        });
      }

      if (stats.languages.length > 0) {
        console.log('\n' + chalk.bold('Languages:'));
        stats.languages.forEach(l => {
          console.log(`  ${l.language}: ${l.count} articles`);
        });
      }

      if (stats.categories.length > 0) {
        console.log('\n' + chalk.bold('Top Categories:'));
        stats.categories.forEach(c => {
          console.log(`  ${c.category}: ${c.count} articles`);
        });
      }

      if (stats.dateRange.oldest && stats.dateRange.newest) {
        console.log('\n' + chalk.bold('Date Range:'));
        console.log(`  Oldest: ${new Date(stats.dateRange.oldest).toLocaleDateString()}`);
        console.log(`  Newest: ${new Date(stats.dateRange.newest).toLocaleDateString()}`);
      }
    } catch (error) {
      spinner.fail(chalk.red('Failed to fetch statistics'));
      console.error(error);
    }

    await closeAllConnections();
  });

// Interactive import command
program
  .command('interactive')
  .alias('i')
  .description('Interactive article selection and import')
  .action(async () => {
    console.log(chalk.bold.cyan('\n🚀 Interactive Article Import\n'));

    // Select database
    const profiles = listDatabaseProfiles();
    const { database } = await inquirer.prompt([
      {
        type: 'list',
        name: 'database',
        message: 'Select database:',
        choices: profiles.map(p => ({ name: `${p.name} - ${p.description}`, value: p.id })),
      },
    ]);

    // Test connection
    const spinner = ora('Connecting to database...').start();
    const connResult = await testDatabaseConnection(database);

    if (!connResult.success) {
      spinner.fail(chalk.red('Connection failed'));
      return;
    }
    spinner.succeed(chalk.green('Connected'));

    // Get database stats
    const stats = await getDatabaseStats(database);

    // Select website if multiple
    let websiteId: number | string | undefined;
    if (stats.websites.length > 1) {
      const { website } = await inquirer.prompt([
        {
          type: 'list',
          name: 'website',
          message: 'Select website:',
          choices: [
            { name: 'All websites', value: undefined },
            ...stats.websites.map(w => ({ name: `Website ${w.id} (${w.count} articles)`, value: w.id })),
          ],
        },
      ]);
      websiteId = website;
    } else if (stats.websites.length === 1) {
      websiteId = stats.websites[0].id;
    }

    // Select language if multiple
    let language: string | undefined;
    if (stats.languages.length > 1) {
      const { lang } = await inquirer.prompt([
        {
          type: 'list',
          name: 'lang',
          message: 'Select language:',
          choices: [
            { name: 'All languages', value: undefined },
            ...stats.languages.map(l => ({ name: `${l.language} (${l.count} articles)`, value: l.language })),
          ],
        },
      ]);
      language = lang;
    } else if (stats.languages.length === 1) {
      language = stats.languages[0].language;
    }

    // Initialize selection manager
    const selectionManager = new ArticleSelectionManager(database);
    await selectionManager.loadArticles(websiteId, language);

    // Selection mode
    const { selectionMode } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectionMode',
        message: 'How would you like to select articles?',
        choices: [
          { name: 'Select all articles', value: 'all' },
          { name: 'Filter articles', value: 'filter' },
          { name: 'Select by date range', value: 'date' },
          { name: 'Select by category', value: 'category' },
          { name: 'Custom selection', value: 'custom' },
        ],
      },
    ]);

    // Apply selection based on mode
    switch (selectionMode) {
      case 'all':
        selectionManager.selectAll();
        break;

      case 'filter':
        const filters = await promptForFilters(selectionManager);
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) {
            selectionManager.setFilter(key as any, value as any);
          }
        });
        selectionManager.selectAll();
        break;

      case 'date':
        const { dateFrom, dateTo } = await inquirer.prompt([
          {
            type: 'input',
            name: 'dateFrom',
            message: 'From date (YYYY-MM-DD):',
            validate: (input) => !input || isValidDate(input) || 'Invalid date format',
          },
          {
            type: 'input',
            name: 'dateTo',
            message: 'To date (YYYY-MM-DD):',
            validate: (input) => !input || isValidDate(input) || 'Invalid date format',
          },
        ]);

        if (dateFrom || dateTo) {
          selectionManager.setFilter('dateRange', {
            from: dateFrom ? new Date(dateFrom) : undefined,
            to: dateTo ? new Date(dateTo) : undefined,
          });
        }
        selectionManager.selectAll();
        break;

      case 'category':
        const availableFilters = await selectionManager.getAvailableFilters();
        if (availableFilters.categories.length > 0) {
          const { categories } = await inquirer.prompt([
            {
              type: 'checkbox',
              name: 'categories',
              message: 'Select categories:',
              choices: availableFilters.categories,
            },
          ]);
          selectionManager.setFilter('categories', categories);
          selectionManager.selectAll();
        }
        break;

      case 'custom':
        await customSelection(selectionManager);
        break;
    }

    // Show selection summary
    const selected = selectionManager.getSelectedArticles();
    const stats2 = selectionManager.getStatistics();

    console.log('\n' + chalk.bold('Selection Summary:'));
    console.log(chalk.cyan('Selected:'), `${selected.length} articles`);
    console.log(chalk.gray('Categories:'), Object.keys(stats2.byCategory).join(', '));
    console.log(chalk.gray('Languages:'), Object.keys(stats2.byLanguage).join(', '));

    // Confirm import
    const { confirmImport } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmImport',
        message: `Import ${selected.length} articles to Payload CMS?`,
        default: true,
      },
    ]);

    if (!confirmImport) {
      console.log(chalk.yellow('Import cancelled'));
      await closeAllConnections();
      return;
    }

    // Import options
    const { queueMode } = await inquirer.prompt([
      {
        type: 'list',
        name: 'queueMode',
        message: 'Import mode:',
        choices: [
          { name: 'Import now', value: 'now' },
          { name: 'Add to queue', value: 'queue' },
          { name: 'Save selection for later', value: 'save' },
        ],
      },
    ]);

    switch (queueMode) {
      case 'now':
        await importNow(selected, database, websiteId, language || 'en');
        break;

      case 'queue':
        await addToQueue(selected, database, websiteId, language || 'en');
        break;

      case 'save':
        await saveSelection(selectionManager);
        break;
    }

    await closeAllConnections();
  });

// Quick import command
program
  .command('quick')
  .description('Quick import with minimal configuration')
  .option('-d, --database <db>', 'Database profile')
  .option('-w, --website <id>', 'Website ID')
  .option('-l, --language <lang>', 'Language code')
  .option('-c, --category <cat>', 'Filter by category')
  .option('-n, --limit <number>', 'Limit number of articles', parseInt)
  .option('--dry-run', 'Preview without importing')
  .action(async (options) => {
    const { database, website, language, category, limit, dryRun } = options;

    if (!database) {
      console.error(chalk.red('Database profile is required'));
      return;
    }

    const spinner = ora('Loading articles...').start();

    try {
      const articles = await queryArticles({
        profileName: database,
        websiteId: website,
        language,
        categories: category ? [category] : undefined,
        limit,
      });

      spinner.succeed(`Found ${articles.length} articles`);

      if (dryRun) {
        console.log('\n' + chalk.bold('Articles to import:'));
        articles.forEach((article, index) => {
          console.log(`${index + 1}. ${article.title} (${article.language})`);
        });
      } else {
        await importNow(articles, database, website, language || 'en');
      }
    } catch (error) {
      spinner.fail(chalk.red('Import failed'));
      console.error(error);
    }

    await closeAllConnections();
  });

// Helper functions

async function promptForFilters(manager: ArticleSelectionManager): Promise<any> {
  const available = await manager.getAvailableFilters();
  const filters: any = {};

  const { useFilters } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'useFilters',
      message: 'Select filters to apply:',
      choices: [
        { name: 'Search text', value: 'search' },
        { name: 'Categories', value: 'categories' },
        { name: 'Authors', value: 'authors' },
        { name: 'Status', value: 'status' },
        { name: 'Has images', value: 'images' },
        { name: 'Word count', value: 'wordcount' },
      ],
    },
  ]);

  for (const filter of useFilters) {
    switch (filter) {
      case 'search':
        const { searchText } = await inquirer.prompt([
          {
            type: 'input',
            name: 'searchText',
            message: 'Search text:',
          },
        ]);
        filters.searchText = searchText;
        break;

      case 'categories':
        if (available.categories.length > 0) {
          const { categories } = await inquirer.prompt([
            {
              type: 'checkbox',
              name: 'categories',
              message: 'Select categories:',
              choices: available.categories,
            },
          ]);
          filters.categories = categories;
        }
        break;

      case 'authors':
        if (available.authors.length > 0) {
          const { authors } = await inquirer.prompt([
            {
              type: 'checkbox',
              name: 'authors',
              message: 'Select authors:',
              choices: available.authors,
            },
          ]);
          filters.authors = authors;
        }
        break;

      case 'status':
        if (available.status.length > 0) {
          const { status } = await inquirer.prompt([
            {
              type: 'checkbox',
              name: 'status',
              message: 'Select status:',
              choices: available.status,
            },
          ]);
          filters.status = status;
        }
        break;

      case 'images':
        const { hasImages } = await inquirer.prompt([
          {
            type: 'list',
            name: 'hasImages',
            message: 'Filter by images:',
            choices: [
              { name: 'With images only', value: true },
              { name: 'Without images only', value: false },
              { name: 'No filter', value: undefined },
            ],
          },
        ]);
        filters.hasImages = hasImages;
        break;

      case 'wordcount':
        const { minWords, maxWords } = await inquirer.prompt([
          {
            type: 'number',
            name: 'minWords',
            message: 'Minimum word count:',
          },
          {
            type: 'number',
            name: 'maxWords',
            message: 'Maximum word count:',
          },
        ]);
        filters.wordCountRange = { min: minWords, max: maxWords };
        break;
    }
  }

  return filters;
}

async function customSelection(manager: ArticleSelectionManager): Promise<void> {
  const articles = manager.getCurrentPageArticles();
  const choices = articles.map((article, index) => ({
    name: `${article.title} (${article.language}, ${article.category || 'uncategorized'})`,
    value: article.id,
    checked: manager.isSelected(article.id),
  }));

  const { selected } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'selected',
      message: 'Select articles:',
      choices,
      pageSize: 20,
    },
  ]);

  // Update selection
  manager.deselectAll();
  selected.forEach((id: string | number) => manager.selectArticle(id));
}

async function importNow(
  articles: GenericArticle[],
  profileName: string,
  websiteId?: number | string,
  language: string = 'en'
): Promise<void> {
  const config: MigrationConfig = {
    websiteId: Number(websiteId) || 1,
    language,
    batchSize: 10,
  };

  const spinner = ora('Importing articles...').start();

  try {
    const results = await batchUpload(articles as any, config);
    spinner.succeed(chalk.green(`Import completed: ${results.summary.succeeded}/${results.summary.total} succeeded`));

    if (results.failed.length > 0) {
      console.log('\n' + chalk.yellow('Failed imports:'));
      results.failed.forEach(f => {
        console.log(chalk.red(`  - ${f.title}: ${f.error}`));
      });
    }
  } catch (error) {
    spinner.fail(chalk.red('Import failed'));
    console.error(error);
  }
}

async function addToQueue(
  articles: GenericArticle[],
  profileName: string,
  websiteId?: number | string,
  language: string = 'en'
): Promise<void> {
  const queueManager = new ImportQueueManager();

  const { queueName, schedule } = await inquirer.prompt([
    {
      type: 'input',
      name: 'queueName',
      message: 'Queue name:',
      default: `Import ${new Date().toLocaleDateString()}`,
    },
    {
      type: 'list',
      name: 'schedule',
      message: 'Schedule:',
      choices: [
        { name: 'Process immediately', value: 'immediate' },
        { name: 'Schedule for later', value: 'scheduled' },
        { name: 'Recurring import', value: 'recurring' },
      ],
    },
  ]);

  const config: MigrationConfig = {
    websiteId: Number(websiteId) || 1,
    language,
    batchSize: 10,
  };

  const queue = queueManager.createQueue(queueName, articles, config, undefined, {
    type: schedule,
  });

  console.log(chalk.green(`✅ Queue "${queue.name}" created with ${articles.length} articles`));

  if (schedule === 'immediate') {
    const { startNow } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'startNow',
        message: 'Start processing queue now?',
        default: true,
      },
    ]);

    if (startNow) {
      await queueManager.startQueue(queue.id);
    }
  }
}

async function saveSelection(manager: ArticleSelectionManager): Promise<void> {
  const { presetName, description } = await inquirer.prompt([
    {
      type: 'input',
      name: 'presetName',
      message: 'Preset name:',
      validate: (input) => input.length > 0 || 'Name is required',
    },
    {
      type: 'input',
      name: 'description',
      message: 'Description (optional):',
    },
  ]);

  manager.savePreset(presetName, description);
  console.log(chalk.green(`✅ Selection saved as "${presetName}"`));

  const selection = manager.exportSelection();
  const filename = `selection-${Date.now()}.json`;
  const fs = await import('fs');
  fs.writeFileSync(filename, JSON.stringify(selection, null, 2));
  console.log(chalk.gray(`Selection exported to ${filename}`));
}

function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

// Parse command line arguments
program.parse(process.argv);

// Show help if no arguments
if (!process.argv.slice(2).length) {
  program.outputHelp();
}