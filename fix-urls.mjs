import fs from 'fs';
import path from 'path';

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const frontendSrc = path.join(process.cwd(), 'frontend', 'src');

walkDir(frontendSrc, (filePath) => {
  if (filePath.endsWith('.jsx') || filePath.endsWith('.js')) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace string literals like 'http://localhost:3001...' with template literals or use dynamic vars
    // It's safer to just define a global variable or replace the hardcoded string
    let newContent = content.replace(/['"]http:\/\/localhost:3001([^'"]*)['"]/g, "`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}$1`");
    
    // If there were already template literals like `http://localhost:3001/api/...`
    newContent = newContent.replace(/`http:\/\/localhost:3001([^`]*)`/g, "`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}$1`");

    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`Updated ${filePath}`);
    }
  }
});

console.log('Frontend URL fix complete.');
