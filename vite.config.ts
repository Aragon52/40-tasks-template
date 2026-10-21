import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const BUILD_ID = Date.now().toString();

export default defineConfig(() => {
  return {
    base: '/',
    define: {
      __APP_BUILD_ID__: JSON.stringify(BUILD_ID),
      __APP_BUILD_TIME__: JSON.stringify(new Date().toISOString()),
      __IS_NETLIFY__: JSON.stringify(process.env.NETLIFY === 'true' || Boolean(process.env.NETLIFY)),
    },
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'inline',
        workbox: {
          skipWaiting: true,
          clientsClaim: true,
          cleanupOutdatedCaches: true,
          navigateFallbackDenylist: [/^\/admin/, /^\/admin\.html/],
        },
        devOptions: {
          enabled: false
        },
        manifest: {
          name: 'Walmart',
          short_name: 'Walmart',
          description: 'Walmart Premium Earning Platform',
          theme_color: '#0071ce',
          background_color: '#f3f4f6',
          display: 'standalone',
          icons: [
            {
              src: '/icon-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/icon-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'maskable'
            },
            {
              src: '/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            }
          ]
        }
      }),
      {
        name: 'generate-version-json',
        apply: 'build',
        generateBundle() {
          this.emitFile({
            type: 'asset',
            fileName: 'version.json',
            source: JSON.stringify({
              buildId: BUILD_ID,
              builtAt: new Date().toISOString()
            }, null, 2)
          });
        }
      },
      {
        name: 'dev-endpoints-intercept',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (req.url && req.url.startsWith('/version.json')) {
              res.setHeader('Content-Type', 'application/json');
              res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
              res.end(JSON.stringify({
                buildId: BUILD_ID,
                builtAt: 'dev'
              }));
              return;
            }
            if (req.url && req.url.startsWith('/sw.js')) {
              res.setHeader('Content-Type', 'application/javascript');
              res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
              res.end('// Self-destructing or empty service worker for dev\nself.addEventListener("install", () => self.skipWaiting());\n');
              return;
            }
            const host = (req.headers.host || '').toLowerCase();
            const isAdminHost = host.startsWith('admin.') || host.startsWith('admin-') || host.includes('admin.walmark-retailshop.com');
            if (isAdminHost && req.url && !req.url.startsWith('/admin.html') && !req.url.startsWith('/@') && !req.url.startsWith('/assets') && !req.url.startsWith('/src') && !req.url.startsWith('/admin-portal') && !req.url.startsWith('/user-portal') && !req.url.startsWith('/node_modules')) {
              req.url = '/admin.html';
            } else if (req.url && (req.url === '/admin' || req.url.startsWith('/admin/'))) {
              req.url = '/admin.html';
            }
            next();
          });
        }
      }
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          admin: path.resolve(__dirname, 'admin.html'),
        },
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
