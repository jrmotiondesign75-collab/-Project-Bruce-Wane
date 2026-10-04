// Claude artifact capabilities, with graceful fallback when the app runs on its own.
// Shared data layout (db):
//   data/users/<uid>/state   private: the player's whole saved state
//   players/<uid>            public player card for leaderboards
//   feed/<uid>               { handle, role, posts: [...] } that player's recent posts and stories
//   cheers/<uid>             { ids: [postKey] } posts that player cheered
//   comments/<uid>           { items: [{ key, text, ts }] } that player's comments

export const cloud = { db: null, user: null, sample: null, assets: null, downloads: null, uid: null, ready: false, isOwner: false };

const use = (name) => (window.claude && typeof window.claude.use === "function" ? window.claude.use(name).catch(() => null) : Promise.resolve(null));

export async function initCloud() {
  const [db, user, sample, assets, downloads] = await Promise.all(["db", "user", "sample", "assets", "downloads"].map(use));
  Object.assign(cloud, { db, user, sample, assets, downloads });
  if (user) {
    cloud.uid = await user.id();
    cloud.isOwner = await user.isOwner();
  }
  if (!cloud.uid) cloud.db = null; // no identity, no shared or private data
  cloud.ready = true;
  return cloud;
}

export const hasSocial = () => !!(cloud.db && cloud.uid);

// ---------- Serialized, coalesced writes (one in flight per document) ----------

const writes = new Map(); // path -> { busy, pending }

export function writeDoc(path, data) {
  if (!cloud.db) return Promise.resolve();
  let w = writes.get(path);
  if (!w) writes.set(path, (w = { busy: false, pending: null, waiters: [] }));
  w.pending = data;
  const p = new Promise((resolve) => w.waiters.push(resolve));
  if (!w.busy) flush(path, w);
  return p;
}

async function flush(path, w) {
  w.busy = true;
  while (w.pending) {
    const data = w.pending;
    w.pending = null;
    const waiters = w.waiters.splice(0);
    try {
      await cloud.db.doc(path).set(data);
    } catch (e) {
      if (e && e.code === "unavailable") {
        await new Promise((r) => setTimeout(r, 800 + Math.random() * 800));
        if (!w.pending) w.pending = data;
      } else {
        console.warn("Save failed", path, e && e.code);
        window.dispatchEvent(new CustomEvent("cloud-error", { detail: e && e.code }));
      }
    }
    waiters.forEach((r) => r());
  }
  w.busy = false;
}

// ---------- Private state ----------

export async function loadPrivate() {
  if (!cloud.db) return null;
  try {
    const snap = await cloud.db.doc(`data/users/${cloud.uid}/state`).get();
    return snap.exists ? snap.data() : null;
  } catch {
    return null;
  }
}

let saveTimer = null;
export function savePrivate(getState) {
  if (!cloud.db) return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const s = getState();
    writeDoc(`data/users/${cloud.uid}/state`, JSON.parse(JSON.stringify(s)));
  }, 1200);
}

// ---------- Player cards (leaderboards) ----------

let lastCard = "";
export function publishCard(card) {
  if (!hasSocial()) return;
  const json = JSON.stringify(card);
  if (json === lastCard) return;
  lastCard = json;
  writeDoc(`players/${cloud.uid}`, { ...card, updatedAt: Date.now() });
}

export function watchCollection(name, cb) {
  if (!hasSocial()) return () => {};
  return cloud.db.collection(name).onSnapshot(
    (snap) => cb(snap.docs.filter((d) => d.exists).map((d) => ({ id: d.id, ...d.data() }))),
    (e) => console.warn("watch failed", name, e && e.code),
  );
}

// ---------- Feed ----------

export function saveMyFeed(handle, role, posts) {
  if (!hasSocial()) return Promise.resolve();
  return writeDoc(`feed/${cloud.uid}`, { handle, role, posts: posts.slice(-30), updatedAt: Date.now() });
}

export function saveMyCheers(ids) {
  if (!hasSocial()) return Promise.resolve();
  return writeDoc(`cheers/${cloud.uid}`, { ids: ids.slice(-500) });
}

export function saveMyComments(items) {
  if (!hasSocial()) return Promise.resolve();
  return writeDoc(`comments/${cloud.uid}`, { items: items.slice(-150) });
}

// Owner moderation: remove a post from someone else's feed document
export async function removeOthersPost(ownerUid, postId) {
  if (!hasSocial() || !cloud.isOwner) return;
  const ref = cloud.db.doc(`feed/${ownerUid}`);
  const snap = await ref.get();
  if (!snap.exists) return;
  const data = snap.data();
  await ref.set({ ...data, posts: (data.posts || []).filter((p) => p.id !== postId) });
}

// ---------- Media, files, AI ----------

export async function uploadMedia(file) {
  if (!cloud.assets) throw { code: "unavailable" };
  return cloud.assets.upload(file);
}

export async function saveFile(filename, data) {
  if (cloud.downloads) return cloud.downloads.save({ filename, data });
  if (window.claude) throw { code: "unavailable" }; // inside a viewer without downloads
  const blob = data instanceof Blob ? data : new Blob([data]);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  return { status: "saved" };
}

export const hasAI = () => !!cloud.sample;

export function askCoach(input, opts = {}) {
  if (!cloud.sample) return Promise.reject({ code: "not_granted" });
  return cloud.sample(input, opts);
}
