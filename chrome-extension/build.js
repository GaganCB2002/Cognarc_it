const fs = require('fs');
const path = require('path');

const SRC = __dirname;
const DIST = path.join(__dirname, 'dist');

const IGNORE = ['node_modules', 'dist', 'package.json', 'package-lock.json', 'build.js'];

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    if (IGNORE.includes(entry.name)) continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
      const size = fs.statSync(srcPath).size;
      console.log(`  ${entry.name.padEnd(30)} ${(size / 1024).toFixed(1)} KB`);
    }
  }
}

console.log('\n📋 Building DocAgent Extension...\n');

if (fs.existsSync(DIST)) {
  fs.rmSync(DIST, { recursive: true });
}

copyDir(SRC, DIST);

console.log(`\n✅ Build complete! Output: ${DIST}`);
console.log('   Load the extension in Chrome:');
console.log('   1. Go to chrome://extensions');
console.log('   2. Enable "Developer mode"');
console.log('   3. Click "Load unpacked"');
console.log(`   4. Select the "${DIST}" folder\n`);
