/**
 * Luminary AI - Service Worker
 * Caching and offline support
 * Developer: Zaniyar Al-Mzurii
 * Version: 6.0.0
 */

'use strict';

const CACHE_NAME = 'luminary-ai-v6';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/admin.html',
    '/style.css',
    '/script.js',
    '/supabaseClient.js',
    '/manifest.json',
    '/icon-192.png',
    '/icon-512.png',
    '/og-image.png',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap',
    'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap'
];

// Install event - cache all assets
self.addEventListener('install', function(event) {
    console.log('📦 Service Worker: Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            console.log('📦 Service Worker: Caching assets');
            return cache.addAll(ASSETS_TO_CACHE).catch(function(err) {
                console.warn('⚠️ Service Worker: Some assets failed to cache:', err.message);
            });
        }).then(function() {
            return self.skipWaiting();
        })
    );
});

// Activate event - clean old caches
self.addEventListener('activate', function(event) {
    console.log('✅ Service Worker: Activated');
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ Service Worker: Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(function() {
            return self.clients.claim();
        })
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', function(event) {
    // Skip Supabase API calls and analytics
    if (event.request.url.includes('supabase.co') ||
        event.request.url.includes('google-analytics.com') ||
        event.request.url.includes('googletagmanager.com') ||
        event.request.url.includes('pagead2.googlesyndication.com')) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then(function(cachedResponse) {
            if (cachedResponse) {
                return cachedResponse;
            }

            return fetch(event.request).then(function(response) {
                // Don't cache non-GET requests or API calls
                if (event.request.method !== 'GET' ||
                    event.request.url.includes('/api/') ||
                    !response || response.status !== 200 ||
                    response.type !== 'basic') {
                    return response;
                }

                // Cache the new response
                var responseToCache = response.clone();
                caches.open(CACHE_NAME).then(function(cache) {
                    cache.put(event.request, responseToCache);
                });

                return response;
            }).catch(function() {
                // Return the offline page for navigation requests
                if (event.request.mode === 'navigate') {
                    return caches.match('/');
                }
                return new Response('Offline - Please check your internet connection', {
                    status: 503,
                    statusText: 'Service Unavailable'
                });
            });
        })
    );
});

// Push notification event
self.addEventListener('push', function(event) {
    var options = {
        body: event.data ? event.data.text() : 'New update from Luminary AI',
        icon: '/icon-192.png',
        badge: '/icon-72.png',
        vibrate: [200, 100, 200],
        data: {
            url: 'https://luminary-ai.vercel.app'
        }
    };

    event.waitUntil(
        self.registration.showNotification('✨ Luminary AI', options)
    );
});

// Notification click event
self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.url || 'https://luminary-ai.vercel.app')
    );
});

console.log('📦 Luminary AI Service Worker registered');
