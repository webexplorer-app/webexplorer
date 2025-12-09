import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';
import { init, unarchive } from '../src';

describe('Archive Package', () => {
    const wasmBinary = fs.readFileSync(path.resolve(__dirname, '../src/libarchive.wasm'));

    for (const fileName of ['flat.zip', 'flat.tar', 'flat.7z']) {
        it(`should unarchive files correctly for ${fileName}`, async () => {
            const wasmModule = await init({
                wasmBinary: wasmBinary.buffer,
            });

            const fileBuffer = fs.readFileSync(path.resolve(__dirname, 'data', fileName));

            const filePtr = wasmModule.malloc(fileBuffer.length);
            wasmModule.module.HEAP8.set(new Int8Array(fileBuffer), filePtr);

            const entries = await unarchive(wasmModule, filePtr, fileBuffer.length, null);
            expect(entries.sort((a, b) => a.path.localeCompare(b.path))).toEqual([
                {
                    name: '',
                    size: 0n,
                    path: 'flat/',
                    type: 16384,
                    data: new Int8Array(0)
                },
                {
                    name: 'a.txt',
                    size: 1n,
                    path: 'flat/a.txt',
                    type: 32768,
                    data: new Int8Array([97])
                },
                {
                    name: 'b.txt',
                    size: 1n,
                    path: 'flat/b.txt',
                    type: 32768,
                    data: new Int8Array([98])
                },
                {
                    name: 'empty.txt',
                    size: 0n,
                    path: 'flat/empty.txt',
                    type: 32768,
                    data: new Int8Array(0)
                }
            ])
        });
    }

    for (const fileName of ['nested.zip', 'nested.tar', 'nested.7z']) {
        it(`should unarchive files correctly for ${fileName}`, async () => {
            const wasmModule = await init({
                wasmBinary: wasmBinary.buffer,
            });

            const fileBuffer = fs.readFileSync(path.resolve(__dirname, 'data', fileName));

            const filePtr = wasmModule.malloc(fileBuffer.length);
            wasmModule.module.HEAP8.set(new Int8Array(fileBuffer), filePtr);

            const entries = await unarchive(wasmModule, filePtr, fileBuffer.length, null);
            expect(entries.sort((a, b) => a.path.localeCompare(b.path))).toEqual(
                [
                    {
                        name: '',
                        size: 0n,
                        path: 'nested/',
                        type: 16384,
                        data: new Int8Array(0)
                    },
                    {
                        name: 'a.txt',
                        size: 1n,
                        path: 'nested/a.txt',
                        type: 32768,
                        data: new Int8Array([97])
                    },
                    {
                        name: 'b.txt',
                        size: 1n,
                        path: 'nested/b.txt',
                        type: 32768,
                        data: new Int8Array([98])
                    },
                    {
                        name: '',
                        size: 0n,
                        path: 'nested/child/',
                        type: 16384,
                        data: new Int8Array(0)
                    },
                    {
                        name: 'ca.txt',
                        size: 0n,
                        path: 'nested/child/ca.txt',
                        type: 32768,
                        data: new Int8Array(0)
                    },
                    {
                        name: 'cb.txt',
                        size: 0n,
                        path: 'nested/child/cb.txt',
                        type: 32768,
                        data: new Int8Array(0)
                    },
                    {
                        name: 'cempty.txt',
                        size: 0n,
                        path: 'nested/child/cempty.txt',
                        type: 32768,
                        data: new Int8Array(0)
                    },
                    {
                        name: 'empty.txt',
                        size: 0n,
                        path: 'nested/empty.txt',
                        type: 32768,
                        data: new Int8Array(0)
                    }
                ])
        });
    }
});
