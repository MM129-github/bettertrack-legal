import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const bundleName = "index-f9d0f16ab635a532e8a4d4df3a24f4b5.js";
const bundlePath = `app/_expo/static/js/web/${bundleName}`;

function read(path) {
  return readFileSync(new URL(path, root), "utf8");
}

test("web app index serves the verified bundle and keeps install metadata", () => {
  const html = read("app/index.html");
  assert.match(html, new RegExp(`/app/_expo/static/js/web/${bundleName}`));
  assert.doesNotMatch(html, /index-4dce6628ff9bcb2d6c6563abec495d97\.js/);
  assert.doesNotMatch(html, /index-f6a07ee52676ae097c3aeb4bfd208aa0\.js/);
  assert.match(html, /href="\/apple-touch-icon\.png"/);
  assert.match(html, /href="\/app\/manifest\.webmanifest"/);
  assert.match(html, /content="BetterTrack"/);
  assert.equal(existsSync(new URL(bundlePath, root)), true);
  assert.equal(
    existsSync(new URL("app/_expo/static/js/web/index-4dce6628ff9bcb2d6c6563abec495d97.js", root)),
    false,
  );
});

test("verified bundle contains the shipped web features and its asset files", () => {
  const js = read(bundlePath);
  const phrases = [
    "Sprint Visualizer",
    "Drag on the picture",
    "This player is moving the video at about",
    "Adjust moves one frame.",
    "Adjust jumps by time, not by frame.",
    "Choose a video. Photos cannot be stepped",
    "Type with keyboard",
    "Show number pad",
    "sideBySide",
    "Click anywhere to save",
    "Full screen stopwatches",
    "Select stopwatches",
    "Pause selected",
    "Lap selected",
    "[1,.5,.25,.1]",
  ];
  for (const phrase of phrases) assert.ok(js.includes(phrase), phrase);
  assert.equal(js.includes("App number pad"), false);
  assert.equal(js.includes("Device keyboard"), false);

  const assets = [...js.matchAll(/\/app\/assets\/[^"'\\\s)]+/g)].map((match) => match[0]);
  assert.ok(assets.length >= 26, `expected asset references, found ${assets.length}`);
  for (const asset of new Set(assets)) {
    const relative = asset.replace(/^\//, "");
    assert.equal(existsSync(new URL(relative, root)), true, asset);
  }
});

test("root site files stay outside the web app swap", () => {
  assert.match(read("index.html"), /Free trackside tools for coaches and athletes\./);
  assert.match(read("index.html"), /href="\/apple-touch-icon\.png"/);
  assert.match(read("privacy.html"), /Privacy Policy for BetterTrack/);
  assert.match(read("support.html"), /BetterTrack Support/);
  assert.match(read("CNAME"), /bettertrackapp\.com/);
  assert.equal(existsSync(new URL("apple-touch-icon.png", root)), true);
  assert.equal(existsSync(new URL("icon-192.png", root)), true);
  assert.equal(existsSync(new URL("icon-512.png", root)), true);
});
