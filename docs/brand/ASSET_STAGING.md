# SplitEasy BRAND-001 | Official asset handoff
Updated: 2026-11-14
Status: **User visually approved the five PNG outputs, pending live preview validation. Images NOT YET committed to GitHub. Do not mark deployment done.**

## Approved local source pack
`SplitEasy_Brand_Assets.zip` was created in ChatGPT and contains original reference images and five derived RGBA PNGs. Generated variations should NOT replace the user's original reference. Visual approvals are provisional, including potential alpha-matte/fringe cleanup.

## Files to upload to the EXISTING branch `brand/official-assets-2026-11`
- `public/brand/spliteasy-app-icon.png` — navy square app icon, dark background is part of mark.
- `public/brand/spliteasy-icon-256.png` — square 256 favicon/PWA candidate.
- `public/brand/spliteasy-symbol.png` — transparent S emblem.
- `public/brand/spliteasy-logo-light.png` — transparent horizontal logo for light background.
- `public/brand/spliteasy-logo-dark.png` — transparent horizontal logo for dark background.

## Integration rules
1. Asset sources must be the user-approved supplied PNG files; don't redraw the logo.
2. Switch horizontal logo according to resolved app theme; maintain readable tagline and pixel ratio.
3. Use compact symbol in small mobile header; icon for favicon/shortcut as appropriate.
4. No modification to auth, expenses, billing, admin, database or RLS.
5. Run app tests and verify rendered artwork at desktop/mobile and light/dark, including halo/transparency artifacts.
6. No publication, payment activation, paid providers or wider features without Commander approval.
7. Preserve current Lovable bidirectional Git synchronization. No simultaneous editing of identical paths.
8. Add assets to the connected repository and verify image files exist before claiming completion.

## Upload constraint
GitHub's text-file endpoint cannot safely upload PNG bytes; documentation commits alone do not upload the artwork. A binary-capable upload through GitHub's Git blobs/trees or Lovable's image attachment feature is required.

## Proposed Lovable instruction after the files are accessible
```text
BRAND-001 — BUILD, scope limited to official SplitEasy branding.
Use only the five user-approved assets supplied by the project owner, in public/brand/.
Do not generate substitute art. Make logo assets available at /brand/<filename>.
Integrate favicon/app icon, responsive light/dark logos for header, landing, login and About (existing page only).
Preserve original aspect ratios, avoid blur/cropping, check dark and light transparency.
No auth, RLS, Stripe, payments, expenses or group logic changes.
Run existing tests; report changed files and visual checks.
Do not publish.
If assets are missing, STOP and ask for them rather than guessing.
```
