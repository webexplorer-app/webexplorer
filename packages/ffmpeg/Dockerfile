# syntax=docker/dockerfile-upstream:master-labs

# Base emsdk image with environment variables.
FROM emscripten/emsdk:3.1.63 AS emsdk-base
ARG EXTRA_CFLAGS
ARG EXTRA_LDFLAGS
ENV INSTALL_DIR=/opt
ENV FFMPEG_VERSION=n6.1.1
ENV CFLAGS="-I$INSTALL_DIR/include $CFLAGS $EXTRA_CFLAGS"
ENV CXXFLAGS="$CFLAGS"
ENV LDFLAGS="-L$INSTALL_DIR/lib $LDFLAGS $CFLAGS $EXTRA_LDFLAGS"
ENV EM_PKG_CONFIG_PATH=$INSTALL_DIR/lib/pkgconfig:/emsdk/upstream/emscripten/system/lib/pkgconfig
ENV EM_TOOLCHAIN_FILE=$EMSDK/upstream/emscripten/cmake/Modules/Platform/Emscripten.cmake
ENV PKG_CONFIG_PATH=$PKG_CONFIG_PATH:$EM_PKG_CONFIG_PATH
RUN apt-get update && \
      apt-get install -y pkg-config autoconf automake libtool ragel git yasm subversion

# Build x264
FROM emsdk-base AS x264-builder
ENV X264_BRANCH=stable
RUN git clone https://code.videolan.org/videolan/x264.git /src/x264
RUN cd /src/x264 && git checkout ${X264_BRANCH}
COPY build/scripts/x264.sh /src/x264/build.sh
RUN bash -x /src/x264/build.sh

# Build x265
FROM x264-builder AS x265-builder
ENV X265_BRANCH=Release_3.6
RUN git clone https://bitbucket.org/multicoreware/x265_git.git /src/x265
RUN cd /src/x265 && git checkout ${X265_BRANCH}
COPY build/scripts/x265.sh /src/x265/build.sh
RUN bash -x /src/x265/build.sh

# Build libvpx
FROM x265-builder AS libvpx-builder
ENV LIBVPX_BRANCH=v1.14.0
RUN git clone https://chromium.googlesource.com/webm/libvpx.git /src/libvpx
RUN cd /src/libvpx && git checkout ${LIBVPX_BRANCH}
COPY build/scripts/libvpx.sh /src/libvpx/build.sh
RUN bash -x /src/libvpx/build.sh

# Build lame
FROM libvpx-builder AS lame-builder
ENV LAME_BRANCH=master
RUN svn checkout https://svn.code.sf.net/p/lame/svn/tags/RELEASE__3_100/lame/ /src/lame
COPY build/scripts/lame.sh /src/lame/build.sh
RUN bash -x /src/lame/build.sh

# Build ogg
FROM lame-builder AS ogg-builder
ENV OGG_BRANCH=v1.3.5
RUN git clone https://gitlab.xiph.org/xiph/ogg.git /src/ogg
RUN cd /src/ogg && git checkout ${OGG_BRANCH}
COPY build/scripts/ogg.sh /src/ogg/build.sh
RUN bash -x /src/ogg/build.sh

# Build theora
FROM ogg-builder AS theora-builder
COPY --from=ogg-builder $INSTALL_DIR $INSTALL_DIR
ENV THEORA_BRANCH=v1.1.1
RUN git clone https://gitlab.xiph.org/xiph/theora.git /src/theora
RUN cd /src/theora && git checkout ${THEORA_BRANCH}
COPY build/scripts/theora.sh /src/theora/build.sh
RUN bash -x /src/theora/build.sh

# Build opus
FROM theora-builder AS opus-builder
ENV OPUS_BRANCH=v1.5.1
RUN git clone https://gitlab.xiph.org/xiph/opus.git /src/opus
RUN cd /src/opus && git checkout ${OPUS_BRANCH}
COPY build/scripts/opus.sh /src/opus/build.sh
RUN bash -x /src/opus/build.sh

# Build vorbis
FROM opus-builder AS vorbis-builder
COPY --from=ogg-builder $INSTALL_DIR $INSTALL_DIR
ENV VORBIS_BRANCH=v1.3.7
RUN git clone https://gitlab.xiph.org/xiph/vorbis.git /src/vorbis
RUN cd /src/vorbis && git checkout ${VORBIS_BRANCH}
COPY build/scripts/vorbis.sh /src/vorbis/build.sh
RUN bash -x /src/vorbis/build.sh

