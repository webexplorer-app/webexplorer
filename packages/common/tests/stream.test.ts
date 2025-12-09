import { describe, it, expect, beforeEach } from 'vitest';
import { Stream } from '../src/stream';

describe('Stream', () => {
  let buffer: ArrayBuffer;
  let view: DataView;

  beforeEach(() => {
    // Create a buffer with known values
    buffer = new ArrayBuffer(17);
    view = new DataView(buffer);
    view.setUint8(0, 65); // 'A'
    view.setUint8(1, 66); // 'B'
    view.setInt8(2, -10);
    view.setUint16(3, 1000, false); // Big endian
    view.setUint16(5, 2000, true);  // Little endian
    view.setUint32(7, 100000, false); // Big endian
    view.setInt16(11, -500, false);
    view.setInt32(13, -50000, false);
  });

  describe('constructor', () => {
    it('should initialize with offset 0', () => {
      const stream = new Stream(buffer);
      expect(stream.offset).toBe(0);
      expect(stream.view).toBeInstanceOf(DataView);
    });
  });

  describe('readByte', () => {
    it('should read signed byte and increment offset', () => {
      const stream = new Stream(buffer);
      stream.moveTo(2);
      const byte = stream.readByte();
      expect(byte).toBe(-10);
      expect(stream.offset).toBe(3);
    });
  });

  describe('readUByte', () => {
    it('should read unsigned byte and increment offset', () => {
      const stream = new Stream(buffer);
      const byte = stream.readUByte();
      expect(byte).toBe(65);
      expect(stream.offset).toBe(1);
    });
  });

  describe('readBytes', () => {
    it('should read multiple bytes and increment offset', () => {
      const stream = new Stream(buffer);
      const bytes = stream.readBytes(2);
      expect(bytes.length).toBe(2);
      expect(bytes[0]).toBe(65);
      expect(bytes[1]).toBe(66);
      expect(stream.offset).toBe(2);
    });

    it('should read correct slice of bytes', () => {
      const stream = new Stream(buffer);
      stream.forward(1);
      const bytes = stream.readBytes(2);
      expect(bytes[0]).toBe(66);
      expect(stream.offset).toBe(3);
    });
  });

  describe('readUint8', () => {
    it('should read unsigned 8-bit integer', () => {
      const stream = new Stream(buffer);
      const value = stream.readUint8();
      expect(value).toBe(65);
      expect(stream.offset).toBe(1);
    });
  });

  describe('readUint16', () => {
    it('should read big endian uint16', () => {
      const stream = new Stream(buffer);
      stream.moveTo(3);
      const value = stream.readUint16(false);
      expect(value).toBe(1000);
      expect(stream.offset).toBe(5);
    });

    it('should read little endian uint16', () => {
      const stream = new Stream(buffer);
      stream.moveTo(5);
      const value = stream.readUint16(true);
      expect(value).toBe(2000);
      expect(stream.offset).toBe(7);
    });
  });

  describe('readUint32', () => {
    it('should read big endian uint32', () => {
      const stream = new Stream(buffer);
      stream.moveTo(7);
      const value = stream.readUint32(false);
      expect(value).toBe(100000);
      expect(stream.offset).toBe(11);
    });
  });

  describe('readInt8', () => {
    it('should read signed 8-bit integer', () => {
      const stream = new Stream(buffer);
      stream.moveTo(2);
      const value = stream.readInt8();
      expect(value).toBe(-10);
      expect(stream.offset).toBe(3);
    });
  });

  describe('readInt16', () => {
    it('should read signed 16-bit integer', () => {
      const stream = new Stream(buffer);
      stream.moveTo(11);
      const value = stream.readInt16(false);
      expect(value).toBe(-500);
      expect(stream.offset).toBe(13);
    });
  });

  describe('readInt32', () => {
    it('should read signed 32-bit integer', () => {
      const stream = new Stream(buffer);
      stream.moveTo(13);
      const value = stream.readInt32(false);
      expect(value).toBe(-50000);
      expect(stream.offset).toBe(17);
    });
  });

  describe('isEnd', () => {
    it('should return false when not at end', () => {
      const stream = new Stream(buffer);
      expect(stream.isEnd()).toBe(false);
    });

    it('should return true when at end', () => {
      const stream = new Stream(buffer);
      stream.moveTo(buffer.byteLength);
      expect(stream.isEnd()).toBe(true);
    });
  });

  describe('peek', () => {
    it('should read byte without incrementing offset', () => {
      const stream = new Stream(buffer);
      const byte = stream.peek();
      expect(byte).toBe(65);
      expect(stream.offset).toBe(0);
    });
  });

  describe('forward', () => {
    it('should move offset forward by specified amount', () => {
      const stream = new Stream(buffer);
      stream.forward(5);
      expect(stream.offset).toBe(5);
    });
  });

  describe('moveTo', () => {
    it('should move offset to specified position', () => {
      const stream = new Stream(buffer);
      stream.moveTo(10);
      expect(stream.offset).toBe(10);
    });
  });
});
