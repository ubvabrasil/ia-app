#!/usr/bin/env node
// Fast dev server startup script
require('dotenv/config');
const { spawn } = require('child_process');

console.log('🚀 Starting dev server...');

// Kill port 3000 if needed (async, don't wait)
const killPort = spawn('npx', ['kill-port', '3000'], { stdio: 'ignore' });
killPort.on('error', () => {}); // Ignore errors

// Start server immediately without waiting for kill-port
setTimeout(() => {
  const server = spawn('ts-node', [
    '--transpile-only',
    '--project', 'tsconfig.server.json',
    'server-custom.ts'
  ], {
    stdio: 'inherit',
    env: process.env
  });

  server.on('error', (err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });

  server.on('exit', (code) => {
    process.exit(code || 0);
  });
}, 100);
