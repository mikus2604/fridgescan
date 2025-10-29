#!/usr/bin/env node

const { spawn } = require('child_process');
const os = require('os');
const qrcode = require('qrcode-terminal');

// Get the local IP address
function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const PORT = 3003;
const ipAddress = getLocalIpAddress();
const localUrl = `http://localhost:${PORT}`;
const networkUrl = `http://${ipAddress}:${PORT}`;

console.log('\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  🥗 FridgeScan Web Development Server');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('\n');

// Generate QR code for network URL
console.log('  Scan this QR code to open on mobile:\n');
qrcode.generate(networkUrl, { small: true }, (qr) => {
  console.log(qr);
});

console.log('\n');
console.log(`  🌐 Local:   ${localUrl}`);
console.log(`  🌐 Network: ${networkUrl}`);
console.log('\n');
console.log('  📱 Open the Network URL in your browser or scan the QR code');
console.log('\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('\n');

// Start the Expo web server
const expoProcess = spawn('npx', ['expo', 'start', '--web', '--port', String(PORT)], {
  stdio: 'inherit',
  shell: true,
});

expoProcess.on('error', (error) => {
  console.error('Failed to start Expo:', error);
  process.exit(1);
});

expoProcess.on('exit', (code) => {
  process.exit(code);
});

// Handle process termination
process.on('SIGINT', () => {
  expoProcess.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  expoProcess.kill('SIGTERM');
  process.exit(0);
});
