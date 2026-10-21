const hostname = (window.location.hostname || '').toLowerCase();
const pathname = (window.location.pathname || '').toLowerCase();
const search = (window.location.search || '').toLowerCase();
const hash = (window.location.hash || '').toLowerCase();

// Explicit admin triggers:
// - Hostname starting with admin. or admin-
// - Pathname starting with /admin or including admin.html
// - Search query parameter portal=admin or admin=true
// - Hash including portal=admin or #admin
const isAdminHost = hostname.startsWith('admin.') || hostname.startsWith('admin-');
const isAdminRoute = pathname.startsWith('/admin') || pathname.includes('admin.html');
const hasAdminQuery = search.includes('portal=admin') || search.includes('admin=true');
const hasAdminHash = hash.includes('portal=admin') || hash.includes('#admin');

// User portal is the PRIMARY site by default
const isAdmin = Boolean(isAdminHost || isAdminRoute || hasAdminQuery || hasAdminHash);

try {
  localStorage.setItem('portal_mode', isAdmin ? 'admin' : 'user');
} catch (e) {
  // Ignore potential localStorage errors in sandbox
}

if (isAdmin) {
  // Dynamically load and mount the Admin Portal
  import('../admin-portal/src/main.tsx').catch((err) => {
    console.error('Failed to mount admin portal:', err);
  });
} else {
  // Dynamically load and mount the User Portal (Primary Site)
  import('../user-portal/src/main.tsx').catch((err) => {
    console.error('Failed to mount user portal:', err);
  });
}
