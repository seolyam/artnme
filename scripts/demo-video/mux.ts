import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

/**
 * Lays the narration clips over raw.webm at the times the recorder logged and
 * writes <name>.mp4 (H.264 + AAC, plays everywhere) plus a <name>.jpg poster,
 * made from <outDir>/poster.png when the recorder left one, else the title card.
 *
 *   FFMPEG=/path/to/ffmpeg tsx scripts/demo-video/mux.ts <outDir> <name> [--crf 20]
 *
 * Use a higher --crf (e.g. 26) for a smaller file that is served from the website.
 */
const OUT = path.resolve(process.argv[2] ?? "scripts/demo-video/out/staff");
const name = process.argv[3] ?? "staff-portal-guide";
const crfFlag = process.argv.indexOf("--crf");
const crf = crfFlag > 0 ? process.argv[crfFlag + 1] : "20";
const ffmpeg = process.env.FFMPEG ?? "ffmpeg";
const { timeline } = JSON.parse(fs.readFileSync(path.join(OUT, "timeline.json"), "utf8")) as {
  timeline: { id: string; at: number }[];
};

// Skip the blank frames before the title card appears.
const start = Math.max(0, timeline[0].at - 400);
const inputs = ["-i", path.join(OUT, "raw.webm")];
const chains: string[] = [];
timeline.forEach(({ id, at }, i) => {
  inputs.push("-i", path.join(OUT, `${id}.wav`));
  const delay = at - start;
  chains.push(`[${i + 1}:a]aresample=48000,adelay=${delay}|${delay}[a${i}]`);
});
const mix = `${timeline.map((_, i) => `[a${i}]`).join("")}amix=inputs=${timeline.length}:normalize=0:duration=longest[aout]`;
const video = `[0:v]trim=start=${start / 1000},setpts=PTS-STARTPTS,fps=30,fade=t=in:st=0:d=0.6[vout]`;

const output = path.join(OUT, `${name}.mp4`);
execFileSync(
  ffmpeg,
  [
    "-y",
    ...inputs,
    "-filter_complex",
    [video, ...chains, mix].join(";"),
    "-map", "[vout]",
    "-map", "[aout]",
    "-c:v", "libx264", "-preset", "slow", "-crf", crf, "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "160k",
    "-movflags", "+faststart",
    "-shortest",
    output,
  ],
  { stdio: "inherit" },
);

const poster = path.join(OUT, `${name}.jpg`);
const shot = path.join(OUT, "poster.png");
const posterInput = fs.existsSync(shot) ? ["-i", shot] : ["-ss", "2", "-i", output]; // title card, after the fade-in
execFileSync(ffmpeg, ["-y", ...posterInput, "-frames:v", "1", "-update", "1", "-q:v", "3", poster], { stdio: "inherit" });
console.log(`Wrote ${output} and ${poster}`);
