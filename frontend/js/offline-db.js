/* ============================================
   MangaVerse — IndexedDB Offline Storage Engine
   ============================================ */

const DB_NAME = 'MangaVerseOfflineDB';
const DB_VERSION = 1;
const STORE_NAME = 'chapters';

let dbInstance = null;

export function initOfflineDB() {
  return new Promise((resolve, reject) => {
    if (dbInstance) return resolve(dbInstance);

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('[OfflineDB] Initialization error:', event.target.error);
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      console.log('[OfflineDB] Initialized successfully');
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        // Create store with composite key path [slug, chapter]
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

// Helper to get Blob from Image URL
async function fetchImageAsBlobBase64(url) {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error('Failed to fetch image for offline storage', err);
    return null;
  }
}

export async function downloadChapter(slug, chapterNum, title, coverUrl, imageUrls, onProgress) {
  const db = await initOfflineDB();
  
  let base64Images = [];
  for (let i = 0; i < imageUrls.length; i++) {
    if (onProgress) onProgress((i / imageUrls.length) * 100);
    const b64 = await fetchImageAsBlobBase64(imageUrls[i]);
    if (b64) base64Images.push(b64);
  }

  // Fetch cover as well
  const coverBase64 = await fetchImageAsBlobBase64(coverUrl);

  const chapterData = {
    id: `${slug}_${chapterNum}`, // Composite key
    slug,
    chapter: chapterNum,
    title,
    cover: coverBase64 || coverUrl,
    pages: base64Images,
    downloadedAt: new Date().getTime(),
    sizeBytes: JSON.stringify(base64Images).length
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(chapterData);

    request.onsuccess = () => {
      if (onProgress) onProgress(100);
      resolve(true);
    };
    request.onerror = (e) => reject(e.target.error);
  });
}

export async function getOfflineChapter(slug, chapterNum) {
  const db = await initOfflineDB();
  const id = `${slug}_${chapterNum}`;
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

export async function deleteOfflineChapter(slug, chapterNum) {
  const db = await initOfflineDB();
  const id = `${slug}_${chapterNum}`;
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve(true);
    request.onerror = (e) => reject(e.target.error);
  });
}

export async function getAllDownloadedChapters() {
  const db = await initOfflineDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = (e) => {
      // Sort by downloadedAt descending
      const list = e.target.result || [];
      resolve(list.sort((a, b) => b.downloadedAt - a.downloadedAt));
    };
    request.onerror = (e) => reject(e.target.error);
  });
}
