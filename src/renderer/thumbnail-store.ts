import type { PreviewImageStore } from "./preview-cache";

type StoredPoster = { key: string; image: string; usedAt: number };

/** Derived posters only: scene files and the runtime remain creative authority. */
export function createThumbnailStore(limit = 64): PreviewImageStore {
  let opening: Promise<IDBDatabase> | undefined;
  const database = () =>
    (opening ??= new Promise<IDBDatabase>((resolve, reject) => {
      let failed = false;
      const request = indexedDB.open("tilt-library-thumbnails", 1);
      request.onupgradeneeded = () => {
        const store = request.result.createObjectStore("posters", {
          keyPath: "key",
        });
        store.createIndex("usedAt", "usedAt");
      };
      request.onsuccess = () => {
        const db = request.result;
        if (failed) {
          db.close();
          return;
        }
        db.onclose = () => {
          opening = undefined;
        };
        db.onversionchange = () => {
          db.close();
          opening = undefined;
        };
        resolve(db);
      };
      request.onerror = () => {
        failed = true;
        reject(request.error);
      };
      request.onblocked = () => {
        failed = true;
        reject(new Error("Thumbnail cache unavailable"));
      };
    }));

  const finished = (transaction: IDBTransaction) =>
    new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onabort = () => reject(transaction.error);
      transaction.onerror = () => reject(transaction.error);
    });

  return {
    async read(key) {
      const db = await database();
      const tx = db.transaction("posters", "readwrite");
      const done = finished(tx);
      const store = tx.objectStore("posters");
      let image: string | undefined;
      const request = store.get(key);
      request.onsuccess = () => {
        const item: StoredPoster | undefined = request.result;
        if (
          item?.key === key &&
          typeof item.image === "string" &&
          item.image.startsWith("data:image/jpeg;base64,")
        ) {
          image = item.image;
          store.put({ ...item, usedAt: Date.now() });
        } else if (item) store.delete(key);
      };
      await done;
      return image;
    },
    async write(key, image) {
      const db = await database();
      const tx = db.transaction("posters", "readwrite");
      const done = finished(tx);
      const store = tx.objectStore("posters");
      store.put({ key, image, usedAt: Date.now() } satisfies StoredPoster);
      const count = store.count();
      count.onsuccess = () => {
        let excess = count.result - limit;
        if (excess <= 0) return;
        const cursor = store.index("usedAt").openCursor();
        cursor.onsuccess = () => {
          const item = cursor.result;
          if (!item || excess-- <= 0) return;
          item.delete();
          item.continue();
        };
      };
      await done;
    },
  };
}
