const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
}

const replaceRules = [
  // Typography
  { match: /\btext-gray-[3456]00\b/g, replace: 'text-text-secondary' },
  { match: /\btext-gray-700\b/g, replace: 'text-text-secondary' },
  { match: /\bbg-white\/([0-9]+)\b/g, replace: 'bg-foreground/$1' },
  { match: /\bborder-white\/([0-9]+)\b/g, replace: 'border-border' }, // border-white/x -> border-border is safer
  { match: /\bborder-gray-[789]00\b/g, replace: 'border-border' },
  { match: /\bbg-\[#0A0A0A\]\b/g, replace: 'bg-background' },
  { match: /\bbg-\[#111111\]\b/g, replace: 'bg-secondary' },
  { match: /\bbg-\[#111\]\b/g, replace: 'bg-secondary' },
  { match: /\bbg-\[#121212\]\b/g, replace: 'bg-background' },
  { match: /\bbg-black(\/[0-9]+)?\b/g, replace: 'bg-background$1' },
  // text-white is tricky. If it's on a background that switches, it should be text-foreground.
  // We'll cautiously replace `text-white` with `text-foreground`, BUT many buttons need to stay white text if they have colorful backgrounds (like bg-accent, bg-red-500, bg-green-500).
  // Actually, it's safer to just replace `text-white` with `text-foreground` when it's on the root container, and let buttons handle themselves. 
];

// Targeted replacements for text-white on known background components
const targetedWhiteReplace = (content) => {
  // Replace text-white on generic layout containers, not on buttons or colorful backgrounds.
  // "text-white" in `min-h-screen`, `glass-strong`, `bg-background`
  content = content.replace(/bg-background\s+text-white/g, 'bg-background text-foreground');
  content = content.replace(/hover:text-white/g, 'hover:text-foreground');
  return content;
};

walk('d:/WEB PROJECTS/MERN (OR) REACT PROJECTS/FITSADHANA/frontend/src', (filePath) => {
  if (filePath.endsWith('.jsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    replaceRules.forEach(rule => {
      content = content.replace(rule.match, rule.replace);
    });
    
    content = targetedWhiteReplace(content);

    // Some specific cases: CalendarPage's text-white on day numbers
    content = content.replace(/text-white/g, (match, offset, string) => {
        // If it's inside a bg-accent, bg-green, bg-red, keep text-white
        // We'll leave this to manual review if needed, but for now we'll do targeted replacements
        return match;
    });

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Updated', filePath);
    }
  }
});
