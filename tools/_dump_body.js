const fs = require('fs'), path = require('path');
const acorn = require(path.join(process.env.TEMP, 'node_modules', 'acorn'));
const src = fs.readFileSync('script.js', 'utf8');
const lines = src.split('\n');
const validSrc = lines.slice(0, 16603).join('\n');
const ast = acorn.parse(validSrc, { ecmaVersion: 2022, sourceType: 'script' });
function getLine(pos) { return validSrc.slice(0, pos).split('\n').length; }

function findFunc(node, name) {
  if (!node || typeof node !== 'object') return null;
  if (node.type === 'FunctionDeclaration' && node.id && node.id.name === name) return node;
  for (const key of Object.keys(node)) {
    const child = node[key];
    if (Array.isArray(child)) { for (const item of child) { const f = findFunc(item, name); if (f) return f; } }
    else if (child && typeof child === 'object') { const f = findFunc(child, name); if (f) return f; }
  }
  return null;
}
const func = findFunc(ast, 'initFirmProfilePage');
const body = func.body.body;
console.log('Total statements in initFirmProfilePage:', body.length);
body.slice(-10).forEach(s => {
  const sl = getLine(s.start); const el = getLine(s.end);
  let desc = s.type;
  if (s.type === 'FunctionDeclaration') desc += ' ' + s.id.name;
  if (s.type === 'VariableDeclaration') desc += ' ' + s.declarations.map(d => d.id.name).join(',');
  if (s.type === 'IfStatement') desc += ' if(...)';
  if (s.type === 'ExpressionStatement') desc += ' expr';
  console.log(sl + '-' + el + ': ' + desc);
});
