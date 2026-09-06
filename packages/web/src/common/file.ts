import { Mime } from 'mime';
import standardTypes from 'mime/types/standard.js';
import otherTypes from 'mime/types/other.js';
import { fileTypeFromBlob } from 'file-type/core';

const mime = new Mime(standardTypes, otherTypes);

const typeMap = {
  "application/x-gtp": ["gp3", "gp4", "gp5"],
  "application/x-azw3": ["azw3"],
};

mime.define(typeMap);

export function mimeType(file: File): string | undefined {
  const fileType = file.type || mime.getType(file.name);
  if (fileType) {
    return fileType;
  }
}

export async function detectMimeType(file: File): Promise<string | undefined> {
  const detectedType = await fileTypeFromBlob(file);
  if (detectedType) return detectedType.mime;

  const preamble = new Uint8Array(await file.slice(128, 132).arrayBuffer());
  if (preamble[0] === 0x44 && preamble[1] === 0x49 && preamble[2] === 0x43 && preamble[3] === 0x4d) {
    return 'application/dicom';
  }
}

export async function readFile(file: File) {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.onload = () => {
      const { result } = fileReader;
      if (result instanceof ArrayBuffer) {
        resolve(new Uint8Array(result));
      } else {
        resolve(new Uint8Array());
      }
    };
    fileReader.onerror = (event) => {
      reject(
        Error(
          `File could not be read! Code=${event?.target?.error?.code || -1}`
        )
      );
    };
    fileReader.readAsArrayBuffer(file);
  });
}
