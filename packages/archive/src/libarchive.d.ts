/// <reference types="emscripen" />

export interface LibArchiveModule extends EmscriptenModule {
  cwrap: typeof cwrap;
  HEAP8: Int8Array;
}

declare const libarchive: EmscriptenModuleFactory<LibArchiveModule>;

export default libarchive;
