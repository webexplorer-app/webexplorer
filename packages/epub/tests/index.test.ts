import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';
import { init, unarchive } from '@webexplorer/archive';
import { parse } from '../src';

describe('EPub Parser', () => {
    it('should parse accessible.epub correctly', async () => {
        // Load WASM binary for archive extraction
        const wasmBinary = fs.readFileSync(
            path.resolve(__dirname, '../../archive/src/libarchive.wasm')
        );

        const wasmModule = await init({
            wasmBinary: wasmBinary.buffer,
        });

        // Load the EPUB file
        const epubBuffer = fs.readFileSync(
            path.resolve(__dirname, 'data/accessible.epub')
        );

        // Extract archive entries
        const filePtr = wasmModule.malloc(epubBuffer.length);
        wasmModule.module.HEAP8.set(new Int8Array(epubBuffer), filePtr);

        const entries = await unarchive(wasmModule, filePtr, epubBuffer.length, null);

        // Parse the EPUB
        const epub = parse({ entries });

        // Verify the structure
        expect(epub).toEqual({
            "root": "EPUB/",
            "metadata": {
                "title": "Accessible EPUB 3",
                "creator": "Matt Garrish", "language": "en", "publisher": "O’Reilly Media, Inc.", "identifier": "urn:isbn:9781449328030", "others": []
            },
            "manifest": {
                "items": {
                    "htmltoc": {
                        "id": "htmltoc",
                        "href": "bk01-toc.xhtml",
                        "mediaType": "application/xhtml+xml"
                    },
                    "epub-css": {
                        "id": "epub-css",
                        "href": "css/epub.css", "mediaType": "text/css"
                    },
                    "epub-tss-css": {
                        "id": "epub-tss-css",
                        "href": "css/synth.css", "mediaType": "text/css"
                    },
                    "cover": { "id": "cover", "href": "cover.xhtml", "mediaType": "application/xhtml+xml" },
                    "cover-image":
                        { "id": "cover-image", "href": "covers/9781449328030_lrg.jpg", "mediaType": "image/jpeg" },
                    "id-id2442754":
                        { "id": "id-id2442754", "href": "index.xhtml", "mediaType": "application/xhtml+xml" },
                    "id-id2632344": { "id": "id-id2632344", "href": "pr01.xhtml", "mediaType": "application/xhtml+xml" }, "id-id2604743": { "id": "id-id2604743", "href": "pr01s02.xhtml", "mediaType": "application/xhtml+xml" }, "id-id2629773": { "id": "id-id2629773", "href": "pr01s03.xhtml", "mediaType": "application/xhtml+xml" }, "id-id2620395": { "id": "id-id2620395", "href": "pr01s04.xhtml", "mediaType": "application/xhtml+xml" }, "id-id2638681": { "id": "id-id2638681", "href": "pr01s05.xhtml", "mediaType": "application/xhtml+xml" }, "id-id2611884": { "id": "id-id2611884", "href": "ch01.xhtml", "mediaType": "application/xhtml+xml" }, "id-id2627310": { "id": "id-id2627310", "href": "ch01s02.xhtml", "mediaType": "application/xhtml+xml" }, "id-id2635343": { "id": "id-id2635343", "href": "ch02.xhtml", "mediaType": "application/xhtml+xml" }, "id-id2622654": { "id": "id-id2622654", "href": "ch02s02.xhtml", "mediaType": "application/xhtml+xml" }, "id-id2624850": { "id": "id-id2624850", "href": "ch02s03.xhtml", "mediaType": "application/xhtml+xml" }, "id-id2640702": { "id": "id-id2640702", "href": "ch03.xhtml", "mediaType": "application/xhtml+xml" }, "id-id2641220": { "id": "id-id2641220", "href": "ch03s02.xhtml", "mediaType": "application/xhtml+xml" }, "id-id2642385": { "id": "id-id2642385", "href": "ch03s03.xhtml", "mediaType": "application/xhtml+xml" }, "id-id2644001": { "id": "id-id2644001", "href": "ch03s04.xhtml", "mediaType": "application/xhtml+xml" }, "id-id2644238": { "id": "id-id2644238", "href": "ch03s05.xhtml", "mediaType": "application/xhtml+xml" }, "id-id2645594": { "id": "id-id2645594", "href": "ch03s06.xhtml", "mediaType": "application/xhtml+xml" }, "id-id2645682": { "id": "id-id2645682", "href": "ch04.xhtml", "mediaType": "application/xhtml+xml" }, "id-id2645862": { "id": "id-id2645862", "href": "co01.xhtml", "mediaType": "application/xhtml+xml" }, "id2670620": { "id": "id2670620", "href": "images/web/epub3_0401.png", "mediaType": "image/png" }, "spi_ad": { "id": "spi_ad", "href": "spi-ad.xhtml", "mediaType": "application/xhtml+xml" }, "spi_global_ad": { "id": "spi_global_ad", "href": "images/spi_global_ad.png", "mediaType": "image/png" }, "epub.embedded.font.1": { "id": "epub.embedded.font.1", "href": "fonts/UbuntuMono-B.ttf", "mediaType": "application/vnd.ms-opentype" }, "epub.embedded.font.2": { "id": "epub.embedded.font.2", "href": "fonts/UbuntuMono-BI.ttf", "mediaType": "application/vnd.ms-opentype" }, "epub.embedded.font.3": { "id": "epub.embedded.font.3", "href": "fonts/UbuntuMono-R.ttf", "mediaType": "application/vnd.ms-opentype" }, "epub.embedded.font.4": { "id": "epub.embedded.font.4", "href": "fonts/UbuntuMono-RI.ttf", "mediaType": "application/vnd.ms-opentype" }, "epub.embedded.font.5": { "id": "epub.embedded.font.5", "href": "fonts/FreeSerif.otf", "mediaType": "application/vnd.ms-opentype" }, "epub.embedded.font.6": { "id": "epub.embedded.font.6", "href": "fonts/FreeSansBold.otf", "mediaType": "application/vnd.ms-opentype" }, "pls-en": { "id": "pls-en", "href": "lexicon/en.pls", "mediaType": "application/pls+xml" }, "pls-fr": { "id": "pls-fr", "href": "lexicon/fr.pls", "mediaType": "application/pls+xml" }
                }
            },
            "spine": {
                "toc": "",
                "itemRefs": [
                    { "idRef": "cover" },
                    { "idRef": "spi_ad" },
                    { "idRef": "id-id2442754" },
                    { "idRef": "htmltoc" }, { "idRef": "id-id2632344" }, { "idRef": "id-id2604743" }, { "idRef": "id-id2629773" }, { "idRef": "id-id2620395" }, { "idRef": "id-id2638681" }, { "idRef": "id-id2611884" }, { "idRef": "id-id2627310" }, { "idRef": "id-id2635343" }, { "idRef": "id-id2622654" }, { "idRef": "id-id2624850" }, { "idRef": "id-id2640702" }, { "idRef": "id-id2641220" }, { "idRef": "id-id2642385" }, { "idRef": "id-id2644001" }, { "idRef": "id-id2644238" }, { "idRef": "id-id2645594" }, { "idRef": "id-id2645682" }, { "idRef": "id-id2645862" }]
            }
        })
    });
});
