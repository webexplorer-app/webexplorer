/**
 * Multipart Document Streaming Protocol
 *
 * A multipart/form-data style protocol for granular document transport.
 * Each part is independent and self-contained with its full position path.
 * Uses vendor MIME types with versioning for forward compatibility.
 *
 * Vendor MIME Types:
 * ==================
 * - application/vnd.webexplorer.document.v1+json      - Document header
 * - application/vnd.webexplorer.page.v1+json          - Page part
 * - application/vnd.webexplorer.section.v1+json       - Section part
 * - application/vnd.webexplorer.row.v1+json           - Row part
 * - application/vnd.webexplorer.column.v1+json        - Column part
 * - application/vnd.webexplorer.cell.v1+json          - Cell with inline content
 * - application/vnd.webexplorer.cell-content.v1       - Cell content (for large data)
 *
 * Content-Disposition:
 * ====================
 * Uses standard Content-Disposition header with extended parameters:
 * - name: Part type (document, page, section, row, column, cell)
 * - id: Unique identifier for the element
 * - position: Full position path (pageIndex.sectionIndex.rowIndex.columnIndex.cellIndex)
 * - title: Optional human-readable title
 *
 * Format:
 * =======
 * Each part has a header section and body, separated by blank line:
 *
 * --{boundary}
 * Content-Type: application/vnd.webexplorer.cell.v1+json
 * Content-Disposition: form-data; name="cell"; id="cell1"; position="0.1.2.3.0"
 * Content-Length: 123
 *
 * {"content":{"mimeType":"text/plain","data":"Hello"}}
 * --{boundary}
 *
 * Parts can arrive in any order and be assembled into a document.
 *
 * Example:
 * ========
 * --boundary123
 * Content-Type: application/vnd.webexplorer.document.v1+json
 * Content-Disposition: form-data; name="document"; id="doc1"
 *
 * {"mode":"content","metadata":{"title":"My Doc"}}
 * --boundary123
 * Content-Type: application/vnd.webexplorer.page.v1+json
 * Content-Disposition: form-data; name="page"; id="page1"; position="0"; title="Page 1"
 *
 * {}
 * --boundary123
 * Content-Type: application/vnd.webexplorer.cell.v1+json
 * Content-Disposition: form-data; name="cell"; id="cell1"; position="0.0.0.0.0"
 *
 * {"content":{"mimeType":"text/plain","data":"Hello World"}}
 * --boundary123--
 */

import type {
  Document,
  DocumentMode,
  DocumentMetadata,
  DocumentStyle,
  Page,
  PageStyle,
  Section,
  SectionStyle,
  Row,
  RowStyle,
  Column,
  ColumnStyle,
  Cell,
  CellStyle,
  CellContent,
  PreviewInfo,
  ContentDocument,
  StructureDocument,
  ContentPage,
  StructurePage,
  ContentSection,
  StructureSection,
  ContentRow,
  StructureRow,
  ContentColumn,
  StructureColumn,
  ContentCell,
  StructureCell,
} from './schema';

// ============================================================================
// VENDOR MIME TYPES
// ============================================================================

export const PROTOCOL_VERSION = 1;

export const VendorMimeTypes = {
  DOCUMENT: `application/vnd.webexplorer.document.v${PROTOCOL_VERSION}+json`,
  PAGE: `application/vnd.webexplorer.page.v${PROTOCOL_VERSION}+json`,
  SECTION: `application/vnd.webexplorer.section.v${PROTOCOL_VERSION}+json`,
  ROW: `application/vnd.webexplorer.row.v${PROTOCOL_VERSION}+json`,
  COLUMN: `application/vnd.webexplorer.column.v${PROTOCOL_VERSION}+json`,
  CELL: `application/vnd.webexplorer.cell.v${PROTOCOL_VERSION}+json`,
  CELL_CONTENT: `application/vnd.webexplorer.cell-content.v${PROTOCOL_VERSION}`,
} as const;

export type VendorMimeType = (typeof VendorMimeTypes)[keyof typeof VendorMimeTypes];

/**
 * Parse vendor MIME type to extract type and version
 */
export function parseVendorMimeType(mimeType: string): {
  type: string;
  version: number;
  format: string;
} | null {
  const match = mimeType.match(
    /^application\/vnd\.webexplorer\.([a-z-]+)\.v(\d+)(?:\+(\w+))?$/
  );
  if (!match) return null;

  return {
    type: match[1],
    version: parseInt(match[2], 10),
    format: match[3] || 'binary',
  };
}

// ============================================================================
// PART TYPES
// ============================================================================

/**
 * Content-Disposition parameters
 */
