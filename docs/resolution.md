# Canvas resolution and UI density

There are three separate sizes:

- `scene.size` is the exported frame in pixels. Header settings offer presets and custom width/height. Both dimensions must be even and at least 64. The limit is 4096 per edge and 4096 × 2160 total pixels, including portrait output. UHD 4K is 3840 × 2160.
- `sources[].width/height` are the app's **CSS layout viewport**. They determine responsive breakpoints and composition. Do not enlarge this viewport to sharpen a capture.
- `scene.capture.density` controls **raster pixels per CSS pixel**. It is `"auto"` by default, or an integer from 1 to 8. A 1000 × 640 layout at 4× produces a 4000 × 2560 texture with the same CSS bounds and layer positions.

```json
{
  "size": { "width": 3840, "height": 2160 },
  "capture": { "density": 4 }
}
```

These are scene-file settings with the same validation, file watching, Undo/Redo and frozen export behavior as other authored values. The CLI command escape hatch supports `set_setting` with `key: "size"`, `"width"`, `"height"` or `"density"`. Agents normally edit the JSON directly. Do not add another density parameter, source-side CSS zoom or capture pipeline.

## Auto and close-ups

Auto computes `ceil(2 × max(outputWidth / layoutWidth, outputHeight / layoutHeight))` separately for each source. This gives a full-frame fit extra sampling headroom. In the preview it also multiplies by inspection zoom (minimum 1). Zooming redraws immediately with the existing texture and requests a denser capture after a short gesture debounce. Preview sessions retain their highest requested density until authored capture inputs change, so multiple viewers or small zoom adjustments do not continually rebuild sources.

The viewer's pan/zoom/orbit are not authored animation. Auto export uses the canvas-based density without inspection zoom. Settings show Preview and Export capture sizes separately whenever they differ. For an authored extreme close-up, choose a sufficient fixed density and inspect its tightest frame at the target output resolution. Auto does not analyze arbitrary animated mesh UVs, shader distortion or every point of a perspective camera move. It cannot promise unlimited magnification.

A source capture is limited to 8192 pixels per edge, 32 megapixels and 8×. Density is reduced to the highest whole multiplier that fits, and the UI/context report **limit reached**. GPU texture limits are checked separately; unsupported sizes fail explicitly instead of silently shrinking. Higher density increases paint, PNG transfer and GPU memory costs approximately with the square of the multiplier. Many large extracted regions or sources can still exhaust memory; these are per-source bounds, not a global VRAM reservation system.

## Shared import and rendering contract

The adapter operates on browser output, independent of React, Svelte, Vue or vanilla code. Reuse the real UI and its assets; wait for the framework, fonts, image decoding and fixture data. Controlled animation still needs an absolute-time `window.tiltSource.sample` adapter. Canvas/WebGL content must size its own backing buffer using `devicePixelRatio`; increasing Tilt density cannot invent missing pixels in a low-resolution image, video or fixed-size canvas. Resolution media queries and `srcset` can react to density intentionally.

The source host supplies an explicit device scale factor. Chromium device metrics keep the logical viewport fixed, and Chromium surface screenshots rasterize at the requested density. PNG dimensions are checked for every full frame and layer crop. Bounds, crop padding and alignment remain CSS pixels. Isolation/restoration and caching are shared at every density. Imported pages retain their existing sandbox, permissions and origin restrictions.

This uses Chromium's [device metrics](https://chromedevtools.github.io/devtools-protocol/tot/Emulation/#method-setDeviceMetricsOverride) and [surface capture](https://chromedevtools.github.io/devtools-protocol/tot/Page/#method-captureScreenshot) through Electron's debugger API. On the tested Electron 41 build, `capturePage()` continued returning host-display dimensions despite the offscreen scale setting. Attach emulation after initial navigation: setting it on an uninitialized offscreen surface caused a native crash in the local probe.

The compositor uses mipmaps and anisotropic filtering for angled surfaces. When a source or crop changes pixel size, it releases and reallocates GPU texture storage while retaining the scene's Texture references. Without this, a live density change can retain the previous allocation even though metadata reports the new size.

Preview backing pixels cover the displayed canvas on Retina screens, up to the same canvas budget. Exports always use the exact authored width/height. Context includes `outputSize`, `previewSize` and per-source `sourceQuality` (requested/effective density, actual raster dimensions and limit state).

## Verify an import

Check real layout bounds at two densities, transparent crops, native-resolution text and thin borders, backward sampling and an export. Compare a live density change with a fresh renderer at that density; PNG dimensions alone do not prove the GPU displays the higher-resolution texture. Test production fonts/assets locally. A framework-independent boundary does not guarantee every app's asynchronous state or embedded media is already deterministic.
