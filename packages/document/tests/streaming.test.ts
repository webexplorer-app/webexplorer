import { describe, it, expect } from 'vitest';
import {
  // Content mode builders
  createContentDocument,
  createContentPage,
  createContentSection,
  createContentRow,
  createContentColumn,
  createContentCell,
  // Structure mode builders
  createStructureDocument,
  createStructurePage,
  createStructureSection,
  createStructureRow,
  createStructureColumn,
  createStructureCell,
  // Streaming
  serializeDocument,
  stringify,
  serializeWithBoundary,
  parse,
  parseDocument,
  parsePart,
  parseTypedPart,
  parseVendorMimeType,
  parseContentDisposition,
  serializeContentDisposition,
  splitMultipart,
  extractBoundary,
  generateBoundary,
  VendorMimeTypes,
  PROTOCOL_VERSION,
  StreamingParser,
  DocumentAssembler,
  type ContentDocument,
  type StructureDocument,
  type Part,
  type ContentDisposition,
} from '../src/index.js';

describe('Multipart Streaming Protocol', () => {
  describe('Vendor MIME Types', () => {
    it('should have correct version in MIME types', () => {
      expect(VendorMimeTypes.DOCUMENT).toBe(`application/vnd.webexplorer.document.v${PROTOCOL_VERSION}+json`);
      expect(VendorMimeTypes.CELL).toBe(`application/vnd.webexplorer.cell.v${PROTOCOL_VERSION}+json`);
    });

    it('should parse vendor MIME type correctly', () => {
      const result = parseVendorMimeType('application/vnd.webexplorer.document.v1+json');
      expect(result).toEqual({ type: 'document', version: 1, format: 'json' });
    });

    it('should parse MIME type without format suffix', () => {
      const result = parseVendorMimeType('application/vnd.webexplorer.cell-content.v1');
      expect(result).toEqual({ type: 'cell-content', version: 1, format: 'binary' });
    });

    it('should return null for non-vendor MIME types', () => {
      expect(parseVendorMimeType('text/plain')).toBeNull();
      expect(parseVendorMimeType('application/json')).toBeNull();
    });
  });

  describe('Content-Disposition', () => {
    it('should serialize Content-Disposition with all parameters', () => {
      const disposition: ContentDisposition = {
        name: 'cell',
        id: 'cell-1',
        position: '0.0.0.0.0',
        title: 'My Cell',
      };
      const result = serializeContentDisposition(disposition);
      expect(result).toBe('form-data; name="cell"; id="cell-1"; position="0.0.0.0.0"; title="My Cell"');
    });

    it('should serialize Content-Disposition with minimal parameters', () => {
      const disposition: ContentDisposition = {
        name: 'document',
        id: 'doc-1',
      };
      const result = serializeContentDisposition(disposition);
      expect(result).toBe('form-data; name="document"; id="doc-1"');
    });

    it('should parse Content-Disposition correctly', () => {
      const result = parseContentDisposition('form-data; name="cell"; id="cell-1"; position="0.0.0.0.0"; title="My Cell"');
      expect(result).toEqual({
        name: 'cell',
        id: 'cell-1',
        position: '0.0.0.0.0',
        title: 'My Cell',
      });
    });

    it('should handle escaped quotes in title', () => {
      const disposition: ContentDisposition = {
        name: 'cell',
        id: 'cell-1',
        title: 'Say "Hello"',
      };
      const serialized = serializeContentDisposition(disposition);
      expect(serialized).toContain('title="Say \\"Hello\\""');
    });

    it('should return null for invalid Content-Disposition', () => {
      expect(parseContentDisposition('')).toBeNull();
      expect(parseContentDisposition('form-data')).toBeNull();
      expect(parseContentDisposition('form-data; name="test"')).toBeNull(); // missing id
    });
  });

  describe('Boundary Generation', () => {
    it('should generate unique boundaries', () => {
      const b1 = generateBoundary();
      const b2 = generateBoundary();
      expect(b1).not.toBe(b2);
      expect(b1.startsWith('----WebExplorerBoundary')).toBe(true);
    });

    it('should extract boundary from Content-Type header', () => {
      const contentType = 'multipart/form-data; boundary=----WebExplorerBoundary123abc';
      expect(extractBoundary(contentType)).toBe('----WebExplorerBoundary123abc');
    });
  });

  describe('Part Serialization', () => {
    it('should serialize an empty content document', () => {
      const doc = createContentDocument()
        .id('doc-1')
        .title('Test Document')
        .build();

      const parts = [...serializeDocument(doc)];

      expect(parts.length).toBeGreaterThanOrEqual(1);
      expect(parts[0].headers['Content-Type']).toBe(VendorMimeTypes.DOCUMENT);
      expect(parts[0].headers['Content-Disposition']).toContain('name="document"');
      expect(parts[0].headers['Content-Disposition']).toContain('id="doc-1"');
      
      const payload = JSON.parse(parts[0].body);
      expect(payload.id).toBe('doc-1');
      expect(payload.mode).toBe('content');
    });

    it('should serialize each level as independent parts with Content-Disposition', () => {
      const doc = createContentDocument()
        .id('doc-1')
        .title('Full Document')
        .addPage(
          createContentPage()
            .id('page-1')
            .title('Page 1')
            .addSection(
              createContentSection()
                .id('section-1')
                .addRow(
                  createContentRow()
                    .id('row-1')
                    .addColumn(
                      createContentColumn()
                        .id('col-1')
                        .addCell(
                          createContentCell()
                            .id('cell-1')
                            .textContent('Hello World')
                        )
                    )
                )
            )
        )
        .build();

      const parts = [...serializeDocument(doc)];

      // Should have: document, page, section, row, column, cell = 6 parts
      expect(parts).toHaveLength(6);

      // Check Content-Disposition for each part
      const getDisposition = (part: Part) => parseContentDisposition(part.headers['Content-Disposition'] as string);

      // Document part
      expect(parts[0].headers['Content-Type']).toBe(VendorMimeTypes.DOCUMENT);
      expect(getDisposition(parts[0])?.name).toBe('document');
      expect(getDisposition(parts[0])?.id).toBe('doc-1');
      expect(getDisposition(parts[0])?.position).toBeUndefined();

      // Page part
      expect(parts[1].headers['Content-Type']).toBe(VendorMimeTypes.PAGE);
      expect(getDisposition(parts[1])?.name).toBe('page');
      expect(getDisposition(parts[1])?.id).toBe('page-1');
      expect(getDisposition(parts[1])?.position).toBe('0');
      expect(getDisposition(parts[1])?.title).toBe('Page 1');

      // Section part
      expect(parts[2].headers['Content-Type']).toBe(VendorMimeTypes.SECTION);
      expect(getDisposition(parts[2])?.name).toBe('section');
      expect(getDisposition(parts[2])?.position).toBe('0.0');

      // Row part
      expect(parts[3].headers['Content-Type']).toBe(VendorMimeTypes.ROW);
      expect(getDisposition(parts[3])?.name).toBe('row');
      expect(getDisposition(parts[3])?.position).toBe('0.0.0');

      // Column part
      expect(parts[4].headers['Content-Type']).toBe(VendorMimeTypes.COLUMN);
      expect(getDisposition(parts[4])?.name).toBe('column');
      expect(getDisposition(parts[4])?.position).toBe('0.0.0.0');

      // Cell part
      expect(parts[5].headers['Content-Type']).toBe(VendorMimeTypes.CELL);
      expect(getDisposition(parts[5])?.name).toBe('cell');
      expect(getDisposition(parts[5])?.id).toBe('cell-1');
      expect(getDisposition(parts[5])?.position).toBe('0.0.0.0.0');

      const cellPayload = JSON.parse(parts[5].body);
      expect(cellPayload.id).toBe('cell-1');
      expect(cellPayload.content.mimeType).toBe('text/plain');
      expect(cellPayload.content.data).toBe('Hello World');
    });

    it('should serialize a structure document with previews', () => {
      const doc = createStructureDocument()
        .id('struct-1')
        .title('Preview Document')
        .preview('Main Preview', 'Document overview')
        .addPage(
          createStructurePage()
            .id('page-1')
            .preview('Page Preview', 'First page')
            .addSection(
              createStructureSection()
                .id('section-1')
                .preview('Section Preview')
                .addRow(
                  createStructureRow()
                    .id('row-1')
                    .addColumn(
                      createStructureColumn()
                        .id('col-1')
                        .addCell(
                          createStructureCell()
                            .id('cell-1')
                            .preview('Image Cell', 'Product photo', 'image/jpeg')
                        )
                    )
                )
            )
        )
        .build();

      const parts = [...serializeDocument(doc)];

      // Document part should include preview
      const docPayload = JSON.parse(parts[0].body);
      expect(docPayload.mode).toBe('structure');
      expect(docPayload.preview.title).toBe('Main Preview');

      // Cell part should include preview
      const cellPayload = JSON.parse(parts[parts.length - 1].body);
      expect(cellPayload.preview.title).toBe('Image Cell');
      expect(cellPayload.preview.expectedMimeType).toBe('image/jpeg');
    });
  });

  describe('Structure vs Content Mode Serialization', () => {
    it('should serialize structure mode without content data', () => {
      const doc = createStructureDocument()
        .id('doc-1')
        .title('Structure Only')
        .addPage(
          createStructurePage()
            .id('page-1')
            .addSection(
              createStructureSection()
                .id('section-1')
                .addRow(
                  createStructureRow()
                    .id('row-1')
                    .addColumn(
                      createStructureColumn()
                        .id('col-1')
                        .addCell(
                          createStructureCell()
                            .id('cell-1')
                            .preview('Image', 'A photo', 'image/jpeg')
                            .estimatedSize(100000)
                        )
                    )
                )
            )
        )
        .build();

      const parts = [...serializeDocument(doc)];
      
      // Cell part body should NOT contain 'content' field with actual data
      const cellPart = parts.find(p => p.headers['Content-Type'] === VendorMimeTypes.CELL);
      const cellPayload = JSON.parse(cellPart!.body);
      
      expect(cellPayload.id).toBe('cell-1');
      expect(cellPayload.preview).toBeDefined();
      expect(cellPayload.preview.title).toBe('Image');
      expect(cellPayload.preview.estimatedSize).toBe(100000);
      expect(cellPayload.content).toBeUndefined(); // No actual content in structure mode
    });

    it('should serialize content mode WITH content data', () => {
      const doc = createContentDocument()
        .id('doc-1')
        .title('Content Mode')
        .addPage(
          createContentPage()
            .id('page-1')
            .addSection(
              createContentSection()
                .id('section-1')
                .addRow(
                  createContentRow()
                    .id('row-1')
                    .addColumn(
                      createContentColumn()
                        .id('col-1')
                        .addCell(
                          createContentCell()
                            .id('cell-1')
                            .content('text/plain', 'Hello World')
                        )
                    )
                )
            )
        )
        .build();

      const parts = [...serializeDocument(doc)];
      
      // Cell part body SHOULD contain 'content' field with actual data
      const cellPart = parts.find(p => p.headers['Content-Type'] === VendorMimeTypes.CELL);
      const cellPayload = JSON.parse(cellPart!.body);
      
      expect(cellPayload.id).toBe('cell-1');
      expect(cellPayload.content).toBeDefined();
      expect(cellPayload.content.mimeType).toBe('text/plain');
      expect(cellPayload.content.data).toBe('Hello World');
    });

    it('should roundtrip structure mode preserving preview without content', () => {
      const original = createStructureDocument()
        .id('doc-1')
        .title('Roundtrip Structure')
        .addPage(
          createStructurePage()
            .id('page-1')
            .addSection(
              createStructureSection()
                .id('section-1')
                .addRow(
                  createStructureRow()
                    .id('row-1')
                    .addColumn(
                      createStructureColumn()
                        .id('col-1')
                        .addCell(
                          createStructureCell()
                            .id('cell-1')
                            .preview('Video', 'A video file', 'video/mp4')
                            .estimatedSize(5000000)
                        )
                    )
                )
            )
        )
        .build();

      const serialized = stringify(original);
      const parsed = parse<'structure'>(serialized) as StructureDocument;

      expect(parsed.mode).toBe('structure');
      const cell = parsed.pages[0].sections[0].rows[0].columns[0].cells[0];
      expect(cell.preview.title).toBe('Video');
      expect(cell.preview.expectedMimeType).toBe('video/mp4');
      expect(cell.preview.estimatedSize).toBe(5000000);
      expect((cell as any).content).toBeUndefined();
    });

    it('should roundtrip content mode preserving actual content', () => {
      const original = createContentDocument()
        .id('doc-1')
        .title('Roundtrip Content')
        .addPage(
          createContentPage()
            .id('page-1')
            .addSection(
              createContentSection()
                .id('section-1')
                .addRow(
                  createContentRow()
                    .id('row-1')
                    .addColumn(
                      createContentColumn()
                        .id('col-1')
                        .addCell(
                          createContentCell()
                            .id('cell-1')
                            .content('application/json', '{"key":"value"}')
                        )
                    )
                )
            )
        )
        .build();

      const serialized = stringify(original);
      const parsed = parse<'content'>(serialized) as ContentDocument;

      expect(parsed.mode).toBe('content');
      const cell = parsed.pages[0].sections[0].rows[0].columns[0].cells[0];
      expect(cell.content?.mimeType).toBe('application/json');
      expect(cell.content?.data).toBe('{"key":"value"}');
    });
  });

  describe('Stringify to Multipart', () => {
    it('should create valid multipart format', () => {
      const doc = createContentDocument()
        .id('doc-1')
        .title('Test')
        .addPage(createContentPage().id('page-1'))
        .build();

      const { boundary, body } = serializeWithBoundary(doc);

      expect(body.startsWith(`--${boundary}`)).toBe(true);
      expect(body.endsWith(`--${boundary}--`)).toBe(true);
      expect(body).toContain('Content-Type:');
      expect(body).toContain(VendorMimeTypes.DOCUMENT);
      expect(body).toContain(VendorMimeTypes.PAGE);
    });
  });

  describe('Part Parsing', () => {
    it('should parse a single part with Content-Disposition', () => {
      const partStr = `Content-Type: application/vnd.webexplorer.cell.v1+json
Content-Disposition: form-data; name="cell"; id="cell-1"; position="0.0.0.0.0"

{"index":0}`;

      const part = parsePart(partStr);
      expect(part).not.toBeNull();
      expect(part!.headers['Content-Type']).toBe('application/vnd.webexplorer.cell.v1+json');
      expect(part!.headers['Content-Disposition']).toContain('position="0.0.0.0.0"');
      expect(part!.body).toBe('{"index":0}');
    });

    it('should parse typed part with Content-Disposition', () => {
      const part: Part = {
        headers: {
          'Content-Type': VendorMimeTypes.DOCUMENT,
          'Content-Disposition': 'form-data; name="document"; id="doc-1"',
        },
        body: '{"id":"doc-1","mode":"content","metadata":{"title":"Test"}}',
      };

      const parsed = parseTypedPart(part);
      expect(parsed.type).toBe('document');
      expect(parsed.version).toBe(1);
      expect(parsed.id).toBe('doc-1');
      expect(parsed.disposition?.name).toBe('document');
      expect((parsed.payload as any).id).toBe('doc-1');
    });
  });

  describe('Document Assembly', () => {
    it('should assemble document from parts with Content-Disposition', () => {
      const assembler = new DocumentAssembler<'content'>();

      // Add document part
      assembler.addPart({
        headers: { 
          'Content-Type': VendorMimeTypes.DOCUMENT,
          'Content-Disposition': 'form-data; name="document"; id="doc-1"',
        },
        body: '{"id":"doc-1","mode":"content","metadata":{"title":"Assembled"}}',
      });

      // Add page part
      assembler.addPart({
        headers: { 
          'Content-Type': VendorMimeTypes.PAGE, 
          'Content-Disposition': 'form-data; name="page"; id="page-1"; position="0"',
        },
        body: '{"id":"page-1","index":0,"title":"Page 1"}',
      });

      // Add section part
      assembler.addPart({
        headers: { 
          'Content-Type': VendorMimeTypes.SECTION, 
          'Content-Disposition': 'form-data; name="section"; id="section-1"; position="0.0"',
        },
        body: '{"id":"section-1","index":0}',
      });

      // Add row part
      assembler.addPart({
        headers: { 
          'Content-Type': VendorMimeTypes.ROW, 
          'Content-Disposition': 'form-data; name="row"; id="row-1"; position="0.0.0"',
        },
        body: '{"id":"row-1","index":0}',
      });

      // Add column part
      assembler.addPart({
        headers: { 
          'Content-Type': VendorMimeTypes.COLUMN, 
          'Content-Disposition': 'form-data; name="column"; id="col-1"; position="0.0.0.0"',
        },
        body: '{"id":"col-1","index":0}',
      });

      // Add cell part
      assembler.addPart({
        headers: { 
          'Content-Type': VendorMimeTypes.CELL, 
          'Content-Disposition': 'form-data; name="cell"; id="cell-1"; position="0.0.0.0.0"',
        },
        body: '{"id":"cell-1","index":0,"content":{"mimeType":"text/plain","data":"Hello"}}',
      });

      const doc = assembler.getDocument() as ContentDocument;

      expect(doc).not.toBeNull();
      expect(doc.id).toBe('doc-1');
      expect(doc.pages).toHaveLength(1);
      expect(doc.pages[0].sections[0].rows[0].columns[0].cells[0].content?.data).toBe('Hello');
    });

    it('should handle parts arriving in any order', () => {
      const assembler = new DocumentAssembler<'content'>();

      // Add cell first (out of order)
      assembler.addPart({
        headers: { 
          'Content-Type': VendorMimeTypes.CELL, 
          'Content-Disposition': 'form-data; name="cell"; id="cell-1"; position="0.0.0.0.0"',
        },
        body: '{"id":"cell-1","index":0,"content":{"mimeType":"text/plain","data":"Cell Data"}}',
      });

      // Add column
      assembler.addPart({
        headers: { 
          'Content-Type': VendorMimeTypes.COLUMN, 
          'Content-Disposition': 'form-data; name="column"; id="col-1"; position="0.0.0.0"',
        },
        body: '{"id":"col-1","index":0}',
      });

      // Add document last
      assembler.addPart({
        headers: { 
          'Content-Type': VendorMimeTypes.DOCUMENT,
          'Content-Disposition': 'form-data; name="document"; id="doc-1"',
        },
        body: '{"id":"doc-1","mode":"content","metadata":{}}',
      });

      // Add remaining in random order
      assembler.addPart({
        headers: { 
          'Content-Type': VendorMimeTypes.SECTION, 
          'Content-Disposition': 'form-data; name="section"; id="section-1"; position="0.0"',
        },
        body: '{"id":"section-1","index":0}',
      });

      assembler.addPart({
        headers: { 
          'Content-Type': VendorMimeTypes.PAGE, 
          'Content-Disposition': 'form-data; name="page"; id="page-1"; position="0"',
        },
        body: '{"id":"page-1","index":0}',
      });

      assembler.addPart({
        headers: { 
          'Content-Type': VendorMimeTypes.ROW, 
          'Content-Disposition': 'form-data; name="row"; id="row-1"; position="0.0.0"',
        },
        body: '{"id":"row-1","index":0}',
      });

      const doc = assembler.getDocument() as ContentDocument;

      expect(doc).not.toBeNull();
      expect(doc.pages[0].sections[0].rows[0].columns[0].cells[0].content?.data).toBe('Cell Data');
    });
  });

  describe('Round-trip', () => {
    it('should round-trip a content document', () => {
      const original = createContentDocument()
        .id('doc-1')
        .title('Round Trip Test')
        .author('Test Author')
        .addPage(
          createContentPage()
            .id('page-1')
            .title('Page 1')
            .addSection(
              createContentSection()
                .id('section-1')
                .title('Section 1')
                .addRow(
                  createContentRow()
                    .id('row-1')
                    .addColumn(
                      createContentColumn()
                        .id('col-1')
                        .addCell(createContentCell().id('cell-1').textContent('Text 1'))
                        .addCell(createContentCell().id('cell-2').htmlContent('<p>HTML</p>'))
                    )
                    .addColumn(
                      createContentColumn()
                        .id('col-2')
                        .addCell(createContentCell().id('cell-3').jsonContent({ key: 'value' }))
                    )
                )
            )
        )
        .build();

      const serialized = stringify(original);
      const parsed = parse<'content'>(serialized) as ContentDocument;

      expect(parsed).not.toBeNull();
      expect(parsed.id).toBe(original.id);
      expect(parsed.metadata.title).toBe(original.metadata.title);
      expect(parsed.pages).toHaveLength(1);
      expect(parsed.pages[0].sections[0].rows[0].columns).toHaveLength(2);
      expect(parsed.pages[0].sections[0].rows[0].columns[0].cells).toHaveLength(2);

      const cell1 = parsed.pages[0].sections[0].rows[0].columns[0].cells[0];
      expect(cell1.content?.data).toBe('Text 1');

      const cell3 = parsed.pages[0].sections[0].rows[0].columns[1].cells[0];
      expect(cell3.content?.data).toEqual({ key: 'value' });
    });

    it('should round-trip a structure document', () => {
      const original = createStructureDocument()
        .id('struct-1')
        .title('Structure Test')
        .preview('Document Overview', 'A preview of the document')
        .addPage(
          createStructurePage()
            .id('page-1')
            .preview('Page 1', 'First page preview')
            .addSection(
              createStructureSection()
                .id('section-1')
                .preview('Header', 'Header section')
                .addRow(
                  createStructureRow()
                    .id('row-1')
                    .addColumn(
                      createStructureColumn()
                        .id('col-1')
                        .addCell(
                          createStructureCell()
                            .id('cell-1')
                            .preview('Logo', 'Company logo', 'image/png')
                            .estimatedSize(50000)
                        )
                    )
                )
            )
        )
        .build();

      const serialized = stringify(original);
      const parsed = parse<'structure'>(serialized) as StructureDocument;

      expect(parsed).not.toBeNull();
      expect(parsed.mode).toBe('structure');
      expect(parsed.preview?.title).toBe('Document Overview');

      const cell = parsed.pages[0].sections[0].rows[0].columns[0].cells[0];
      expect(cell.preview.title).toBe('Logo');
      expect(cell.preview.expectedMimeType).toBe('image/png');
      expect(cell.preview.estimatedSize).toBe(50000);
    });
  });

  describe('Streaming Parser', () => {
    it('should parse document incrementally', () => {
      const doc = createContentDocument()
        .id('doc-1')
        .title('Streaming')
        .addPage(
          createContentPage()
            .id('page-1')
            .addSection(
              createContentSection()
                .id('section-1')
                .addRow(
                  createContentRow()
                    .id('row-1')
                    .addColumn(
                      createContentColumn()
                        .id('col-1')
                        .addCell(
                          createContentCell()
                            .id('cell-1')
                            .textContent('Hello')
                        )
                    )
                )
            )
        )
        .build();

      const { boundary, body } = serializeWithBoundary(doc);
      const parser = new StreamingParser<'content'>(boundary);

      // Feed entire body at once first (simpler case)
      parser.feed(body);
      parser.finalize();

      const finalDoc = parser.getDocument() as ContentDocument;
      expect(finalDoc).not.toBeNull();
      expect(finalDoc.id).toBe('doc-1');
      expect(finalDoc.pages[0].sections[0].rows[0].columns[0].cells[0].content?.data).toBe('Hello');
    });

    it('should provide partial document at any time', () => {
      const boundary = '----TestBoundary';
      const parser = new StreamingParser<'content'>(boundary);

      // Feed document part
      parser.feed(`--${boundary}\r
Content-Type: ${VendorMimeTypes.DOCUMENT}\r
Content-Disposition: form-data; name="document"; id="doc-1"\r
\r
{"id":"doc-1","mode":"content","metadata":{"title":"Partial"}}\r
--${boundary}\r
Content-Type: ${VendorMimeTypes.PAGE}\r
Content-Disposition: form-data; name="page"; id="page-1"; position="0"\r
\r
{"id":"page-1","index":0}\r
--${boundary}`);

      let doc = parser.getDocument();
      expect(doc).not.toBeNull();
      expect(doc!.id).toBe('doc-1');
      expect(doc!.pages).toHaveLength(1);

      // Continue feeding more parts
      parser.feed(`\r
Content-Type: ${VendorMimeTypes.SECTION}\r
Content-Disposition: form-data; name="section"; id="section-1"; position="0.0"\r
\r
{"id":"section-1","index":0}\r
--${boundary}--`);

      doc = parser.getDocument();
      expect(doc!.pages[0].sections).toHaveLength(1);
    });

    it('should reset parser state', () => {
      const parser = new StreamingParser<'content'>('----TestBoundary');

      parser.feed(`------TestBoundary\r
Content-Type: ${VendorMimeTypes.DOCUMENT}\r
\r
{"id":"doc-1","mode":"content","metadata":{}}\r
------TestBoundary--`);

      expect(parser.getDocument()).not.toBeNull();

      parser.reset();
      expect(parser.getDocument()).toBeNull();
    });
  });

  describe('Multiple Pages/Sections', () => {
    it('should handle multiple pages', () => {
      const doc = createContentDocument()
        .addPage(createContentPage().id('page-1'))
        .addPage(createContentPage().id('page-2'))
        .addPage(createContentPage().id('page-3'))
        .build();

      const serialized = stringify(doc);
      const parsed = parse<'content'>(serialized) as ContentDocument;

      expect(parsed.pages).toHaveLength(3);
      expect(parsed.pages[0].id).toBe('page-1');
      expect(parsed.pages[1].id).toBe('page-2');
      expect(parsed.pages[2].id).toBe('page-3');
    });

    it('should handle multiple sections per page', () => {
      const doc = createContentDocument()
        .addPage(
          createContentPage()
            .id('page-1')
            .addSection(createContentSection().id('section-1'))
            .addSection(createContentSection().id('section-2'))
        )
        .build();

      const serialized = stringify(doc);
      const parsed = parse<'content'>(serialized) as ContentDocument;

      expect(parsed.pages[0].sections).toHaveLength(2);
    });

    it('should correctly assign positions for complex hierarchy', () => {
      const doc = createContentDocument()
        .id('doc-1')
        .addPage(
          createContentPage()
            .id('page-0')
            .addSection(
              createContentSection()
                .id('section-0-0')
                .addRow(
                  createContentRow()
                    .id('row-0-0-0')
                    .addColumn(
                      createContentColumn()
                        .id('col-0-0-0-0')
                        .addCell(createContentCell().id('cell-0').textContent('0.0.0.0.0'))
                        .addCell(createContentCell().id('cell-1').textContent('0.0.0.0.1'))
                    )
                    .addColumn(
                      createContentColumn()
                        .id('col-0-0-0-1')
                        .addCell(createContentCell().id('cell-2').textContent('0.0.0.1.0'))
                    )
                )
            )
        )
        .addPage(
          createContentPage()
            .id('page-1')
            .addSection(
              createContentSection()
                .id('section-1-0')
                .addRow(
                  createContentRow()
                    .id('row-1-0-0')
                    .addColumn(
                      createContentColumn()
                        .id('col-1-0-0-0')
                        .addCell(createContentCell().id('cell-3').textContent('1.0.0.0.0'))
                    )
                )
            )
        )
        .build();

      const parts = [...serializeDocument(doc)];

      // Find cell parts and check positions via Content-Disposition
      const cellParts = parts.filter(p => p.headers['Content-Type'] === VendorMimeTypes.CELL);

      expect(cellParts).toHaveLength(4);
      expect(cellParts[0].headers['Content-Disposition']).toContain('position="0.0.0.0.0"');
      expect(cellParts[1].headers['Content-Disposition']).toContain('position="0.0.0.0.1"');
      expect(cellParts[2].headers['Content-Disposition']).toContain('position="0.0.0.1.0"');
      expect(cellParts[3].headers['Content-Disposition']).toContain('position="1.0.0.0.0"');
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in content', () => {
      const doc = createContentDocument()
        .addPage(
          createContentPage().addSection(
            createContentSection().addRow(
              createContentRow().addColumn(
                createContentColumn().addCell(
                  createContentCell().textContent('Special: "quotes", \\backslash\\, 日本語, emoji 🎉')
                )
              )
            )
          )
        )
        .build();

      const serialized = stringify(doc);
      const parsed = parse<'content'>(serialized) as ContentDocument;

      const cell = parsed.pages[0].sections[0].rows[0].columns[0].cells[0];
      expect(cell.content?.data).toBe('Special: "quotes", \\backslash\\, 日本語, emoji 🎉');
    });

    it('should handle nested JSON in content', () => {
      const nestedData = {
        level1: {
          level2: {
            level3: ['a', 'b', 'c'],
          },
        },
      };

      const doc = createContentDocument()
        .addPage(
          createContentPage().addSection(
            createContentSection().addRow(
              createContentRow().addColumn(
                createContentColumn().addCell(createContentCell().jsonContent(nestedData))
              )
            )
          )
        )
        .build();

      const serialized = stringify(doc);
      const parsed = parse<'content'>(serialized) as ContentDocument;

      const cell = parsed.pages[0].sections[0].rows[0].columns[0].cells[0];
      expect(cell.content?.data).toEqual(nestedData);
    });

    it('should handle empty document', () => {
      const doc = createContentDocument().id('empty').title('Empty').build();

      const serialized = stringify(doc);
      const parsed = parse<'content'>(serialized) as ContentDocument;

      expect(parsed.id).toBe('empty');
      expect(parsed.pages).toHaveLength(0);
    });

    it('should track parts count correctly', () => {
      const assembler = new DocumentAssembler<'content'>();

      assembler.addPart({
        headers: { 
          'Content-Type': VendorMimeTypes.DOCUMENT,
          'Content-Disposition': 'form-data; name="document"; id="doc-1"',
        },
        body: '{"id":"doc-1","mode":"content","metadata":{}}',
      });

      assembler.addPart({
        headers: { 
          'Content-Type': VendorMimeTypes.PAGE, 
          'Content-Disposition': 'form-data; name="page"; id="page-1"; position="0"',
        },
        body: '{"id":"page-1","index":0}',
      });

      expect(assembler.getPartsCount()).toBe(2);
      expect(assembler.hasDocumentHeader()).toBe(true);
    });
  });

  describe('Protocol Versioning', () => {
    it('should detect version from MIME type', () => {
      // V1
      let result = parseVendorMimeType('application/vnd.webexplorer.document.v1+json');
      expect(result?.version).toBe(1);

      // Hypothetical V2
      result = parseVendorMimeType('application/vnd.webexplorer.document.v2+json');
      expect(result?.version).toBe(2);

      // V10
      result = parseVendorMimeType('application/vnd.webexplorer.cell.v10+json');
      expect(result?.version).toBe(10);
    });

    it('should support different formats in MIME type', () => {
      const jsonType = parseVendorMimeType('application/vnd.webexplorer.cell.v1+json');
      expect(jsonType?.format).toBe('json');

      const binaryType = parseVendorMimeType('application/vnd.webexplorer.cell-content.v1');
      expect(binaryType?.format).toBe('binary');
    });
  });

  describe('Content-Length Header', () => {
    it('should include Content-Length when requested', () => {
      const doc = createContentDocument()
        .id('doc-1')
        .title('Test')
        .build();

      const parts = [...serializeDocument(doc, { includeContentLength: true })];

      expect(parts[0].headers['Content-Length']).toBeDefined();
      expect(typeof parts[0].headers['Content-Length']).toBe('number');
    });

    it('should not include Content-Length by default', () => {
      const doc = createContentDocument()
        .id('doc-1')
        .title('Test')
        .build();

      const parts = [...serializeDocument(doc)];

      expect(parts[0].headers['Content-Length']).toBeUndefined();
    });
  });
});
