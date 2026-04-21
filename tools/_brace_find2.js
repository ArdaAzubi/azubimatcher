const fs = require('fs');
const src = fs.readFileSync('script.js', 'utf8');
const lines = src.split('\n');

let depth = 0;
let i = 0;
let line = 1;
let inStr = false, strChar = '';
let depthAtFunc = null;

while (i < src.length) {
  const ch = src[i];

  if (ch === '\n') { line++; i++; continue; }

  if (inStr) {
    if (ch === '\\') { i += 2; continue; }
    if (ch === strChar) { inStr = false; }
    i++; continue;
  }

  // Single-line comment
  if (ch === '/' && src[i+1] === '/') {
    while (i < src.length && src[i] !== '\n') i++;
    continue;
  }

  // Block comment
  if (ch === '/' && src[i+1] === '*') {
    i += 2;
    while (i < src.length - 1 && !(src[i] === '*' && src[i+1] === '/')) {
      if (src[i] === '\n') line++;
      i++;
    }
    i += 2; continue;
  }

  // Strings
  if (ch === "'" || ch === '"') {
    inStr = true; strChar = ch; i++; continue;
  }

  // Template literal (simple: ignore nested ${})
  if (ch === '`') {
    i++;
    while (i < src.length && src[i] !== '`') {
      if (src[i] === '\n') line++;
      if (src[i] === '\\') { i += 2; continue; }
      i++;
    }
    i++; continue;
  }

  if (ch === '{') {
    depth++;
    if (line === 15452 && depthAtFunc === null) {
      depthAtFunc = depth - 1; // depth before the function's {
      console.log('initFirmProfilePage opens at depth', depthAtFunc, '-> function body depth:', depth);
    }
    i++; continue;
  }
  if (ch === '}') {
    depth--;
    if (line >= 15452 && depthAtFunc !== null && depth === depthAtFunc) {
      console.log('CLOSE at line', line, ':', lines[line-1].trim().slice(0, 80));
    }
    i++; continue;
  }
  i++;
}
console.log('Final depth:', depth);
