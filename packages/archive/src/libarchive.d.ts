/// <reference types="emscripen" />

export interface LibArchiveModule extends EmscriptenModule {
  cwrap: typeof cwrap;
}

declare const libarchive: EmscriptenModuleFactory<LibArchiveModule>;

export default libarchive;
