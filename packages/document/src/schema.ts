/**
 * Document Schema Definitions
 * 
 * Hierarchy: Document > Page > Section > Row > Column > Cell
 * Each cell can host content with a specific MIME type.
 * 
 * Supports two modes:
 * - 'structure': Preview mode with title/summary for understanding layout
 * - 'content': Full document mode with actual content
 */

/**
 * Document mode discriminator
 * - 'structure': Contains title/summary for preview purposes
 * - 'content': Contains actual content data
 */
export type DocumentMode = 'structure' | 'content';

/**
 * Common MIME types for cell content
 */
export type MimeType =
  | 'text/plain'
  | 'text/html'
  | 'text/markdown'
  | 'image/png'
  | 'image/jpeg'
  | 'image/svg+xml'
  | 'image/gif'
  | 'image/webp'
  | 'application/json'
  | 'application/pdf'
  | 'audio/mpeg'
  | 'audio/wav'
  | 'video/mp4'
  | 'video/webm'
  | string; // Allow custom MIME types

/**
 * Preview information for structure mode
 */
export interface PreviewInfo {
  /** Short title describing the content */
  title: string;
  /** Brief summary of the content */
  summary?: string;
  /** Expected MIME type of the actual content */
  expectedMimeType?: MimeType;
  /** Thumbnail or preview image (base64 or URL) */
  thumbnail?: string;
  /** Estimated size of actual content */
  estimatedSize?: number;
}

/**
 * Actual content stored in a cell (content mode)
 */
export interface CellContent {
  /** MIME type of the content */
  mimeType: MimeType;
  /** The actual content data (string, base64, or structured data) */
  data: string | ArrayBuffer | object;
  /** Optional encoding information */
  encoding?: 'utf-8' | 'base64' | 'binary';
  /** Optional metadata for the content */
  metadata?: Record<string, unknown>;
}

/**
 * Base cell properties shared between modes
 */
interface CellBase {
  /** Unique identifier for the cell */
  id: string;
  /** Index of this cell within its parent column */
  index: number;
  /** Optional cell styling */
  style?: CellStyle;
  /** Optional cell attributes */
  attributes?: Record<string, unknown>;
}

/**
 * Cell in structure mode - contains preview info
 */
export interface StructureCell extends CellBase {
  /** Preview information for this cell */
  preview: PreviewInfo;
}

/**
 * Cell in content mode - contains actual content
 */
export interface ContentCell extends CellBase {
  /** Actual content hosted by this cell */
  content?: CellContent;
}

/**
 * Generic Cell type based on mode
 */
export type Cell<M extends DocumentMode = 'content'> = M extends 'structure' 
  ? StructureCell 
  : ContentCell;

/**
 * Cell styling options
 */
export interface CellStyle {
  width?: string | number;
  height?: string | number;
  padding?: string | number;
  margin?: string | number;
  backgroundColor?: string;
  border?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  verticalAlign?: 'top' | 'middle' | 'bottom';
}

/**
 * Column styling options
 */
export interface ColumnStyle {
  width?: string | number;
  minWidth?: string | number;
  maxWidth?: string | number;
  flex?: number;
  backgroundColor?: string;
  border?: string;
}

/**
 * Base column properties shared between modes
 */
interface ColumnBase<M extends DocumentMode> {
  /** Unique identifier for the column */
  id: string;
  /** Index of this column within its parent row */
  index: number;
  /** Cells contained in this column */
  cells: Cell<M>[];
  /** Optional column styling */
  style?: ColumnStyle;
  /** Optional column attributes */
  attributes?: Record<string, unknown>;
}

/**
 * Column in structure mode - includes preview info
 */
export interface StructureColumn extends ColumnBase<'structure'> {
  /** Preview information for this column */
  preview?: PreviewInfo;
}

/**
 * Column in content mode
 */
export interface ContentColumn extends ColumnBase<'content'> {}

/**
 * Generic Column type based on mode
 */
export type Column<M extends DocumentMode = 'content'> = M extends 'structure'
  ? StructureColumn
  : ContentColumn;

/**
 * Base row properties shared between modes
 */
interface RowBase<M extends DocumentMode> {
  /** Unique identifier for the row */
  id: string;
  /** Index of this row within its parent section */
  index: number;
  /** Columns contained in this row */
  columns: Column<M>[];
  /** Optional row styling */
  style?: RowStyle;
  /** Optional row attributes */
  attributes?: Record<string, unknown>;
}

/**
 * Row in structure mode - includes preview info
 */
export interface StructureRow extends RowBase<'structure'> {
  /** Preview information for this row */
  preview?: PreviewInfo;
}

/**
 * Row in content mode
 */
export interface ContentRow extends RowBase<'content'> {}

/**
 * Generic Row type based on mode
 */
