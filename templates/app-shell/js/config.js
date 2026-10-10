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
    // Our apps. The picker and home screens link to every app except this one (matched by id).
    // Each app keeps its own profiles and progress; the link just opens it. Keep this list the same in every app.
    apps: [
      { id: 'math-expedition', name: 'Math Expedition', icon: '🧭', url: 'https://appleinfire.github.io/Math/' },
      { id: 'writing-power', name: 'WritingPower', icon: '✏️', url: 'https://appleinfire.github.io/WritingPower/' },
    ],
    // Firebase web-app config from console.firebase.google.com → Project settings → Your apps.
    // These values identify the project; they are not secrets. null = no cloud sync (progress stays on each device).
    firebase: null,
  };
})();
