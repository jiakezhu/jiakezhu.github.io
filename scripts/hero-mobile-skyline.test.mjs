import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../assets/hero-mobile-skyline.js', import.meta.url), 'utf8');

function scene({ desktop = false, width = 390, height = 844, dpr = 3 } = {}) {
  const root = { dataset: { theme: 'dark' } }, frames = [], strips = [], observers = {}, listeners = {};
  const gradient = { addColorStop() {} };
  const ctx = new Proxy({}, { get: (target, key) => target[key] || (() => gradient) });
  const canvas = { dataset: {}, style: {}, setAttribute() {}, getContext: () => ctx };
  const hero = { offsetHeight: 1300, getBoundingClientRect: () => ({ width }), prepend() {} };
  const media = { matches: desktop, addEventListener: (_, fn) => { listeners.pointer = fn; } };
  const context = {
    document: { documentElement: root, getElementById: () => hero, createElement: () => canvas },
    matchMedia: () => media, innerHeight: height, devicePixelRatio: dpr,
    requestAnimationFrame: fn => frames.push(fn),
    ResizeObserver: class { constructor(fn) { observers.resize = fn; } observe() {} },
    MutationObserver: class { constructor(fn) { observers.theme = fn; } observe() {} }
  };
  context.window = {
    VerseCity: {
      palette: () => ({ theme: root.dataset.theme }),
      strip: options => { strips.push(options); return { body: {}, lights: {}, tileW: 747, tileH: options.tileH }; }
    },
    addEventListener: (name, fn) => { listeners[name] = fn; }
  };
  vm.runInNewContext(source, context);
  return { canvas, strips, frames, observers, listeners, root, media, resize: value => { width = value; observers.resize(); }, flush: () => { while (frames.length) frames.shift()(); } };
}

test('mobile renders at retina resolution with sparse windows and bounded-height layers', () => {
  const page = scene();
  assert.equal(page.canvas.width, 780);
  assert.equal(page.canvas.height, 1688);
  assert.equal(page.canvas.style.height, '844px');
  assert.equal(page.strips.length, 2);
  assert(page.strips.every(strip => strip.tileH <= 340 && strip.dpr === 2 && strip.spec.lit < .1));
  assert.equal(page.frames.length, 0, 'static backdrop must not schedule a render loop');
});

test('same-size notifications do not repaint; rotation redraws without stretching', () => {
  const page = scene();
  page.observers.resize(); page.observers.resize(); page.flush();
  assert.equal(page.strips.length, 2);
  page.resize(430); page.flush();
  assert.equal(page.canvas.width, 860);
  assert.equal(page.strips.length, 4);
  assert.equal(page.frames.length, 0);
});

test('theme changes repaint the static city even without an animation frame loop', () => {
  const page = scene();
  page.root.dataset.theme = 'light'; page.observers.theme(); page.flush();
  assert.equal(page.canvas.dataset.theme, 'light');
  assert.equal(page.strips.length, 4);
});

test('desktop keeps its original scene, and switching input mode updates the backdrop', () => {
  const page = scene({ desktop: true });
  assert.equal(page.canvas.hidden, true);
  assert.equal(page.strips.length, 0);
  page.media.matches = false; page.listeners.pointer(); page.flush();
  assert.equal(page.canvas.hidden, false);
  assert.equal(page.strips.length, 2);
});

test('homepage no longer generates or stretches a raster sky, and loads the native skyline after the city kit', () => {
  const css = fs.readFileSync(new URL('../assets/home-loading.css', import.meta.url), 'utf8');
  const generator = fs.readFileSync(new URL('./build-home-media.mjs', import.meta.url), 'utf8');
  const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const startup = fs.readFileSync(new URL('../assets/home-startup.js', import.meta.url), 'utf8');
  assert(!/home-sky-|background-size:100% 100%/.test(css + generator + html));
  assert(css.includes('radial-gradient'));
  assert(startup.indexOf('hero-mobile-skyline.js') > startup.indexOf('verse-city.js'));
  assert(!/City\.haze|City\.sun|setInterval/.test(source), 'no halftone textures or timer repaint');
});
