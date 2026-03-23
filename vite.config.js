import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
            manifest: {
                name: 'Video Mosaic Tool',
                short_name: 'Mosaic',
                description: 'PWA for processing videos with mosaic effects',
                theme_color: '#1f2937',
                background_color: '#ffffff',
                display: 'standalone',
                scope: '/',
                start_url: '/',
                icons: [
                    {
                        src: '/pwa-192x192.png',
                        sizes: '192x192',
                        type: 'image/png',
                        purpose: 'any',
                    },
                    {
                        src: '/pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any',
                    },
                    {
                        src: '/pwa-192x192.png',
                        sizes: '192x192',
                        type: 'image/png',
                        purpose: 'maskable',
                    },
                ],
                screenshots: [
                    {
                        src: '/screenshot-540x720.png',
                        sizes: '540x720',
                        type: 'image/png',
                    },
                    {
                        src: '/screenshot-1080x1440.png',
                        sizes: '1080x1440',
                        type: 'image/png',
                    },
                ],
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,wasm}'],
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/cdn\.jsdelivr\.net\//,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'jsdelivr-cache',
                            expiration: {
                                maxEntries: 20,
                                maxAgeSeconds: 60 * 60 * 24 * 365,
                            },
                        },
                    },
                ],
            },
        }),
    ],
    server: {
        headers: {
            'Cross-Origin-Opener-Policy': 'same-origin',
            'Cross-Origin-Embedder-Policy': 'require-corp',
        },
    },
});
