// Family sync through Firebase (Firestore + anonymous sign-in, free Spark plan).
//
// A family is identified by a family code + PIN typed on each device. Both are turned into a long key
// in the browser (PBKDF2), and the family's data lives at families/<key>/profiles/<childId>.
// Without the code and PIN nobody can find the key; the PIN itself is never stored or sent.
// This key is also the family root of all our apps (MQ.APPS): the other apps derive their own data keys
// from it, and families/<key> is the one family record. So one family code + PIN works in every app, and an
// app can join the family another app connected on this device (C.sibling) without asking for the PIN.
//
// The device keeps its own copy in localStorage (js/store.js), so the app opens instantly and works offline.
// Changes are uploaded a moment after they happen; changes from other devices arrive live and are merged.
(function () {
  const MQ = (globalThis.MQ = globalThis.MQ || {});
  const LINK = 'math-expedition-family'; // { fid, root, name } of the connected family on this device (here fid = root)
  const C = { status: 'off', family: null, error: '' };
  const subs = [];
  C.onUpdate = (fn) => subs.push(fn);
  const emit = (what) => subs.forEach((fn) => { try { fn(what); } catch (e) { /* ignore */ } });
  const setStatus = (s) => { if (C.status !== s) { C.status = s; emit('status'); } };
  const fail = (code) => Object.assign(new Error(code), { code });

  C.normCode = (code) => String(code || '').trim().toLowerCase().replace(/\s+/g, '-');
  C.deriveId = async (code, pin) => {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', enc.encode(C.normCode(code) + '|' + String(pin).trim()), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode('math-expedition'), iterations: 150000 }, key, 256);
    return [...new Uint8Array(bits)].map((b) => b.toString(16).padStart(2, '0')).join('');
  };
  C.configured = () =>
    !!MQ.CLOUD_CONFIG && typeof firebase !== 'undefined' && typeof location !== 'undefined' && /^https?:$/.test(location.protocol) && !!(globalThis.crypto && crypto.subtle);

  const readLink = () => { try { return JSON.parse(localStorage.getItem(LINK) || 'null'); } catch (e) { return null; } };
  const writeLink = (v) => { try { v ? localStorage.setItem(LINK, JSON.stringify(v)) : localStorage.removeItem(LINK); } catch (e) { /* ignore */ } };
  // A family one of our other apps connected on this device (they share this origin, so their links are visible).
  C.sibling = () => {
    for (const a of MQ.APPS || []) {
      if (a.id === MQ.APP_ID) continue;
      let l = null;
      try { l = JSON.parse(localStorage.getItem(a.id + '-family') || 'null'); } catch (e) { /* ignore */ }
      if (l && /^[a-f0-9]{64}$/.test(l.root || '')) return { root: l.root, name: l.name || '', app: a.name };
    }
    return null;
  };

  let db = null, auth = null, unsub = null, ready = null;
  const timers = {};
  let inflight = 0; // uploads sent and not yet confirmed
  const busy = () => inflight > 0 || Object.keys(timers).length > 0;
  function boot() {
    if (db) return;
    firebase.initializeApp(MQ.CLOUD_CONFIG);
    auth = firebase.auth();
    db = firebase.firestore();
    try { db.enablePersistence({ synchronizeTabs: true }).catch(() => {}); } catch (e) { /* offline cache unavailable (private mode) */ }
  }
  // Wait for the saved sign-in to load, then sign in anonymously if there is none yet.
  function ensureUser() {
    return new Promise((resolve, reject) => {
      const off = auth.onAuthStateChanged((u) => {
        off();
        if (u) resolve(u);
        else auth.signInAnonymously().then((cred) => resolve(cred.user), reject);
      }, reject);
    });
  }
  const famRef = () => db.collection('families').doc(C.family.fid);
  const now = () => firebase.firestore.FieldValue.serverTimestamp();

  // What this device last uploaded for each profile ({ fid, revs: { id: rev } }). On start it tells a change
  // that never reached the server (upload it) from a profile deleted on another device (remove it here).
  const SYNCED = 'math-expedition-synced';
  // It also keeps deletes the server has not confirmed yet ({ gone: { id: 1 } }): they are sent again on start,
  // and a server copy of a profile deleted here is ignored meanwhile.
  const readRec = () => {
    try { const v = JSON.parse(localStorage.getItem(SYNCED) || 'null'); return v && C.family && v.fid === C.family.fid ? { revs: v.revs || {}, gone: v.gone || {} } : null; } catch (e) { return null; }
  };
  const writeRec = (r) => { try { localStorage.setItem(SYNCED, JSON.stringify({ fid: C.family.fid, revs: r.revs, gone: r.gone })); } catch (e) { /* ignore */ } };
  // null = no record yet for this family (a device from before this record existed).
  const readSynced = () => { const r = readRec(); return r ? r.revs : null; };
  const writeSynced = (revs) => { const r = readRec() || { revs: {}, gone: {} }; r.revs = revs; writeRec(r); };
  const isGone = (id) => !!(readRec() || { gone: {} }).gone[id];
  const setGone = (id, on) => {
    if (!C.family) return;
    const r = readRec() || { revs: {}, gone: {} };
    on ? (r.gone[id] = 1) : delete r.gone[id];
    writeRec(r);
  };
  const markSynced = (id, rev) => {
    if (!C.family) return;
    const revs = readSynced() || {};
    rev === null ? delete revs[id] : (revs[id] = rev);
    writeSynced(revs);
  };
  // Compare this device with the server: local = [{ id, rev }], server = { id: rev }, synced = { id: rev } or null.
  // Returns what to upload, what to remove here, and the profiles now known to be on the server ({ id: rev }).
  C.catchUpPlan = (local, server, synced) => {
    const plan = { upload: [], remove: [], onServer: {} };
    for (const { id, rev } of local) {
      if (id in server) {
        if ((rev || 0) > (server[id] || 0)) plan.upload.push(id); // a change that never reached the server
        else plan.onServer[id] = server[id];
      } else if (!synced) continue; // no record yet: can't tell "never uploaded" from "deleted elsewhere", leave it
      else if (id in synced && (rev || 0) <= synced[id]) plan.remove.push(id); // deleted on another device, not changed here since
      else plan.upload.push(id); // never reached the server, or changed here after it was deleted elsewhere: keep it
    }
    return plan;
  };

  function upload(id) {
    delete timers[id];
    const st = MQ.store.raw(id);
    if (!st || !C.family || !ready) return;
    setStatus(navigator.onLine === false ? 'offline' : 'saving');
    const rev = st.rev || 0;
    inflight++;
    ready
      .then(() => famRef().collection('profiles').doc(id).set({ json: JSON.stringify(st), rev: st.rev || 0, name: st.name || '', grade: st.grade || '', updatedAt: now() }))
      .then(() => { inflight--; markSynced(id, rev); if (!busy()) setStatus('synced'); })
      .catch((e) => { inflight--; C.error = (e && e.code) || 'write'; setStatus(navigator.onLine === false ? 'offline' : 'error'); });
  }
  function deleteRemote(id) {
    setGone(id, true);
    if (!ready) return; // sent on the next start
    inflight++;
    setStatus(navigator.onLine === false ? 'offline' : 'saving');
    ready
      .then(() => famRef().collection('profiles').doc(id).delete())
      .then(() => { inflight--; setGone(id, false); markSynced(id, null); if (!busy()) setStatus('synced'); })
      .catch(() => { inflight--; setStatus(navigator.onLine === false ? 'offline' : 'error'); });
  }
  C.flushAll = () => Object.keys(timers).forEach((id) => { clearTimeout(timers[id]); upload(id); });

  function listen() {
    if (unsub) unsub();
    let caughtUp = false;
    unsub = famRef().collection('profiles').onSnapshot({ includeMetadataChanges: true }, (snap) => {
      let any = false;
      if (!snap.metadata.fromCache && !caughtUp) { // first answer from the server: catch up on what went missing
        caughtUp = true;
        const server = {};
        snap.docs.forEach((d) => { server[d.id] = d.data().rev || 0; });
        Object.keys((readRec() || { gone: {} }).gone).forEach((id) => (id in server ? deleteRemote(id) : setGone(id, false))); // unconfirmed deletes
        const plan = C.catchUpPlan(MQ.store.profiles().map((p) => ({ id: p.id, rev: MQ.store.raw(p.id).rev })), server, readSynced());
        const revs = Object.assign(readSynced() || {}, plan.onServer);
        plan.remove.forEach((id) => { any = MQ.store.removeRemote(id) || any; delete revs[id]; });
        writeSynced(revs);
        plan.upload.forEach((id) => upload(id));
      }
      snap.docChanges().forEach((ch) => {
        if (ch.doc.metadata.hasPendingWrites) return; // our own change on its way up
        if (ch.type === 'removed') { any = MQ.store.removeRemote(ch.doc.id) || any; markSynced(ch.doc.id, null); setGone(ch.doc.id, false); return; }
        if (isGone(ch.doc.id)) return; // deleted here, the delete is on its way
        let st;
        try { st = JSON.parse(ch.doc.data().json); } catch (e) { return; }
        any = MQ.store.applyRemote(st) || any;
        markSynced(ch.doc.id, ch.doc.data().rev || 0); // this copy is on the server
      });
      // A first answer from the device cache is normal while the server responds; only no network means "offline".
      if (snap.metadata.fromCache) setStatus(navigator.onLine === false ? 'offline' : 'connecting');
      else setStatus(snap.metadata.hasPendingWrites || busy() ? 'saving' : 'synced');
      if (any) emit('data');
    }, (e) => { C.error = (e && e.code) || 'read'; setStatus('error'); });
  }

  // Every local change is uploaded ~1.5 s later (several quick answers become one write).
  function watchLocal() {
    MQ.store.onChange((type, id) => {
      if (!C.family || !db) return;
      clearTimeout(timers[id]);
      if (type === 'remove') {
        delete timers[id];
        deleteRemote(id);
        return;
      }
      timers[id] = setTimeout(() => upload(id), 1500);
      setStatus(navigator.onLine === false ? 'offline' : 'saving'); // not "synced" while a change waits to go up
    });
    if (typeof window !== 'undefined') {
      window.addEventListener('pagehide', C.flushAll);
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') C.flushAll(); });
      window.addEventListener('online', () => { if (C.family && C.status !== 'synced') start(); });
      window.addEventListener('offline', () => { if (C.family) setStatus('offline'); });
    }
  }

  function start() {
    setStatus(navigator.onLine === false ? 'offline' : 'connecting');
    ready = ensureUser();
    ready.then(listen, () => setStatus('offline'));
    ready.catch(() => {});
  }

  // Called once when the app starts.
  C.init = () => {
    if (!MQ.store) return;
    watchLocal();
    const link = readLink();
    if (!link || !C.configured()) return;
    if (!link.root) { link.root = link.fid; writeLink(link); } // older links: let our other apps find the family
    C.family = link;
    boot();
    start();
  };

  // Connect this device to a family. create=true makes a new family with this code + PIN.
  // Everything already on this device is merged into the family, so nothing is lost.
  C.connect = async ({ code, pin, create }) => {
    if (!C.configured()) throw fail('unavailable');
    const name = C.normCode(code);
    pin = String(pin || '').trim();
    if (name.length < 6) throw fail('short-code');
    if (!/^\d{4,6}$/.test(pin)) throw fail('bad-pin');
    return attach(() => C.deriveId(name, pin), name, create ? 'create' : 'join');
  };
  // Join the family another of our apps connected on this device (see C.sibling): no code or PIN needed.
  C.connectSibling = () => {
    if (!C.configured()) return Promise.reject(fail('unavailable'));
    const sib = C.sibling();
    if (!sib) return Promise.reject(fail('not-found'));
    return attach(() => sib.root, sib.name, 'join');
  };
  async function attach(getFid, name, mode) {
    const create = mode === 'create';
    boot();
    const before = C.family;
    setStatus('connecting');
    try {
      await ensureUser();
      const fid = await getFid();
      const ref = db.collection('families').doc(fid);
      let snap;
      try { snap = await ref.get({ source: 'server' }); } catch (e) { throw fail(e && e.code === 'permission-denied' ? 'denied' : 'offline'); }
      if (create && snap.exists) throw fail('exists');
      if (!create && !snap.exists) throw fail('not-found');
      if (create) await ref.set({ name, created: now() });
      if (unsub) { unsub(); unsub = null; }
      C.family = { fid, root: fid, name };
      writeLink(C.family);
      if (!readSynced()) writeSynced({}); // everything on this device is uploaded right below
      ready = Promise.resolve();
      const docs = await ref.collection('profiles').get({ source: 'server' });
      docs.forEach((d) => { if (isGone(d.id)) return; try { MQ.store.applyRemote(JSON.parse(d.data().json)); markSynced(d.id, d.data().rev || 0); } catch (e) { /* skip a broken copy */ } });
      MQ.store.profiles().forEach((p) => upload(p.id));
      listen();
      emit('data');
      return C.family;
    } catch (e) {
      C.family = before;
      setStatus(before ? 'offline' : 'off');
      throw e.code ? e : fail(navigator.onLine === false ? 'offline' : 'unknown');
    }
  }

  // Stop syncing on this device. The children's progress stays on this device and in the family.
  C.disconnect = () => {
    C.flushAll();
    if (unsub) { unsub(); unsub = null; }
    C.family = null;
    writeLink(null);
    try { localStorage.removeItem(SYNCED); } catch (e) { /* ignore */ }
    setStatus('off');
  };

  MQ.cloud = C;
})();
