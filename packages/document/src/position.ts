/**
 * Position utilities for locating cells within a document
 * 
 * Position format: pageIndex.sectionIndex.rowIndex.columnIndex.cellIndex
 */

import type { Document, Page, Section, Row, Column, Cell, DocumentMode } from './schema';

/**
 * Represents a position in the document hierarchy
 */
export interface CellPosition {
  pageIndex: number;
  sectionIndex: number;
  rowIndex: number;
  columnIndex: number;
  cellIndex: number;
}

/**
 * Partial position for addressing higher-level elements
 */
export interface PagePosition {
  pageIndex: number;
}

export interface SectionPosition extends PagePosition {
  sectionIndex: number;
}

export interface RowPosition extends SectionPosition {
  rowIndex: number;
}

export interface ColumnPosition extends RowPosition {
  columnIndex: number;
}

/**
 * Position string format: "pageIndex.sectionIndex.rowIndex.columnIndex.cellIndex"
 */
export type PositionString = string;

/**
 * Parse a position string into a CellPosition object
 * @param positionString - Position in format "0.1.2.3.4"
 * @returns Parsed CellPosition object
 * @throws Error if position string is invalid
 */
export function parsePosition(positionString: PositionString): CellPosition {
  const parts = positionString.split('.');
  
  if (parts.length !== 5) {
    throw new Error(
      `Invalid position string "${positionString}". Expected format: pageIndex.sectionIndex.rowIndex.columnIndex.cellIndex`
    );
  }

  const [pageIndex, sectionIndex, rowIndex, columnIndex, cellIndex] = parts.map((part, index) => {
    const num = parseInt(part, 10);
    if (isNaN(num) || num < 0) {
      const names = ['pageIndex', 'sectionIndex', 'rowIndex', 'columnIndex', 'cellIndex'];
      throw new Error(`Invalid ${names[index]} "${part}" in position string "${positionString}"`);
    }
    return num;
  });

  return { pageIndex, sectionIndex, rowIndex, columnIndex, cellIndex };
}

/**
 * Convert a CellPosition object to a position string
 * @param position - CellPosition object
 * @returns Position string in format "0.1.2.3.4"
 */
export function stringifyPosition(position: CellPosition): PositionString {
  return `${position.pageIndex}.${position.sectionIndex}.${position.rowIndex}.${position.columnIndex}.${position.cellIndex}`;
}

/**
 * Parse a partial position string (for higher-level elements)
 * @param positionString - Partial position string
 * @returns Partial position object with available indices
 */
export function parsePartialPosition(positionString: PositionString): Partial<CellPosition> {
  const parts = positionString.split('.');
  const names: (keyof CellPosition)[] = ['pageIndex', 'sectionIndex', 'rowIndex', 'columnIndex', 'cellIndex'];
  const result: Partial<CellPosition> = {};

  parts.forEach((part, index) => {
    if (index < names.length) {
      const num = parseInt(part, 10);
      if (!isNaN(num) && num >= 0) {
        result[names[index]] = num;
      }
    }
  });

  return result;
}

/**
 * Get a cell at the specified position
 * @param document - The document to search
 * @param position - Position of the cell (string or object)
 * @returns The cell at the position, or undefined if not found
 */
export function getCellAt<M extends DocumentMode = 'content'>(
  document: Document<M>,
  position: CellPosition | PositionString
): Cell<M> | undefined {
  const pos = typeof position === 'string' ? parsePosition(position) : position;

  const page = document.pages[pos.pageIndex];
  if (!page) return undefined;

  const section = page.sections[pos.sectionIndex];
  if (!section) return undefined;

  const row = section.rows[pos.rowIndex];
  if (!row) return undefined;

  const column = row.columns[pos.columnIndex];
  if (!column) return undefined;

  return column.cells[pos.cellIndex] as Cell<M> | undefined;
}

/**
 * Get a column at the specified position
 */
