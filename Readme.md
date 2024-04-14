# gnuplot compiled to wasm

Experiment. Initial idea taken from https://github.com/CD3/gnuplot-in-the-browser

## Hack for WASM in Vite

```js
import gnuplot from "gnuplot-wasm";

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const wasmPath = require.resolve("gnuplot-wasm/src/gnuplot.wasm");

const { draw, version } = await gnuplot({
  locateFile: () => wasmPath,
});
```

See:

- https://github.com/vitejs/vite/issues/11694
- https://github.com/httptoolkit/brotli-wasm/issues/8
- https://github.com/sapphi-red/vite-plugin-static-copy/

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
  - `--emit-tsd gnuplot.d.ts`, but it requires Typescript, which mean I need to create custom Dcoker image with node, npm, TypeScript
