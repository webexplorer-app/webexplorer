#!/bin/bash

set -euo pipefail

cd ./vorbis

CONF_FLAGS=(
  --prefix=$INSTALL_DIR                               # install library in a build directory for FFmpeg to include
  --host=i686                                  # use i686 linux
  --enable-shared=no                                  # disable shared library
  --enable-docs=no
  --enable-examples=no
  --enable-fast-install=no
  --disable-oggtest                                   # disable oggtests
  --disable-dependency-tracking                       # speed up one-time build
)

./autogen.sh
emconfigure ./configure "${CONF_FLAGS[@]}"
emmake make
emmake make install -j