export function getColumnAt<M extends DocumentMode = 'content'>(
  document: Document<M>,
  position: ColumnPosition | PositionString
): Column<M> | undefined {
  const pos = typeof position === 'string' ? parsePartialPosition(position) : position;

  if (pos.pageIndex === undefined || pos.sectionIndex === undefined || 
      pos.rowIndex === undefined || pos.columnIndex === undefined) {
    return undefined;
  }

  const page = document.pages[pos.pageIndex];
  if (!page) return undefined;

  const section = page.sections[pos.sectionIndex];
  if (!section) return undefined;

  const row = section.rows[pos.rowIndex];
  if (!row) return undefined;

  return row.columns[pos.columnIndex] as Column<M> | undefined;
}

/**
 * Get a row at the specified position
 */
export function getRowAt<M extends DocumentMode = 'content'>(
  document: Document<M>,
  position: RowPosition | PositionString
): Row<M> | undefined {
  const pos = typeof position === 'string' ? parsePartialPosition(position) : position;

  if (pos.pageIndex === undefined || pos.sectionIndex === undefined || pos.rowIndex === undefined) {
    return undefined;
  }

  const page = document.pages[pos.pageIndex];
  if (!page) return undefined;

  const section = page.sections[pos.sectionIndex];
  if (!section) return undefined;

  return section.rows[pos.rowIndex] as Row<M> | undefined;
}

/**
 * Get a section at the specified position
 */
export function getSectionAt<M extends DocumentMode = 'content'>(
  document: Document<M>,
  position: SectionPosition | PositionString
): Section<M> | undefined {
  const pos = typeof position === 'string' ? parsePartialPosition(position) : position;

  if (pos.pageIndex === undefined || pos.sectionIndex === undefined) {
    return undefined;
  }

  const page = document.pages[pos.pageIndex];
  if (!page) return undefined;

  return page.sections[pos.sectionIndex] as Section<M> | undefined;
}

/**
 * Get a page at the specified position
 */
export function getPageAt<M extends DocumentMode = 'content'>(
  document: Document<M>,
  position: PagePosition | PositionString
): Page<M> | undefined {
  const pos = typeof position === 'string' ? parsePartialPosition(position) : position;

  if (pos.pageIndex === undefined) {
    return undefined;
  }

  return document.pages[pos.pageIndex] as Page<M> | undefined;
}

/**
 * Check if a position exists in the document
 */
export function positionExists<M extends DocumentMode = 'content'>(
  document: Document<M>,
  position: CellPosition | PositionString
): boolean {
  return getCellAt(document, position) !== undefined;
}

/**
 * Get all cell positions in a document
 */
export function* iterateCellPositions<M extends DocumentMode = 'content'>(document: Document<M>): Generator<CellPosition> {
  for (let pageIndex = 0; pageIndex < document.pages.length; pageIndex++) {
    const page = document.pages[pageIndex];
    for (let sectionIndex = 0; sectionIndex < page.sections.length; sectionIndex++) {
      const section = page.sections[sectionIndex];
      for (let rowIndex = 0; rowIndex < section.rows.length; rowIndex++) {
        const row = section.rows[rowIndex];
        for (let columnIndex = 0; columnIndex < row.columns.length; columnIndex++) {
          const column = row.columns[columnIndex];
          for (let cellIndex = 0; cellIndex < column.cells.length; cellIndex++) {
            yield { pageIndex, sectionIndex, rowIndex, columnIndex, cellIndex };
          }
        }
      }
    }
  }
}

/**
 * Compare two positions
 * @returns negative if a < b, positive if a > b, 0 if equal
 */
export function comparePositions(a: CellPosition, b: CellPosition): number {
  if (a.pageIndex !== b.pageIndex) return a.pageIndex - b.pageIndex;
  if (a.sectionIndex !== b.sectionIndex) return a.sectionIndex - b.sectionIndex;
  if (a.rowIndex !== b.rowIndex) return a.rowIndex - b.rowIndex;
  if (a.columnIndex !== b.columnIndex) return a.columnIndex - b.columnIndex;
  return a.cellIndex - b.cellIndex;
}
