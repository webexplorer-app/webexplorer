/**
 * Builder utilities for creating documents
 * Supports both 'structure' mode (preview) and 'content' mode (actual content)
 */

import type {
  DocumentMetadata,
  DocumentStyle,
  PageStyle,
  SectionStyle,
  RowStyle,
  ColumnStyle,
  CellStyle,
  CellContent,
  MimeType,
  PreviewInfo,
  ContentCell,
  StructureCell,
  ContentColumn,
  StructureColumn,
  ContentRow,
  StructureRow,
  ContentSection,
  StructureSection,
  ContentPage,
  StructurePage,
  ContentDocument,
  StructureDocument,
} from './schema';

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
}

// ============================================================================
// CONTENT MODE BUILDERS (for actual document content)
// ============================================================================

/**
 * Builder for creating ContentCell instances (actual content)
 */
export class ContentCellBuilder {
  private cell: ContentCell;

  constructor(index: number = 0) {
    this.cell = {
      id: generateId(),
      index,
    };
  }

  id(id: string): this {
    this.cell.id = id;
    return this;
  }

  content(mimeType: MimeType, data: CellContent['data'], encoding?: CellContent['encoding']): this {
    this.cell.content = { mimeType, data, encoding };
    return this;
  }

  textContent(text: string): this {
    this.cell.content = { mimeType: 'text/plain', data: text, encoding: 'utf-8' };
    return this;
  }

  htmlContent(html: string): this {
    this.cell.content = { mimeType: 'text/html', data: html, encoding: 'utf-8' };
    return this;
  }

  markdownContent(markdown: string): this {
    this.cell.content = { mimeType: 'text/markdown', data: markdown, encoding: 'utf-8' };
    return this;
  }

  imageContent(mimeType: 'image/png' | 'image/jpeg' | 'image/svg+xml' | 'image/gif' | 'image/webp', data: string | ArrayBuffer): this {
    this.cell.content = { mimeType, data, encoding: typeof data === 'string' ? 'base64' : 'binary' };
    return this;
  }

  jsonContent(data: object): this {
    this.cell.content = { mimeType: 'application/json', data };
    return this;
  }

  style(style: CellStyle): this {
    this.cell.style = { ...this.cell.style, ...style };
    return this;
  }

  attributes(attrs: Record<string, unknown>): this {
    this.cell.attributes = { ...this.cell.attributes, ...attrs };
    return this;
  }

  build(): ContentCell {
    return { ...this.cell };
  }
}

/**
 * Builder for creating ContentColumn instances
 */
export class ContentColumnBuilder {
  private column: ContentColumn;

  constructor(index: number = 0) {
    this.column = {
      id: generateId(),
      index,
      cells: [],
    };
  }

  id(id: string): this {
    this.column.id = id;
    return this;
  }

  addCell(cell: ContentCell | ContentCellBuilder): this {
    const builtCell = cell instanceof ContentCellBuilder ? cell.build() : cell;
    builtCell.index = this.column.cells.length;
    this.column.cells.push(builtCell);
    return this;
  }

  addCells(...cells: (ContentCell | ContentCellBuilder)[]): this {
    cells.forEach(cell => this.addCell(cell));
    return this;
  }

  style(style: ColumnStyle): this {
    this.column.style = { ...this.column.style, ...style };
    return this;
  }

  attributes(attrs: Record<string, unknown>): this {
    this.column.attributes = { ...this.column.attributes, ...attrs };
    return this;
  }

  build(): ContentColumn {
    return { ...this.column, cells: [...this.column.cells] };
  }
}

/**
 * Builder for creating ContentRow instances
 */
export class ContentRowBuilder {
  private row: ContentRow;

  constructor(index: number = 0) {
    this.row = {
      id: generateId(),
      index,
      columns: [],
    };
  }

  id(id: string): this {
    this.row.id = id;
    return this;
  }

  addColumn(column: ContentColumn | ContentColumnBuilder): this {
    const builtColumn = column instanceof ContentColumnBuilder ? column.build() : column;
    builtColumn.index = this.row.columns.length;
    this.row.columns.push(builtColumn);
    return this;
  }

  addColumns(...columns: (ContentColumn | ContentColumnBuilder)[]): this {
    columns.forEach(col => this.addColumn(col));
    return this;
  }

  style(style: RowStyle): this {
    this.row.style = { ...this.row.style, ...style };
    return this;
  }

  attributes(attrs: Record<string, unknown>): this {
    this.row.attributes = { ...this.row.attributes, ...attrs };
    return this;
  }

  build(): ContentRow {
    return { ...this.row, columns: [...this.row.columns] };
  }
}

/**
 * Builder for creating ContentSection instances
 */
export class ContentSectionBuilder {
  private section: ContentSection;

  constructor(index: number = 0) {
    this.section = {
      id: generateId(),
      index,
      rows: [],
    };
  }

