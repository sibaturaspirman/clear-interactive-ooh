import * as esbuild from "esbuild";
import fs from "node:fs";
import path from "node:path";

const outDir = path.join("public", "broadsign");
const outFile = path.join(outDir, "player.js");

fs.mkdirSync(outDir, { recursive: true });

await esbuild.build({
  entryPoints: ["src/broadsign-led/player-entry.js"],
  outfile: outFile,
  bundle: true,
  format: "iife",
  target: ["chrome87"],
  minify: true,
  legalComments: "none",
});

const motionSrc = path.join("src", "components", "led", "led-player.css");
const motionDest = path.join(outDir, "motion.css");
const raw = fs.readFileSync(motionSrc, "utf8");
const nameStart = raw.indexOf(".led-live-participant-name-wrap");
const staticStart = raw.indexOf(".led-bei-static-layer");
const sliceFrom =
  nameStart >= 0 && staticStart >= 0
    ? Math.min(nameStart, staticStart)
    : staticStart >= 0
      ? staticStart
      : nameStart >= 0
        ? nameStart
        : 0;
const motionCss = raw.slice(sliceFrom);
fs.writeFileSync(
  motionDest,
  [
    ".bs-fill{position:relative;width:100%;height:100%;overflow:hidden}",
    ".relative{position:relative}",
    ".size-full{width:100%;height:100%}",
    ".flex{display:flex}",
    ".items-end{align-items:flex-end}",
    ".justify-start{justify-content:flex-start}",
    ".pointer-events-none{pointer-events:none}",
    ".absolute{position:absolute}",
    ".bs-z-name{z-index:4}",
    motionCss,
  ].join("\n"),
);
console.log("Broadsign player →", outFile);
console.log("Broadsign motion  →", motionDest);