# Build zlib
FROM vorbis-builder AS zlib-builder
ENV ZLIB_BRANCH=v1.3.1
RUN git clone https://github.com/madler/zlib.git /src/zlib
RUN cd /src/zlib && git checkout ${ZLIB_BRANCH}
COPY build/scripts/zlib.sh /src/zlib/build.sh
RUN bash -x /src/zlib/build.sh

# Build libwebp
FROM zlib-builder AS libwebp-builder
COPY --from=zlib-builder $INSTALL_DIR $INSTALL_DIR
ENV LIBWEBP_BRANCH=v1.3.2
RUN git clone https://github.com/webmproject/libwebp.git /src/libwebp
RUN cd /src/libwebp && git checkout ${LIBWEBP_BRANCH}
COPY build/scripts/libwebp.sh /src/libwebp/build.sh
RUN bash -x /src/libwebp/build.sh

# Build freetype2
FROM libwebp-builder AS freetype2-builder
ENV FREETYPE2_BRANCH=VER-2-13-2
RUN git clone https://git.savannah.gnu.org/git/freetype/freetype2.git /src/freetype2
RUN cd /src/freetype2 && git checkout ${FREETYPE2_BRANCH}
COPY build/scripts/freetype2.sh /src/freetype2/build.sh
RUN bash -x /src/freetype2/build.sh

# Build fribidi
FROM freetype2-builder AS fribidi-builder
ENV FRIBIDI_BRANCH=v1.0.13
RUN git clone https://github.com/fribidi/fribidi.git /src/fribidi
RUN cd /src/fribidi && git checkout ${FRIBIDI_BRANCH}
COPY build/scripts/fribidi.sh /src/fribidi/build.sh
RUN bash -x /src/fribidi/build.sh

# Build harfbuzz
FROM fribidi-builder AS harfbuzz-builder
ENV HARFBUZZ_BRANCH=8.4.0
RUN git clone https://github.com/harfbuzz/harfbuzz.git /src/harfbuzz
RUN cd /src/harfbuzz && git checkout ${HARFBUZZ_BRANCH}
COPY build/scripts/harfbuzz.sh /src/harfbuzz/build.sh
RUN bash -x /src/harfbuzz/build.sh

# Build libass
FROM harfbuzz-builder AS libass-builder
COPY --from=freetype2-builder $INSTALL_DIR $INSTALL_DIR
COPY --from=fribidi-builder $INSTALL_DIR $INSTALL_DIR
COPY --from=harfbuzz-builder $INSTALL_DIR $INSTALL_DIR
ENV LIBASS_BRANCH=0.17.1
RUN git clone https://github.com/libass/libass.git /src/libass
RUN cd /src/libass && git checkout ${LIBASS_BRANCH}
COPY build/scripts/libass.sh /src/libass/build.sh
RUN bash -x /src/libass/build.sh

# Build zimg
FROM libass-builder AS zimg-builder
ENV ZIMG_BRANCH=release-3.0.5
RUN git clone --recursive -b $ZIMG_BRANCH https://github.com/sekrit-twc/zimg.git /src/zimg
RUN cd /src/zimg && git checkout ${ZIMG_BRANCH}
COPY build/scripts/zimg.sh /src/zimg/build.sh
RUN bash -x /src/zimg/build.sh

# Base ffmpeg image with dependencies and source code populated.
FROM zimg-builder AS ffmpeg-base
RUN embuilder build sdl2 sdl2-mt
RUN git clone https://github.com/FFmpeg/FFmpeg.git /src/ffmpeg
RUN cd /src/ffmpeg && git checkout ${FFMPEG_VERSION}

# Build ffmpeg
FROM ffmpeg-base AS ffmpeg-builder
COPY build/scripts/ffmpeg.sh /src/ffmpeg/build.sh
COPY build/patch/ffmpeg/configure /src/ffmpeg/configure
COPY build/patch/ffmpeg/fftools/ffprobe.c /src/ffmpeg/fftools/ffprobe.c
COPY build/patch/ffmpeg/fftools/ffmpeg.c /src/ffmpeg/fftools/ffmpeg.c
RUN chmod a+x /src/ffmpeg/configure
RUN bash -x /src/ffmpeg/build.sh

# Build ffmpeg web assembly
FROM ffmpeg-builder AS ffmpeg-wasm-builder
COPY build/scripts/wasm.sh /src/ffmpeg/wasm.sh
COPY build/js /src/ffmpeg/js
RUN mkdir -p /src/dist && bash -x /src/ffmpeg/wasm.sh -o /src/dist/ffmpeg.js

FROM scratch AS exportor
COPY --from=ffmpeg-wasm-builder /src/dist /src