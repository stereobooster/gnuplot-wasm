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
#!/usr/bin/gnuplot
#
# Plotting filledcurves with different transparencies
#
# AUTHOR: Hagen Wierstorf
# VERSION: gnuplot 4.6 patchlevel 0

# reset

# wxt
# set terminal wxt size 350,262 enhanced font 'Verdana,10' persist
# png
# set terminal pngcairo size 350,262 enhanced font 'Verdana,10'
# set output 'different_transparency2.png'

set border linewidth 1.5
# Axes
set style line 11 lc rgb '#808080' lt 1
set border 3 back ls 11
set tics nomirror out scale 0.75
# Grid
set style line 12 lc rgb'#808080' lt 0 lw 1
set grid back ls 12

set style fill noborder
set style function filledcurves y1=0
set clip two

Gauss(x,mu,sigma) = 1./(sigma*sqrt(2*pi)) * exp( -(x-mu)**2 / (2*sigma**2) )
d1(x) = Gauss(x, 0.5, 0.5)
d2(x) = Gauss(x,  2.,  1.)
d3(x) = Gauss(x, -1.,  2.)

set xrange [-5:5]
set yrange [0:1]

unset colorbox

set key title "Gaussian Distribution"
set key top left Left reverse samplen 1

set lmargin 6
plot d1(x) fs transparent solid 0.75 lc rgb "forest-green" title 'µ= 0.5 σ=0.5', \
     d2(x) fs transparent solid 0.50 lc rgb "gold" title 'µ= 2.0 σ=1.0', \
     d3(x) fs transparent solid 0.25 lc rgb "red" title 'µ=-1.0 σ=2.0'
`;

writeFileSync("./plot.svg", launch(script).result);
