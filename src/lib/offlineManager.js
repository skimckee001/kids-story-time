// Offline Manager for Kids Story Time App

class OfflineManager {
  constructor() {
    this.dbName = 'KidsStoryTimeDB';
    this.dbVersion = 1;
    this.db = null;
    this.isOnline = navigator.onLine;
    this.syncQueue = [];
    
    this.init();
  }

  async init() {
    await this.initDB();
    this.setupEventListeners();
    this.registerServiceWorker();
  }

  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Stories store
        if (!db.objectStoreNames.contains('stories')) {
          const storyStore = db.createObjectStore('stories', { keyPath: 'id' });
          storyStore.createIndex('childId', 'child_id', { unique: false });
          storyStore.createIndex('createdAt', 'created_at', { unique: false });
        }
        
        // Children store
        if (!db.objectStoreNames.contains('children')) {
          db.createObjectStore('children', { keyPath: 'id' });
        }
        
        // Audio cache store
        if (!db.objectStoreNames.contains('audioCache')) {
          db.createObjectStore('audioCache', { keyPath: 'storyId' });
        }
        
        // Sync queue store
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  setupEventListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processSyncQueue();
      this.notifyOnlineStatus(true);
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyOnlineStatus(false);
    });
  }

  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration);
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  // Story Management
  async saveStoryOffline(story) {
    if (!this.db) await this.initDB();
    
    const transaction = this.db.transaction(['stories'], 'readwrite');
    const store = transaction.objectStore('stories');
    
    const storyWithOfflineFlag = {
      ...story,
      offline: true,
      saved_at: new Date().toISOString()
    };
    
    return new Promise((resolve, reject) => {
      const request = store.put(storyWithOfflineFlag);
      request.onsuccess = () => resolve(storyWithOfflineFlag);
      request.onerror = () => reject(request.error);
    });
  }

  async getOfflineStories(childId = null) {
    if (!this.db) await this.initDB();
    
    const transaction = this.db.transaction(['stories'], 'readonly');
    const store = transaction.objectStore('stories');
    
    return new Promise((resolve, reject) => {
      let request;
      
      if (childId) {
        const index = store.index('childId');
        request = index.getAll(childId);
      } else {
        request = store.getAll();
      }
      
      request.onsuccess = () => {
        const stories = request.result.filter(story => story.offline);
        resolve(stories);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteOfflineStory(storyId) {
    if (!this.db) await this.initDB();
    
    const transaction = this.db.transaction(['stories'], 'readwrite');
    const store = transaction.objectStore('stories');
    
    return new Promise((resolve, reject) => {
      const request = store.delete(storyId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Children Management
  async saveChildOffline(child) {
    if (!this.db) await this.initDB();
    
    const transaction = this.db.transaction(['children'], 'readwrite');
    const store = transaction.objectStore('children');
    
    return new Promise((resolve, reject) => {
      const request = store.put(child);
      request.onsuccess = () => resolve(child);
      request.onerror = () => reject(request.error);
    });
  }

  async getOfflineChildren() {
    if (!this.db) await this.initDB();
    
    const transaction = this.db.transaction(['children'], 'readonly');
    const store = transaction.objectStore('children');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Audio Cache Management
  async cacheAudio(storyId, audioBlob) {
    if (!this.db) await this.initDB();
    
    const transaction = this.db.transaction(['audioCache'], 'readwrite');
    const store = transaction.objectStore('audioCache');
    
    const audioData = {
      storyId: storyId,
      audioBlob: audioBlob,
      cached_at: new Date().toISOString()
    };
    
    return new Promise((resolve, reject) => {
      const request = store.put(audioData);
      request.onsuccess = () => resolve(audioData);
      request.onerror = () => reject(request.error);
    });
  }

  async getCachedAudio(storyId) {
    if (!this.db) await this.initDB();
    
    const transaction = this.db.transaction(['audioCache'], 'readonly');
    const store = transaction.objectStore('audioCache');
    
    return new Promise((resolve, reject) => {
      const request = store.get(storyId);
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          resolve(URL.createObjectURL(result.audioBlob));
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Sync Queue Management
  async addToSyncQueue(action, data) {
    if (!this.db) await this.initDB();
    
    const transaction = this.db.transaction(['syncQueue'], 'readwrite');
    const store = transaction.objectStore('syncQueue');
    
    const syncItem = {
      action: action,
      data: data,
      timestamp: new Date().toISOString(),
      retries: 0
    };
    
    return new Promise((resolve, reject) => {
      const request = store.add(syncItem);
      request.onsuccess = () => resolve(syncItem);
      request.onerror = () => reject(request.error);
    });
  }

  async processSyncQueue() {
    if (!this.isOnline || !this.db) return;
    
    const transaction = this.db.transaction(['syncQueue'], 'readwrite');
    const store = transaction.objectStore('syncQueue');
    
    const request = store.getAll();
    request.onsuccess = async () => {
      const items = request.result;
      
      for (const item of items) {
        try {
          await this.processSyncItem(item);
          // Remove from queue after successful sync
          store.delete(item.id);
        } catch (error) {
          console.error('Sync failed for item:', item, error);
          // Increment retry count
          item.retries = (item.retries || 0) + 1;
          if (item.retries < 3) {
            store.put(item);
          } else {
            // Remove after 3 failed attempts
            store.delete(item.id);
          }
        }
      }
    };
  }

  async processSyncItem(item) {
    // This would integrate with your API client
    switch (item.action) {
      case 'createStory':
        // await apiClient.generateStory(item.data);
        break;
      case 'updateChild':
        // await apiClient.updateChild(item.data.id, item.data);
        break;
      case 'favoriteStory':
        // await apiClient.toggleFavorite(item.data.storyId);
        break;
      default:
        console.warn('Unknown sync action:', item.action);
    }
  }

  // Utility Methods
  getStorageUsage() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      return navigator.storage.estimate();
    }
    return Promise.resolve({ usage: 0, quota: 0 });
  }

  async clearOfflineData() {
    if (!this.db) await this.initDB();
    
    const stores = ['stories', 'audioCache', 'syncQueue'];
    const transaction = this.db.transaction(stores, 'readwrite');
    
    const promises = stores.map(storeName => {
      const store = transaction.objectStore(storeName);
      return new Promise((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });
    
    return Promise.all(promises);
  }

  // Event System
  notifyOnlineStatus(isOnline) {
    const event = new CustomEvent('onlineStatusChanged', {
      detail: { isOnline }
    });
    window.dispatchEvent(event);
  }

  // Public API
  isOfflineMode() {
    return !this.isOnline;
  }

  async getOfflineCapabilities() {
    const usage = await this.getStorageUsage();
    const stories = await this.getOfflineStories();
    const children = await this.getOfflineChildren();
    
    return {
      isOnline: this.isOnline,
      storageUsed: usage.usage,
      storageQuota: usage.quota,
      offlineStories: stories.length,
      offlineChildren: children.length,
      hasServiceWorker: 'serviceWorker' in navigator
    };
  }
}

// Create and export singleton instance
export const offlineManager = new OfflineManager();

