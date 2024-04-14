import { writeFileSync } from "node:fs";
import gnuplot from "./gnuplot.js";

let STDOUT = [];
const SCRIPT_FILE = "script.gnuplot";
const RESULT_FILE = "plot.svg";
const DATA_FILE = "data.txt"

const instance = await gnuplot({
  // Don't run main on page load
  noInitialRun: true,
  noFSInit: true,

  // Print functions
  print: (stdout) => STDOUT.push(stdout),
  printErr: (stderr) => STDOUT.push(stderr),
});

function stdin() {
  return null; // if gnuplot asks for input, say NO
}
instance.FS.init(stdin, null, null);

// Utility function to run gnuplot
function run_gnuplot(script, options) {
  // Create file from object
  script =
    "set term svg size 1000,800;set output '" + RESULT_FILE + "'\n" + script;
  instance.FS.writeFile(SCRIPT_FILE, script);

  // Clear previous stdout/stderr before launching gnuplot
  STDOUT = [];

  // Launch gnuplot's main() function
  let args = [SCRIPT_FILE];
  args = args.concat(options);
  // HACK: gnuplot does not clean up memory when it exits.
  // this is OK under normal circumstances because the OS will
  // reclaim the memory. But the emscripten runtime does not
  // do this, so we create a snapshot of the memory before calling
  // main and restore it after calling main.
  const mem_snapshot = Uint8Array.from(instance.HEAPU8);
  instance.callMain(args);
  instance.HEAPU8.set(mem_snapshot);

  return {
    stdout: STDOUT.join("\n"),
  };
}

console.log("Powered by " + run_gnuplot("", "--version").stdout);

// Launch gnuplot with current field values
function launch(script, data = "") {
  // Write data file
  instance.FS.writeFile(DATA_FILE, data);
  // Call gnuplot
  const stdout = run_gnuplot(script, []);
  const result = instance.FS.readFile(RESULT_FILE, { encoding: "utf8" });

  return {
    stdout,
    result,
  };
}

console.log("Powered by " + run_gnuplot("", "--version").stdout);

const script = `
# set terminal pngcairo  transparent enhanced font "arial,10" fontscale 1.0 size 600, 400 
# set output 'simple.7.png'
set key bmargin left horizontal Right noreverse enhanced autotitle box lt black linewidth 1.000 dashtype solid
set samples 800, 800
set title "Simple Plots" 
set title  font ",20" textcolor lt -1 norotate
set xrange [ * : * ] noreverse writeback
set x2range [ * : * ] noreverse writeback
set yrange [ * : * ] noreverse writeback
set y2range [ * : * ] noreverse writeback
set zrange [ * : * ] noreverse writeback
set cbrange [ * : * ] noreverse writeback
set rrange [ * : * ] noreverse writeback
set colorbox vertical origin screen 0.9, 0.2 size screen 0.05, 0.6 front  noinvert bdefault
NO_ANIMATION = 1
plot [-30:20] sin(x*20)*atan(x)`;

// writeFileSync("./plot.svg", launch(script).result);
