const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else {
      filelist.push(dirFile);
    }
  });
  return filelist;
};

const htmlFiles = walkSync(path.join(__dirname, 'frontend'))
  .filter(f => f.endsWith('.html'));

htmlFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  if (!content.includes('manifest.json')) {
    content = content.replace('</head>', '  <link rel="manifest" href="manifest.json">\n</head>');
    changed = true;
  }
  // Inject theme-color meta tag if not exists
  if (!content.includes('name="theme-color"')) {
    content = content.replace('</head>', '  <meta name="theme-color" content="#8b5cf6">\n</head>');
    changed = true;
  }
  
  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Injected PWA tags to', file);
  }
});
