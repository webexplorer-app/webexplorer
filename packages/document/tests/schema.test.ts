import { describe, it, expect } from 'vitest';
import {
  // Content mode
  createContentDocument,
  createContentPage,
  createContentSection,
  createContentRow,
  createContentColumn,
  createContentCell,
  // Structure mode
  createStructureDocument,
  createStructurePage,
  createStructureSection,
  createStructureRow,
  createStructureColumn,
  createStructureCell,
  // Position utilities
  parsePosition,
  stringifyPosition,
  getCellAt,
  getPageAt,
  getSectionAt,
  getRowAt,
  getColumnAt,
  positionExists,
  iterateCellPositions,
  comparePositions,
  // Type guards
  isStructureDocument,
  isContentDocument,
  // Legacy aliases
  createDocument,
  createPage,
  createSection,
  createRow,
  createColumn,
  createCell,
  type CellPosition,
  type ContentDocument,
  type StructureDocument,
} from '../src/index.js';

describe('Document Schema', () => {
  describe('Content Mode - Document Builder', () => {
    it('should create an empty content document', () => {
      const doc = createContentDocument().title('Test Document').build();

      expect(doc.id).toBeDefined();
      expect(doc.mode).toBe('content');
      expect(doc.metadata.title).toBe('Test Document');
      expect(doc.pages).toHaveLength(0);
    });

    it('should create a content document with full hierarchy', () => {
      const doc = createContentDocument()
        .title('Full Document')
        .author('Test Author')
        .addPage(
          createContentPage()
            .title('Page 1')
            .addSection(
              createContentSection()
                .title('Section 1')
                .addRow(
                  createContentRow()
                    .addColumn(
                      createContentColumn()
                        .addCell(createContentCell().textContent('Hello World'))
                    )
                )
            )
        )
        .build();

      expect(doc.mode).toBe('content');
      expect(doc.pages).toHaveLength(1);
      expect(doc.pages[0].sections).toHaveLength(1);
      expect(doc.pages[0].sections[0].rows).toHaveLength(1);
      expect(doc.pages[0].sections[0].rows[0].columns).toHaveLength(1);
      expect(doc.pages[0].sections[0].rows[0].columns[0].cells).toHaveLength(1);
      expect(doc.pages[0].sections[0].rows[0].columns[0].cells[0].content?.data).toBe('Hello World');
    });

    it('should create cells with different content types', () => {
      const textCell = createContentCell().textContent('Plain text').build();
      const htmlCell = createContentCell().htmlContent('<p>HTML</p>').build();
      const markdownCell = createContentCell().markdownContent('# Heading').build();
      const jsonCell = createContentCell().jsonContent({ key: 'value' }).build();

      expect(textCell.content?.mimeType).toBe('text/plain');
      expect(htmlCell.content?.mimeType).toBe('text/html');
      expect(markdownCell.content?.mimeType).toBe('text/markdown');
      expect(jsonCell.content?.mimeType).toBe('application/json');
    });
  });

  describe('Structure Mode - Document Builder', () => {
    it('should create an empty structure document', () => {
      const doc = createStructureDocument()
        .title('Preview Document')
        .preview('Document Overview', 'A summary of the document')
        .build();

      expect(doc.id).toBeDefined();
      expect(doc.mode).toBe('structure');
      expect(doc.metadata.title).toBe('Preview Document');
      expect(doc.preview?.title).toBe('Document Overview');
      expect(doc.preview?.summary).toBe('A summary of the document');
      expect(doc.pages).toHaveLength(0);
    });

    it('should create a structure document with preview info at all levels', () => {
      const doc = createStructureDocument()
        .title('Structure Preview')
        .preview('Main Document', 'Overview of all content')
        .addPage(
          createStructurePage()
            .title('Page 1')
            .preview('First Page', 'Introduction and overview')
            .addSection(
              createStructureSection()
                .title('Header Section')
                .preview('Header', 'Contains logo and navigation')
                .addRow(
                  createStructureRow()
                    .preview('Logo Row', 'Company branding')
                    .addColumn(
                      createStructureColumn()
                        .preview('Logo Column', 'Main logo area')
                        .addCell(
                          createStructureCell()
                            .preview('Company Logo', 'PNG image of logo', 'image/png')
                            .estimatedSize(50000)
                        )
                    )
                )
            )
        )
        .build();

      expect(doc.mode).toBe('structure');
      expect(doc.preview?.title).toBe('Main Document');
      expect(doc.pages[0].preview?.title).toBe('First Page');
      expect(doc.pages[0].sections[0].preview?.title).toBe('Header');
      expect(doc.pages[0].sections[0].rows[0].preview?.title).toBe('Logo Row');
      expect(doc.pages[0].sections[0].rows[0].columns[0].preview?.title).toBe('Logo Column');
      
      const cell = doc.pages[0].sections[0].rows[0].columns[0].cells[0];
      expect(cell.preview.title).toBe('Company Logo');
      expect(cell.preview.expectedMimeType).toBe('image/png');
      expect(cell.preview.estimatedSize).toBe(50000);
    });

    it('should create structure cells with preview info', () => {
      const cell = createStructureCell()
        .preview('Product Image', 'Main product photo', 'image/jpeg')
        .thumbnail('data:image/jpeg;base64,...')
        .estimatedSize(120000)
        .build();

      expect(cell.preview.title).toBe('Product Image');
      expect(cell.preview.summary).toBe('Main product photo');
      expect(cell.preview.expectedMimeType).toBe('image/jpeg');
      expect(cell.preview.thumbnail).toBe('data:image/jpeg;base64,...');
      expect(cell.preview.estimatedSize).toBe(120000);
    });
  });

  describe('Type Guards', () => {
    it('should identify structure documents', () => {
      const structureDoc = createStructureDocument().build();
      const contentDoc = createContentDocument().build();

      expect(isStructureDocument(structureDoc)).toBe(true);
      expect(isStructureDocument(contentDoc)).toBe(false);
    });

    it('should identify content documents', () => {
      const structureDoc = createStructureDocument().build();
      const contentDoc = createContentDocument().build();

      expect(isContentDocument(contentDoc)).toBe(true);
      expect(isContentDocument(structureDoc)).toBe(false);
    });
  });

  describe('Type Safety', () => {
    it('should not allow mixing content and structure builders', () => {
      // This test verifies compile-time type safety
      // The following would cause TypeScript errors if uncommented:
      
      // createContentColumn().addCell(createStructureCell()); // Error!
      // createStructureColumn().addCell(createContentCell()); // Error!
      
      // Instead, we verify correct usage compiles
      const contentCol = createContentColumn()
        .addCell(createContentCell().textContent('test'))
        .build();
      
      const structureCol = createStructureColumn()
        .addCell(createStructureCell().preview('test'))
        .build();

      expect(contentCol.cells).toHaveLength(1);
      expect(structureCol.cells).toHaveLength(1);
    });
  });

  describe('Legacy Compatibility', () => {
    it('should work with legacy aliases (defaults to content mode)', () => {
      const doc = createDocument()
        .title('Legacy Document')
        .addPage(
          createPage()
            .addSection(
              createSection()
                .addRow(
                  createRow()
                    .addColumn(
                      createColumn()
                        .addCell(createCell().textContent('Legacy content'))
                    )
                )
            )
        )
        .build();

      expect(doc.mode).toBe('content');
      expect(doc.pages[0].sections[0].rows[0].columns[0].cells[0].content?.data).toBe('Legacy content');
    });
  });

  describe('Position Utilities', () => {
    it('should parse position string', () => {
      const pos = parsePosition('1.2.3.4.5');

      expect(pos.pageIndex).toBe(1);
      expect(pos.sectionIndex).toBe(2);
      expect(pos.rowIndex).toBe(3);
      expect(pos.columnIndex).toBe(4);
      expect(pos.cellIndex).toBe(5);
    });

    it('should stringify position', () => {
      const pos: CellPosition = {
        pageIndex: 0,
        sectionIndex: 1,
        rowIndex: 2,
        columnIndex: 3,
        cellIndex: 4,
      };

      expect(stringifyPosition(pos)).toBe('0.1.2.3.4');
    });

    it('should throw on invalid position string', () => {
      expect(() => parsePosition('1.2.3')).toThrow();
      expect(() => parsePosition('a.b.c.d.e')).toThrow();
      expect(() => parsePosition('-1.0.0.0.0')).toThrow();
    });

    it('should get cell at position in content document', () => {
      const doc = createContentDocument()
        .addPage(
          createContentPage()
            .addSection(
              createContentSection()
                .addRow(
                  createContentRow()
                    .addColumn(
                      createContentColumn()
                        .addCell(createContentCell().textContent('Cell 0'))
                        .addCell(createContentCell().textContent('Cell 1'))
                    )
                )
            )
        )
        .build();

      const cell0 = getCellAt(doc, '0.0.0.0.0');
      const cell1 = getCellAt(doc, { pageIndex: 0, sectionIndex: 0, rowIndex: 0, columnIndex: 0, cellIndex: 1 });

      expect(cell0?.content?.data).toBe('Cell 0');
      expect(cell1?.content?.data).toBe('Cell 1');
    });

    it('should get cell at position in structure document', () => {
      const doc = createStructureDocument()
        .addPage(
          createStructurePage()
            .addSection(
              createStructureSection()
                .addRow(
                  createStructureRow()
                    .addColumn(
                      createStructureColumn()
                        .addCell(createStructureCell().preview('Preview 0'))
                        .addCell(createStructureCell().preview('Preview 1'))
                    )
                )
            )
        )
        .build();

      const cell0 = getCellAt<"structure">(doc, '0.0.0.0.0');
      const cell1 = getCellAt<"structure">(doc, { pageIndex: 0, sectionIndex: 0, rowIndex: 0, columnIndex: 0, cellIndex: 1 });

      expect(cell0?.preview.title).toBe('Preview 0');
      expect(cell1?.preview.title).toBe('Preview 1');
    });

    it('should return undefined for non-existent position', () => {
      const doc = createContentDocument().addPage(createContentPage()).build();

      expect(getCellAt(doc, '0.0.0.0.0')).toBeUndefined();
      expect(getCellAt(doc, '5.0.0.0.0')).toBeUndefined();
    });

    it('should check position existence', () => {
      const doc = createContentDocument()
        .addPage(
          createContentPage()
            .addSection(
              createContentSection()
                .addRow(
                  createContentRow()
                    .addColumn(
                      createContentColumn()
                        .addCell(createContentCell().textContent('Test'))
                    )
                )
            )
        )
        .build();

      expect(positionExists(doc, '0.0.0.0.0')).toBe(true);
      expect(positionExists(doc, '0.0.0.0.1')).toBe(false);
      expect(positionExists(doc, '1.0.0.0.0')).toBe(false);
    });

    it('should get higher-level elements at position', () => {
      const doc = createContentDocument()
        .addPage(
          createContentPage()
            .title('Page Title')
            .addSection(
              createContentSection()
                .title('Section Title')
                .addRow(
                  createContentRow()
                    .addColumn(
                      createContentColumn()
                        .addCell(createContentCell().textContent('Test'))
                    )
                )
            )
        )
        .build();

      expect(getPageAt(doc, '0')?.title).toBe('Page Title');
      expect(getSectionAt(doc, '0.0')?.title).toBe('Section Title');
      expect(getRowAt(doc, '0.0.0')).toBeDefined();
      expect(getColumnAt(doc, '0.0.0.0')).toBeDefined();
    });
  });

  describe('Position Iteration', () => {
    it('should iterate all cell positions', () => {
      const doc = createContentDocument()
        .addPage(
          createContentPage()
            .addSection(
              createContentSection()
                .addRow(
                  createContentRow()
                    .addColumn(createContentColumn().addCell(createContentCell()))
                    .addColumn(createContentColumn().addCell(createContentCell()))
                )
            )
        )
        .addPage(
          createContentPage()
            .addSection(
              createContentSection()
                .addRow(
                  createContentRow()
                    .addColumn(createContentColumn().addCell(createContentCell()))
                )
            )
        )
        .build();

      const positions = [...iterateCellPositions(doc)];

      expect(positions).toHaveLength(3);
      expect(stringifyPosition(positions[0])).toBe('0.0.0.0.0');
      expect(stringifyPosition(positions[1])).toBe('0.0.0.1.0');
      expect(stringifyPosition(positions[2])).toBe('1.0.0.0.0');
    });
  });

  describe('Position Comparison', () => {
    it('should compare positions correctly', () => {
      const pos1: CellPosition = { pageIndex: 0, sectionIndex: 0, rowIndex: 0, columnIndex: 0, cellIndex: 0 };
      const pos2: CellPosition = { pageIndex: 0, sectionIndex: 0, rowIndex: 0, columnIndex: 0, cellIndex: 1 };
      const pos3: CellPosition = { pageIndex: 1, sectionIndex: 0, rowIndex: 0, columnIndex: 0, cellIndex: 0 };

      expect(comparePositions(pos1, pos1)).toBe(0);
      expect(comparePositions(pos1, pos2)).toBeLessThan(0);
      expect(comparePositions(pos2, pos1)).toBeGreaterThan(0);
      expect(comparePositions(pos1, pos3)).toBeLessThan(0);
    });
  });
});
