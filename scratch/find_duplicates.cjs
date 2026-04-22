const fs = require('fs');
const content = fs.readFileSync('server/routers.ts', 'utf8');
const lines = content.split('\n');
const keys = {};
lines.forEach((line, i) => {
  const match = line.match(/^\s+([a-zA-Z0-9_]+):/);
  if (match) {
    const key = match[1];
    if (keys[key]) {
      console.log(`Duplicate key "${key}" found on line ${i + 1} (previous on line ${keys[key]})`);
    } else {
      keys[key] = i + 1;
    }
  }
});
