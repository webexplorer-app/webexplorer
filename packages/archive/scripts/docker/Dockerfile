FROM emscripten/emsdk

WORKDIR /opt

RUN git clone --branch v3.8.3 --depth 1 https://github.com/libarchive/libarchive.git
RUN git clone --branch v1.3.1 --depth 1 https://github.com/madler/zlib.git
RUN git clone --branch v5.8.1 --depth 1 https://github.com/tukaani-project/xz
RUN git clone --branch master --depth 1 https://gitlab.com/bzip2/bzip2.git
RUN git clone --branch openssl-3.6.0 --depth 1 https://github.com/openssl/openssl.git
RUN git clone --branch v1.10.0 --depth 1 https://github.com/lz4/lz4.git
RUN git clone --branch v1.5.7 --depth 1 https://github.com/facebook/zstd.git

RUN apt-get update && \
    apt-get install -y autoconf libtool gettext cmake

ENV CPPFLAGS "-I/usr/local/include/ -I/opt/lz4/lib -I/opt/xz -I/opt/zstd/lib -I/opt/zlib -I/opt/bzip2 -I/opt/libarchive -I/opt/openssl/include -I/opt/openssl/test"
ENV LDFLAGS "-L/usr/local/lib -L/opt/lz4 -L/opt/xz -L/opt/zstd/lib -L/opt/zlib -L/opt/bzip2 -L/opt/libarchive -L/opt/openssl"

# compile ZLIB to LLVM
WORKDIR /opt/zlib
RUN cd /opt/zlib && \
    emconfigure ./configure && \
    emmake make libz.a 2>&1

# compile BZIP2 to LLVM
WORKDIR /opt/bzip2
RUN cd /opt/bzip2 && \
    emcmake cmake . -DENABLE_STATIC_LIB=1 -DENABLE_SHARED_LIB=0 -DENABLE_LIB_ONLY=1 && \
    cmake --build . --config Release 2>&1 && \
    cp libbz2_static.a libbz2.a

# compile LZMA to LLVM
WORKDIR /opt/xz
RUN cd /opt/xz && \
    echo "set(CMAKE_MODULE_PATH \"${CMAKE_MODULE_PATH};/emsdk/upstream/emscripten/cmake/Modules/\")" | cat - cmake/tuklib_integer.cmake > temp && mv temp cmake/tuklib_integer.cmake && \
    emcmake cmake . && emmake make 2>&1

WORKDIR /opt/lz4
RUN cd /opt/lz4 && \
	emmake make

WORKDIR /opt/zstd
RUN cd /opt/zstd
RUN emmake make

# compile openSSL to LLVM
WORKDIR /opt/openssl
RUN cd /opt/openssl && \
    emmake bash -c "./Configure no-asm no-ssl2 no-tests no-ssl3 no-hw no-deprecated no-dso linux-generic32" && \
    sed -i 's/$(CROSS_COMPILE)//' Makefile && \
    emmake make


# compile libarchive to LLVM
WORKDIR /opt/libarchive
RUN cd /opt/libarchive
RUN emcmake cmake . \
	-DCMAKE_BUILD_TYPE=MinSizeRel \
	-DBUILD_SHARED_LIBS=Off \
	-DCMAKE_INTERPROCEDURAL_OPTIMIZATION=On \
	-DHAVE_POSIX_SPAWN=0 -DHAVE_PTHREAD_H=0 -DHAVE_LIBPTHREAD=0 -DPTHREAD_IN_LIBC=0 -DHAVE_POSIX_SPAWNP=0 \
	-DHAVE_VFORK=0 -DHAVE_FORK=0 -DHAVE__FSEEKI64=0 \
	-DHAVE_WCSCPY=1 -DHAVE_WCSLEN=1 \
	-DENABLE_MBEDTLS=On \
	-DENABLE_NETTLE=Off \
	-DENABLE_OPENSSL=Off \
	-DOPENSSL_SSL_LIBRARY=/opt/openssl/lib/libssl.a \
	-DOPENSSL_CRYPTO_LIBRARY=/opt/openssl/lib/libcrypto.a \
	-DOPENSSL_INCLUDE_DIR=/opt/openssl/include \
	-DENABLE_LZO=Off \
	-DENABLE_LIBB2=Off \
	-DENABLE_BZip2=On \
	-DBZIP2_INCLUDE_DIR=${SYSROOT}/opt/bzip2 \
	-DBZIP2_LIBRARIES=${SYSROOT}/opt/bzip2/libbz2.a \
	-DENABLE_LZ4=On \
	-DLZ4_INCLUDE_DIR=${SYSROOT}/opt/lz4/lib \
	-DLZ4_LIBRARY=${SYSROOT}/opt/lz4/liblz4.a \
	-DENABLE_LZMA=On \
	-DLIBLZMA_INCLUDE_DIR=${SYSROOT}/opt/xz/src/liblzma/api \
	-DLIBLZMA_LIBRARY=${SYSROOT}/opt/xz/liblzma.a \
	-DENABLE_ZSTD=On \
	-DZSTD_INCLUDE_DIR=${SYSROOT}/opt/zstd/lib \
	-DZSTD_LIBRARY=${SYSROOT}/opt/zstd/lib/libzstd.a \
	-DENABLE_ZLIB=On \
	-DZLIB_INCLUDE_DIR=${SYSROOT}/opt/zlib \
	-DZLIB_LIBRARY=${SYSROOT}/opt/zlib/libz.a \
	-DENABLE_LIBXML2=Off \
	-DENABLE_EXPAT=Off \
	-DENABLE_PCREPOSIX=Off \
	-DENABLE_LIBGCC=Off \
	-DENABLE_CNG=Off \
	-DENABLE_TAR=Off \
	-DENABLE_CPIO=Off \
	-DENABLE_CAT=Off \
	-DENABLE_UNZIP=Off \
	-DENABLE_XATTR=Off \
	-DENABLE_ACL=Off \
	-DENABLE_ICONV=Off \
	-DENABLE_TEST=Off \
	-DPOSIX_REGEX_LIB=libc \
	-DLIBARCHIVE_STATIC=1
RUN emmake make 2>&1

WORKDIR /var/local/scripts/
CMD ["bash","/var/local/scripts/compile.sh"]