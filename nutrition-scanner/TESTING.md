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

## VR (Meta Quest, and PC VR if you have it)

- [ ] On the Quest, open the site, pick **VR** in the view switch, then **Enter VR**.
- [ ] The panel appears in front of you at a comfortable height; **Recenter** brings it back.
- [ ] Point and pull the trigger to type a barcode and **Look up**.
- [ ] Put the controllers down. Your hands show up and the panel moves within arm's reach.
- [ ] Tap keys with your index finger like a touch screen; each tap types once, even if you rest your finger.
- [ ] Pinch while pointing at a button from farther away; that presses it too.
- [ ] Pick the controllers back up; the panel moves back out.
- [ ] Switch diets on the panel; the verdict updates. Open a recent scan.
- [ ] Try **Enter passthrough**: the panel floats over your real room.
- [ ] Text is sharp enough to read without leaning in.
- [ ] PC VR: in Chrome or Edge on Windows with Quest Link, Air Link, SteamVR or Virtual Desktop running, repeat the steps above.

## After testing

Send me the notes and I'll tune the rules, e.g. add exceptions for false hits.
