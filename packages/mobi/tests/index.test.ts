import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { parse, Compression, EncryptionType } from '../src';

describe('Mobi Parser', () => {
    const sampleFiles = [
        'sample-1.mobi',
        'sample-2.mobi',
        'sample-3.mobi',
        'sample-4.mobi',
    ];

    it('should parse sample-1.mobi correctly (Letter)', () => {
        const filePath = path.resolve(__dirname, 'data', 'sample-1.mobi');
        const buffer = fs.readFileSync(filePath);
        const mobi = parse(buffer.buffer);

        // Verify PDB Header
        const { pdbHeader } = mobi.metadata;
        expect(pdbHeader.name).toContain('Letter');
        expect(pdbHeader.type).toBe('BOOK');
        expect(pdbHeader.creator).toBe('MOBI');
        expect(pdbHeader.recordNum).toBe(10);

        // Verify PalmDDC Header
        const { palmDDCHeader } = mobi.metadata;
        expect(palmDDCHeader.compression).toBe(Compression.PalmDDC);
        expect(palmDDCHeader.textLength).toBe(2934);
        expect(palmDDCHeader.recordCount).toBe(1);
        expect(palmDDCHeader.recordSize).toBe(4096);
        expect(palmDDCHeader.encryptionType).toBe(EncryptionType.NoEncryption);

        // Verify MOBI Header
        const { mobiHeader } = mobi.metadata;
        expect(mobiHeader.identifier).toBe(1297039945);
        expect(mobiHeader.headerLength).toBe(232);
        expect(mobiHeader.mobiType).toBe(2);
        expect(mobiHeader.textEncoding).toBe(65001);
        expect(mobiHeader.language).toBe(9);
        expect(mobiHeader.firstImageIdx).toBe(6);

        // Verify Record List
        const { recordList } = mobi.metadata;
        expect(recordList.length).toBe(10);
        expect(recordList[0].offset).toBe(160);
        expect(recordList[1].offset).toBe(8944);

        // Verify text content
        expect(mobi.text.length).toBe(2934);
        expect(mobi.text).toContain('<html>');
        expect(mobi.text).toContain('Your Name');
        expect(mobi.text).toContain('123 Your Street');
    });

    it('should parse sample-2.mobi correctly (Resume)', () => {
        const filePath = path.resolve(__dirname, 'data', 'sample-2.mobi');
        const buffer = fs.readFileSync(filePath);
        const mobi = parse(buffer.buffer);

        // Verify PDB Header
        const { pdbHeader } = mobi.metadata;
        expect(pdbHeader.name).toContain('Resume');
        expect(pdbHeader.type).toBe('BOOK');
        expect(pdbHeader.creator).toBe('MOBI');
        expect(pdbHeader.recordNum).toBe(10);

        // Verify PalmDDC Header
        const { palmDDCHeader } = mobi.metadata;
        expect(palmDDCHeader.compression).toBe(Compression.PalmDDC);
        expect(palmDDCHeader.textLength).toBe(7300);
        expect(palmDDCHeader.recordCount).toBe(2);
        expect(palmDDCHeader.recordSize).toBe(4096);
        expect(palmDDCHeader.encryptionType).toBe(EncryptionType.NoEncryption);

        // Verify MOBI Header
        const { mobiHeader } = mobi.metadata;
        expect(mobiHeader.headerLength).toBe(232);
        expect(mobiHeader.textEncoding).toBe(65001);
        expect(mobiHeader.language).toBe(9);
        expect(mobiHeader.firstImageIdx).toBe(10);

        // Verify text content
        expect(mobi.text.length).toBe(7291);
        expect(mobi.text).toContain('<html>');
        expect(mobi.text).toContain('Hello');
        expect(mobi.text).toContain('Your Name');
    });

    it('should parse sample-3.mobi correctly (Resume with table)', () => {
        const filePath = path.resolve(__dirname, 'data', 'sample-3.mobi');
        const buffer = fs.readFileSync(filePath);
        const mobi = parse(buffer.buffer);

        // Verify PDB Header
        const { pdbHeader } = mobi.metadata;
        expect(pdbHeader.name).toContain('Resume');
        expect(pdbHeader.type).toBe('BOOK');
        expect(pdbHeader.creator).toBe('MOBI');
        expect(pdbHeader.recordNum).toBe(11);

        // Verify PalmDDC Header
        const { palmDDCHeader } = mobi.metadata;
        expect(palmDDCHeader.compression).toBe(Compression.PalmDDC);
        expect(palmDDCHeader.textLength).toBe(10030);
        expect(palmDDCHeader.recordCount).toBe(3);
        expect(palmDDCHeader.recordSize).toBe(4096);

        // Verify MOBI Header
        const { mobiHeader } = mobi.metadata;
        expect(mobiHeader.headerLength).toBe(232);
        expect(mobiHeader.firstImageIdx).toBe(11);

        // Verify Record List
        const { recordList } = mobi.metadata;
        expect(recordList.length).toBe(11);
        expect(recordList[0].offset).toBe(168);

        // Verify text content
        expect(mobi.text.length).toBe(9984);
        expect(mobi.text).toContain('<html>');
        expect(mobi.text).toContain('<table');
        expect(mobi.text).toContain('Your Name');
        expect(mobi.text).toContain('Lorem ipsum dolor sit amet');
    });

    it('should parse sample-4.mobi correctly (Sample Document)', () => {
        const filePath = path.resolve(__dirname, 'data', 'sample-4.mobi');
        const buffer = fs.readFileSync(filePath);
        const mobi = parse(buffer.buffer);

        // Verify PDB Header
        const { pdbHeader } = mobi.metadata;
        expect(pdbHeader.name).toContain('sample');
        expect(pdbHeader.type).toBe('BOOK');
        expect(pdbHeader.creator).toBe('MOBI');
        expect(pdbHeader.recordNum).toBe(8);

        // Verify PalmDDC Header
        const { palmDDCHeader } = mobi.metadata;
        expect(palmDDCHeader.compression).toBe(Compression.PalmDDC);
        expect(palmDDCHeader.textLength).toBe(1947);
        expect(palmDDCHeader.recordCount).toBe(1);
        expect(palmDDCHeader.recordSize).toBe(4096);

        // Verify MOBI Header
        const { mobiHeader } = mobi.metadata;
        expect(mobiHeader.headerLength).toBe(232);
        expect(mobiHeader.firstImageIdx).toBe(8);

        // Verify Record List
        const { recordList } = mobi.metadata;
        expect(recordList.length).toBe(8);
        expect(recordList[0].offset).toBe(144);

        // Verify text content
        expect(mobi.text.length).toBe(1947);
        expect(mobi.text).toContain('<html>');
        expect(mobi.text).toContain('Sample Document');
        expect(mobi.text).toContain('Fusce convallis metus');
    });

    it('should handle PalmDDC compression correctly', () => {
        const buffer = fs.readFileSync(path.resolve(__dirname, 'data', 'sample-1.mobi'));
        const mobi = parse(buffer.buffer);

        // All samples use PalmDDC compression (compression type 2)
        expect(mobi.metadata.palmDDCHeader.compression).toBe(Compression.PalmDDC);
        expect(mobi.metadata.palmDDCHeader.compression).toBe(2);
        
        // Should successfully decompress and extract text
        expect(mobi.text.length).toBe(2934);
        expect(mobi.text).toContain('Your Name');
    });

    it('should parse all metadata timestamp fields correctly', () => {
        const buffer = fs.readFileSync(path.resolve(__dirname, 'data', 'sample-1.mobi'));
        const mobi = parse(buffer.buffer);

        const { metadata } = mobi;

        // Check PDB header timestamp fields
        expect(metadata.pdbHeader.ctime).toBe(1730278375);
        expect(metadata.pdbHeader.mtime).toBe(1730278375);
        expect(metadata.pdbHeader.btime).toBe(0);
        expect(metadata.pdbHeader.attr).toBe(0);
        expect(metadata.pdbHeader.version).toBe(0);

        // Check MOBI header fields
        expect(metadata.mobiHeader.mobiType).toBe(2);
        expect(metadata.mobiHeader.language).toBe(9);
        expect(metadata.mobiHeader.formatVersion).toBe(6);
        expect(metadata.mobiHeader.generatorVersion).toBe(6);
    });

    it('should extract UTF-8 encoded text correctly', () => {
        const buffer = fs.readFileSync(path.resolve(__dirname, 'data', 'sample-1.mobi'));
        const mobi = parse(buffer.buffer);

        // Text encoding should be UTF-8 (65001)
        expect(mobi.metadata.mobiHeader.textEncoding).toBe(65001);
        
        // Text should be valid UTF-8 string
        expect(typeof mobi.text).toBe('string');
        expect(mobi.text.length).toBe(2934);
        
        // Should contain HTML tags and readable text
        expect(mobi.text).toMatch(/<html>/);
        expect(mobi.text).toMatch(/<\/html>/);
        expect(mobi.text).toMatch(/<p.*?>/);
        expect(/[a-zA-Z0-9]/.test(mobi.text)).toBe(true);
    });

    it('should verify no encryption is used in all sample files', () => {
        for (const fileName of sampleFiles) {
            const filePath = path.resolve(__dirname, 'data', fileName);
            const buffer = fs.readFileSync(filePath);
            const mobi = parse(buffer.buffer);
            
            // All samples should have no encryption
            expect(mobi.metadata.palmDDCHeader.encryptionType).toBe(EncryptionType.NoEncryption);
            expect(mobi.metadata.palmDDCHeader.encryptionType).toBe(0);
        }
    });

    it('should parse all common MOBI header fields consistently', () => {
        for (const fileName of sampleFiles) {
            const filePath = path.resolve(__dirname, 'data', fileName);
            const buffer = fs.readFileSync(filePath);
            const mobi = parse(buffer.buffer);
            
            const { mobiHeader } = mobi.metadata;
            
            // Common fields across all samples
            expect(mobiHeader.identifier).toBe(1297039945); // 'MOBI' signature
            expect(mobiHeader.headerLength).toBe(232);
            expect(mobiHeader.mobiType).toBe(2);
            expect(mobiHeader.textEncoding).toBe(65001); // UTF-8
            expect(mobiHeader.language).toBe(9);
            expect(mobiHeader.formatVersion).toBe(6);
            expect(mobiHeader.exthFlags).toBe(80);
            expect(mobiHeader.drmOffset).toBe(4294967295);
            expect(mobiHeader.drmCount).toBe(0);
            expect(mobiHeader.extraFlags).toBe(3);
        }
    });
});
