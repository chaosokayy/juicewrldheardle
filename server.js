
const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const path = require('path');

const PORT = 5000;

const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);

  if (parsedUrl.pathname === '/api/random') {

    const apiUrl = 'https://juicewrldapi.com/juicewrld/radio/random/';

    https.get(apiUrl, (apiRes) => {
      let data = '';

      apiRes.on('data', (chunk) => {
        data += chunk;
      });

      apiRes.on('end', () => {
        res.writeHead(apiRes.statusCode, { 'Content-Type': 'application/json' });
        res.end(data);
      });
    }).on('error', (err) => {
      console.error('Error fetching from API:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to fetch from API' }));
    });
  } else if (parsedUrl.pathname.startsWith('/api/audio/')) {

    const audioPath = parsedUrl.pathname.replace('/api/audio/', '');
    const audioUrl = `https://juicewrldapi.com/juicewrld/file/${audioPath}`;

    https.get(audioUrl, (apiRes) => {
      const headers = {
        'Content-Type': apiRes.headers['content-type'] || 'audio/mpeg'
      };
      
      if (apiRes.headers['content-length']) {
        headers['Content-Length'] = apiRes.headers['content-length'];
      }
      
      res.writeHead(apiRes.statusCode, headers);
      apiRes.pipe(res);
    }).on('error', (err) => {
      console.error('Error fetching audio:', err);
      res.writeHead(500);
      res.end('Failed to fetch audio');
    });
  } else {

    let filePath = '.' + parsedUrl.pathname;
    if (filePath === './') {
      filePath = './index.html';
    }

    const extname = path.extname(filePath);
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
      if (err) {
        if (err.code === 'ENOENT') {
          res.writeHead(404);
          res.end('File not found');
        } else {
          res.writeHead(500);
          res.end('Server error: ' + err.code);
        }
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content, 'utf-8');
      }
    });
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Proxying requests to juicewrldapi.com to bypass CORS`);
});
