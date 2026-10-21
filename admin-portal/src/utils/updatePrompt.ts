let updateServiceWorkerFn: ((reloadPage?: boolean) => Promise<void>) | null = null;

export async function triggerAdminAppRefresh(): Promise<void> {
  try {
    if (typeof updateServiceWorkerFn === 'function') {
      await updateServiceWorkerFn(true);
    }
  } catch (err) {
    console.debug('Service worker updateSW error:', err);
  }
  window.location.reload();
}

export async function initAdminPWAUpdatePrompt(): Promise<void> {
  if (typeof window === 'undefined') return;

  if (window.__pwa_updater_initialized) return;
  window.__pwa_updater_initialized = true;

  try {
    const pwaModule = await import('virtual:pwa-register').catch(() => null);
    if (!pwaModule || typeof pwaModule.registerSW !== 'function') return;

    const updateSW = pwaModule.registerSW({
      immediate: true,
      onNeedRefresh() {
        if (typeof updateSW === 'function') {
          updateSW(true).catch(() => {});
        }
      },
      onOfflineReady() {
        console.debug('Admin App ready for offline usage.');
      },
      onRegisteredSW(_swScriptUrl: string, registration?: ServiceWorkerRegistration) {
        if (registration) {
          if (registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
          setInterval(() => {
            registration.update().catch(() => {});
          }, 60 * 60 * 1000);
        }
      },
      onRegisterError(error: unknown) {
        console.debug('Admin Service worker registration skipped:', error);
      }
    });

    updateServiceWorkerFn = updateSW;
  } catch (err) {
    console.debug('Admin Service worker initialization skipped:', err);
  }
}
