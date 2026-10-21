import type { Config, Context } from '@netlify/edge-functions'

// Set to `false` (or set the MAINTENANCE_MODE environment variable to "off"
// and redeploy) to take the public site out of maintenance.
const MAINTENANCE_ENABLED = false

// Service worker served while in maintenance: clears the PWA caches and
// unregisters itself so returning visitors don't get the cached app shell.
const KILL_SWITCH_SW = `
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
    await self.registration.unregister();
    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach((client) => client.navigate(client.url));
  })());
});
`

const MAINTENANCE_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="robots" content="noindex" />
  <meta name="theme-color" content="#0071ce" />
  <link rel="icon" href="/icon-192.png" />
  <title>We'll be right back</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&family=Inter:wght@400;500&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      font-family: 'Inter', system-ui, sans-serif;
      color: #1f2937;
      background: linear-gradient(160deg, #e8f3fc 0%, #f3f4f6 55%, #fff8e1 100%);
    }
    .card {
      width: 100%;
      max-width: 440px;
      background: #fff;
      border-radius: 24px;
      padding: 40px 32px;
      text-align: center;
      box-shadow: 0 20px 50px -20px rgba(0, 113, 206, 0.35);
    }
    .icon {
      width: 72px;
      height: 72px;
      margin: 0 auto 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #0088f0 0%, #0071ce 100%);
    }
    .icon svg { width: 34px; height: 34px; animation: spin 6s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @media (prefers-reduced-motion: reduce) { .icon svg { animation: none; } }
    h1 {
      font-family: 'Outfit', sans-serif;
      font-size: 26px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 12px;
    }
    p { font-size: 15px; line-height: 1.6; color: #4b5563; }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin-top: 28px;
      padding: 8px 16px;
      border-radius: 999px;
      background: #fff8e1;
      color: #92400e;
      font-size: 13px;
      font-weight: 500;
    }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: #ffc220; }
    button {
      display: block;
      width: 100%;
      margin-top: 24px;
      padding: 14px;
      border: 0;
      border-radius: 12px;
      background: #0071ce;
      color: #fff;
      font: 600 15px 'Outfit', sans-serif;
      cursor: pointer;
    }
    button:hover { background: #005ea8; }
  </style>
</head>
<body>
  <main class="card">
    <div class="icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    </div>
    <h1>We'll be right back</h1>
    <p>We're rolling out an update to improve your experience. The platform is temporarily unavailable. Thank you for your patience.</p>
    <div class="badge"><span class="dot"></span>Scheduled maintenance in progress</div>
    <button type="button" onclick="location.reload()">Try again</button>
  </main>
</body>
</html>`

const isAdminRequest = (url: URL) => {
  const host = url.hostname.toLowerCase()
  const path = url.pathname.toLowerCase()
  return (
    host.startsWith('admin.') ||
    host.startsWith('admin-') ||
    path === '/admin' ||
    path.startsWith('/admin/') ||
    path === '/admin.html'
  )
}

export default async (req: Request, context: Context) => {
  if (!MAINTENANCE_ENABLED || Netlify.env.get('MAINTENANCE_MODE') === 'off') return

  // Only the live production site goes into maintenance, so deploy previews
  // and branch deploys can still be used to test the upcoming release.
  if (context.deploy?.context && context.deploy.context !== 'production') return

  const url = new URL(req.url)
  if (isAdminRequest(url)) return

  if (url.pathname === '/sw.js') {
    return new Response(KILL_SWITCH_SW, {
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  }

  return new Response(MAINTENANCE_HTML, {
    status: 503,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Retry-After': '3600',
    },
  })
}

export const config: Config = {
  path: '/*',
  excludedPath: ['/assets/*', '/icon-192.png', '/icon-512.png', '/robots.txt', '/google56cc7ab2b754e088.html'],
}