export interface ContentDisposition {
  /** Part type: document, page, section, row, column, cell */
  name: string;
  /** Unique identifier for the element */
  id: string;
  /** Position path (e.g., "0.1.2.3.4" for cell at page 0, section 1, row 2, column 3, cell 4) */
  position?: string;
  /** Optional human-readable title */
  title?: string;
  /** Optional filename for content parts */
  filename?: string;
}

/**
 * Headers for a multipart part
 */
export interface PartHeaders {
  'Content-Type': string;
  'Content-Disposition'?: string;
  'Content-Length'?: number;
  'Content-Transfer-Encoding'?: 'base64' | '8bit' | 'binary';
  [key: string]: string | number | undefined;
}

/**
 * A single part in the multipart stream
 */
export interface Part {
  headers: PartHeaders;
  body: string;
}

/**
 * Document part payload
 */
export interface DocumentPartPayload {
  id: string;
  mode: DocumentMode;
  metadata: DocumentMetadata;
  style?: DocumentStyle;
  preview?: PreviewInfo;
}

/**
 * Page part payload
 */
export interface PagePartPayload {
  id: string;
  index: number;
  title?: string;
  style?: PageStyle;
  attributes?: Record<string, unknown>;
  preview?: PreviewInfo;
}

/**
 * Section part payload
 */
export interface SectionPartPayload {
  id: string;
  index: number;
  title?: string;
  style?: SectionStyle;
  attributes?: Record<string, unknown>;
  preview?: PreviewInfo;
}

/**
 * Row part payload
 */
export interface RowPartPayload {
  id: string;
  index: number;
  style?: RowStyle;
  attributes?: Record<string, unknown>;
  preview?: PreviewInfo;
}

/**
 * Column part payload
 */
export interface ColumnPartPayload {
  id: string;
  index: number;
  style?: ColumnStyle;
  attributes?: Record<string, unknown>;
  preview?: PreviewInfo;
}

/**
 * Cell part payload (content mode)
 */
export interface ContentCellPartPayload {
  id: string;
  index: number;
  content?: CellContent;
  style?: CellStyle;
  attributes?: Record<string, unknown>;
}

/**
 * Cell part payload (structure mode)
 */
export interface StructureCellPartPayload {
  id: string;
  index: number;
  preview: PreviewInfo;
  style?: CellStyle;
  attributes?: Record<string, unknown>;
}

export type CellPartPayload = ContentCellPartPayload | StructureCellPartPayload;

// ============================================================================
// CONTENT-DISPOSITION
// ============================================================================

/**
 * Serialize Content-Disposition header value
 */
