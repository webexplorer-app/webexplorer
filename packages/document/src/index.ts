/**
 * @webexplorer/document
 * 
 * Document generation and schema definition library.
 * 
 * Hierarchy: Document > Page > Section > Row > Column > Cell
 * Each cell can host content with a specific MIME type.
 * Cells are addressable via position: pageIndex.sectionIndex.rowIndex.columnIndex.cellIndex
 * 
 * Supports two modes:
 * - 'structure': Preview mode with title/summary for understanding layout
 * - 'content': Full document mode with actual content
 */

// Schema types
export type {
  DocumentMode,
  MimeType,
  PreviewInfo,
  CellContent,
  CellStyle,
  ColumnStyle,
  RowStyle,
  SectionStyle,
  PageStyle,
  DocumentMetadata,
  DocumentStyle,
  // Generic types
  Cell,
  Column,
  Row,
  Section,
  Page,
  Document,
  // Content mode types
  ContentCell,
  ContentColumn,
  ContentRow,
  ContentSection,
  ContentPage,
  ContentDocument,
  // Structure mode types
  StructureCell,
  StructureColumn,
  StructureRow,
  StructureSection,
  StructurePage,
  StructureDocument,
  // Type aliases
  DocumentStructure,
  DocumentContent,
} from './schema';

// Type guards
export {
  isStructureDocument,
  isContentDocument,
} from './schema';

// Position utilities
export {
  parsePosition,
  stringifyPosition,
  parsePartialPosition,
  getCellAt,
  getColumnAt,
  getRowAt,
  getSectionAt,
  getPageAt,
  positionExists,
  iterateCellPositions,
  comparePositions,
} from './position';

export type {
  CellPosition,
  PagePosition,
  SectionPosition,
  RowPosition,
  ColumnPosition,
  PositionString,
} from './position';

// Content mode builders
export {
  ContentDocumentBuilder,
  ContentPageBuilder,
  ContentSectionBuilder,
  ContentRowBuilder,
  ContentColumnBuilder,
  ContentCellBuilder,
  createContentDocument,
  createContentPage,
  createContentSection,
  createContentRow,
  createContentColumn,
  createContentCell,
} from './builder';

// Structure mode builders
export {
  StructureDocumentBuilder,
  StructurePageBuilder,
  StructureSectionBuilder,
  StructureRowBuilder,
  StructureColumnBuilder,
  StructureCellBuilder,
  createStructureDocument,
  createStructurePage,
  createStructureSection,
  createStructureRow,
  createStructureColumn,
  createStructureCell,
} from './builder';

// Legacy aliases (backward compatibility - defaults to content mode)
export {
  DocumentBuilder,
  PageBuilder,
  SectionBuilder,
  RowBuilder,
  ColumnBuilder,
  CellBuilder,
  createDocument,
  createPage,
  createSection,
  createRow,
  createColumn,
  createCell,
} from './builder';

// Streaming serialization/deserialization (multipart/form-data style protocol)
export {
  // Protocol constants
  PROTOCOL_VERSION,
  VendorMimeTypes,
  parseVendorMimeType,
  // Content-Disposition utilities
  serializeContentDisposition,
  parseContentDisposition,
  // Boundary utilities
  generateBoundary,
  extractBoundary,
  // Part utilities
  serializePart,
  parsePart,
  parseTypedPart,
  splitMultipart,
  // Document serialization
  serializeDocument,
  stringify,
  serializeWithBoundary,
  // Document parsing
  parse,
  parseDocument,
  // Assembler
  createAssemblerState,
  DocumentAssembler,
  Assembler,
  // Streaming parser
  StreamingParser,
} from './streaming';

export type {
  VendorMimeType,
  ContentDisposition,
  PartHeaders,
  Part,
  ParsedPart,
  DocumentPartPayload,
  PagePartPayload,
  SectionPartPayload,
  RowPartPayload,
  ColumnPartPayload,
  ContentCellPartPayload,
  StructureCellPartPayload,
  CellPartPayload,
  SerializerOptions,
  AssemblerState,
  AssemblerError,
} from './streaming';