  id(id: string): this {
    this.section.id = id;
    return this;
  }

  title(title: string): this {
    this.section.title = title;
    return this;
  }

  addRow(row: ContentRow | ContentRowBuilder): this {
    const builtRow = row instanceof ContentRowBuilder ? row.build() : row;
    builtRow.index = this.section.rows.length;
    this.section.rows.push(builtRow);
    return this;
  }

  addRows(...rows: (ContentRow | ContentRowBuilder)[]): this {
    rows.forEach(row => this.addRow(row));
    return this;
  }

  style(style: SectionStyle): this {
    this.section.style = { ...this.section.style, ...style };
    return this;
  }

  attributes(attrs: Record<string, unknown>): this {
    this.section.attributes = { ...this.section.attributes, ...attrs };
    return this;
  }

  build(): ContentSection {
    return { ...this.section, rows: [...this.section.rows] };
  }
}

/**
 * Builder for creating ContentPage instances
 */
export class ContentPageBuilder {
  private page: ContentPage;

  constructor(index: number = 0) {
    this.page = {
      id: generateId(),
      index,
      sections: [],
    };
  }

  id(id: string): this {
    this.page.id = id;
    return this;
  }

  title(title: string): this {
    this.page.title = title;
    return this;
  }

  addSection(section: ContentSection | ContentSectionBuilder): this {
    const builtSection = section instanceof ContentSectionBuilder ? section.build() : section;
    builtSection.index = this.page.sections.length;
    this.page.sections.push(builtSection);
    return this;
  }

  addSections(...sections: (ContentSection | ContentSectionBuilder)[]): this {
    sections.forEach(section => this.addSection(section));
    return this;
  }

  style(style: PageStyle): this {
    this.page.style = { ...this.page.style, ...style };
    return this;
  }

  attributes(attrs: Record<string, unknown>): this {
    this.page.attributes = { ...this.page.attributes, ...attrs };
    return this;
  }

  build(): ContentPage {
    return { ...this.page, sections: [...this.page.sections] };
  }
}

/**
 * Builder for creating ContentDocument instances
 */
export class ContentDocumentBuilder {
  private document: ContentDocument;

  constructor() {
    this.document = {
      id: generateId(),
      mode: 'content',
      metadata: {},
      pages: [],
    };
  }

  id(id: string): this {
    this.document.id = id;
    return this;
  }

  metadata(metadata: DocumentMetadata): this {
    this.document.metadata = { ...this.document.metadata, ...metadata };
    return this;
  }

  title(title: string): this {
    this.document.metadata.title = title;
    return this;
  }

  author(author: string): this {
    this.document.metadata.author = author;
    return this;
  }

  addPage(page: ContentPage | ContentPageBuilder): this {
    const builtPage = page instanceof ContentPageBuilder ? page.build() : page;
    builtPage.index = this.document.pages.length;
    this.document.pages.push(builtPage);
    return this;
  }

  addPages(...pages: (ContentPage | ContentPageBuilder)[]): this {
    pages.forEach(page => this.addPage(page));
    return this;
  }

  style(style: DocumentStyle): this {
    this.document.style = { ...this.document.style, ...style };
    return this;
  }

  build(): ContentDocument {
    if (!this.document.metadata.createdAt) {
      this.document.metadata.createdAt = new Date().toISOString();
    }
    this.document.metadata.updatedAt = new Date().toISOString();

    return { ...this.document, pages: [...this.document.pages] };
  }
}

// ============================================================================
// STRUCTURE MODE BUILDERS (for document preview/layout)
// ============================================================================

/**
 * Builder for creating StructureCell instances (preview info)
 */
export class StructureCellBuilder {
  private cell: StructureCell;

  constructor(index: number = 0) {
    this.cell = {
      id: generateId(),
      index,
      preview: { title: '' },
    };
  }

  id(id: string): this {
    this.cell.id = id;
    return this;
  }

  preview(title: string, summary?: string, expectedMimeType?: MimeType): this {
    this.cell.preview = { title, summary, expectedMimeType };
    return this;
  }

  previewInfo(info: PreviewInfo): this {
    this.cell.preview = { ...this.cell.preview, ...info };
    return this;
  }

  thumbnail(thumbnail: string): this {
    this.cell.preview.thumbnail = thumbnail;
    return this;
  }

  estimatedSize(size: number): this {
    this.cell.preview.estimatedSize = size;
    return this;
  }

  style(style: CellStyle): this {
    this.cell.style = { ...this.cell.style, ...style };
    return this;
  }

  attributes(attrs: Record<string, unknown>): this {
    this.cell.attributes = { ...this.cell.attributes, ...attrs };
    return this;
  }

  build(): StructureCell {
    return { ...this.cell, preview: { ...this.cell.preview } };
  }
}

