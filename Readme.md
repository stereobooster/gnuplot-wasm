# gnuplot compiled to wasm

Experiment. Initial idea taken from https://github.com/CD3/gnuplot-in-the-browser

## TODO

- make npm package
- smaller size
  - `-s MALLOC=emmalloc`
  - `-Os -closure 1`
  - https://github.com/WebAssembly/wabt
  - remove unsued features - can I leave only support for SVG?
- github action for npm deployment
- test in browser
- typescript signatures
  - ` --emit-tsd gnuplot.d.ts`, but it requires Typescript, which mean I need to create custom Dcoker image with node, npm, TypeScript
