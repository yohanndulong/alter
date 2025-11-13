const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Serve static files from current directory
app.use(express.static(path.join(__dirname)));

// Serve CSS files with correct MIME type
app.use('/css', express.static(path.join(__dirname, 'css'), {
  setHeaders: (res, filepath) => {
    if (filepath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
  }
}));

// Serve images
app.use('/images', express.static(path.join(__dirname, 'images')));

// Fallback to index.html for SPA-like behavior (optional)
app.get('*', (req, res) => {
  // Si c'est un fichier HTML existant, le servir
  if (req.path.endsWith('.html')) {
    res.sendFile(path.join(__dirname, req.path));
  } else if (req.path === '/' || !req.path.includes('.')) {
    // Sinon, servir index.html pour les routes sans extension
    res.sendFile(path.join(__dirname, 'index.html'));
  } else {
    // Pour tout autre fichier, renvoyer 404
    res.status(404).send('Not found');
  }
});

app.listen(PORT, () => {
  console.log(`🌐 Alter Website is running on http://localhost:${PORT}`);
  console.log(`📁 Serving static files from: ${__dirname}`);
});
