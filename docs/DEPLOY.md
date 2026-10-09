# Putting Math Expedition online

The app is a static website on **GitHub Pages**, and family progress is stored in **Firebase** (Firestore + anonymous sign-in, free Spark plan). Both are free.

Site: **https://appleinfire.github.io/Math/**

## How updates go out

Every push to `main` runs `.github/workflows/pages.yml`, which:

1. runs the tests (`tests/generators.test.js`, `tests/store.test.js`);
2. copies the site into `_site/`;
3. gives the offline cache a new name (the commit hash), so tablets load the new version the next time the app is opened online;
4. publishes it to GitHub Pages. This takes about a minute.

Watch a deploy: repository → **Actions** → *Deploy to GitHub Pages*.

## One-time setup (already done)

**GitHub**
- Settings → General → visibility **Public** (GitHub Pages is free only for public repositories; the code holds no secrets).
- Settings → Pages → Source: **GitHub Actions**.

**Firebase** (project `math-accc7`, console.firebase.google.com)
- Web app registered; its config is in `js/cloud-config.js`. These values only identify the project and are public by design.
- Authentication → Sign-in method → **Anonymous** enabled; Authorized domains include `appleinfire.github.io`.
- Firestore database created in production mode; **Rules** = contents of `firestore.rules`.
- Stay on the free **Spark** plan. A family uses a tiny part of its limits (50,000 reads and 20,000 writes per day).

## How family sync works

- The first device chooses **Create a family**: a family code (at least 6 characters, e.g. `rudyk-tigers`) and a 4–6 digit PIN.
- Every other device chooses **I already have a family** and types the same code and PIN, once.
- The browser turns code + PIN into a long key (PBKDF2-SHA256, 150,000 rounds). The family's data lives at `families/<key>/profiles/<childId>`. The PIN is never stored or sent.
- Each device keeps a full copy in its own storage, so the app opens instantly and works offline. Changes upload about 1.5 seconds after they happen (or when the app is closed) and appear on other devices within seconds.
- If the same child played offline on two devices, the copies are merged: creatures, badges and best stars from both are kept; crystals and settings come from the most recent copy. Erasing a child's progress on purpose is not undone by an older copy.

**Security trade-off.** Anyone who knows both the family code and the PIN can see and change that family's progress. Families cannot be listed or deleted by anyone, and data without the right key is unreachable. This is fine for children's game progress; use a code that is not easy to guess.

## Changing things later

- **Forgot the PIN:** on a device that has the children, open *For grown-ups → Family sync → Disconnect this device*, then *Connect family → Create a family* with a new code and PIN. The children on that device move into the new family. Connect the other devices to the new family.
- **Turn sync off completely:** set `MQ.CLOUD_CONFIG = null` in `js/cloud-config.js`. The app keeps working with progress stored per device.
- **Test the real sync:** `node tests/cloud-e2e.mjs` (needs Playwright). It creates a test family with a random code, plays on two simulated devices, and deletes its test explorer afterwards (the empty test family record stays, because families cannot be deleted).
