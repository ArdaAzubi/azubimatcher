const fs = require('fs');
const path = require('path');
const acorn = require(path.join(process.env.TEMP, 'node_modules', 'acorn'));

const src = fs.readFileSync('script.js', 'utf8');
const lines = src.split('\n');
const validSrc = lines.slice(0, 16603).join('\n');

const ast = acorn.parse(validSrc, { ecmaVersion: 2022, sourceType: 'script' });

function getLine(pos) { return validSrc.slice(0, pos).split('\n').length; }

// Find all top-level FunctionDeclarations in range 15400-16610
for (const node of ast.body) {
  if (node.type === 'FunctionDeclaration') {
    const start = getLine(node.start);
    const end = getLine(node.end);
    if (start >= 15400) {
      console.log(`${node.id.name}: ${start} - ${end}`);
    }
  }
}
