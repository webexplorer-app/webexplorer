declare module "webtorrent/dist/webtorrent.min" {
  import WebTorrent from "webtorrent";

  export = WebTorrent;
}

declare module "*.wasm" {
  const url: string;

  export = url;
}

declare module 'mime' {
  export const define: (arg: any) => void;
  export const getType: (ext: string) => string;
}
