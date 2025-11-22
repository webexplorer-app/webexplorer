find /opt/libarchive -name libarchive.a
emcc ./main.c /opt/xz/liblzma.a /opt/libarchive/libarchive/libarchive.a /opt/openssl/libssl.a /opt/openssl/libcrypto.a -I /usr/local/include/ -I /opt/libarchive/libarchive\
    -o ./output/libarchive.js \
    -s USE_ZLIB=1 -s USE_BZIP2=1 -s MODULARIZE=1 -s EXPORT_ES6=1 -s EXPORT_NAME=libarchive -s WASM=1 -O3 -s ALLOW_MEMORY_GROWTH=1 \
    -s EXPORTED_RUNTIME_METHODS='["cwrap","ccall"]' -s EXPORTED_FUNCTIONS=@$PWD/libarchive.exports -s ERROR_ON_UNDEFINED_SYMBOLS=0

echo Done