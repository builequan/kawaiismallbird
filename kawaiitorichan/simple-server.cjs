// Simple diagnostic server to test if container is working
const http = require('http');

const port = process.env.PORT || 3000;
const hostname = '0.0.0.0';

console.log('Starting simple diagnostic server...');
console.log('Environment check:');
console.log('- PORT:', port);
console.log('- DATABASE_URI:', process.env.DATABASE_URI ? 'SET' : 'NOT SET');
console.log('- PAYLOAD_SECRET:', process.env.PAYLOAD_SECRET ? 'SET' : 'NOT SET');
console.log('- NODE_ENV:', process.env.NODE_ENV);

const server = http.createServer((req, res) => {
  console.log(`Request received: ${req.method} ${req.url}`);

  if (req.url === '/health' || req.url === '/api/health') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      status: 'OK',
      message: 'Simple server is running',
      env: {
        PORT: port,
        DATABASE_URI: process.env.DATABASE_URI ? 'SET' : 'NOT SET',
        PAYLOAD_SECRET: process.env.PAYLOAD_SECRET ? 'SET' : 'NOT SET',
        NODE_ENV: process.env.NODE_ENV || 'not set'
      }
    }));
  } else {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Simple server is working! Check /health for details\n');
  }
});

server.listen(port, hostname, () => {
  console.log(`Simple server running at http://${hostname}:${port}/`);
  console.log('Server is ready to accept connections');
});

// Keep the process alive
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  server.close(() => {
    process.exit(0);
  });
});