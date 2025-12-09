export * from './buffer';
export * from './stream';

export function bytesToUTF8(bytes: Uint8Array | number[]) {
  if (Array.isArray(bytes)) {
    return new TextDecoder("utf-8").decode(new Uint8Array(bytes));
  } else {
    return new TextDecoder("utf-8").decode(bytes);
  }
}

export function bytesToUTF16LE(bytes: Uint8Array | number[]) {
  if (Array.isArray(bytes)) {
    return new TextDecoder("utf-16le").decode(new Uint8Array(bytes));
  } else {
    return new TextDecoder("utf-16le").decode(bytes);
  }
}

export function isUTF16LE(str: string): boolean {
  return str.endsWith("001F");
}
