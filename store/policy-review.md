# Chrome Web Store policy review

Reviewed September 10, 2026 for version 1.4.0, Save video moments.
Local candidate packaging is allowed for this implementation. Store submission remains a separate publication step.

## Product boundary

The extension saves local bookmarks: a video URL, title, start/end timestamps and the user's note.
It links back to the original YouTube video at the saved start time. YouTube documents timestamped sharing.
[YouTube sharing help](https://support.google.com/youtube/answer/57741?hl=en).

There is no audiovisual extraction, recording, download API, transcript scraping, OAuth or processing endpoint.
The optional BlitzReels homepage link has campaign tags only; it does not hand a YouTube URL, note or media job to the app.
The popup provides saving, searching, reopening, copying and removal itself, without an account.
This gives the extension a functional purpose beyond launching a website.
[Chrome Web Store policies](https://developer.chrome.com/docs/webstore/program-policies/policies).

## Validation requirements

- Only the storage API permission and the desktop YouTube content-script matches are included.
- Packaged code is local. No remote code, tracking pixels, hidden links, search overrides or affiliate injection.
- Saved content remains in trusted local extension storage. Thumbnail requests and optional app visits are disclosed.
- Library mutations are restricted to the packaged popup. Input and stored state are validated.
- Failed storage writes, corrupt data and full libraries do not silently overwrite saved content.
- Store copy and screenshots describe bookmarks. They must not claim downloadable YouTube clips.
- Exact build hash and native-popup evidence accompany the candidate. Hosted privacy and publisher disclosures remain required.

## Earlier prototype

Version 1.3.0 and earlier facilitated a YouTube download through server-side clipping.
Google explicitly identifies facilitating YouTube downloads as a reason for rejection or removal.
[Review troubleshooting](https://developer.chrome.com/docs/webstore/troubleshooting#prohibited-products).
Those ZIPs and a source snapshot are archived under `artifacts/not-for-submission` and must never be submitted.

This review addresses the identified product behavior and current published policies.
It does not establish Google's approval, guarantee a backlink's ranking value, or certify every user's use of saved content.
