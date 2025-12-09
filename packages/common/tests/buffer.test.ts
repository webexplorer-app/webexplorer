import { describe, it, expect } from 'vitest';
import { BufferBuilder } from '../src/buffer';

describe('BufferBuilder', () => {
  describe('constructor', () => {
    it('should initialize with given fragment size', () => {
      const builder = new BufferBuilder(1024);
      expect(builder.fragmentSize).toBe(1024);
      expect(builder.fragmentIndex).toBe(0);
      expect(builder.fragmentOffset).toBe(0);
      expect(builder.fragments.length).toBe(1);
    });
  });

  describe('write', () => {
    it('should write single byte', () => {
      const builder = new BufferBuilder(4);
      builder.write(65); // 'A'
      expect(builder.fragmentOffset).toBe(1);
      expect(builder.read(0)).toBe(65);
    });

    it('should write multiple bytes', () => {
      const builder = new BufferBuilder(4);
      builder.write(65);
      builder.write(66);
      builder.write(67);
      expect(builder.fragmentOffset).toBe(3);
      expect(builder.read(0)).toBe(65);
      expect(builder.read(1)).toBe(66);
      expect(builder.read(2)).toBe(67);
    });

    it('should extend when fragment is full', () => {
      const builder = new BufferBuilder(2);
      builder.write(65);
      builder.write(66);
      expect(builder.fragments.length).toBe(1);
      builder.write(67); // Should trigger extend
      expect(builder.fragments.length).toBe(2);
      expect(builder.fragmentIndex).toBe(1);
      expect(builder.fragmentOffset).toBe(1);
    });
  });

  describe('read', () => {
    it('should read byte from first fragment', () => {
      const builder = new BufferBuilder(4);
      builder.write(65);
      builder.write(66);
      expect(builder.read(0)).toBe(65);
      expect(builder.read(1)).toBe(66);
    });

    it('should read byte from multiple fragments', () => {
      const builder = new BufferBuilder(2);
      builder.write(65);
      builder.write(66);
      builder.write(67);
      builder.write(68);
      expect(builder.read(0)).toBe(65);
      expect(builder.read(1)).toBe(66);
      expect(builder.read(2)).toBe(67);
      expect(builder.read(3)).toBe(68);
    });
  });

  describe('length', () => {
    it('should return 0 for empty builder', () => {
      const builder = new BufferBuilder(4);
      expect(builder.length()).toBe(0);
    });

    it('should return correct length after writes', () => {
      const builder = new BufferBuilder(4);
      builder.write(65);
      builder.write(66);
      builder.write(67);
      expect(builder.length()).toBe(3);
    });

    it('should return correct length across multiple fragments', () => {
      const builder = new BufferBuilder(2);
      builder.write(65);
      builder.write(66);
      builder.write(67);
      expect(builder.length()).toBe(3);
    });
  });

  describe('combine', () => {
    it('should return empty array for empty builder', () => {
      const builder = new BufferBuilder(4);
      const result = builder.combine();
      expect(result.length).toBe(0);
    });

    it('should combine single fragment', () => {
      const builder = new BufferBuilder(4);
      builder.write(65);
      builder.write(66);
      builder.write(67);
      const result = builder.combine();
      expect(result.length).toBe(3);
      expect(result[0]).toBe(65);
      expect(result[1]).toBe(66);
      expect(result[2]).toBe(67);
    });

    it('should combine multiple fragments', () => {
      const builder = new BufferBuilder(2);
      builder.write(65);
      builder.write(66);
      builder.write(67);
      builder.write(68);
      builder.write(69);
      const result = builder.combine();
      expect(result.length).toBe(5);
      expect(result[0]).toBe(65);
      expect(result[1]).toBe(66);
      expect(result[2]).toBe(67);
      expect(result[3]).toBe(68);
      expect(result[4]).toBe(69);
    });
  });

  describe('extend', () => {
    it('should add new fragment', () => {
      const builder = new BufferBuilder(2);
      expect(builder.fragments.length).toBe(1);
      builder.extend();
      expect(builder.fragments.length).toBe(2);
      expect(builder.fragmentIndex).toBe(1);
      expect(builder.fragmentOffset).toBe(0);
    });
  });
});
