const { spawn } = require('child_process');
const fs = require('fs');

const log = fs.openSync('/tmp/nx.log', 'a');
const server = spawn('npx', ['next', 'dev', '-p', '3000'], {
  cwd: '/home/z/my-project',
  stdio: [ 'ignore', log, log ],
  detached: true,
});

server.unref();
console.log('Server started, PID:', server.pid);

// Keep parent alive briefly to ensure spawn completes
setTimeout(() => process.exit(0), 3000);