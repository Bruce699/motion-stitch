# Admin Next order detail

This scene uses the real Admin Next order detail page for fixture order #1401, including AppShell, the original design system, sample order/customer data, product images, Shopify Inter, and Fuzzy Bubbles.

Source: `/Users/jaytel/Developer/admin-next`, commit `a58f401b05c42ae4ddf8355c253266395b43f6d4`.

`admin-order-app/app` is the source snapshot. `admin-order-app/entry.tsx` is the capture adapter: it mounts the original route with a memory router, disables initial Motion transitions, and waits for the page, fonts and decoded images. `admin-order/` is the production browser bundle that Tilt serves. No admin-next development server is needed for preview.

To rebuild: install the dependencies from `admin-order-app/package.json` (the upstream Bun lockfile is included), then run `node build.mjs` inside that directory. The public folder contains the assets used by this fixture. No backend connection or live customer data is used.

The decorative map retains the original OpenFreeMap tile service; its pixels are external and are not a sealed dependency. The rest of the page, fonts and images are local. The page is separated through Tilt's shared layer contract into the note, fulfillment, payment backing and nested payment card, customer details, risk and timeline. These use stable data-tilt-id attributes in the local snapshot and settle onto their original browser layout by six seconds.

The original vanilla source remains under `source/` for reference; the file journal can undo the replacement.