export function serializeContentDisposition(disposition: ContentDisposition): string {
  const parts = ['form-data'];

  // Always include name
  parts.push(`name="${disposition.name}"`);

  // Always include id
  parts.push(`id="${disposition.id}"`);

  // Optional position
  if (disposition.position !== undefined) {
    parts.push(`position="${disposition.position}"`);
  }

  // Optional title (escape quotes)
  if (disposition.title) {
    const escapedTitle = disposition.title.replace(/"/g, '\\"');
    parts.push(`title="${escapedTitle}"`);
  }

  // Optional filename
  if (disposition.filename) {
    const escapedFilename = disposition.filename.replace(/"/g, '\\"');
    parts.push(`filename="${escapedFilename}"`);
  }

  return parts.join('; ');
}

/**
 * Parse Content-Disposition header value
 */
export function parseContentDisposition(value: string): ContentDisposition | null {
  if (!value) return null;

  const result: Partial<ContentDisposition> = {};

  // Parse parameters using regex that handles quoted values
  const paramRegex = /([a-zA-Z-]+)=(?:"([^"\\]*(?:\\.[^"\\]*)*)"|([^\s;]+))/g;
  let match;

  while ((match = paramRegex.exec(value)) !== null) {
    const key = match[1].toLowerCase();
    // Use quoted value if present, otherwise unquoted
    const val = match[2] !== undefined ? match[2].replace(/\\"/g, '"') : match[3];

    switch (key) {
      case 'name':
        result.name = val;
        break;
      case 'id':
        result.id = val;
        break;
      case 'position':
        result.position = val;
        break;
      case 'title':
        result.title = val;
        break;
      case 'filename':
        result.filename = val;
        break;
    }
  }

  // Validate required fields
  if (!result.name || !result.id) {
    return null;
  }

  return result as ContentDisposition;
}

// ============================================================================
// SERIALIZER
// ============================================================================

export interface SerializerOptions {
  /** Boundary string for multipart (auto-generated if not provided) */
  boundary?: string;
  /** Whether to include Content-Length headers */
  includeContentLength?: boolean;
  /** Threshold for base64 encoding binary content (default: 0, always inline) */
  base64Threshold?: number;
}

/**
 * Generate a random boundary string
 */
export function generateBoundary(): string {
  return `----WebExplorerBoundary${Date.now().toString(36)}${Math.random().toString(36).substring(2)}`;
}

/**
 * Serialize a single part to string
 */
export function serializePart(part: Part, boundary: string): string {
  const headerLines: string[] = [];

  for (const [key, value] of Object.entries(part.headers)) {
    if (value !== undefined) {
      headerLines.push(`${key}: ${value}`);
    }
  }

  return `--${boundary}\r\n${headerLines.join('\r\n')}\r\n\r\n${part.body}`;
}

/**
 * Create a part with Content-Disposition header
 */
function createPart(
  contentType: string,
  disposition: ContentDisposition,
  payload: object,
  includeContentLength: boolean = false
): Part {
  const body = JSON.stringify(payload);
  const headers: PartHeaders = {
    'Content-Type': contentType,
    'Content-Disposition': serializeContentDisposition(disposition),
  };

  if (includeContentLength) {
    headers['Content-Length'] = Buffer.byteLength(body, 'utf-8');
  }

  return { headers, body };
}

/**
 * Serialize a document to a stream of independent parts.
 * Each part can be parsed and processed independently.
 */
export function* serializeDocument<M extends DocumentMode>(
  document: Document<M>,
  options: SerializerOptions = {}
): Generator<Part> {
  const { includeContentLength = false } = options;

  // Document part
  const docPayload: DocumentPartPayload = {
    id: document.id,
    mode: document.mode,
    metadata: document.metadata,
    style: document.style,
  };

  if (document.mode === 'structure' && (document as StructureDocument).preview) {
    docPayload.preview = (document as StructureDocument).preview;
  }

  yield createPart(
    VendorMimeTypes.DOCUMENT,
    { name: 'document', id: document.id },
    docPayload,
    includeContentLength
  );

  // Pages and their contents
  for (const page of document.pages) {
    yield* serializePage(page, document.mode, includeContentLength);
  }
}

function* serializePage<M extends DocumentMode>(
  page: Page<M>,
  mode: M,
  includeContentLength: boolean
): Generator<Part> {
  const position = `${page.index}`;

  const payload: PagePartPayload = {
    id: page.id,
    index: page.index,
    title: page.title,
    style: page.style,
    attributes: page.attributes,
  };

  if (mode === 'structure' && (page as StructurePage).preview) {
    payload.preview = (page as StructurePage).preview;
  }

  yield createPart(
    VendorMimeTypes.PAGE,
    { name: 'page', id: page.id, position, title: page.title },
    payload,
    includeContentLength
  );

  for (const section of page.sections) {
    yield* serializeSection(section as Section<M>, page.index, mode, includeContentLength);
  }
}

function* serializeSection<M extends DocumentMode>(
  section: Section<M>,
  pageIndex: number,
  mode: M,
  includeContentLength: boolean
): Generator<Part> {
  const position = `${pageIndex}.${section.index}`;

  const payload: SectionPartPayload = {
    id: section.id,
    index: section.index,
    title: section.title,
    style: section.style,
    attributes: section.attributes,
  };

  if (mode === 'structure' && (section as StructureSection).preview) {
    payload.preview = (section as StructureSection).preview;
  }

  yield createPart(
    VendorMimeTypes.SECTION,
    { name: 'section', id: section.id, position, title: section.title },
    payload,
    includeContentLength
  );

  for (const row of section.rows) {
    yield* serializeRow(row as Row<M>, pageIndex, section.index, mode, includeContentLength);
  }
}

function* serializeRow<M extends DocumentMode>(
  row: Row<M>,
  pageIndex: number,
  sectionIndex: number,
  mode: M,
  includeContentLength: boolean
): Generator<Part> {
  const position = `${pageIndex}.${sectionIndex}.${row.index}`;

  const payload: RowPartPayload = {
    id: row.id,
    index: row.index,
    style: row.style,
    attributes: row.attributes,
  };

  if (mode === 'structure' && (row as StructureRow).preview) {
    payload.preview = (row as StructureRow).preview;
  }

  yield createPart(
    VendorMimeTypes.ROW,
    { name: 'row', id: row.id, position },
    payload,
    includeContentLength
  );

  for (const column of row.columns) {
    yield* serializeColumn(column as Column<M>, pageIndex, sectionIndex, row.index, mode, includeContentLength);
  }
}

function* serializeColumn<M extends DocumentMode>(
  column: Column<M>,
  pageIndex: number,
  sectionIndex: number,
  rowIndex: number,
  mode: M,
  includeContentLength: boolean
): Generator<Part> {
  const position = `${pageIndex}.${sectionIndex}.${rowIndex}.${column.index}`;

  const payload: ColumnPartPayload = {
    id: column.id,
    index: column.index,
    style: column.style,
    attributes: column.attributes,
  };

  if (mode === 'structure' && (column as StructureColumn).preview) {
    payload.preview = (column as StructureColumn).preview;
  }

  yield createPart(
    VendorMimeTypes.COLUMN,
    { name: 'column', id: column.id, position },
    payload,
    includeContentLength
  );

  for (const cell of column.cells) {
    yield* serializeCell(cell as Cell<M>, pageIndex, sectionIndex, rowIndex, column.index, mode, includeContentLength);
  }
}

function* serializeCell<M extends DocumentMode>(
  cell: Cell<M>,
  pageIndex: number,
  sectionIndex: number,
  rowIndex: number,
  columnIndex: number,
  mode: M,
  includeContentLength: boolean
): Generator<Part> {
  const position = `${pageIndex}.${sectionIndex}.${rowIndex}.${columnIndex}.${cell.index}`;

  if (mode === 'structure') {
    const structCell = cell as StructureCell;
    const payload: StructureCellPartPayload = {
      id: structCell.id,
      index: structCell.index,
      preview: structCell.preview,
      style: structCell.style,
      attributes: structCell.attributes,
    };
    yield createPart(
      VendorMimeTypes.CELL,
      { name: 'cell', id: structCell.id, position, title: structCell.preview?.title },
      payload,
      includeContentLength
    );
  } else {
    const contentCell = cell as ContentCell;
    const payload: ContentCellPartPayload = {
      id: contentCell.id,
      index: contentCell.index,
      content: contentCell.content,
      style: contentCell.style,
      attributes: contentCell.attributes,
    };
    yield createPart(
      VendorMimeTypes.CELL,
      { name: 'cell', id: contentCell.id, position },
      payload,
      includeContentLength
    );
  }
}

/**
 * Serialize document to multipart string with boundary
 */
export function stringify<M extends DocumentMode>(
  document: Document<M>,
  options: SerializerOptions = {}
): string {
  const boundary = options.boundary || generateBoundary();
  const parts: string[] = [];

  for (const part of serializeDocument(document, options)) {
    parts.push(serializePart(part, boundary));
  }

  // End boundary
  parts.push(`--${boundary}--`);

  return parts.join('\r\n');
}

/**
 * Serialize document with boundary info for transport
 */
export function serializeWithBoundary<M extends DocumentMode>(
  document: Document<M>,
  options: SerializerOptions = {}
): { boundary: string; body: string } {
  const boundary = options.boundary || generateBoundary();
  const body = stringify(document, { ...options, boundary });
  return { boundary, body };
}

// ============================================================================
// PARSER
// ============================================================================

/**
 * Parse result for a single part
 */
export interface ParsedPart {
  type:
    | 'document'
    | 'page'
    | 'section'
    | 'row'
    | 'column'
    | 'cell'
    | 'cell-content'
    | 'unknown';
  version: number;
  /** Content-Disposition parameters */
  disposition?: ContentDisposition;
  /** Position from Content-Disposition (convenience accessor) */
  position?: string;
  /** ID from Content-Disposition (convenience accessor) */
  id?: string;
  payload: unknown;
  raw: Part;
}

/**
 * Parse a single part's headers and body
 */
export function parsePart(partString: string): Part | null {
  // Split headers and body (separated by double CRLF or double LF)
  const separatorMatch = partString.match(/\r?\n\r?\n/);
  if (!separatorMatch) {
    // No body, just headers
    return parsePartHeadersOnly(partString);
  }

  const separatorIndex = separatorMatch.index!;
  const headerSection = partString.substring(0, separatorIndex);
  const body = partString.substring(separatorIndex + separatorMatch[0].length);

  const headers = parseHeaders(headerSection);

  return { headers, body };
}

function parsePartHeadersOnly(headerSection: string): Part | null {
  const headers = parseHeaders(headerSection);
  return { headers, body: '' };
}

function parseHeaders(headerSection: string): PartHeaders {
  const headers: PartHeaders = { 'Content-Type': '' };
  const lines = headerSection.split(/\r?\n/);

  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 1).trim();

      // Parse numeric values
      if (key === 'Content-Length') {
        headers[key] = parseInt(value, 10);
      } else {
        headers[key] = value;
      }
    }
  }

  return headers;
}

/**
 * Parse a part into a typed result
 */
export function parseTypedPart(part: Part): ParsedPart {
  const contentType = part.headers['Content-Type'] as string;
  const mimeInfo = parseVendorMimeType(contentType);
  const disposition = part.headers['Content-Disposition']
    ? parseContentDisposition(part.headers['Content-Disposition'] as string)
    : undefined;

  if (!mimeInfo) {
    return {
      type: 'unknown',
      version: 0,
      disposition: disposition || undefined,
      position: disposition?.position,
      id: disposition?.id,
      payload: part.body,
      raw: part,
    };
  }

  let payload: unknown;
  if (mimeInfo.format === 'json') {
    try {
      payload = JSON.parse(part.body);
    } catch {
      payload = part.body;
    }
  } else {
    payload = part.body;
  }

  return {
    type: mimeInfo.type as ParsedPart['type'],
    version: mimeInfo.version,
    disposition: disposition || undefined,
    position: disposition?.position,
    id: disposition?.id,
    payload,
    raw: part,
  };
}

/**
 * Split multipart body into individual parts
 */
export function splitMultipart(body: string, boundary: string): string[] {
  const parts: string[] = [];
  const boundaryMarker = `--${boundary}`;
  const endMarker = `--${boundary}--`;

  // Split by boundary
  const segments = body.split(boundaryMarker);

  for (const segment of segments) {
    // Skip empty segments and end marker
    const trimmed = segment.trim();
    if (!trimmed || trimmed === '--' || trimmed.startsWith('--')) {
      continue;
    }

    // Remove trailing -- if present (end marker was split)
    const cleanSegment = trimmed.replace(/^-+/, '').replace(/-+$/, '').trim();
    if (cleanSegment) {
      parts.push(cleanSegment);
    }
  }

  return parts;
}

/**
 * Extract boundary from Content-Type header
 */
export function extractBoundary(contentType: string): string | null {
  const match = contentType.match(/boundary=([^;\s]+)/);
  return match ? match[1].replace(/^["']|["']$/g, '') : null;
}

// ============================================================================
// DOCUMENT ASSEMBLER
// ============================================================================

/**
 * State for assembling a document from parts
 */
export interface AssemblerState<M extends DocumentMode = 'content'> {
  document: Document<M> | null;
  mode: M | null;
  partsReceived: number;
  errors: AssemblerError[];
}

export interface AssemblerError {
  part: number;
  message: string;
  position?: string;
}

/**
 * Create a new assembler state
 */
export function createAssemblerState<M extends DocumentMode = 'content'>(): AssemblerState<M> {
  return {
    document: null,
    mode: null,
    partsReceived: 0,
    errors: [],
  };
}

/**
 * Document assembler that collects parts and builds a document.
 * Parts can arrive in any order.
 */
export class DocumentAssembler<M extends DocumentMode = 'content'> {
  private state: AssemblerState<M>;
  private documentPayload: DocumentPartPayload | null = null;
  private pages: Map<number, PagePartPayload> = new Map();
  private sections: Map<string, SectionPartPayload> = new Map();
  private rows: Map<string, RowPartPayload> = new Map();
  private columns: Map<string, ColumnPartPayload> = new Map();
  private cells: Map<string, CellPartPayload> = new Map();

  constructor() {
    this.state = createAssemblerState<M>();
  }

  /**
   * Add a part to the assembler
   */
  addPart(part: Part): this {
    this.state.partsReceived++;
    const parsed = parseTypedPart(part);

    try {
      switch (parsed.type) {
        case 'document':
          this.documentPayload = parsed.payload as DocumentPartPayload;
          this.state.mode = this.documentPayload.mode as M;
          break;

        case 'page':
          this.addPage(parsed);
          break;

        case 'section':
          this.addSection(parsed);
          break;

        case 'row':
          this.addRow(parsed);
          break;

        case 'column':
          this.addColumn(parsed);
          break;

        case 'cell':
          this.addCell(parsed);
          break;

        default:
          // Unknown part type, skip
          break;
      }
    } catch (error) {
      this.state.errors.push({
        part: this.state.partsReceived,
        message: error instanceof Error ? error.message : 'Unknown error',
        position: parsed.position,
      });
    }

    return this;
  }

  private addPage(parsed: ParsedPart): void {
    const payload = parsed.payload as PagePartPayload;
    const pageIndex = parseInt(parsed.position || '0', 10);
    payload.index = pageIndex;
    this.pages.set(pageIndex, payload);
  }

  private addSection(parsed: ParsedPart): void {
    const payload = parsed.payload as SectionPartPayload;
    const position = parsed.position || '0.0';
    this.sections.set(position, payload);
  }

  private addRow(parsed: ParsedPart): void {
    const payload = parsed.payload as RowPartPayload;
    const position = parsed.position || '0.0.0';
    this.rows.set(position, payload);
  }

  private addColumn(parsed: ParsedPart): void {
    const payload = parsed.payload as ColumnPartPayload;
    const position = parsed.position || '0.0.0.0';
    this.columns.set(position, payload);
  }

  private addCell(parsed: ParsedPart): void {
    const payload = parsed.payload as CellPartPayload;
    const position = parsed.position || '0.0.0.0.0';
    this.cells.set(position, payload);
  }

  /**
   * Build the document from collected parts.
   * Can be called at any time to get a partial document.
   */
  build(): Document<M> | null {
    if (!this.documentPayload) {
      return null;
    }

    const mode = this.documentPayload.mode;

    if (mode === 'structure') {
      return this.buildStructureDocument() as Document<M>;
    } else {
      return this.buildContentDocument() as Document<M>;
    }
  }

  private buildContentDocument(): ContentDocument {
    const doc: ContentDocument = {
      id: this.documentPayload!.id,
      mode: 'content',
      metadata: this.documentPayload!.metadata,
      style: this.documentPayload!.style,
      pages: [],
    };

    // Sort and add pages
    const sortedPages = [...this.pages.entries()].sort((a, b) => a[0] - b[0]);

    for (const [pageIndex, pagePayload] of sortedPages) {
      const page: ContentPage = {
        id: pagePayload.id,
        index: pagePayload.index,
        title: pagePayload.title,
        style: pagePayload.style,
        attributes: pagePayload.attributes,
        sections: [],
      };

      // Find sections for this page
      const pageSections = this.getSectionsForPage(pageIndex);
      for (const [sectionPos, sectionPayload] of pageSections) {
        const section: ContentSection = {
          id: sectionPayload.id,
          index: sectionPayload.index,
          title: sectionPayload.title,
          style: sectionPayload.style,
          attributes: sectionPayload.attributes,
          rows: [],
        };

        // Find rows for this section
        const sectionRows = this.getRowsForSection(sectionPos);
        for (const [rowPos, rowPayload] of sectionRows) {
          const row: ContentRow = {
            id: rowPayload.id,
            index: rowPayload.index,
            style: rowPayload.style,
            attributes: rowPayload.attributes,
            columns: [],
          };

          // Find columns for this row
          const rowColumns = this.getColumnsForRow(rowPos);
          for (const [colPos, colPayload] of rowColumns) {
            const column: ContentColumn = {
              id: colPayload.id,
              index: colPayload.index,
              style: colPayload.style,
              attributes: colPayload.attributes,
              cells: [],
            };

            // Find cells for this column
            const columnCells = this.getCellsForColumn(colPos);
            for (const [, cellPayload] of columnCells) {
              const contentPayload = cellPayload as ContentCellPartPayload;
              const cell: ContentCell = {
                id: contentPayload.id,
                index: contentPayload.index,
                content: contentPayload.content,
                style: contentPayload.style,
                attributes: contentPayload.attributes,
              };
              column.cells.push(cell);
            }

            row.columns.push(column);
          }

          section.rows.push(row);
        }

        page.sections.push(section);
      }

      doc.pages.push(page);
    }

    this.state.document = doc as Document<M>;
    return doc;
  }

  private buildStructureDocument(): StructureDocument {
    const doc: StructureDocument = {
      id: this.documentPayload!.id,
      mode: 'structure',
      metadata: this.documentPayload!.metadata,
      style: this.documentPayload!.style,
      preview: this.documentPayload!.preview,
      pages: [],
    };

    // Sort and add pages
    const sortedPages = [...this.pages.entries()].sort((a, b) => a[0] - b[0]);

    for (const [pageIndex, pagePayload] of sortedPages) {
      const page: StructurePage = {
        id: pagePayload.id,
        index: pagePayload.index,
        title: pagePayload.title,
        style: pagePayload.style,
        attributes: pagePayload.attributes,
        preview: pagePayload.preview,
        sections: [],
      };

      // Find sections for this page
      const pageSections = this.getSectionsForPage(pageIndex);
      for (const [sectionPos, sectionPayload] of pageSections) {
        const section: StructureSection = {
          id: sectionPayload.id,
          index: sectionPayload.index,
          title: sectionPayload.title,
          style: sectionPayload.style,
          attributes: sectionPayload.attributes,
          preview: sectionPayload.preview,
          rows: [],
        };

        // Find rows for this section
        const sectionRows = this.getRowsForSection(sectionPos);
        for (const [rowPos, rowPayload] of sectionRows) {
          const row: StructureRow = {
            id: rowPayload.id,
            index: rowPayload.index,
            style: rowPayload.style,
            attributes: rowPayload.attributes,
            preview: rowPayload.preview,
            columns: [],
          };

          // Find columns for this row
          const rowColumns = this.getColumnsForRow(rowPos);
          for (const [colPos, colPayload] of rowColumns) {
            const column: StructureColumn = {
              id: colPayload.id,
              index: colPayload.index,
              style: colPayload.style,
              attributes: colPayload.attributes,
              preview: colPayload.preview,
              cells: [],
            };

            // Find cells for this column
            const columnCells = this.getCellsForColumn(colPos);
            for (const [, cellPayload] of columnCells) {
              const structPayload = cellPayload as StructureCellPartPayload;
              const cell: StructureCell = {
                id: structPayload.id,
                index: structPayload.index,
                preview: structPayload.preview,
                style: structPayload.style,
                attributes: structPayload.attributes,
              };
              column.cells.push(cell);
            }

            row.columns.push(column);
          }

          section.rows.push(row);
        }

        page.sections.push(section);
      }

      doc.pages.push(page);
    }

    this.state.document = doc as Document<M>;
    return doc;
  }

  private getSectionsForPage(pageIndex: number): [string, SectionPartPayload][] {
    const prefix = `${pageIndex}.`;
    return [...this.sections.entries()]
      .filter(([pos]) => pos.startsWith(prefix) && pos.split('.').length === 2)
      .sort((a, b) => {
        const aIdx = parseInt(a[0].split('.')[1], 10);
        const bIdx = parseInt(b[0].split('.')[1], 10);
        return aIdx - bIdx;
      });
  }

  private getRowsForSection(sectionPos: string): [string, RowPartPayload][] {
    const prefix = `${sectionPos}.`;
    return [...this.rows.entries()]
      .filter(([pos]) => pos.startsWith(prefix) && pos.split('.').length === 3)
      .sort((a, b) => {
        const aIdx = parseInt(a[0].split('.')[2], 10);
        const bIdx = parseInt(b[0].split('.')[2], 10);
        return aIdx - bIdx;
      });
  }

  private getColumnsForRow(rowPos: string): [string, ColumnPartPayload][] {
    const prefix = `${rowPos}.`;
    return [...this.columns.entries()]
      .filter(([pos]) => pos.startsWith(prefix) && pos.split('.').length === 4)
      .sort((a, b) => {
        const aIdx = parseInt(a[0].split('.')[3], 10);
        const bIdx = parseInt(b[0].split('.')[3], 10);
        return aIdx - bIdx;
      });
  }

  private getCellsForColumn(colPos: string): [string, CellPartPayload][] {
    const prefix = `${colPos}.`;
    return [...this.cells.entries()]
      .filter(([pos]) => pos.startsWith(prefix) && pos.split('.').length === 5)
      .sort((a, b) => {
        const aIdx = parseInt(a[0].split('.')[4], 10);
        const bIdx = parseInt(b[0].split('.')[4], 10);
        return aIdx - bIdx;
      });
  }

  /**
   * Get the current partial document
   */
  getDocument(): Document<M> | null {
    return this.build();
  }

  /**
   * Get the assembler state
   */
  getState(): AssemblerState<M> {
    return this.state;
  }

  /**
   * Get the number of parts received
   */
  getPartsCount(): number {
    return this.state.partsReceived;
  }

  /**
   * Get any assembly errors
   */
  getErrors(): AssemblerError[] {
    return this.state.errors;
  }

  /**
   * Check if we have a document header
   */
  hasDocumentHeader(): boolean {
    return this.documentPayload !== null;
  }

  /**
   * Reset the assembler
   */
  reset(): void {
    this.state = createAssemblerState<M>();
    this.documentPayload = null;
    this.pages.clear();
    this.sections.clear();
    this.rows.clear();
    this.columns.clear();
    this.cells.clear();
  }
}

// ============================================================================
// STREAMING PARSER
// ============================================================================

/**
 * Streaming parser for multipart document data
 */
export class StreamingParser<M extends DocumentMode = 'content'> {
  private assembler: DocumentAssembler<M>;
  private buffer: string = '';
  private boundary: string | null = null;

  constructor(boundary?: string) {
    this.assembler = new DocumentAssembler<M>();
    this.boundary = boundary || null;
  }

  /**
   * Set the boundary (can be extracted from Content-Type header)
   */
  setBoundary(boundary: string): this {
    this.boundary = boundary;
    return this;
  }

  /**
   * Feed data to the parser
   */
  feed(data: string): { partsProcessed: number; document: Document<M> | null } {
    this.buffer += data;

    if (!this.boundary) {
      // Try to extract boundary from first line
      const match = this.buffer.match(/^--([^\r\n]+)/);
      if (match) {
        this.boundary = match[1];
      } else {
        return { partsProcessed: 0, document: null };
      }
    }

    let partsProcessed = 0;
    const boundaryMarker = `--${this.boundary}`;
    const endMarker = `${boundaryMarker}--`;

    // Process complete parts
    while (true) {
      const startIndex = this.buffer.indexOf(boundaryMarker);
      if (startIndex === -1) break;

      // Check if this is the end marker
      const isEndMarker = this.buffer.substring(startIndex, startIndex + endMarker.length) === endMarker;
      if (isEndMarker) {
        this.buffer = '';
        break;
      }

      const afterBoundary = startIndex + boundaryMarker.length;
      
      // Find next boundary or end marker
      let nextBoundaryIndex = this.buffer.indexOf(boundaryMarker, afterBoundary);

      if (nextBoundaryIndex === -1) {
        // No next boundary found - wait for more data
        break;
      }

      // Extract and process part (skip leading newlines after boundary)
      let partContent = this.buffer.substring(afterBoundary, nextBoundaryIndex);
      partContent = partContent.replace(/^[\r\n]+/, '').replace(/[\r\n]+$/, '');
      
      if (partContent) {
        const part = parsePart(partContent);
        if (part && part.headers['Content-Type']) {
          this.assembler.addPart(part);
          partsProcessed++;
        }
      }

      // Move buffer past this part to the next boundary
      this.buffer = this.buffer.substring(nextBoundaryIndex);
    }

    return {
      partsProcessed,
      document: this.assembler.getDocument(),
    };
  }

  /**
   * Finalize parsing - process any remaining buffered data
   */
  finalize(): Document<M> | null {
    if (!this.boundary || !this.buffer) {
      return this.assembler.getDocument();
    }

    const boundaryMarker = `--${this.boundary}`;
    const endMarker = `${boundaryMarker}--`;

    // Check if we have a final part before end marker
    const startIndex = this.buffer.indexOf(boundaryMarker);
    if (startIndex !== -1) {
      const afterBoundary = startIndex + boundaryMarker.length;
      const endIndex = this.buffer.indexOf(endMarker, afterBoundary);

      if (endIndex !== -1) {
        let partContent = this.buffer.substring(afterBoundary, endIndex);
        partContent = partContent.replace(/^[\r\n]+/, '').replace(/[\r\n]+$/, '');

        if (partContent) {
          const part = parsePart(partContent);
          if (part && part.headers['Content-Type']) {
            this.assembler.addPart(part);
          }
        }
      }
    }

    this.buffer = '';
    return this.assembler.getDocument();
  }

  /**
   * Get the current partial document
   */
  getDocument(): Document<M> | null {
    return this.assembler.getDocument();
  }

  /**
   * Get the assembler for advanced operations
   */
  getAssembler(): DocumentAssembler<M> {
    return this.assembler;
  }

  /**
   * Reset the parser
   */
  reset(): void {
    this.assembler.reset();
    this.buffer = '';
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Parse a complete multipart document string
 */
export function parse<M extends DocumentMode = 'content'>(
  input: string,
  boundary?: string
): Document<M> | null {
  // Extract boundary if not provided
  if (!boundary) {
    const match = input.match(/^--([^\r\n]+)/);
    if (!match) return null;
    boundary = match[1];
  }

  const parts = splitMultipart(input, boundary);
  const assembler = new DocumentAssembler<M>();

  for (const partStr of parts) {
    const part = parsePart(partStr);
    if (part && part.headers['Content-Type']) {
      assembler.addPart(part);
    }
  }

  return assembler.getDocument();
}

/**
 * Parse multipart with full result including errors
 */
export function parseDocument<M extends DocumentMode = 'content'>(
  input: string,
  boundary?: string
): { document: Document<M> | null; errors: AssemblerError[] } {
  // Extract boundary if not provided
  if (!boundary) {
    const match = input.match(/^--([^\r\n]+)/);
    if (!match) return { document: null, errors: [] };
    boundary = match[1];
  }

  const parts = splitMultipart(input, boundary);
  const assembler = new DocumentAssembler<M>();

  for (const partStr of parts) {
    const part = parsePart(partStr);
    if (part && part.headers['Content-Type']) {
      assembler.addPart(part);
    }
  }

  return {
    document: assembler.getDocument(),
    errors: assembler.getErrors(),
  };
}

// Re-export for backward compatibility
export { DocumentAssembler as Assembler };
