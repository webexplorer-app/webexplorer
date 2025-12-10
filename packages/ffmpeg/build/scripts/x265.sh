#!/bin/bash

set -euo pipefail

BASE_FLAGS=(
  -DCMAKE_TOOLCHAIN_FILE=$EM_TOOLCHAIN_FILE
  -DENABLE_LIBNUMA=OFF
  -DENABLE_SHARED=OFF
  -DENABLE_CLI=OFF
)

FLAGS_12BIT=(
  ${BASE_FLAGS[@]}
  -DHIGH_BIT_DEPTH=ON
  -DEXPORT_C_API=OFF
  -DMAIN12=ON
)

FLAGS_10BIT=(
  ${BASE_FLAGS[@]}
  -DHIGH_BIT_DEPTH=ON
  -DEXPORT_C_API=OFF
)

FLAGS_8BIT=(
  ${BASE_FLAGS[@]}
  -DCMAKE_INSTALL_PREFIX=$INSTALL_DIR
  -DEXTRA_LIB="x265_main10.a;x265_main12.a"
  -DEXTRA_LINK_FLAGS=-L.
  -DLINKED_10BIT=ON
  -DLINKED_12BIT=ON
)

cd ./x265

cd source
rm -rf build
mkdir -p build
cd build
mkdir -p 8bit 10bit 12bit

cd 12bit
emcmake cmake ../.. -DCMAKE_CXX_FLAGS="$CXXFLAGS" ${FLAGS_12BIT[@]}
sed -i -e 's/-march=i686//g' common/CMakeFiles/common.dir/flags.make
sed -i -e 's/-march=i686//g' encoder/CMakeFiles/encoder.dir/flags.make
emmake make -j

cd ../10bit 
emcmake cmake ../.. -DCMAKE_CXX_FLAGS="$CXXFLAGS" ${FLAGS_10BIT[@]}
sed -i -e 's/-march=i686//g' common/CMakeFiles/common.dir/flags.make
sed -i -e 's/-march=i686//g' encoder/CMakeFiles/encoder.dir/flags.make
emmake make -j

cd ../8bit
ln -sf ../10bit/libx265.a libx265_main10.a
ln -sf ../12bit/libx265.a libx265_main12.a
emcmake cmake ../.. -DCMAKE_CXX_FLAGS="$CXXFLAGS" ${FLAGS_8BIT[@]}
sed -i -e 's/-march=i686//g' common/CMakeFiles/common.dir/flags.make
sed -i -e 's/-march=i686//g' encoder/CMakeFiles/encoder.dir/flags.make
emmake make -j
mv libx265.a libx265_main.a

# Merge static libraries
emar -M <<EOF
CREATE libx265.a
ADDLIB libx265_main.a
ADDLIB libx265_main10.a
ADDLIB libx265_main12.a
SAVE
END
EOF
emmake make install -j