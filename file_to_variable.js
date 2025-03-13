import { argv } from "node:process";
import { basename, join } from "node:path";
import { readFileSync, writeFileSync } from "node:fs";

const from = argv[2];
const to = argv[3];
const src = `export default ${JSON.stringify(
  readFileSync(from, { encoding: "utf8" })
)}`;

writeFileSync(join(to, basename(from)), src);