/**
 * Builder for creating StructureColumn instances
 */
export class StructureColumnBuilder {
  private column: StructureColumn;

  constructor(index: number = 0) {
    this.column = {
      id: generateId(),
      index,
      cells: [],
    };
  }

  id(id: string): this {
    this.column.id = id;
    return this;
  }

  preview(title: string, summary?: string): this {
    this.column.preview = { title, summary };
    return this;
  }

  previewInfo(info: PreviewInfo): this {
    this.column.preview = { ...this.column.preview, ...info };
    return this;
  }

  addCell(cell: StructureCell | StructureCellBuilder): this {
    const builtCell = cell instanceof StructureCellBuilder ? cell.build() : cell;
    builtCell.index = this.column.cells.length;
    this.column.cells.push(builtCell);
    return this;
  }

  addCells(...cells: (StructureCell | StructureCellBuilder)[]): this {
    cells.forEach(cell => this.addCell(cell));
    return this;
  }

  style(style: ColumnStyle): this {
    this.column.style = { ...this.column.style, ...style };
    return this;
  }

  attributes(attrs: Record<string, unknown>): this {
    this.column.attributes = { ...this.column.attributes, ...attrs };
    return this;
  }

  build(): StructureColumn {
    return { ...this.column, cells: [...this.column.cells] };
  }
}

/**
 * Builder for creating StructureRow instances
 */
export class StructureRowBuilder {
  private row: StructureRow;

  constructor(index: number = 0) {
    this.row = {
      id: generateId(),
      index,
      columns: [],
    };
  }

  id(id: string): this {
    this.row.id = id;
    return this;
  }

  preview(title: string, summary?: string): this {
    this.row.preview = { title, summary };
    return this;
  }

  previewInfo(info: PreviewInfo): this {
    this.row.preview = { ...this.row.preview, ...info };
    return this;
  }

  addColumn(column: StructureColumn | StructureColumnBuilder): this {
    const builtColumn = column instanceof StructureColumnBuilder ? column.build() : column;
    builtColumn.index = this.row.columns.length;
    this.row.columns.push(builtColumn);
    return this;
  }

  addColumns(...columns: (StructureColumn | StructureColumnBuilder)[]): this {
    columns.forEach(col => this.addColumn(col));
    return this;
  }

  style(style: RowStyle): this {
    this.row.style = { ...this.row.style, ...style };
    return this;
  }

  attributes(attrs: Record<string, unknown>): this {
    this.row.attributes = { ...this.row.attributes, ...attrs };
    return this;
  }

  build(): StructureRow {
    return { ...this.row, columns: [...this.row.columns] };
  }
}

/**
 * Builder for creating StructureSection instances
 */
export class StructureSectionBuilder {
  private section: StructureSection;

  constructor(index: number = 0) {
    this.section = {
      id: generateId(),
      index,
      rows: [],
    };
  }

  id(id: string): this {
    this.section.id = id;
    return this;
  }

  title(title: string): this {
    this.section.title = title;
    return this;
  }

  preview(title: string, summary?: string): this {
    this.section.preview = { title, summary };
    return this;
  }

  previewInfo(info: PreviewInfo): this {
    this.section.preview = { ...this.section.preview, ...info };
    return this;
  }

  addRow(row: StructureRow | StructureRowBuilder): this {
    const builtRow = row instanceof StructureRowBuilder ? row.build() : row;
    builtRow.index = this.section.rows.length;
    this.section.rows.push(builtRow);
    return this;
  }

  addRows(...rows: (StructureRow | StructureRowBuilder)[]): this {
    rows.forEach(row => this.addRow(row));
    return this;
  }

  style(style: SectionStyle): this {
    this.section.style = { ...this.section.style, ...style };
    return this;
  }

  attributes(attrs: Record<string, unknown>): this {
    this.section.attributes = { ...this.section.attributes, ...attrs };
    return this;
  }

  build(): StructureSection {
    return { ...this.section, rows: [...this.section.rows] };
  }
}

/**
 * Builder for creating StructurePage instances
 */
export class StructurePageBuilder {
  private page: StructurePage;

  constructor(index: number = 0) {
    this.page = {
      id: generateId(),
      index,
      sections: [],
    };
  }

  id(id: string): this {
    this.page.id = id;
    return this;
  }

  title(title: string): this {
    this.page.title = title;
    return this;
  }

  preview(title: string, summary?: string): this {
    this.page.preview = { title, summary };
    return this;
  }

  previewInfo(info: PreviewInfo): this {
    this.page.preview = { ...this.page.preview, ...info };
    return this;
  }

  addSection(section: StructureSection | StructureSectionBuilder): this {
    const builtSection = section instanceof StructureSectionBuilder ? section.build() : section;
    builtSection.index = this.page.sections.length;
    this.page.sections.push(builtSection);
    return this;
  }

