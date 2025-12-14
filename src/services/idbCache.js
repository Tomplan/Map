import { openDB } from 'idb';

const DB_NAME = 'map-db';
const DB_VERSION = 1;
const MARKER_STORE = 'markers';
const QUEUE_STORE = 'offlineQueue';

async function getDB() {
  // Lazily open DB and create needed stores
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(MARKER_STORE)) {
        db.createObjectStore(MARKER_STORE);
      }
      if (!db.objectStoreNames.contains(QUEUE_STORE)) {
        db.createObjectStore(QUEUE_STORE, { autoIncrement: true });
      }
    },
  });
}

export async function isAvailable() {
  return typeof indexedDB !== 'undefined';
}

/**
 * Retrieve the stored marker snapshot (or undefined)
 */
export async function getMarkerSnapshot() {
  try {
    const db = await getDB();
    return await db.get(MARKER_STORE, 'snapshot');
  } catch (err) {
    // Graceful degradation - return undefined on failure
    // and let callers fall back to network or empty state
    // This avoids throwing IndexedDB errors into UI code
    // which keeps behavior predictable.
    // eslint-disable-next-line no-console
    console.warn('getMarkerSnapshot failed', err);
    return undefined;
  }
}

/**
 * Persist the marker snapshot (async)
 */
export async function setMarkerSnapshot(snapshot) {
  try {
    const db = await getDB();
    await db.put(MARKER_STORE, snapshot, 'snapshot');
    return true;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('setMarkerSnapshot failed', err);
    return false;
  }
}

export async function clearMarkerSnapshot() {
  try {
    const db = await getDB();
    await db.delete(MARKER_STORE, 'snapshot');
    return true;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('clearMarkerSnapshot failed', err);
    return false;
  }
}

// Simple offline queue: add an operation (e.g., write) to be synced later
export async function enqueueOfflineAction(action) {
  try {
    const db = await getDB();
    await db.add(QUEUE_STORE, action);
    return true;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('enqueueOfflineAction failed', err);
    return false;
  }
}

export async function getOfflineQueue() {
  try {
    const db = await getDB();
    const tx = db.transaction(QUEUE_STORE, 'readonly');
    const store = tx.objectStore(QUEUE_STORE);
    const all = await store.getAll();
    await tx.done;
    return all;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('getOfflineQueue failed', err);
    return [];
  }
}

export async function clearOfflineQueue() {
  try {
    const db = await getDB();
    const tx = db.transaction(QUEUE_STORE, 'readwrite');
    const store = tx.objectStore(QUEUE_STORE);
    await store.clear();
    await tx.done;
    return true;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('clearOfflineQueue failed', err);
    return false;
  }
}

export default {
  isAvailable,
  getMarkerSnapshot,
  setMarkerSnapshot,
  clearMarkerSnapshot,
  enqueueOfflineAction,
  getOfflineQueue,
  clearOfflineQueue,
};
