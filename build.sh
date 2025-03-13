#! /bin/bash


set -e

ROOT=$PWD
BUILD=$ROOT/build


mkdir -p $BUILD

cd $BUILD

GNUPLOT_VERSION="5.4.0"
if [[ ! -e gnuplot-${GNUPLOT_VERSION}.tar.gz ]]
then
  wget https://sourceforge.net/projects/gnuplot/files/gnuplot/${GNUPLOT_VERSION}/gnuplot-${GNUPLOT_VERSION}.tar.gz/download
  mv download gnuplot-${GNUPLOT_VERSION}.tar.gz
fi

if [[ ! -d gnuplot-${GNUPLOT_VERSION} ]]
then
  tar xzf gnuplot-${GNUPLOT_VERSION}.tar.gz
fi

cd gnuplot-${GNUPLOT_VERSION}

if [[ ! -e src/gnuplot ]]
then
docker run \
  --rm \
  -v $(pwd):/src \
  -u $(id -u):$(id -g) \
  -e CXXFLAGS="-s MODULARIZE -s EXPORT_ES6 -s EXPORTED_RUNTIME_METHODS=FS,callMain" \
  emscripten/emsdk \
  emconfigure ./configure \
    --disable-largefile \
    --disable-plugins \
    --disable-history-file \
    --disable-x11-mbfonts \
    --disable-x11-external \
    --disable-raise-console \
    --disable-wxwidgets \
    --without-libcerf \
    --without-latex \
    --without-kpsexpand \
    --without-x \
    --without-x-dcop \
    --without-aquaterm \
    --without-readline \
    --without-lua \
    --with-cwdrc \
    --without-row-help \
    --without-wx-multithreaded \
    --without-bitmap-terminals \
    --without-tektronix \
    --without-gpic \
    --without-tgif \
    --without-mif \
    --without-regis \
    --without-cairo \
    --without-qt

docker run \
  --rm \
  -v $(pwd):/src \
  -u $(id -u):$(id -g) \
  emscripten/emsdk \
  emmake make gnuplot
fi

cd ${ROOT}

if [[ ! -d src ]]
then
  mkdir src
fi

cp ${BUILD}/gnuplot-${GNUPLOT_VERSION}/src/gnuplot src/gnuplot.js
cp ${BUILD}/gnuplot-${GNUPLOT_VERSION}/src/gnuplot.wasm src/
node file_to_variable.js ${BUILD}/gnuplot-${GNUPLOT_VERSION}/term/js/gnuplot_svg.js src/
# cp -r ${BUILD}/gnuplot-${GNUPLOT_VERSION}/term/js/ src/files
