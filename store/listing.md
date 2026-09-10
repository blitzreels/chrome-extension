# Chrome Web Store listing

## Name

BlitzReels - Save video moments

## Short description

Save YouTube timestamps and notes. Find your saved moments in the BlitzReels popup and return to the original video.

## Detailed description

Keep the moments you want to come back to with BlitzReels.

While watching a YouTube video, click Save in BlitzReels. Save the current timestamp, add an optional end time and note,
and find it again from your Chrome toolbar.

- Save timestamps from YouTube videos and Shorts.
- Add notes and optional time ranges.
- See video thumbnails and search your saved titles and notes.
- Open the original video at the saved time or copy its timestamped link.
- Remove saved moments and undo an accidental removal.
- Use light or dark mode to match your browser.

Your moments stay on this device. No account is needed, and saving moments is free.
BlitzReels does not download, record or create clips from YouTube videos.
An end time is a reference for your notes; shared links start playback at the saved start time.
Live streams and advertisements are not supported.

For captions, video editing and more, the optional Open BlitzReels link takes you to blitzreels.com.
The web app has separate account and plan requirements. Your moments and notes are not sent to it.

BlitzReels is an independent product and is not affiliated with or endorsed by YouTube or Google.

## Store fields

- Website: https://blitzreels.com
- Privacy policy: https://blitzreels-extension.vercel.app/privacy
- Support email: support@blitzreels.com.
- Suggested category: Workflow & Planning.
- Single purpose: save, organize and revisit timestamped YouTube bookmarks with personal notes.
- Storage justification: persist the user's bookmarks and notes between popup sessions and browser restarts.
- YouTube site access justification: display the Save in BlitzReels action and read the selected video URL, title,
  duration and current playback time when the user opens the extension.
- Remote code: none. Executable code, font and branding ship inside the package.
- User data: disclose Website content (video titles, thumbnails and notes) and Web history (selected YouTube URLs).
  Data is handled locally for saving and revisiting moments. This is not a claim to access the browser's history API.
  Thumbnail requests go directly to YouTube. There is no extension analytics or server-side library.
- Reviewer login: not required. Start with an ordinary YouTube watch page; wait for ads to finish.

## Reviewer instructions

No account, subscription or test credentials are required.

1. Open a normal YouTube video in Chrome 127 or later. Wait for any advertisement to finish.
2. Click Save in BlitzReels beneath the video, or open BlitzReels from the Chrome toolbar.
3. Save the current time with a note. An optional end time records a range for reference.
4. Close the popup, refresh YouTube and reopen the popup. The saved moment remains.
5. Search for the note, copy its timestamped link, and open the original video at the saved time.
6. Remove the moment and use Undo to restore it.

The extension does not download or record media. End times do not stop or trim the YouTube player.
The optional Open BlitzReels link opens the homepage without transferring any saved moment or note.
Shorts are supported. Live streams, advertisements and embedded players are not supported.

## Distribution and data certifications

- Distribution: public, free, all available countries; English listing.
- Select automatic publication after review to match the owner's September 10 publication request.
- No remotely hosted code: JavaScript, fonts and branding are bundled in the ZIP.
- No sale or transfer of saved user data to third parties.
- Saved data is used only for the extension's stated purpose.
- Saved data is not used for lending or creditworthiness decisions.
- Declare the YouTube thumbnail requests in any field asking about third-party handling.
  These requests expose the requested thumbnail and IP address to YouTube; the extension does not geolocate users.
- Confirm the current dashboard labels against these facts before certifying the form.

Local-only processing still requires disclosure under Google's
[user-data FAQ](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq.md.txt).

## Submission files

- Extension ZIP: `../release/blitzreels-chrome-1.4.0.zip`.
- Icon: `../public/icons/icon-128.png`.
- Screenshot: `screenshots/moments-1280x800.png`.
- Required small promotional tile: `promo/small-440x280.png`.
- Public privacy policy: https://blitzreels-extension.vercel.app/privacy.
- Local publisher state and receipts are excluded from the public source repository.

## Publication checklist

1. Run `pnpm package` and use only its current ZIP from `release`.
2. Check the live native-popup receipt and screenshots against that version.
3. Verify the hosted `privacy.html` URL above remains public. Anonymous HTTP 200 and byte parity passed September 10.
4. Enter that URL in the dedicated privacy-policy field and review the current user-data declarations.
5. Upload the app icon, current 1280x800 screenshot and required 440x280 promotional tile.
6. Confirm developer identity, contact information, website ownership and any required store registration payment.
7. Review and submit from the developer account. Publication and search visibility remain unverified until Google approves it.

No SEO ranking value, approval or install volume is promised by this listing.

## Privacy hosting maintenance

Edit `privacy.html`, then run `node scripts/prepare-privacy-site.mjs` from the extension root.
Deploy only `store/privacy-site` with `vercel deploy --prod --scope varkoffs-projects`.
The standalone Vercel project is `blitzreels-extension`; its canonical policy URL is listed above.
Verify the public response against the source bytes after each deployment.
