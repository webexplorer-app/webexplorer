import { describe, it, expect } from 'vitest';
import { bytesToUTF8, bytesToUTF16LE, isUTF16LE } from '../src/index';

describe('bytesToUTF8', () => {
  it('should convert Uint8Array to UTF-8 string', () => {
    const bytes = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
    const result = bytesToUTF8(bytes);
    expect(result).toBe('Hello');
  });

  it('should convert number array to UTF-8 string', () => {
    const bytes = [72, 101, 108, 108, 111]; // "Hello"
    const result = bytesToUTF8(bytes);
    expect(result).toBe('Hello');
  });

  it('should handle empty array', () => {
    const result = bytesToUTF8([]);
    expect(result).toBe('');
  });

  it('should handle UTF-8 multibyte characters', () => {
    const bytes = new Uint8Array([228, 189, 160, 229, 165, 189]); // "你好" in UTF-8
    const result = bytesToUTF8(bytes);
    expect(result).toBe('你好');
  });
});

describe('bytesToUTF16LE', () => {
  it('should convert Uint8Array to UTF-16LE string', () => {
    const bytes = new Uint8Array([72, 0, 101, 0, 108, 0, 108, 0, 111, 0]); // "Hello" in UTF-16LE
    const result = bytesToUTF16LE(bytes);
    expect(result).toBe('Hello');
  });

  it('should convert number array to UTF-16LE string', () => {
    const bytes = [72, 0, 101, 0, 108, 0, 108, 0, 111, 0]; // "Hello" in UTF-16LE
    const result = bytesToUTF16LE(bytes);
    expect(result).toBe('Hello');
  });

  it('should handle empty array', () => {
    const result = bytesToUTF16LE([]);
    expect(result).toBe('');
  });

  it('should handle UTF-16LE characters', () => {
    const bytes = new Uint8Array([96, 79, 125, 89]); // "你好" in UTF-16LE
    const result = bytesToUTF16LE(bytes);
    expect(result).toBe('你好');
  });
});

describe('isUTF16LE', () => {
  it('should return true for strings ending with 001F', () => {
    const result = isUTF16LE('test001F');
    expect(result).toBe(true);
  });

  it('should return false for strings not ending with 001F', () => {
    const result = isUTF16LE('test');
    expect(result).toBe(false);
  });

  it('should return false for empty string', () => {
    const result = isUTF16LE('');
    expect(result).toBe(false);
  });

  it('should return false for strings containing but not ending with 001F', () => {
    const result = isUTF16LE('test001Fmore');
    expect(result).toBe(false);
  });
});
