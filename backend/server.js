const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from Vite build output (dist)
app.use(express.static(path.resolve(__dirname, '../dist')));

// API proxy – forward all /api requests to the Python backend (Render URL will replace placeholder later)
app.use('/api', createProxyMiddleware({
  target: process.env.PYTHON_BACKEND_URL || 'http://localhost:8000',
  changeOrigin: true,
  secure: false,
}));

// All other routes should serve index.html (SPA handling)
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Express server listening on port ${PORT}`);
});
