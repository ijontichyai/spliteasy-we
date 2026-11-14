# SplitEasy brand (BRAND-001, 2026-11-14)

Official artwork supplied by the Product Owner (SplitEasy_Brand_Assets.zip). Not redesigned or regenerated.

## Runtime assets (public/brand/)
| File | Size | Use |
|---|---|---|
| spliteasy-logo-light.png | 1100x299 RGBA | Horizontal logo, light theme (header ≥sm, landing, auth card) |
| spliteasy-logo-dark.png | 1100x299 RGBA | Horizontal logo, dark theme |
| spliteasy-icon-256.png | 256x256 RGBA | Compact header mark on mobile |
| spliteasy-app-icon.png | 520x521 RGBA | Source for favicon/touch icons |
| spliteasy-symbol.png | 260x267 RGBA | Installed, not used (defect below) |

Derived by plain resize from spliteasy-app-icon.png: public/favicon-32.png, public/apple-touch-icon.png (180), public/icon-192.png, public/icon-512.png. No PWA manifest exists, so the 192/512 files are prepared but unreferenced.

Theme switching: both logo variants render; the `.dark` class on `<html>` (Light/Dark/System selector) shows one. Component: src/components/brand-logo.tsx.

Reference sources (not served): docs/brand/source/ (SOURCE-approved-composite.png, SOURCE-horizontal-original.png, README.md).

## Known asset defects (not fixed, awaiting native vector files)
- spliteasy-symbol.png: a fragment of the "Plan" tagline is clipped into the bottom-right corner, so the 256 icon is used on mobile instead.
- spliteasy-logo-dark.png: background removal left a dark, jagged outline around the white wordmark and tagline; visible on dark surfaces at large sizes.
- No About page exists; none was created.
