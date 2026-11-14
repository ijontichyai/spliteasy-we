# SplitEasy | BRAND-001 asset staging
Status: **assets prepared locally, binary upload PENDING**. Not merged, not integrated, not published.

## Canonical artwork
User-approved composite and horizontal images supplied 2026-11-14. Do **not** regenerate or substitute approximations.

Expected files to add under `public/brand/`:
- `spliteasy-app-icon.png` — navy square logo, outside transparent.
- `spliteasy-icon-256.png` — icon 256px.
- `spliteasy-symbol.png` — multicolor S transparent.
- `spliteasy-logo-light.png` — horizontal navy wordmark, transparent.
- `spliteasy-logo-dark.png` — horizontal light wordmark for dark theme, transparent.

## Release gates
1. Upload PNGs from verified brand package to this branch; ensure browser preview shows correct transparency and no cropping/white fringes.
2. Review/approve assets visually in light and dark; source artwork is raster on near-white, so matte extraction needs close inspection.
3. Merge approved assets in a controlled PR only after sign-off and check Lovable bidirectional synchronization.
4. Then give Lovable an implementation prompt using exact `/brand/` paths. Preserve all existing features, no publishing or paid services.

No binary artwork has been committed by this file alone.
