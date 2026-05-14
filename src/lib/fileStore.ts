export const saveFileToDB = (file: File): Promise<void> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("NeuralOSFiles", 1);
    
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains("files")) {
        db.createObjectStore("files", { keyPath: "id" });
      }
    };

    request.onsuccess = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      const tx = db.transaction("files", "readwrite");
      const store = tx.objectStore("files");
      store.put({ id: "user_resume", file });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    };
    
    request.onerror = () => reject(request.error);
  });
};

export const getFileFromDB = (): Promise<File | null> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("NeuralOSFiles", 1);
    
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains("files")) {
        db.createObjectStore("files", { keyPath: "id" });
      }
    };

    request.onsuccess = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      // In case we just created it in upgraded needed, transaction may still work
      try {
        const tx = db.transaction("files", "readonly");
        const store = tx.objectStore("files");
        const getReq = store.get("user_resume");
        getReq.onsuccess = () => resolve(getReq.result ? getReq.result.file : null);
        getReq.onerror = () => reject(getReq.error);
      } catch (err) {
        resolve(null);
      }
    };
    
    request.onerror = () => reject(request.error);
  });
};
