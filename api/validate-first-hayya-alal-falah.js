import http from 'http';
import { parse } from 'url';

export default function handler(req, res) {
  const backendUrl = 'http://172.184.138.18:8000/validate-first-hayya-alal-falah/';
  const { hostname, port, pathname } = parse(backendUrl);

  // Remove host header
  const headers = { ...req.headers };
  delete headers.host;

  const options = {
    hostname,
    port: port || 80,
    path: pathname,
    method: req.method,
    headers,
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  req.pipe(proxyReq, { end: true });

  proxyReq.on('error', (err) => {
    console.error('Proxy error:', err);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Proxy error', details: err.message }));
  });
} 