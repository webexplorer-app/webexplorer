FROM emscripten/emsdk

WORKDIR /opt

RUN apt-get update && \
    apt-get install -y autoconf libtool gettext cmake lsb-release

RUN git clone https://chromium.googlesource.com/chromium/tools/depot_tools.git
ENV PATH="${PATH}:/opt/depot_tools"

RUN mkdir repo

WORKDIR /opt/repo
RUN gclient config --unmanaged https://pdfium.googlesource.com/pdfium.git
RUN gclient sync

WORKDIR /opt/repo/pdfium
RUN mkdir -p out/Release
COPY args.gn out/Release/args.gn
RUN ./build/install-build-deps.sh
RUN gn gen out/Release
RUN ninja -C out/Release pdfium_all

WORKDIR /var/local/scripts/
CMD ["bash","/var/local/scripts/compile.sh"]