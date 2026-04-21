// Find where initFirmProfilePage closes using proper state machine
const fs = require('fs');
const src = fs.readFileSync('script.js', 'utf8');
const lines = src.split('\n');

// Find function start line
const funcName = 'function initFirmProfilePage()';
const funcLineNum = src.slice(0, src.indexOf(funcName)).split('\n').length;
console.log('initFirmProfilePage at source line:', funcLineNum);

// Parse from start of function, tracking depth
// Find the character offset of the function
const funcOffset = src.indexOf(funcName);

let depth = 0;
let i = funcOffset;
let line = funcLineNum;
let funcOpenDepth = null;
let funcCloseLines = [];

while (i < src.length) {
  const ch = src[i];
  
  if (ch === '\n') { line++; i++; continue; }
  if (ch === '\r') { i++; continue; }
  
  // Skip single-line comments
  if (ch === '/' && src[i+1] === '/') {
    while (i < src.length && src[i] !== '\n') i++;
    continue;
  }
  
  // Skip multi-line comments
  if (ch === '/' && src[i+1] === '*') {
    i += 2;
    while (i < src.length - 1 && !(src[i] === '*' && src[i+1] === '/')) {
      if (src[i] === '\n') line++;
      i++;
    }
    i += 2;
    continue;
  }
  
  // Skip single-quoted strings
  if (ch === "'") {
    i++;
    while (i < src.length && src[i] !== "'" && src[i] !== '\n') {
      if (src[i] === '\\') i++;
      i++;
    }
    i++;
    continue;
  }
  
  // Skip double-quoted strings
  if (ch === '"') {
    i++;
    while (i < src.length && src[i] !== '"' && src[i] !== '\n') {
      if (src[i] === '\\') i++;
      i++;
    }
    i++;
    continue;
  }
  
  // Skip template literals with nested ${} support
  if (ch === '`') {
    i++;
    let tplDepth = 0;
    while (i < src.length) {
      if (src[i] === '\n') line++;
      if (src[i] === '\r') { i++; continue; }
      if (src[i] === '\\') { i += 2; continue; }
      if (src[i] === '$' && src[i+1] === '{') { tplDepth++; i += 2; continue; }
      if (src[i] === '{' && tplDepth > 0) { tplDepth++; i++; continue; }
      if (src[i] === '}' && tplDepth > 0) { tplDepth--; i++; continue; }
      if (src[i] === '`' && tplDepth === 0) { i++; break; }
      i++;
    }
    continue;
  }
  
  if (ch === '{') {
    depth++;
    if (funcOpenDepth === null) {
      funcOpenDepth = depth;
      console.log('Function opens at line', line, 'depth', depth);
    }
    i++;
    continue;
  }
  
  if (ch === '}') {
    if (funcOpenDepth !== null && depth === funcOpenDepth) {
      funcCloseLines.push(line);
      if (funcCloseLines.length <= 3) {
        console.log('Function closes at line', line, '(depth', depth, '->', depth-1, ')');
        console.log('  Line content:', lines[line-1].trim().slice(0, 80));
      }
      if (funcCloseLines.length === 1) {
        console.log('  --> This is the FIRST (and should be only) close');
      }
    }
    depth--;
    i++;
    
    if (line > 16650) break; // Stop after area of interest
    continue;
  }
  
  i++;
}

console.log('Total times function closed:', funcCloseLines.length);
console.log('Final depth after scan:', depth);
