const fs = require('fs');
const src = fs.readFileSync('script.js', 'utf8');
const lines = src.split('\n');

let depth = 0;
let inFunc = false;
let funcDepth = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (i + 1 === 15452) {
    inFunc = true;
    funcDepth = depth;
  }

  // Strip // comments and simple strings before counting braces
  let stripped = line
    .replace(/\/\/.*$/, '')
    .replace(/'[^'\\]*'/g, "''")
    .replace(/"[^"\\]*"/g, '""');

  for (const c of stripped) {
    if (c === '{') depth++;
    if (c === '}') depth--;
  }

  if (inFunc && depth <= funcDepth) {
    console.log('Function closes at line:', i + 1, '| depth:', depth, '| content:', line.trim().slice(0, 80));
    inFunc = false;
  }
}
console.log('Final depth:', depth);
