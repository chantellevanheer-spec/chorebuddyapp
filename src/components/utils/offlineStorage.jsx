// IndexedDB wrapper for offline storage
const DB_NAME = 'chorebuddy_offline';
const DB_VERSION = 2;
const STORES = {
  CHORES: 'chores',
  ASSIGNMENTS: 'assignments',
  PEOPLE: 'people',
  SYNC_QUEUE: 'sync_queue',
  REWARDS: 'rewards',
  ITEMS: 'items'
};

class OfflineStorage {
  constructor() {
    this.db = null;
    this.initPromise = this.init();
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create stores if they don't exist
        if (!db.objectStoreNames.contains(STORES.CHORES)) {
          db.createObjectStore(STORES.CHORES, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.ASSIGNMENTS)) {
          db.createObjectStore(STORES.ASSIGNMENTS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.PEOPLE)) {
          db.createObjectStore(STORES.PEOPLE, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
          const store = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id', autoIncrement: true });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORES.REWARDS)) {
          db.createObjectStore(STORES.REWARDS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.ITEMS)) {
          db.createObjectStore(STORES.ITEMS, { keyPath: 'id' });
        }
      };
    });
  }

  async ensureDB() {
    if (!this.db) {
      await this.initPromise;
    }
    return this.db;
  }

  async saveData(storeName, data) {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      // Clear existing data and add new
      const clearRequest = store.clear();
      clearRequest.onsuccess = () => {
        const addPromises = data.map(item => {
          return new Promise((res, rej) => {
            const addRequest = store.add(item);
            addRequest.onsuccess = () => res();
            addRequest.onerror = () => rej(addRequest.error);
          });
        });
        
        Promise.all(addPromises)
          .then(() => resolve())
          .catch(reject);
      };
      clearRequest.onerror = () => reject(clearRequest.error);
    });
  }

  async getData(storeName) {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async updateItem(storeName, id, updates) {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const item = getRequest.result;
        if (item) {
          const updated = { ...item, ...updates };
          const putRequest = store.put(updated);
          putRequest.onsuccess = () => resolve(updated);
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          reject(new Error('Item not found'));
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async addToSyncQueue(operation) {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.SYNC_QUEUE], 'readwrite');
      const store = transaction.objectStore(STORES.SYNC_QUEUE);
      
      const queueItem = {
        ...operation,
        timestamp: Date.now()
      };
      
      const request = store.add(queueItem);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getSyncQueue() {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.SYNC_QUEUE], 'readonly');
      const store = transaction.objectStore(STORES.SYNC_QUEUE);
      const index = store.index('timestamp');
      const request = index.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async clearSyncQueue() {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.SYNC_QUEUE], 'readwrite');
      const store = transaction.objectStore(STORES.SYNC_QUEUE);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async removeFromSyncQueue(id) {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.SYNC_QUEUE], 'readwrite');
      const store = transaction.objectStore(STORES.SYNC_QUEUE);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getLastSyncTime() {
    try {
      return localStorage.getItem('chorebuddy_last_sync');
    } catch {
      return null;
    }
  }

  async setLastSyncTime(time) {
    try {
      localStorage.setItem('chorebuddy_last_sync', time);
    } catch (error) {
      console.error('Failed to set last sync time:', error);
    }
  }
}

export const offlineStorage = new OfflineStorage();
export { STORES };