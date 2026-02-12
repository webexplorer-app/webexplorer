#!/bin/bash
# `-o <OUTPUT_FILE_NAME>` must be provided when using this build script.
# ex:
#     bash ffmpeg-wasm.sh -o ffmpeg.js

set -euo pipefail

cd ./ffmpeg

EXPORT_NAME="createFFmpeg"

CONF_FLAGS=(
  -I. 
  -I./src/fftools 
  -I$INSTALL_DIR/include 
  -L$INSTALL_DIR/lib 
  -Llibavcodec 
  -Llibavdevice 
  -Llibavfilter 
  -Llibavformat 
  -Llibavutil 
  -Llibpostproc 
  -Llibswresample 
  -Llibswscale 
  -lavcodec 
  -lavdevice 
  -lavfilter 
  -lavformat 
  -lavutil 
  -lpostproc 
  -lswresample 
  -lswscale 
  -Wno-deprecated-declarations 
  $LDFLAGS 
  -sENVIRONMENT=worker                     # only target web worker environment, strip Node.js code paths
  -sWASM_BIGINT                            # enable big int support
  -sUSE_SDL=2                              # use emscripten SDL2 lib port
  -sMODULARIZE                             # modularized to use as a library
  -sINITIAL_MEMORY=4096MB   # ALLOW_MEMORY_GROWTH is not recommended when using threads, thus we use a large initial memory
  -sPTHREAD_POOL_SIZE=64    # use 32 threads
  -sEXPORT_NAME="$EXPORT_NAME"             # required in browser env, so that user can access this module from window object
  -sEXPORTED_FUNCTIONS=$(node js/export.js) # exported functions
  -sEXPORTED_RUNTIME_METHODS=$(node js/export-runtime.js) # exported built-in functions
  -sALLOW_MEMORY_GROWTH=1 
  -sWASM=1
  -sEXPORT_ES6
  -lworkerfs.js
  --pre-js js/pre.js        # extra bindings, contains most of the ffmpeg.wasm javascript code
  # ffmpeg source code
  fftools/ffmpeg_dec.c
  fftools/ffmpeg_demux.c
  fftools/ffmpeg_enc.c
  fftools/ffmpeg_filter.c 
  fftools/ffmpeg_hw.c 
  fftools/ffmpeg_mux.c 
  fftools/ffmpeg_mux_init.c 
  fftools/ffmpeg_opt.c 
  fftools/objpool.c 
  fftools/sync_queue.c 
  fftools/thread_queue.c 
  fftools/ffmpeg.c 
  fftools/cmdutils.c 
  fftools/opt_common.c 
  fftools/ffprobe.c 
)

emcc "${CONF_FLAGS[@]}" \
      -lx264 \
      -lx265 \
      -lvpx \
      -lmp3lame \
      -logg \
      -ltheora \
      -lvorbis \
      -lvorbisenc \
      -lvorbisfile \
      -lopus \
      -lz \
      -lwebpmux \
      -lwebp \
      -lsharpyuv \
      -lfreetype \
      -lfribidi \
      -lharfbuzz \
      -lass \
      -lzimg \
      $@