  addSections(...sections: (StructureSection | StructureSectionBuilder)[]): this {
    sections.forEach(section => this.addSection(section));
    return this;
  }

  style(style: PageStyle): this {
    this.page.style = { ...this.page.style, ...style };
    return this;
  }

  attributes(attrs: Record<string, unknown>): this {
    this.page.attributes = { ...this.page.attributes, ...attrs };
    return this;
  }

  build(): StructurePage {
    return { ...this.page, sections: [...this.page.sections] };
  }
}

/**
 * Builder for creating StructureDocument instances
 */
export class StructureDocumentBuilder {
  private document: StructureDocument;

  constructor() {
    this.document = {
      id: generateId(),
      mode: 'structure',
      metadata: {},
      pages: [],
    };
  }

  id(id: string): this {
    this.document.id = id;
    return this;
  }

  metadata(metadata: DocumentMetadata): this {
    this.document.metadata = { ...this.document.metadata, ...metadata };
    return this;
  }

  title(title: string): this {
    this.document.metadata.title = title;
    return this;
  }

  author(author: string): this {
    this.document.metadata.author = author;
    return this;
  }

  preview(title: string, summary?: string): this {
    this.document.preview = { title, summary };
    return this;
  }

  previewInfo(info: PreviewInfo): this {
    this.document.preview = { ...this.document.preview, ...info };
    return this;
  }

  addPage(page: StructurePage | StructurePageBuilder): this {
    const builtPage = page instanceof StructurePageBuilder ? page.build() : page;
    builtPage.index = this.document.pages.length;
    this.document.pages.push(builtPage);
    return this;
  }

  addPages(...pages: (StructurePage | StructurePageBuilder)[]): this {
    pages.forEach(page => this.addPage(page));
    return this;
  }

  style(style: DocumentStyle): this {
    this.document.style = { ...this.document.style, ...style };
    return this;
  }

  build(): StructureDocument {
    if (!this.document.metadata.createdAt) {
      this.document.metadata.createdAt = new Date().toISOString();
    }
    this.document.metadata.updatedAt = new Date().toISOString();

    return { ...this.document, pages: [...this.document.pages] };
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Factory functions for content mode (actual document)
 */
export function createContentDocument(): ContentDocumentBuilder {
  return new ContentDocumentBuilder();
}

export function createContentPage(index?: number): ContentPageBuilder {
  return new ContentPageBuilder(index);
}

export function createContentSection(index?: number): ContentSectionBuilder {
  return new ContentSectionBuilder(index);
}

export function createContentRow(index?: number): ContentRowBuilder {
  return new ContentRowBuilder(index);
}

export function createContentColumn(index?: number): ContentColumnBuilder {
  return new ContentColumnBuilder(index);
}

export function createContentCell(index?: number): ContentCellBuilder {
  return new ContentCellBuilder(index);
}

/**
 * Factory functions for structure mode (preview/layout)
 */
export function createStructureDocument(): StructureDocumentBuilder {
  return new StructureDocumentBuilder();
}

export function createStructurePage(index?: number): StructurePageBuilder {
  return new StructurePageBuilder(index);
}

export function createStructureSection(index?: number): StructureSectionBuilder {
  return new StructureSectionBuilder(index);
}

export function createStructureRow(index?: number): StructureRowBuilder {
  return new StructureRowBuilder(index);
}

export function createStructureColumn(index?: number): StructureColumnBuilder {
  return new StructureColumnBuilder(index);
}

export function createStructureCell(index?: number): StructureCellBuilder {
  return new StructureCellBuilder(index);
}

// ============================================================================
// LEGACY ALIASES (defaults to content mode for backward compatibility)
// ============================================================================

/** @deprecated Use ContentDocumentBuilder instead */
export const DocumentBuilder = ContentDocumentBuilder;
/** @deprecated Use ContentPageBuilder instead */
export const PageBuilder = ContentPageBuilder;
/** @deprecated Use ContentSectionBuilder instead */
export const SectionBuilder = ContentSectionBuilder;
/** @deprecated Use ContentRowBuilder instead */
export const RowBuilder = ContentRowBuilder;
/** @deprecated Use ContentColumnBuilder instead */
export const ColumnBuilder = ContentColumnBuilder;
/** @deprecated Use ContentCellBuilder instead */
export const CellBuilder = ContentCellBuilder;

/** @deprecated Use createContentDocument() instead */
export const createDocument = createContentDocument;
/** @deprecated Use createContentPage() instead */
export const createPage = createContentPage;
/** @deprecated Use createContentSection() instead */
export const createSection = createContentSection;
/** @deprecated Use createContentRow() instead */
export const createRow = createContentRow;
/** @deprecated Use createContentColumn() instead */
export const createColumn = createContentColumn;
/** @deprecated Use createContentCell() instead */
export const createCell = createContentCell;
