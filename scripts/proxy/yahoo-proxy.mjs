import http from 'http';
import https from 'https';
import { URL } from 'url';

const TARGETS = {
  yahoo: 'https://query1.finance.yahoo.com',
  stooq: 'https://stooq.pl',
};

const DEFAULT_TARGET = 'yahoo';
const PORT = Number(process.env.YAHOO_PROXY_PORT || 8787);

const addCorsHeaders = (headers = {}) => ({
  ...headers,
  'access-control-allow-origin': '*',
  'access-control-allow-headers': headers['access-control-allow-headers'] || '*',
  'access-control-allow-methods': headers['access-control-allow-methods'] || 'GET,POST,OPTIONS',
});

const resolveTarget = (incomingUrl) => {
  const parsed = new URL(incomingUrl, 'http://proxy.local');
  const pathParts = parsed.pathname.split('/').filter(Boolean);
  const hasTrailingSlash = parsed.pathname.endsWith('/');
  const targetKey = TARGETS[pathParts[0]] ? pathParts.shift() : DEFAULT_TARGET;
  const targetBase = TARGETS[targetKey] || TARGETS[DEFAULT_TARGET];
  const targetPath = '/' + pathParts.join('/') + (hasTrailingSlash ? '/' : '');
  const targetUrl = new URL(targetPath + parsed.search, targetBase);

  return {
    targetUrl,
    targetHost: new URL(targetBase).host,
  };
};

const server = http.createServer((req, res) => {
  if (!req.url) {
    res.writeHead(400, addCorsHeaders());
    res.end('Missing url');
    return;
  }

  if (req.method === 'OPTIONS') {
    res.writeHead(204, addCorsHeaders());
    res.end();
    return;
  }

  let target;
  try {
    target = resolveTarget(req.url);
  } catch (error) {
    res.writeHead(400, addCorsHeaders());
    res.end(`Invalid URL: ${error.message}`);
    return;
  }

  const headers = { ...req.headers };
  delete headers.host;
  delete headers.origin;
  delete headers.referer;

  const proxyReq = https.request(target.targetUrl, {
    method: req.method,
    headers: {
      ...headers,
      'accept-encoding': 'identity',
      host: target.targetHost,
      'user-agent': headers['user-agent'] || 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
    },
  }, (proxyRes) => {
    const responseHeaders = addCorsHeaders(proxyRes.headers);
    res.writeHead(proxyRes.statusCode || 500, responseHeaders);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (error) => {
    res.writeHead(502, addCorsHeaders());
    res.end(`Proxy error: ${error.message}`);
  });

  req.pipe(proxyReq, { end: true });
});

server.listen(PORT, () => {
  console.log(`Proxy running on http://localhost:${PORT}`);
  console.log(`Targets: /yahoo -> ${TARGETS.yahoo}, /stooq -> ${TARGETS.stooq}`);
});
