# App shell

The family app shell from [Math Expedition](https://github.com/appleinfire/Math), without the math. A new app starts from these files and adds its own screens.

What the shell already does:

- **Profiles.** "Who's playing?" picker, a new-profile form (name, kind such as grade or age group, avatar), one profile opens straight to its home. Every profile has its own progress.
- **Same progress on every device.** *Create a family* (family code + PIN) on the first device, *I already have a family* on the others. Firebase Firestore + anonymous sign-in; the code and PIN become a key in the browser (PBKDF2), the PIN is never sent. Each device keeps a full copy, works offline, uploads changes 1.5 s later, and merges copies played offline on two devices without losing anything earned.
- **For grown-ups.** Behind a multiplication question: report (KPIs, last 14 days), settings, rename, family sync status and disconnect, save code (backup / move without the cloud), list of profiles (change kind, delete with a second tap), erase progress (not undone by an older copy on another device).
- **Grown-up preview.** Everything unlocked on a copy of the profile, nothing saved, a purple bar with Exit.
- **Navigation.** Back button on every screen, browser back gesture moves between screens and asks before leaving an activity.
- **Installable and offline.** PWA manifest and service worker; on an iPad: Safari → Share → Add to Home Screen.
- **Publishing.** Every push to `main` runs the tests and publishes the site to GitHub Pages in about a minute.

## Files

```
index.html             app shell page; every script is a plain <script> tag (no build step)
css/style.css          all styles; colors are tokens in :root
js/config.js           app name, storage id, profile kinds, avatars, Firebase config      ← change first
js/schema.js           what a new profile holds and how two copies merge                ← the app's own data
js/util.js             helpers
js/store.js            profiles in localStorage, preview, paused sessions, save codes, merging
js/cloud.js            family sync through Firebase
js/app.js              screens and routing; home() and the demo quiz are where the app's own screens go
js/vendor/             Firebase JS SDK 10.14.1 compat builds: copy from appleinfire/Math js/vendor/
sw.js                  offline cache (list every file in FILES; PREFIX unique per app)
manifest.webmanifest   name and icons for "Add to Home Screen"
icons/                 placeholder icons (replace)
firestore.rules        Firestore security rules
.github/workflows/pages.yml   tests + deploy to GitHub Pages
tests/shell.test.js    node: merging, storage, preview, save code, family key, offline file list
tests/smoke.mjs        Playwright: two profiles, a round, grown-ups gate, preview, back gesture, reload
```

How the code is organized: every file attaches itself to the global `APP` object. Screens are functions that call `render(html)`; buttons carry `data-act="<action>" data-arg="<argument>"`, and one click listener calls `ACTIONS[action](arg)`. `go('<screen>')` changes screen and records it for the back gesture. After changing `APP.state`, call `APP.store.save()`: it saves locally, and the cloud uploads it.

## Start a new app

1. Copy this folder to the root of a new repository, and copy `js/vendor/` from appleinfire/Math.
2. In `js/config.js` set `name`, `id` (unique, never changed later), `profileWord`, `kinds`, `avatars`.
3. In `sw.js` set `PREFIX` to `'<id>-cache-'`. In `index.html` and `manifest.webmanifest` set the title, description, colors. Replace the icons.
4. Replace the demo fields in `js/schema.js` and the demo screens in `js/app.js` (`home`, `play`, `next`, `answer`, `finish`) with the app's own. For every new field in a profile, decide how two copies merge (`mergeProgress`) and add a test.
5. `node tests/shell.test.js` and `node tests/smoke.mjs` must pass.

## Publish (GitHub Pages)

1. The repository must be **public** (free GitHub Pages).
2. Settings → Pages → Source: **GitHub Actions**.
3. Push to `main`. Actions → *Deploy to GitHub Pages* shows the run; the site is at `https://<user>.github.io/<repo>/`.

## Family sync (Firebase, free Spark plan)

Option A — reuse the Firebase project of Math Expedition (nothing to set up): copy the config from appleinfire/Math `js/cloud-config.js` into `firebase:` in `js/config.js`. Its authorized domain `appleinfire.github.io` already covers every repository of that account. Data stays separate because the family key is salted with `APP.CONFIG.id`. The daily free limits (50,000 reads, 20,000 writes) are shared.

Option B — a separate project:

1. console.firebase.google.com → Add project (Google Analytics not needed). Stay on the **Spark** plan.
2. Project settings → Your apps → Web app → register; copy the `firebaseConfig` object into `firebase:` in `js/config.js`.
3. Authentication → Get started → Sign-in method → **Anonymous** → enable. Authentication → Settings → Authorized domains → add `<user>.github.io`.
4. Firestore Database → Create database → production mode → any region. Rules → paste `firestore.rules` → Publish.

Without a config (`firebase: null`) the app works with progress kept on each device, and the save code still moves a profile.

**Same origin note.** All apps at `<user>.github.io` share one browser origin: localStorage keys start with `APP.CONFIG.id`, and the service worker deletes only caches that start with its own `PREFIX`, so apps do not touch each other's data.
