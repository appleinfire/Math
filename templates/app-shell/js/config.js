// Everything that names this app. Change these values first when starting a new app from the template.
(function () {
  const APP = (globalThis.APP = globalThis.APP || {});
  APP.CONFIG = {
    name: 'My App',
    // Storage prefix and family-key salt. Pick it once (lowercase, dashes) and never change it after launch:
    // a new id means every device starts empty and families can no longer be found.
    id: 'my-app',
    // What one profile is called in the interface.
    profileWord: 'player',
    // Profile kinds (grade, age group, level…). Each profile follows one kind; a grown-up can switch it.
    kinds: [
      { id: 'young', label: 'Ages 4–6', icon: '🌻', color: '#e0a21b', about: 'Big pictures, read-aloud' },
      { id: 'older', label: 'Ages 7–9', icon: '🧭', color: '#2bb3a3', about: 'Harder tasks, more reading' },
    ],
    avatars: ['🦊', '🐼', '🐸', '🦉', '🐯', '🐙', '🦄', '🐢'],
    // Firebase web-app config from console.firebase.google.com → Project settings → Your apps.
    // These values identify the project; they are not secrets. null = no cloud sync (progress stays on each device).
    firebase: null,
  };
})();
