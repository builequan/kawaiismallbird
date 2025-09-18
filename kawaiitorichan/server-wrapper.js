/**
 * Server wrapper to catch and log startup errors
 * This helps diagnose issues in Docker deployments
 */

console.log('Server wrapper starting...');
console.log('Environment check from Node.js:');
console.log('- DATABASE_URI:', process.env.DATABASE_URI ? 'Set' : 'Not set');
console.log('- PAYLOAD_SECRET:', process.env.PAYLOAD_SECRET ? 'Set' : 'Not set');
console.log('- NEXT_PUBLIC_SERVER_URL:', process.env.NEXT_PUBLIC_SERVER_URL || 'Not set');
console.log('- NODE_ENV:', process.env.NODE_ENV || 'Not set');
console.log('- PORT:', process.env.PORT || 'Not set');

// Add error handlers
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:');
  console.error(error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
  process.exit(1);
});

// Try to start the server
try {
  console.log('Loading server.js...');
  require('./server.js');
} catch (error) {
  console.error('❌ Failed to start server:');
  console.error(error);

  // Provide specific guidance based on error
  if (error.message && error.message.includes('DATABASE_URI')) {
    console.error('\n📌 Database connection issue detected.');
    console.error('Please check your DATABASE_URI in Dokploy environment settings.');
  } else if (error.message && error.message.includes('PAYLOAD_SECRET')) {
    console.error('\n📌 Payload secret issue detected.');
    console.error('Please check your PAYLOAD_SECRET in Dokploy environment settings.');
  } else if (error.message && error.message.includes('ECONNREFUSED')) {
    console.error('\n📌 Connection refused - database may not be reachable.');
    console.error('Check if the database hostname is correct in your DATABASE_URI.');
  }

  process.exit(1);
}