# BlitzReels Chrome extension

## Scope

- One purpose: save and revisit YouTube timestamps with notes in the native toolbar popup.
- Local saving is free and does not require an account. The optional BlitzReels link opens the homepage.
- Read `README.md` for runtime boundaries and `store/policy-review.md` before packaging or changing data sources.
- Media extraction, recording, downloads, OAuth and video URL handoffs are outside this extension's scope.

## Code and UI

- Use WXT lifecycle helpers and React components; verify library APIs in installed declarations.
- Functions with multiple domain arguments take one object. Required wiring remains mandatory.
- Entrypoints adapt browser events; hooks manage subscriptions; presentation receives typed props.
- Validate messages and persisted data with the schemas in `src/contracts.ts`.
- The background controller serializes writes. Failed reads preserve storage; retries cannot duplicate moments.
- Only packaged `popup.html` may read or mutate the library. Content scripts receive only popup acknowledgements.
- Keep local storage restricted to trusted contexts; never send moments or notes to BlitzReels.
- Keep code, fonts and styles bundled. Thumbnail URLs use validated YouTube video IDs and omit the referrer.
- Components use BlitzReels tokens, Onest and existing button variants. Inline controls use YouTube's themes and shape.
- Keep one Shadow DOM host and clean up observers, frames, message listeners and React roots on invalidation.
- Read playback metadata on invocation. Hide the action on unsupported pages; do not save advertisements or live streams.
- End times are notes for a range; original YouTube links start at the saved timestamp and do not trim playback.
- `src/ui.showcase.tsx` exposes real view states; fixtures stay under `tests` and out of the user preview and release.

## Verification and delivery

- Run `pnpm verify` before handoff. It covers typecheck, lint, unit tests, production build and browser behavior.
- Use disposable Chrome profiles. Distinguish fixture tests from live native-popup proof.
- Keep `dist` as the stable unpacked path. Manifest changes require one manual extension reload, then a YouTube refresh.
- Run `scripts/check-live-popup.mjs` with a real YouTube URL; require a Chrome POPUP context and saved-moment persistence.
- `pnpm package` must validate the tested artifact hash before copying a ZIP to `release`.
- Release candidates do not establish store approval. Finish the publication checklist in `store/listing.md` before submission.
- Earlier downloader prototypes remain archived under `artifacts/not-for-submission` and must never be published.
