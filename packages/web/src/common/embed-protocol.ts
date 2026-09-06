import {
  EMBED_STYLE_PARAMETERS,
  isHexColor,
  type EmbedStyleParameter,
  type EmbedStyles,
} from './theme';

export const EMBED_PROTOCOL = 'webexplorer';
export const EMBED_PROTOCOL_VERSION = 1;
export const MAX_EMBED_FILE_SIZE = 200 * 1024 * 1024;

export type EmbedErrorCode = 'invalid-request' | 'invalid-file' | 'file-too-large';

export class EmbedRequestError extends Error {
  constructor(public readonly code: EmbedErrorCode, message: string) {
    super(message);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function validateName(value: unknown): string {
  if (typeof value !== 'string') throw new EmbedRequestError('invalid-file', 'A file name is required');
  const name = value.trim().split(/[\\/]/).pop() || '';
  if (!name || name.length > 255 || /[\u0000-\u001f\u007f]/.test(name)) {
    throw new EmbedRequestError('invalid-file', 'The file name is invalid');
  }
  return name;
}

function validateMimeType(value: unknown): string {
  if (value === undefined || value === '') return '';
  if (typeof value !== 'string' || value.length > 127 || !/^[\w!#$&^_.+-]+\/[\w!#$&^_.+-]+$/.test(value)) {
    throw new EmbedRequestError('invalid-file', 'The MIME type is invalid');
  }
  return value;
}

function validateSize(size: number) {
  if (size > MAX_EMBED_FILE_SIZE) {
    throw new EmbedRequestError('file-too-large', `Files larger than ${MAX_EMBED_FILE_SIZE / 1024 / 1024} MB are not supported`);
  }
}

function validateEnvelope(value: unknown, type: string): asserts value is Record<string, unknown> & { requestId: string } {
  if (!isRecord(value) || value.protocol !== EMBED_PROTOCOL || value.version !== EMBED_PROTOCOL_VERSION || value.type !== type) {
    throw new EmbedRequestError('invalid-request', 'Unsupported message');
  }
  if (typeof value.requestId !== 'string' || value.requestId.length < 1 || value.requestId.length > 100) {
    throw new EmbedRequestError('invalid-request', 'A valid requestId is required');
  }
}

export function parseEmbedOpenFileRequest(value: unknown): { requestId: string; file: File } {
  validateEnvelope(value, 'open-file');

  const suppliedFile = value.file;
  const suppliedData = value.data;
  const hasFile = suppliedFile instanceof File;
  const hasData = suppliedData instanceof ArrayBuffer
    || (suppliedData instanceof Uint8Array && suppliedData.buffer instanceof ArrayBuffer);
  if (hasFile === hasData) {
    throw new EmbedRequestError('invalid-request', 'Provide exactly one of file or data');
  }

  if (suppliedFile instanceof File) {
    validateSize(suppliedFile.size);
    const name = validateName(suppliedFile.name);
    const type = validateMimeType(suppliedFile.type);
    const file = name === suppliedFile.name && type === suppliedFile.type
      ? suppliedFile
      : new File([suppliedFile], name, { type, lastModified: suppliedFile.lastModified });
    return { requestId: value.requestId, file };
  }

  if (!(suppliedData instanceof ArrayBuffer) && !(suppliedData instanceof Uint8Array && suppliedData.buffer instanceof ArrayBuffer)) {
    throw new EmbedRequestError('invalid-file', 'The file data is invalid');
  }
  let data: ArrayBuffer;
  if (suppliedData instanceof ArrayBuffer) {
    data = suppliedData;
  } else {
    data = new ArrayBuffer(suppliedData.byteLength);
    new Uint8Array(data).set(suppliedData);
  }
  validateSize(data.byteLength);
  const name = validateName(value.name);
  const type = validateMimeType(value.mimeType);
  const lastModified = typeof value.lastModified === 'number' && Number.isFinite(value.lastModified)
    ? value.lastModified
    : Date.now();
  return { requestId: value.requestId, file: new File([data], name, { type, lastModified }) };
}

export function parseEmbedConfigureRequest(value: unknown): { requestId: string; styles: EmbedStyles } {
  validateEnvelope(value, 'configure');
  if (!isRecord(value.styles)) {
    throw new EmbedRequestError('invalid-request', 'A styles object is required');
  }

  const styles: EmbedStyles = {};
  for (const [name, color] of Object.entries(value.styles)) {
    if (!EMBED_STYLE_PARAMETERS.includes(name as EmbedStyleParameter)) {
      throw new EmbedRequestError('invalid-request', `Unsupported style: ${name}`);
    }
    if (!isHexColor(color)) {
      throw new EmbedRequestError('invalid-request', `Style ${name} must be a six-digit hex color`);
    }
    styles[name as EmbedStyleParameter] = color;
  }
  return { requestId: value.requestId, styles };
}

export function messageTypeFromMessage(value: unknown): string {
  if (!isRecord(value) || typeof value.type !== 'string') return '';
  return value.type;
}

export function requestIdFromMessage(value: unknown): string {
  if (!isRecord(value) || typeof value.requestId !== 'string') return '';
  return value.requestId.slice(0, 100);
}