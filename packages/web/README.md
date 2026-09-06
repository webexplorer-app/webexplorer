# Web Explorer

The browser application for Web Explorer. Files are processed locally and are not uploaded.

## Development

From the repository root:

```sh
npm run dev --workspace packages/web
npm run build --workspace packages/web
npm run e2e --workspace packages/web
```

## Embed API

A third-party page can open Web Explorer in an iframe and send it a file with `postMessage`. Set `embed=1` and bind the viewer to the exact parent origin:

```js
const viewerOrigin = 'https://viewer.example';
const parentOrigin = window.location.origin;
const iframe = document.createElement('iframe');

window.addEventListener('message', event => {
  if (event.source !== iframe.contentWindow || event.origin !== viewerOrigin) return;

  if (event.data?.protocol === 'webexplorer' && event.data?.type === 'ready') {
    const bytes = new TextEncoder().encode('{"hello":"world"}');
    iframe.contentWindow.postMessage({
      protocol: 'webexplorer',
      version: 1,
      type: 'open-file',
      requestId: crypto.randomUUID(),
      data: bytes.buffer,
      name: 'example.json',
      mimeType: 'application/json',
    }, viewerOrigin, [bytes.buffer]);
  }
});

const query = new URLSearchParams({
  embed: '1',
  parentOrigin,
  lang: 'en-US',
  theme: 'system',
  accent: '#0066cc',
});
iframe.src = `${viewerOrigin}/?${query}`;
document.body.append(iframe);
```

Install the message listener before appending the iframe so the immediate `ready` message is not missed. Always use exact origins for both the query parameter and `postMessage` target; do not use `*`.

### Appearance

The iframe URL supports these optional presentation parameters:

- `lang`: `en-US`, `zh-CN`, `ja-JP`, `ko-KR`, `es-ES`, `fr-FR`, or `de-DE`.
- `theme`: `light`, `dark`, or `system`. The default is `system`.
- `accent`: the basic brand and loading-indicator color.

The accent must be a six-digit hex value. `URLSearchParams` handles encoding the leading `#`; when writing a URL manually, encode it as `%23`.

The `ready` message includes a `capabilities` object listing supported languages and themes. Set the iframe's dimensions and border in the host page:

```css
.webexplorer-frame {
  width: 100%;
  min-height: 40rem;
  border: 0;
}
```

For a larger custom palette, send a `configure` message after receiving `ready`:

```js
iframe.contentWindow.postMessage({
  protocol: 'webexplorer',
  version: 1,
  type: 'configure',
  requestId: 'styles-1',
  styles: {
    background: '#101820',
    backgroundAlt: '#17232d',
    surface: '#20313f',
    surfaceHover: '#294252',
    border: '#486477',
    borderStrong: '#6b899e',
    text: '#f2f6f8',
    textSecondary: '#b8c6ce',
    codeBackground: '#0b1217',
    codeText: '#d8e2e8',
  },
}, viewerOrigin);
```

The supported style names are `accent`, `background`, `backgroundAlt`, `surface`, `surfaceHover`, `border`, `borderStrong`, `text`, `textSecondary`, `codeBackground`, and `codeText`. Every value must be a six-digit hex color. The viewer replies with `configure-result` using the same `requestId` and `ok: true` or `false`.

The `ready.capabilities.styles` array provides the current allowlist. Arbitrary CSS and variable names are rejected. The host is responsible for choosing accessible text/background and focus/background contrast.

### Open a File

Send an `open-file` request containing exactly one of:

- `file`: a structured-cloned `File` object.
- `data`: an `ArrayBuffer` or `Uint8Array`, with `name` and optional `mimeType` and `lastModified` fields.

```js
iframe.contentWindow.postMessage({
  protocol: 'webexplorer',
  version: 1,
  type: 'open-file',
  requestId: 'request-1',
  file,
}, viewerOrigin);
```

Files are limited to 200 MB. Names are reduced to their basename, and MIME types are validated before the viewer opens the file.

### Responses

The viewer sends a readiness message:

```js
{ protocol: 'webexplorer', version: 1, type: 'ready' }
```

Each accepted request receives an `open-file-result` with the same `requestId`:

```js
{
  protocol: 'webexplorer',
  version: 1,
  type: 'open-file-result',
  requestId: 'request-1',
  ok: true,
  file: { name: 'example.json', size: 17, type: 'application/json' },
}
```

Invalid requests return `ok: false` and an error with one of these codes: `invalid-request`, `invalid-file`, or `file-too-large`. Messages from any window other than the direct parent, or from an origin other than `parentOrigin`, are ignored.
