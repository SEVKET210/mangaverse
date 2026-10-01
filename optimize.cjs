const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    try {
      filelist = walkSync(dirFile, filelist);
    } catch (err) {
      if (err.code === 'ENOTDIR' || err.code === 'EBADF') filelist.push(dirFile);
    }
  });
  return filelist;
};

const files = walkSync(path.join(__dirname, 'frontend'))
  .filter(f => f.endsWith('.js') || f.endsWith('.html'));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  
  // Basic regex to find img tags
  const imgRegex = /<img\s+([^>]+)>/g;
  content = content.replace(imgRegex, (match, attrs) => {
    let newAttrs = attrs;
    if (!newAttrs.includes('loading=')) {
      newAttrs += ' loading="lazy"';
    }
    if (!newAttrs.includes('decoding=')) {
      newAttrs += ' decoding="async"';
    }
    if (newAttrs !== attrs) changed = true;
    return `<img ${newAttrs.trim()}>`;
  });

  // Change fetch('/api/ to fetch('/api/v1/
  if (content.includes("fetch('/api/")) {
    content = content.replace(/fetch\('\/api\//g, "fetch('/api/v1/");
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Optimized:', file);
  }
});
