import gnuplotWrapper from "./gnuplot.js";

let STDOUT = [];
const SCRIPT_FILE = "script.gnuplot";
const RESULT_FILE = "plot.svg";

const instance = await gnuplotWrapper({
  // Don't run main on page load
  noInitialRun: true,
  noFSInit: true,

  // Print functions
  print: (stdout) => STDOUT.push(stdout),
  printErr: (stderr) => STDOUT.push(stderr),
});

// disable STDIN
instance.FS.init(() => null, null, null);

function exec(...argv) {
  // HACK: gnuplot does not clean up memory when it exits.
  // this is OK under normal circumstances because the OS will
  // reclaim the memory. But the emscripten runtime does not
  // do this, so we create a snapshot of the memory before calling
  // main and restore it after calling main.
  const mem_snapshot = Uint8Array.from(instance.HEAPU8);
  const exitCode = instance.callMain(argv);
  instance.HEAPU8.set(mem_snapshot);

  const stdout = STDOUT.join("\n");
  STDOUT = [];
  return {
    exitCode,
    stdout,
  };
}

export function version() {
  return exec("--version").stdout;
}

export function draw(script, options = {}) {
  const term = options.term || "svg";
  const width = options.width || 1000;
  const height = options.height || 800;
  const data = options.data || {};

  if (term !== "svg") throw new Error("Only svg tem supported for now");

  script = `set term ${term} size ${width},${height};set output '${RESULT_FILE}'\n${script}`;
  instance.FS.writeFile(SCRIPT_FILE, script);
  Object.entries(data).forEach(([name, content]) =>
    instance.FS.writeFile(name, content)
  );

  const { stdout, exitCode } = exec(SCRIPT_FILE);

  let result = null;

  try {
    result = instance.FS.readFile(RESULT_FILE, { encoding: "utf8" });
  } catch (e) {}

  try {
    Object.keys(data).forEach((name) => instance.FS.unlink(name));
    instance.FS.unlink(SCRIPT_FILE);
    instance.FS.unlink(RESULT_FILE);
  } catch (e) {}

  return { result, stdout, exitCode };
}
