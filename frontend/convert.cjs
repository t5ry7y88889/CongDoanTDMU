const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../public');
const pagesDir = path.join(__dirname, 'src/pages');

const pagesToConvert = [
  'gioi-thieu.html',
  'co-cau-to-chuc.html',
  'tin-tuc.html',
  'phuc-loi-doan-vien.html',
  'van-ban.html',
  'bieu-mau.html',
  'lien-he.html',
  'bai-viet.html'
];

function extractMainContentAndScripts(html) {
  let content = html;
  
  // Extract all inline script contents (without src)
  const scriptRegex = /<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi;
  let inlineScripts = [];
  let match;
  while ((match = scriptRegex.exec(content)) !== null) {
    const code = match[1].trim();
    if (code && !code.includes('serviceWorker')) {
      inlineScripts.push(code);
    }
  }

  const navMatch = content.match(/<nav[\s\S]*?<\/nav>/);
  const bodyEndMatch = content.match(/<\/body>/);
  
  if (navMatch && bodyEndMatch) {
    const startIdx = navMatch.index + navMatch[0].length;
    const endIdx = bodyEndMatch.index;
    content = content.substring(startIdx, endIdx);
  }
  
  // Remove footer block
  content = content.replace(/<footer[\s\S]*?<\/footer>/i, '');
  // Remove all script tags from HTML body
  content = content.replace(/<script[\s\S]*?<\/script>/gi, '');
  content = content.trim();
  
  return {
    content,
    script: inlineScripts.join('\n;\n')
  };
}

pagesToConvert.forEach(file => {
  const filePath = path.join(publicDir, file);
  if (fs.existsSync(filePath)) {
    const rawHtml = fs.readFileSync(filePath, 'utf8');
    const { content: mainHtml, script: inlineScript } = extractMainContentAndScripts(rawHtml);
    
    // Escape backticks and $ for template literal
    const escapedHtml = mainHtml.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
    const escapedScript = inlineScript.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
    
    const componentName = file
      .replace('.html', '')
      .split('-')
      .map(p => p.charAt(0).toUpperCase() + p.slice(1))
      .join('');
    
    const code = `import React, { useEffect } from 'react';

const ${componentName} = () => {
  const htmlContent = \`${escapedHtml}\`;
  const pageScript = \`${escapedScript}\`;

  useEffect(() => {
    if (pageScript) {
      try {
        // Run in global scope so functions attach to window for onclick handlers
        (0, eval)(pageScript);
        // Also trigger DOMContentLoaded logic manually if any
        window.dispatchEvent(new Event('DOMContentLoaded'));
      } catch (err) {
        console.warn('Inline page script notice for ${componentName}:', err);
      }
    }
  }, []);

  return (
    <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
  );
};

export default ${componentName};
`;
    
    fs.writeFileSync(path.join(pagesDir, `${componentName}.jsx`), code);
    console.log(`Converted ${file} -> ${componentName}.jsx with global script hydration`);
  }
});
