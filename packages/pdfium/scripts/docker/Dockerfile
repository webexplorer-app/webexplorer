FROM emscripten/emsdk

WORKDIR /opt

RUN apt-get update && \
    apt-get install -y autoconf libtool gettext cmake

RUN git clone https://chromium.googlesource.com/chromium/tools/depot_tools.git
RUN export PATH="$PATH:/path/to/depot_tools"

RUN mkdir repo
RUN cd repo
RUN gclient config --unmanaged https://pdfium.googlesource.com/pdfium.git
RUN gclient sync
RUN cd pdfium
RUN ./build/install-build-deps.sh

WORKDIR /var/local/scripts/
CMD ["bash","/var/local/scripts/compile.sh"]