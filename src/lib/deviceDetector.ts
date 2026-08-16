/**
 * AETHER SECURITY NETWORK - DEVICE & BROWSER INTELLIGENCE ENGINE
 * Comprehensive device, operating system, browser, screen, and viewport adaptation engine.
 */

export interface DeviceInfo {
  deviceType: 'mobile' | 'tablet' | 'desktop' | 'foldable';
  os: 'iOS' | 'Android' | 'macOS' | 'Windows' | 'Linux' | 'ChromeOS' | 'Unknown';
  osVersion: string;
  browser: 'Safari' | 'Chrome' | 'Firefox' | 'Edge' | 'Opera' | 'Samsung Internet' | 'Brave' | 'WebKit' | 'Unknown';
  browserVersion: string;
  isTouch: boolean;
  isStandalonePWA: boolean;
  isRetina: boolean;
  orientation: 'portrait' | 'landscape';
  screenWidth: number;
  screenHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  devicePixelRatio: number;
  hasNotch: boolean;
  prefersReducedMotion: boolean;
  prefersDarkMode: boolean;
}

export function detectDevice(): DeviceInfo {
  if (typeof window === 'undefined') {
    return {
      deviceType: 'desktop',
      os: 'Unknown',
      osVersion: '',
      browser: 'Unknown',
      browserVersion: '',
      isTouch: false,
      isStandalonePWA: false,
      isRetina: false,
      orientation: 'landscape',
      screenWidth: 1920,
      screenHeight: 1080,
      viewportWidth: 1920,
      viewportHeight: 1080,
      devicePixelRatio: 1,
      hasNotch: false,
      prefersReducedMotion: false,
      prefersDarkMode: true,
    };
  }

  const ua = navigator.userAgent || '';
  const vendor = navigator.vendor || '';

  // 1. Operating System Detection
  let os: DeviceInfo['os'] = 'Unknown';
  let osVersion = '';

  if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
    os = 'iOS';
    const match = ua.match(/OS (\d+[_.]\d+)/);
    if (match) osVersion = match[1].replace('_', '.');
  } else if (/Android/.test(ua)) {
    os = 'Android';
    const match = ua.match(/Android (\d+([._]\d+)?)/);
    if (match) osVersion = match[1];
  } else if (/Macintosh|Mac OS X/.test(ua)) {
    os = 'macOS';
    const match = ua.match(/Mac OS X (\d+[_.]\d+)/);
    if (match) osVersion = match[1].replace('_', '.');
  } else if (/Windows/.test(ua)) {
    os = 'Windows';
    if (/Windows NT 10.0/.test(ua)) osVersion = '10/11';
    else if (/Windows NT 6.3/.test(ua)) osVersion = '8.1';
    else if (/Windows NT 6.1/.test(ua)) osVersion = '7';
  } else if (/CrOS/.test(ua)) {
    os = 'ChromeOS';
  } else if (/Linux/.test(ua)) {
    os = 'Linux';
  }

  // 2. Browser Detection
  let browser: DeviceInfo['browser'] = 'Unknown';
  let browserVersion = '';

  if (/SamsungBrowser/.test(ua)) {
    browser = 'Samsung Internet';
    const match = ua.match(/SamsungBrowser\/(\d+(\.\d+)?)/);
    if (match) browserVersion = match[1];
  } else if (/Edg\//.test(ua)) {
    browser = 'Edge';
    const match = ua.match(/Edg\/(\d+(\.\d+)?)/);
    if (match) browserVersion = match[1];
  } else if (/OPR\/|Opera/.test(ua)) {
    browser = 'Opera';
    const match = ua.match(/(?:OPR|Opera)\/(\d+(\.\d+)?)/);
    if (match) browserVersion = match[1];
  } else if (Boolean((navigator as any).brave) || /Brave/.test(ua)) {
    browser = 'Brave';
  } else if (/Chrome\//.test(ua) && !/Edg\//.test(ua) && !/OPR\//.test(ua) && /Google Inc/.test(vendor)) {
    browser = 'Chrome';
    const match = ua.match(/Chrome\/(\d+(\.\d+)?)/);
    if (match) browserVersion = match[1];
  } else if (/Firefox\//.test(ua)) {
    browser = 'Firefox';
    const match = ua.match(/Firefox\/(\d+(\.\d+)?)/);
    if (match) browserVersion = match[1];
  } else if (/Safari/.test(ua) && /Apple Computer/.test(vendor)) {
    browser = 'Safari';
    const match = ua.match(/Version\/(\d+(\.\d+)?)/);
    if (match) browserVersion = match[1];
  } else if (/WebKit/.test(ua)) {
    browser = 'WebKit';
  }

  // 3. Screen Dimensions & Device Type Detection
  const screenWidth = window.screen?.width || window.innerWidth;
  const screenHeight = window.screen?.height || window.innerHeight;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const isTouch = Boolean('ontouchstart' in window || navigator.maxTouchPoints > 0);
  const minDimension = Math.min(viewportWidth, viewportHeight);

  let deviceType: DeviceInfo['deviceType'] = 'desktop';
  if (minDimension < 500 || (isTouch && viewportWidth < 600)) {
    deviceType = 'mobile';
  } else if (minDimension >= 500 && minDimension < 900 && isTouch) {
    deviceType = 'tablet';
  } else if (viewportWidth >= 500 && viewportWidth <= 768 && !isTouch) {
    deviceType = 'foldable';
  } else {
    deviceType = 'desktop';
  }

  const isStandalonePWA = Boolean(
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone ||
    document.referrer.includes('android-app://')
  );

  const isRetina = (window.devicePixelRatio || 1) >= 1.5;
  const orientation = viewportWidth > viewportHeight ? 'landscape' : 'portrait';
  const hasNotch = os === 'iOS' && isTouch && (screenHeight >= 812 || screenWidth >= 812);
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

  return {
    deviceType,
    os,
    osVersion,
    browser,
    browserVersion,
    isTouch,
    isStandalonePWA,
    isRetina,
    orientation,
    screenWidth,
    screenHeight,
    viewportWidth,
    viewportHeight,
    devicePixelRatio: window.devicePixelRatio || 1,
    hasNotch,
    prefersReducedMotion,
    prefersDarkMode,
  };
}

/**
 * Initializes dynamic viewport height and safe-area calculation for mobile browsers.
 * Solves the mobile Safari & Chrome 100vh address bar jump.
 */
export function initViewportFixer(): () => void {
  if (typeof window === 'undefined') return () => {};

  const updateDimensions = () => {
    // 1. Calculate actual viewport height (1vh = 1% of innerHeight)
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
    document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
    document.documentElement.style.setProperty('--app-width', `${window.innerWidth}px`);

    // 2. Set Device Metadata attributes on <html> for CSS targeting
    const info = detectDevice();
    document.documentElement.setAttribute('data-device', info.deviceType);
    document.documentElement.setAttribute('data-os', info.os.toLowerCase());
    document.documentElement.setAttribute('data-browser', info.browser.toLowerCase().replace(/\s+/g, '-'));
    document.documentElement.setAttribute('data-touch', info.isTouch ? 'true' : 'false');
    document.documentElement.setAttribute('data-orientation', info.orientation);
  };

  updateDimensions();

  window.addEventListener('resize', updateDimensions, { passive: true });
  window.addEventListener('orientationchange', updateDimensions, { passive: true });

  return () => {
    window.removeEventListener('resize', updateDimensions);
    window.removeEventListener('orientationchange', updateDimensions);
  };
}
