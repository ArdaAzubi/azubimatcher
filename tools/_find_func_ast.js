// Use node's built-in parsing to find initFirmProfilePage end
const fs = require('fs');
const src = fs.readFileSync('script.js', 'utf8');

// Get only lines 1-16603 (valid portion)
const lines = src.split('\n');
const validSrc = lines.slice(0, 16603).join('\n');

try {
  const vm = require('vm');
  // We can't easily get AST from vm, let's use a different approach
  // Parse using Function constructor which has better error handling
  
  // Instead, let's use a binary search approach to find where the function closes
  // We know lines 1-16603 are valid
  // Binary search for when initFirmProfilePage's body ends
  
  // Strategy: find the line after which the code at lines 16547-16603 is NOT part of the function
  // by checking if removing initFirmProfilePage's body at different points is still valid
  
  // Find all lines from 16000-16545 that have exactly 0-indent }
  let depth = 0;
  let inStr = false;
  let strCh = '';
  let lineNum = 1;
  let funcDepth = null;
  let i = 0;
  
  while (i < validSrc.length) {
    const ch = validSrc[i];
    
    if (ch === '\n') { lineNum++; i++; continue; }
    
    if (inStr) {
      if (ch === '\\') { i += 2; continue; }
      if (ch === strCh) inStr = false;
      i++; continue;
    }
    
    // Skip comments
    if (ch === '/' && validSrc[i+1] === '/') {
      while (i < validSrc.length && validSrc[i] !== '\n') i++;
      continue;
    }
    if (ch === '/' && validSrc[i+1] === '*') {
      i += 2;
      while (i < validSrc.length - 1 && !(validSrc[i] === '*' && validSrc[i+1] === '/')) {
        if (validSrc[i] === '\n') lineNum++;
        i++;
      }
      i += 2; continue;
    }
    
    // Strings
    if (ch === "'" || ch === '"') { inStr = true; strCh = ch; i++; continue; }
    
    // Template literals - handle properly including ${} nesting
    if (ch === '`') {
      i++;
      let tplStack = 1; // count of open `
      while (i < validSrc.length) {
        const tc = validSrc[i];
        if (tc === '\n') { lineNum++; i++; continue; }
        if (tc === '\\') { i += 2; continue; }
        if (tc === '`') {
          tplStack--;
          i++;
          if (tplStack === 0) break;
          continue;
        }
        if (tc === '$' && validSrc[i+1] === '{') {
          // Enter ${} expression - track braces
          i += 2;
          let exprDepth = 1;
          while (i < validSrc.length && exprDepth > 0) {
            const ec = validSrc[i];
            if (ec === '\n') { lineNum++; i++; continue; }
            if (ec === '\\') { i += 2; continue; }
            if (ec === '{') { exprDepth++; depth++; i++; continue; }
            if (ec === '}') { exprDepth--; depth--; i++; continue; }
            if (ec === '`') {
              // Nested template literal
              tplStack++;
              i++;
              continue;
            }
            i++;
          }
          continue;
        }
        i++;
      }
      continue;
    }
    
    if (ch === '{') {
      depth++;
      if (lineNum === 15452 && funcDepth === null) {
        funcDepth = depth - 1;
        // console.log('initFirmProfilePage opens at depth ' + funcDepth + ', body at ' + depth);
      }
      i++; continue;
    }
    
    if (ch === '}') {
      depth--;
      if (funcDepth !== null && depth === funcDepth && lineNum >= 15452) {
        console.log('initFirmProfilePage closes at line ' + lineNum + ': ' + lines[lineNum-1].trim().slice(0, 80));
      }
      i++; continue;
    }
    
    i++;
  }
  
  console.log('Final depth of valid portion (1-16603):', depth);
  
} catch(e) {
  console.error(e.message);
}
