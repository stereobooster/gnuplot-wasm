import gnuplotWrapper from "./gnuplot.js";
import gnuplot_svg from "./gnuplot_svg.js";

export default async function init(options = {}) {
  let STDOUT = [];
  const SCRIPT_FILE = "script.gnuplot";
  const RESULT_FILE = "plot.svg";
  const SVG_JS_PATH = "/usr/local/share/gnuplot/5.4/js/";
  const SVG_JS_FILE = "gnuplot_svg.js";

  const instance = await gnuplotWrapper({
    noInitialRun: true,
    noFSInit: true,
    print: (stdout) => STDOUT.push(stdout),
    printErr: (stderr) => STDOUT.push(stderr),
    ...options,
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

  function version() {
    return exec("--version").stdout;
  }

  function render(script, options = {}) {
    const term = options.term || "svg";
    const width = options.width || 1000;
    const height = options.height || 500;
    const background = options.background || "white";
    const data = options.data || {};

    if (term !== "svg") throw new Error("Only svg term supported for now");

    script = `set term ${term} enhanced size ${width},${height} background rgb '${background}';set output '${RESULT_FILE}'\n${script}`;
    instance.FS.writeFile(SCRIPT_FILE, script);
    instance.FS.mkdirTree(SVG_JS_PATH);
    instance.FS.writeFile(SVG_JS_PATH + SVG_JS_FILE, gnuplot_svg);
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
      instance.FS.unlink(SVG_JS_PATH + SVG_JS_FILE);
    } catch (e) {}

    if (exitCode !== 0) throw new Error(stdout);

    return { svg: result, stdout };
  }

  return { version, render, exec, _gnuplot: instance };
}
