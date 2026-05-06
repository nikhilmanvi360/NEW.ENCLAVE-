import fs from 'fs';
import path from 'path';

const filePath = 'c:\\Users\\Nikhil\\Downloads\\multi-agent-truth-engine\\server.ts';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Remove the top block
const topBlockRegex = /if \(false && isProduction\) \{[\s\S]*?\} else \{/;
content = content.replace(topBlockRegex, '');

// 2. Remove the matching closing brace for the else block (which is now dangling)
// The vite block is followed by a } at line 798
const danglingBraceRegex = /app\.use\(vite\.middlewares\);\s*\}/;
content = content.replace(danglingBraceRegex, 'app.use(vite.middlewares);');

// 3. Add the production block at the end
const listenRegex = /app\.listen\(port, \(\) => \{[\s\S]*?\n\}\);/;
const replacement = `// Production Static Serving
if (isProduction) {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(port, () => {
  console.log(\`LUMINA Server running on port \${port} (mode: \${isProduction ? 'PROD' : 'DEV'})\`);
});`;

content = content.replace(listenRegex, replacement);

fs.writeFileSync(filePath, content);
console.log('Server.ts updated successfully.');
