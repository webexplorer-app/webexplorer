
export class Stream {
  offset: number;
  view: DataView;

  constructor(arrayBuffer: ArrayBuffer) {
    const view = new DataView(arrayBuffer);
    this.view = view;
    this.offset = 0;
  }

  readByte() {
    const byte = this.view.getInt8(this.offset);
    this.offset = this.offset + 1;
    return byte;
  }

  readUByte() {
    const u8 = this.view.getUint8(this.offset);
    this.offset = this.offset + 1;
    return u8;
  }

  readBytes(len: number) {
    const { view, offset } = this;
    const data = view.buffer.slice(offset, offset + len);
    this.offset = this.offset + len;
    return new Uint8Array(data);
  }

  readUint8() {
    const u8 = this.view.getUint8(this.offset);
    this.offset = this.offset + 1;
    return u8;
  }

  readUint16(littleEndian: boolean = false) {
    const u16 = this.view.getUint16(this.offset, littleEndian);
    this.offset = this.offset + 2;
    return u16;
  }

  readUint32(littleEndian: boolean = false) {
    const u32 = this.view.getUint32(this.offset, littleEndian);
    this.offset = this.offset + 4;
    return u32;
  }

  readInt8() {
    const u8 = this.view.getInt8(this.offset);
    this.offset = this.offset + 1;
    return u8;
  }

  readInt16(littleEndian: boolean = false) {
    const u16 = this.view.getInt16(this.offset, littleEndian);
    this.offset = this.offset + 2;
    return u16;
  }

  readInt32(littleEndian: boolean = false) {
    const u32 = this.view.getInt32(this.offset, littleEndian);
    this.offset = this.offset + 4;
    return u32;
  }

  isEnd() {
    return this.offset === this.view.byteLength;
  }

  peek() {
    return this.view.getUint8(this.offset);
  }

  forward(len: number) {
    this.offset = this.offset + len;
  }

  moveTo(offset: number) {
    this.offset = offset;
  }
}
