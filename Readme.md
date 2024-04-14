# gnuplot compiled to wasm

Experiment. Initial idea taken from https://github.com/CD3/gnuplot-in-the-browser

Notes:

- https://web.dev/articles/emscripten-npm
- https://github.com/plotters-rs/plotters-wasm-demo
- http://www.gnuplot.info/
- https://gnuplotting.org/

## TODO

- write wrapper with nicer API
  - output formats: svg, png, svg-js, canvas-js (supports many other formats)
- make npm package
- typescript signatures
  - ` --emit-tsd gnuplot.d.ts`, but it requires Typescript, which mean I need to create custom Dcoker image with node, npm, TypeScript
- smaller size
  - `-s MALLOC=emmalloc`
  - `-Os –closure 1`
  - https://github.com/WebAssembly/wabt
  - remove unsued features - can I leave only support for SVG?
- github action for npm deployment
- test in browser
