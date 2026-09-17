# Order 1401 — In depth

Fresh 14-second composition from the local Order #1401 browser build. No previous scene choreography or camera settings were copied.

The camera traces payment detail, pulls back while cards separate, drifts past their depth, and settles into a full-order hold. Six declared browser layers include the nested payment surface. The page fades away during maximum separation and returns as the cards reassemble.

Timeline groups own the motion: **Unfold the order**, **Payment detail**, **Reassemble**, **Camera journey**. Expand groups to adjust individual layer and camera intervals. All intervals are sampled from the current document; before/after endpoints clamp and hold. Separation, Spread, Background dim, Detail lift and Travel are contextual controls. Depth of field uses Tilt's shared camera settings.

The copied app retains its layout, content, fonts and artwork. A small style in `admin-order/index.html` gives otherwise transparent lifted sections white backing and a subtle shadow. The customer note stays with the base page because its isolated paint was not reliable in this experiment.

Output: 3840×2160, 60 fps, 14 seconds. Fixed 3× source raster, 4320×3000, preserves the original 1440×1000 CSS layout. The final PNGs and video were inspected, including an opening native-pixel detail crop. The scene is sampled absolutely; reverse sampling reproduced the same pixels.

See [the friction log](../../docs/friction-order-in-depth.md) for the iterations, measured review latency, verification evidence and proposals for the next discussion. Generated media stays under `.tilt/` and `exports/`.
