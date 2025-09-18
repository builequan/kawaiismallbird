// Initialize database tables for Payload CMS
console.log('Initializing database tables...');

// Set required environment variables if not already set
process.env.PAYLOAD_CONFIG_PATH = process.env.PAYLOAD_CONFIG_PATH || './src/payload.config.ts';

async function initDatabase() {
  try {
    console.log('Starting database initialization...');
    console.log('Database URI:', process.env.DATABASE_URI ? 'Set' : 'Not set');

    // Import Payload after environment is set up
    const { getPayload } = await import('payload');
    const configPromise = await import('./src/payload.config.ts');

    console.log('Getting Payload instance...');
    const payload = await getPayload({
      config: configPromise.default,
    });

    console.log('Running migrations...');
    await payload.db.migrate();

    console.log('Database initialized successfully!');
    console.log('Starting server...');

    // Now start the actual server
    require('./server.js');
  } catch (error) {
    console.error('Failed to initialize database:', error);

    // If migration fails, try to start anyway (might be already migrated)
    console.log('Attempting to start server anyway...');
    try {
      require('./server.js');
    } catch (serverError) {
      console.error('Server start failed:', serverError);
      process.exit(1);
    }
  }
}

initDatabase();