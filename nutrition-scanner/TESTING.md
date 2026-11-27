# Device test checklist

The automated tests (`tests/`, run by the GitHub Action) cover the diet rules,
Section 508 / WCAG checks, security and the main features in a desktop browser.
These are the checks that need real hardware. Allow about 15 minutes.

Write down anything that looks wrong: the barcode, what the app said, and what
the label actually says.

## Phone (iPhone Safari, and Android Chrome if you have one)

- [ ] Open gilbertanderson.com/nutrition-scanner and allow the camera when asked.
- [ ] Scan 15 to 20 pantry items. Include something with dairy, something with
      wheat, a soda, a plain item (nuts, rice) and something with "coconut milk"
      or "cocoa butter" (these should NOT be flagged as dairy).
- [ ] For each, does the verdict match what you'd decide reading the label?
      Note any word that was flagged wrongly, or missed.
- [ ] Barcodes that won't scan: type the number instead and note which ones.
- [ ] Switch diets on a result (Best Bet, Vegan, Diabetic); the result updates.
- [ ] Install: Safari Share > Add to Home Screen (Android: menu > Install app).
      Open it from the home screen; it opens full screen.
- [ ] Turn on airplane mode, open the app, open a recent scan. It should load
      with a note that you're offline.

## VoiceOver (iPhone: Settings > Accessibility > VoiceOver)

- [ ] Swipe through the page; every button and field is read with a clear name.
- [ ] Pick a diet; VoiceOver says which one is selected.
- [ ] Type a barcode and look it up; VoiceOver reads the verdict, e.g.
      "Doesn't fit · Best Bet Diet. 3 reasons listed."
- [ ] Open a reason; the cookbook list and source are read.
- [ ] Highlighted ingredients are read with "(avoid)" or "(limit)" after them.

## Meta Quest (Quest Browser)

- [ ] Open the site; it should start in Headset view.
- [ ] Allow the camera; if the picture is wrong, use Switch camera.
      (Passthrough camera access in the browser needs a recent Quest Browser.)
- [ ] Scan or type a barcode; the result appears in the right column.
- [ ] Everything can be pointed at and clicked comfortably with controllers
      and with hand tracking.
- [ ] Install from the browser menu if offered, and pin it next to another app.

## After testing

Send me the notes and I'll tune the rules, e.g. add exceptions for false hits.
