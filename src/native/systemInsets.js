import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor, registerPlugin } from '@capacitor/core';

const NativeSystemInsets = registerPlugin('SystemInsets');
const isNativeAndroid =
  Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';

function safeInset(value) {
  const inset = Number(value);
  return Number.isFinite(inset) && inset > 0 ? inset : 0;
}

function applyInsets(insets = {}) {
  const root = document.documentElement;
  root.style.setProperty('--native-safe-area-top', `${safeInset(insets.top)}px`);
  root.style.setProperty('--native-safe-area-right', `${safeInset(insets.right)}px`);
  root.style.setProperty('--native-safe-area-bottom', `${safeInset(insets.bottom)}px`);
  root.style.setProperty('--native-safe-area-left', `${safeInset(insets.left)}px`);
}

async function syncInsets() {
  if (!isNativeAndroid) {
    applyInsets();
    return;
  }

  try {
    applyInsets(await NativeSystemInsets.getInsets());
  } catch {
    // CSS env() values remain available as the browser fallback.
  }
}

export function installSystemInsetSync() {
  let appStateListener;
  let followUpTimer;

  const refresh = () => {
    window.requestAnimationFrame(() => syncInsets());
    window.clearTimeout(followUpTimer);
    followUpTimer = window.setTimeout(syncInsets, 250);
  };

  refresh();
  window.addEventListener('resize', refresh);
  window.addEventListener('orientationchange', refresh);
  window.visualViewport?.addEventListener('resize', refresh);

  CapacitorApp.addListener('appStateChange', ({ isActive }) => {
    if (isActive) refresh();
  }).then((listener) => {
    appStateListener = listener;
  });

  return () => {
    window.clearTimeout(followUpTimer);
    window.removeEventListener('resize', refresh);
    window.removeEventListener('orientationchange', refresh);
    window.visualViewport?.removeEventListener('resize', refresh);
    appStateListener?.remove();
  };
}
