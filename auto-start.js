const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting PayPass Backend with Auto MongoDB Connection...');

// Function to start the server
function startServer() {
  console.log('📡 Starting server...');
  
  const server = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true,
    cwd: __dirname
  });
  
  server.on('error', (error) => {
    console.error('❌ Server error:', error);
    console.log('🔄 Restarting server in 3 seconds...');
    setTimeout(startServer, 3000);
  });
  
  server.on('exit', (code) => {
    console.log(`🔄 Server exited with code ${code}`);
    console.log('🔄 Restarting server in 3 seconds...');
    setTimeout(startServer, 3000);
  });
  
  // Handle process termination
  process.on('SIGINT', () => {
    console.log('🛑 Shutting down server...');
    server.kill('SIGINT');
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.log('🛑 Shutting down server...');
    server.kill('SIGTERM');
    process.exit(0);
  });
}

// Start the server
startServer(); 