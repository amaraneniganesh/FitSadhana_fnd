const fs = require('fs');
const path = require('path');

const replaceInFile = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Login & Register background
  content = content.replace(/bg-\[#0A0A0A\]/g, 'bg-background');

  // Input texts
  content = content.replace(/text-white focus:outline-none focus:-accent/g, 'text-foreground focus:outline-none focus:border-accent');
  content = content.replace(/text-white focus:outline-none focus:border-purple-500/g, 'text-foreground focus:outline-none focus:border-accent');
  
  // Links
  content = content.replace(/className="text-white font-medium hover:underline"/g, 'className="text-foreground font-medium hover:underline"');

  // Any remaining generic text-white that are obviously text
  content = content.replace(/<p className="text-lg font-bold text-white">/g, '<p className="text-lg font-bold text-foreground">');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed', filePath);
  }
}

replaceInFile('d:/WEB PROJECTS/MERN (OR) REACT PROJECTS/FITSADHANA/frontend/src/pages/Login.jsx');
replaceInFile('d:/WEB PROJECTS/MERN (OR) REACT PROJECTS/FITSADHANA/frontend/src/pages/Register.jsx');
replaceInFile('d:/WEB PROJECTS/MERN (OR) REACT PROJECTS/FITSADHANA/frontend/src/pages/CalendarPage.jsx');
