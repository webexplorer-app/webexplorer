import { createServer } from 'node:http';

const port = 5174;
const html = '<!doctype html><html><head><meta charset="utf-8"></head><body></body></html>';

createServer((_request, response) => {
  response.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Length': Buffer.byteLength(html),
  });
  response.end(html);
}).listen(port, () => {
  console.log(`Embed host listening on http://localhost:${port}`);
});