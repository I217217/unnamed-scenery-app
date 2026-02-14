import type { Spot } from '../data/spots';

const DB_NAME = 'unnamed-scenery-db';
const DB_VERSION = 1;
const STORE_NAME = 'spots';

const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };

        request.onsuccess = (event) => {
            resolve((event.target as IDBOpenDBRequest).result);
        };

        request.onerror = (event) => {
            reject((event.target as IDBOpenDBRequest).error);
        };
    });
};

export const saveSpotsToDB = async (spots: Spot[]) => {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        // Simple approach: Clear and Rewrite (ensures deleted spots are gone)
        // For larger datasets, diffing would be better, but for this app, this is safe.
        const clearReq = store.clear();

        clearReq.onsuccess = () => {
            let pending = spots.length;
            if (pending === 0) {
                resolve();
                return;
            }

            spots.forEach(spot => {
                const req = store.put(spot);
                req.onsuccess = () => {
                    pending--;
                    if (pending <= 0) resolve();
                };
                req.onerror = () => reject(req.error);
            });
        };

        clearReq.onerror = () => reject(clearReq.error);
    });
};

export const loadSpotsFromDB = async (): Promise<Spot[]> => {
    const db = await openDB();
    return new Promise<Spot[]>((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
            resolve(request.result as Spot[]);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
};
