import { readFileSync } from 'fs';

const enText = readFileSync('src/i18n/locales/en.ts', 'utf8');
const thText = readFileSync('src/i18n/locales/th.ts', 'utf8');

// Normalize both files: expand inline objects to multi-line
function expandInline(text) {
  // Expand things like: key: { a: 'v', b: 'v2' } to multiline format
  // This handles single-line objects
  return text.replace(/(\w+): \{([^{}]+)\}/g, (match, key, content) => {
    const inner = content.trim();
    const expanded = inner.split(',').map(pair => `  ${pair.trim()}`).join(',\n');
    return `${key}: {\n${expanded}\n}`;
  });
}

// Extract all leaf key paths with full path
function extractAllKeys(text) {
  const expanded = expandInline(text);
  const paths = new Set();
  const sectionStack = [];
  
  const lines = expanded.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const indent = line.match(/^(\s*)/)[1].length;
    
    // Opening brace with key
    const sectionMatch = line.match(/^\s+([a-zA-Z_][a-zA-Z0-9_]*): \{/);
    if (sectionMatch) {
      const key = sectionMatch[1];
      while (sectionStack.length > 0 && sectionStack[sectionStack.length - 1].indent >= indent) {
        sectionStack.pop();
      }
      sectionStack.push({ indent, key });
      continue;
    }
    
    // Closing brace
    if (line.match(/^\s*\},?$/)) {
      while (sectionStack.length > 0 && sectionStack[sectionStack.length - 1].indent >= indent) {
        sectionStack.pop();
      }
      continue;
    }
    
    // Leaf key
    const leafMatch = line.match(/^\s+([a-zA-Z_][a-zA-Z0-9_]*): ['`"]/);
    if (leafMatch) {
      const leafKey = leafMatch[1];
      const prefix = sectionStack.map(s => s.key).join('.');
      paths.add(prefix ? `${prefix}.${leafKey}` : leafKey);
    }
  }
  
  return paths;
}

const enPaths = extractAllKeys(enText);
const thPaths = extractAllKeys(thText);

console.log('EN total paths:', enPaths.size);
console.log('TH total paths:', thPaths.size);

const missing = [];
for (const path of enPaths) {
  if (!thPaths.has(path)) {
    missing.push(path);
  }
}

if (missing.length === 0) {
  console.log('\n✅ All EN keys exist in TH!');
} else {
  console.log('\nPaths in EN but missing in TH:');
  for (const p of missing.sort()) {
    console.log(' ', p);
  }
  console.log('\nTotal missing:', missing.length);
}

// Also check th keys not in en (extra keys)
const extra = [];
for (const path of thPaths) {
  if (!enPaths.has(path)) {
    extra.push(path);
  }
}
if (extra.length > 0) {
  console.log('\nPaths in TH but not in EN (extra):');
  for (const p of extra.sort()) {
    console.log(' ', p);
  }
}
