emcc ./main.c /opt/libarchive/libarchive/libarchive.a /opt/lz4/lib/liblz4.a /opt/xz/liblzma.a /opt/zstd/lib/libzstd.a /opt/zlib/libz.a /opt/bzip2/libbz2.a /opt/openssl/libssl.a /opt/openssl/libcrypto.a -I /usr/local/include/ -I /opt/libarchive/libarchive\
    -o ./output/libarchive.js \
    -s ENVIRONMENT=web,worker \
    -s USE_ZLIB=1 -s USE_BZIP2=1 -s MODULARIZE=1 -s EXPORT_ES6=1 -s EXPORT_NAME=libarchive -s WASM=1 -O3 -s ALLOW_MEMORY_GROWTH=1 \
    -s EXPORTED_RUNTIME_METHODS='["HEAP8", "cwrap","ccall"]' -s EXPORTED_FUNCTIONS=@$PWD/libarchive.exports -s ERROR_ON_UNDEFINED_SYMBOLS=0

echo Done