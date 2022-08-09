import type {
  EmscriptenModuleFactory,
  EmscriptenModule,
  cwrap,
} from "emscripten";

export interface LibPdfiumModule extends EmscriptenModule {
  cwrap: typeof cwrap;
  HEAP8: Int8Array;
}

const libpdfium: EmscriptenModuleFactory<LibPdfiumModule>;

export default libpdfium;
