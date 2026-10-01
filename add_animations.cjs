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
  if (!content.includes('css/animations.css')) {
    content = content.replace('</head>', '  <link rel="stylesheet" href="css/animations.css">\n</head>');
    fs.writeFileSync(file, content, 'utf8');
    console.log('Injected animations.css to', file);
  }
});
