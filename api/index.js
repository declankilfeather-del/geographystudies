const { createProxyMiddleware } = require('http-proxy-middleware');
const express = require('express');
const app = express();

app.use('/proxy/:hostname', (req, res, next) => {
  const targetHost = req.params.hostname;
  
  const proxy = createProxyMiddleware({
    target: `https://${targetHost}`,
    changeOrigin: true,
    followRedirects: true, // Follows redirects so it doesn't get stuck
    autoRewrite: true,     // Rewrites links inside the site
    pathRewrite: (path) => path.replace(`/proxy/${targetHost}`, ''),
    onProxyReq: (proxyReq) => {
      // Makes the proxy look like a real browser (User-Agent Spoofing)
      proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      proxyReq.setHeader('Referer', `https://${targetHost}/`);
      proxyReq.setHeader('Origin', `https://${targetHost}`);
    },
    onProxyRes: (proxyRes) => {
      // Strips the "Do Not Load In Iframe" blocks
      delete proxyRes.headers['x-frame-options'];
      delete proxyRes.headers['content-security-policy'];
      delete proxyRes.headers['content-security-policy-report-only'];
      
      // Forces the browser to ignore "No-Iframe" signals
      proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    },
    onError: (err, req, res) => {
      res.status(500).send('BlackCosmos Tunnel Error: Target site ' + targetHost + ' is blocking the connection.');
    }
  });

  return proxy(req, res, next);
});

module.exports = app;
