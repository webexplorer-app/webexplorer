export class BufferBuilder {
  fragmentSize: number;
  fragmentIndex: number = 0;
  fragmentOffset: number = 0;
  fragments: Uint8Array[] = [];

  constructor(fragmentSize: number) {
    this.fragmentSize = fragmentSize;
    this.extend();
  }

  extend() {
    const fragment = new Uint8Array(this.fragmentSize);
    this.fragments.push(fragment);
    this.fragmentIndex = this.fragments.length - 1;
    this.fragmentOffset = 0;
  }

  write(byte: number) {
    if (this.fragmentOffset === this.fragmentSize) {
      this.extend();
    }

    this.fragments[this.fragmentIndex][this.fragmentOffset] = byte;
    this.fragmentOffset = this.fragmentOffset + 1;
  }

  read(offset: number) {
    const fragmentIndex = Math.floor(offset / this.fragmentSize);
    const fragmentOffset = offset - fragmentIndex * this.fragmentSize;
    return this.fragments[fragmentIndex][fragmentOffset];
  }

  length() {
    const length =
      (this.fragments.length - 1) * this.fragmentSize + this.fragmentOffset;

    return length;
  }

  combine() {
    if (this.fragments.length == 0) {
      return new Uint8Array(0);
    }

    const length = this.length();
    const array = new Uint8Array(length);

    let offset = 0;
    this.fragments.forEach((buffer, i) => {
      if (i !== this.fragments.length - 1) {
        array.set(buffer, offset);
        offset += buffer.length;
      } else {
        array.set(buffer.slice(0, this.fragmentOffset), offset);
      }
    });

    return array;
  }
}
