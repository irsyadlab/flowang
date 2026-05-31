/**
 * deviceInfo - parse browser and device/OS from a user agent string.
 */

export interface DeviceInfo {
  browser: string;
  os: string;
  isMobile: boolean;
}

export function parseDeviceInfo(ua: string): DeviceInfo {
  const isMobile = /Android|iPhone|iPad|iPod/i.test(ua);

  const browser =
    /Edg\//i.test(ua) ? 'Edge' :
    /OPR\//i.test(ua) || /Opera/i.test(ua) ? 'Opera' :
    /SamsungBrowser/i.test(ua) ? 'Samsung Browser' :
    /Chrome/i.test(ua) ? 'Chrome' :
    /Firefox/i.test(ua) ? 'Firefox' :
    /Safari/i.test(ua) ? 'Safari' :
    'Browser';

  const os =
    /Android/i.test(ua) ? 'Android' :
    /iPhone/i.test(ua) ? 'iPhone' :
    /iPad/i.test(ua) ? 'iPad' :
    /Windows NT/i.test(ua) ? 'Windows' :
    /Mac OS X/i.test(ua) ? 'macOS' :
    /Linux/i.test(ua) ? 'Linux' :
    'Unknown';

  return { browser, os, isMobile };
}

/**
 * Get device info for the current browser.
 */
export function getLocalDeviceInfo(): DeviceInfo {
  return parseDeviceInfo(navigator.userAgent);
}
