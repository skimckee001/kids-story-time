// Kids Story Time Service Worker for Offline Support
const CACHE_NAME = 'kids-story-time-v1';
const STATIC_CACHE_NAME = 'kids-story-time-static-v1';
const DYNAMIC_CACHE_NAME = 'kids-story-time-dynamic-v1';
const STORY_CACHE_NAME = 'kids-story-time-stories-v1';

// Files to cache on install
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/images/logo.png',
  '/images/moms-and-daughters-portrait.jpg',
  '/images/dads-and-sons-portrait.jpg'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching static files');
      return cache.addAll(STATIC_FILES.map(url => {
        return new Request(url, { cache: 'reload' });
      }));
    }).catch((error) => {
      console.error('[Service Worker] Failed to cache static files:', error);
    })
  );
  
  // Force the service worker to activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName.startsWith('kids-story-time-') && 
                   cacheName !== STATIC_CACHE_NAME &&
                   cacheName !== DYNAMIC_CACHE_NAME &&
                   cacheName !== STORY_CACHE_NAME;
          })
          .map((cacheName) => {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
  );
  
  // Take control of all pages immediately
  self.clients.claim();
});

// Fetch event - serve from cache when possible
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Handle API calls differently (network-first)
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/v1/')) {
    event.respondWith(
      networkFirst(request, DYNAMIC_CACHE_NAME)
    );
    return;
  }
  
  // Handle story content (cache-first with background update)
  if (url.pathname.includes('/stories/') || url.pathname.includes('/story')) {
    event.respondWith(
      staleWhileRevalidate(request, STORY_CACHE_NAME)
    );
    return;
  }
  
  // Handle images (cache-first)
  if (request.destination === 'image') {
    event.respondWith(
      cacheFirst(request, DYNAMIC_CACHE_NAME)
    );
    return;
  }
  
  // Handle static assets (cache-first)
  if (url.pathname.match(/\.(js|css|woff2?|ttf|otf)$/)) {
    event.respondWith(
      cacheFirst(request, STATIC_CACHE_NAME)
    );
    return;
  }
  
  // Default strategy (network-first)
  event.respondWith(
    networkFirst(request, DYNAMIC_CACHE_NAME)
  );
});

// Cache strategies

// Cache-first strategy
async function cacheFirst(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('[Service Worker] Found in cache:', request.url);
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[Service Worker] Cache-first failed:', error);
    
    // Return offline fallback page if available
    const cache = await caches.open(STATIC_CACHE_NAME);
    const offlinePage = await cache.match('/offline.html');
    return offlinePage || new Response('Offline', { status: 503 });
  }
}

// Network-first strategy
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] Network failed, trying cache:', request.url);
    
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline fallback
    const staticCache = await caches.open(STATIC_CACHE_NAME);
    const offlinePage = await staticCache.match('/offline.html');
    return offlinePage || new Response('Offline', { status: 503 });
  }
}

// Stale-while-revalidate strategy
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  // Return cached version immediately if available
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => {
    // Network failed, but we might have already returned cached version
    return cachedResponse;
  });
  
  return cachedResponse || fetchPromise;
}

// Message handling for cache management
self.addEventListener('message', (event) => {
  if (event.data.type === 'CACHE_STORY') {
    cacheStory(event.data.story);
  } else if (event.data.type === 'CLEAR_STORIES') {
    clearStoryCache();
  } else if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Cache a specific story for offline reading
async function cacheStory(story) {
  try {
    const cache = await caches.open(STORY_CACHE_NAME);
    
    // Cache story data as JSON
    const storyResponse = new Response(JSON.stringify(story), {
      headers: { 'Content-Type': 'application/json' }
    });
    await cache.put(`/stories/${story.id}`, storyResponse);
    
    // Cache story images if any
    if (story.imageUrl) {
      const imageResponse = await fetch(story.imageUrl);
      if (imageResponse.ok) {
        await cache.put(story.imageUrl, imageResponse);
      }
    }
    
    // Cache audio narration if any
    if (story.audioUrl) {
      const audioResponse = await fetch(story.audioUrl);
      if (audioResponse.ok) {
        await cache.put(story.audioUrl, audioResponse);
      }
    }
    
    console.log('[Service Worker] Story cached:', story.id);
  } catch (error) {
    console.error('[Service Worker] Failed to cache story:', error);
  }
}

// Clear story cache
async function clearStoryCache() {
  try {
    await caches.delete(STORY_CACHE_NAME);
    console.log('[Service Worker] Story cache cleared');
  } catch (error) {
    console.error('[Service Worker] Failed to clear story cache:', error);
  }
}

// Background sync for uploading stories created offline
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-stories') {
    event.waitUntil(syncOfflineStories());
  }
});

async function syncOfflineStories() {
  try {
    // Get offline stories from IndexedDB (to be implemented)
    console.log('[Service Worker] Syncing offline stories...');
    // Implementation would sync stories created offline
  } catch (error) {
    console.error('[Service Worker] Sync failed:', error);
  }
}

// Push notifications for reading reminders
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Time for a story!',
    icon: '/images/logo-192.png',
    badge: '/images/badge-72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      { action: 'read', title: 'Read a story' },
      { action: 'later', title: 'Maybe later' }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Kids Story Time', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'read') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});