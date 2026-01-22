/// <reference types="vite/client" />

declare module '*.ftl?raw' {
  const content: string;
  export default content;
}

declare module 'webtorrent/dist/webtorrent.min' {
  export * from 'webtorrent';
  export { default } from 'webtorrent';
}

declare module 'csv-parse/browser/esm' {
  export { parse } from 'csv-parse';
}
