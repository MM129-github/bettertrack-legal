import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);

const PNG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function read(path) {
  return readFileSync(new URL(path, root));
}

function pngSize(path) {
  const buf = read(path);
  assert.ok(buf.subarray(0, 8).equals(PNG), `${path} is not a PNG`);
  assert.equal(buf.subarray(12, 16).toString("ascii"), "IHDR", `${path} missing IHDR`);
  return {
    width: buf.readUInt32BE(16),
    height: buf.readUInt32BE(20),
    bytes: buf.length,
  };
}

const ICONS = {
  "/apple-touch-icon.png": [180, 180],
  "/icon-192.png": [192, 192],
  "/icon-512.png": [512, 512],
};

test("home-screen icons are real PNGs at the declared sizes", () => {
  for (const [href, [width, height]] of Object.entries(ICONS)) {
    const size = pngSize(href.slice(1));
    assert.deepEqual([size.width, size.height], [width, height], href);
    assert.ok(size.bytes > 4000, `${href} is too small to be the logo`);
  }
});

test("landing page and web app both point at the BetterTrack touch icon", () => {
  const pages = [
    ["index.html", "/manifest.webmanifest"],
    ["app/index.html", "/app/manifest.webmanifest"],
  ];
  for (const [page, manifestHref] of pages) {
    const html = read(page).toString("utf8");
    assert.match(
      html,
      /<link rel="apple-touch-icon" href="\/apple-touch-icon\.png" type="image\/png" sizes="180x180">/,
      page,
    );
    assert.match(
      html,
      /<link rel="icon" href="\/icon-192\.png" type="image\/png" sizes="192x192">/,
      page,
    );
    assert.match(html, /<meta name="apple-mobile-web-app-title" content="BetterTrack">/, page);
    assert.match(html, new RegExp(`<link rel="manifest" href="${manifestHref}">`), page);
    assert.doesNotMatch(html, /apple-touch-icon" href="[^"]+\.jpe?g"/i, page);
  }
});

test("manifests name BetterTrack and keep each entry URL", () => {
  const landing = JSON.parse(read("manifest.webmanifest").toString("utf8"));
  const app = JSON.parse(read("app/manifest.webmanifest").toString("utf8"));

  for (const manifest of [landing, app]) {
    assert.equal(manifest.name, "BetterTrack");
    assert.equal(manifest.short_name, "BetterTrack");
    assert.equal(manifest.display, "browser");
    assert.equal(manifest.icons.length, 3);
    for (const icon of manifest.icons) {
      assert.equal(icon.type, "image/png");
      assert.equal(ICONS[icon.src].join("x"), icon.sizes);
    }
  }

  assert.equal(landing.start_url, "/");
  assert.equal(landing.scope, "/");
  assert.equal(app.start_url, "/app/");
  assert.equal(app.scope, "/app/");
});

test("web app entry still loads the existing bundle", () => {
  const html = read("app/index.html").toString("utf8");
  assert.match(html, /\/app\/_expo\/static\/js\/web\/index-/);
  assert.match(html, /theme-color" content="#12061F"/);
});
