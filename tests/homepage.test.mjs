import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const html = readFileSync(new URL("index.html", root), "utf8");

const APP_STORE = "https://apps.apple.com/us/app/bettertrack/id6798806026";

test("approved homepage copy and calls to action", () => {
  assert.match(html, /<h1[^>]*>Free trackside tools for coaches and athletes\.<\/h1>/);
  assert.match(
    html,
    /Calculate pace and splits, time multiple athletes, and compare performances with World Athletics points\./,
  );
  assert.equal(html.match(/Download on the App Store/g).length, 2);
  assert.equal(html.match(/Try it free in your browser/g).length, 2);
  assert.equal(html.match(new RegExp(APP_STORE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")).length, 2);
  assert.equal(html.match(/href="\/app\/"/g).length, 2);

  const primary = html.indexOf("Download on the App Store");
  const secondary = html.indexOf("Try it free in your browser");
  assert.ok(primary > -1 && primary < secondary);
});

test("tool section uses the three approved tools and real screenshots", () => {
  for (const name of ["Pace &amp; Splits", "Multi Stopwatch", "World Athletics Points Converter"]) {
    assert.ok(html.includes(name), name);
  }
  assert.match(html, /Calculate pace, splits, and target times\./);
  assert.match(html, /Run several stopwatches at once with laps and a start-all button\./);
  assert.match(html, /Convert any performance to World Athletics points\./);

  const shots = [
    ["assets/pace-and-splits.webp", 860, 1460],
    ["assets/multi-stopwatch.webp", 860, 1720],
    ["assets/world-athletics-points.webp", 860, 980],
  ];
  for (const [file, width, height] of shots) {
    assert.ok(html.includes(`src="${file}"`));
    assert.ok(html.includes(`width="${width}"`));
    assert.ok(html.includes(`height="${height}"`));
    const size = statSync(new URL(file, root)).size;
    assert.ok(size > 15_000, `${file} looks empty (${size} bytes)`);
  }

  const alts = [...html.matchAll(/<img[^>]*assets\/[^>]*alt="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(alts.length, 3);
  for (const alt of alts) assert.ok(alt.length > 40, alt);
});

test("homepage does not add unapproved claims", () => {
  const banned = [
    /Workout Builder/i,
    /testimonial/i,
    /trusted by/i,
    /university/i,
    /college/i,
    /all-in-one/i,
  ];
  for (const pattern of banned) assert.doesNotMatch(html, pattern);
  assert.equal(html.match(/<h1\b/g).length, 1);
  assert.doesNotMatch(html, /<script\b/i);
});

test("legal pages, support, and the web app entry stay in place", () => {
  assert.ok(html.includes('href="privacy.html"'));
  assert.ok(html.includes('href="support.html"'));
  assert.match(html, /Skip to content/);
  assert.match(html, /<html lang="en">/);

  const privacy = readFileSync(new URL("privacy.html", root), "utf8");
  const support = readFileSync(new URL("support.html", root), "utf8");
  const app = readFileSync(new URL("app/index.html", root), "utf8");
  assert.match(privacy, /Privacy Policy for BetterTrack/);
  assert.match(privacy, /bettertrackcalculations@gmail.com/);
  assert.match(support, /BetterTrack Support/);
  assert.match(support, /bettertrackcalculations@gmail.com/);
  assert.match(app, /\/app\/_expo\/static\/js\/web\/index-/);
  assert.match(readFileSync(new URL("CNAME", root), "utf8"), /bettertrackapp\.com/);
});