export type Row<M extends DocumentMode = 'content'> = M extends 'structure'
  ? StructureRow
  : ContentRow;

/**
 * Row styling options
 */
export interface RowStyle {
  height?: string | number;
  minHeight?: string | number;
  maxHeight?: string | number;
  backgroundColor?: string;
  border?: string;
  gap?: string | number;
}

/**
 * Section styling options
 */
export interface SectionStyle {
  padding?: string | number;
  margin?: string | number;
  backgroundColor?: string;
  border?: string;
  pageBreakBefore?: boolean;
  pageBreakAfter?: boolean;
}

/**
 * Base section properties shared between modes
 */
interface SectionBase<M extends DocumentMode> {
  /** Unique identifier for the section */
  id: string;
  /** Index of this section within its parent page */
  index: number;
  /** Section title (optional) */
  title?: string;
  /** Rows contained in this section */
  rows: Row<M>[];
  /** Optional section styling */
  style?: SectionStyle;
  /** Optional section attributes */
  attributes?: Record<string, unknown>;
}

/**
 * Section in structure mode - includes preview info
 */
export interface StructureSection extends SectionBase<'structure'> {
  /** Preview information for this section */
  preview?: PreviewInfo;
}

/**
 * Section in content mode
 */
export interface ContentSection extends SectionBase<'content'> {}

/**
 * Generic Section type based on mode
 */
export type Section<M extends DocumentMode = 'content'> = M extends 'structure'
  ? StructureSection
  : ContentSection;

/**
 * Page styling options
 */
export interface PageStyle {
  width?: string | number;
  height?: string | number;
  padding?: string | number;
  margin?: string | number;
  backgroundColor?: string;
  orientation?: 'portrait' | 'landscape';
  size?: 'A4' | 'A3' | 'letter' | 'legal' | 'custom';
}

/**
 * Base page properties shared between modes
 */
interface PageBase<M extends DocumentMode> {
  /** Unique identifier for the page */
  id: string;
  /** Index of this page within the document */
  index: number;
  /** Page title (optional) */
  title?: string;
  /** Sections contained in this page */
  sections: Section<M>[];
  /** Optional page styling */
  style?: PageStyle;
  /** Optional page attributes */
  attributes?: Record<string, unknown>;
}

/**
 * Page in structure mode - includes preview info
 */
export interface StructurePage extends PageBase<'structure'> {
  /** Preview information for this page */
  preview?: PreviewInfo;
}

/**
 * Page in content mode
 */
export interface ContentPage extends PageBase<'content'> {}

/**
 * Generic Page type based on mode
 */
export type Page<M extends DocumentMode = 'content'> = M extends 'structure'
  ? StructurePage
  : ContentPage;

/**
 * Document metadata
 */
export interface DocumentMetadata {
  title?: string;
  author?: string;
  description?: string;
  keywords?: string[];
  createdAt?: Date | string;
  updatedAt?: Date | string;
  version?: string;
  language?: string;
  [key: string]: unknown;
}

/**
 * Document-level styling defaults
 */
export interface DocumentStyle {
  defaultPageStyle?: PageStyle;
  defaultSectionStyle?: SectionStyle;
  defaultRowStyle?: RowStyle;
  defaultColumnStyle?: ColumnStyle;
  defaultCellStyle?: CellStyle;
  fontFamily?: string;
  fontSize?: string | number;
  lineHeight?: string | number;
  color?: string;
}

/**
 * Base document properties shared between modes
 */
interface DocumentBase<M extends DocumentMode> {
  /** Unique identifier for the document */
  id: string;
  /** Document mode indicator */
  mode: M;
  /** Document metadata */
  metadata: DocumentMetadata;
  /** Pages contained in this document */
  pages: Page<M>[];
  /** Optional document-level styling defaults */
  style?: DocumentStyle;
}

/**
 * Document in structure mode - for previewing layout
 */
export interface StructureDocument extends DocumentBase<'structure'> {
  mode: 'structure';
  /** Overall document preview/summary */
  preview?: PreviewInfo;
}

/**
 * Document in content mode - contains actual content
 */
export interface ContentDocument extends DocumentBase<'content'> {
  mode: 'content';
}

/**
 * Generic Document type based on mode
 */
export type Document<M extends DocumentMode = 'content'> = M extends 'structure'
  ? StructureDocument
  : ContentDocument;

/**
 * Type aliases for convenience
 */
export type DocumentStructure = Document<'structure'>;
export type DocumentContent = Document<'content'>;

/**
 * Type guard to check if document is in structure mode
 */
export function isStructureDocument(doc: Document<DocumentMode>): doc is StructureDocument {
  return doc.mode === 'structure';
}

/**
 * Type guard to check if document is in content mode
 */
export function isContentDocument(doc: Document<DocumentMode>): doc is ContentDocument {
  return doc.mode === 'content';
}
