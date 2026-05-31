/**
 * deviceInfo - parse browser and device/OS from a user agent string.
 */

export interface DeviceInfo {
  browser: string;
  os: string;
  osVersion: string;
  isMobile: boolean;
  isPwa: boolean;
}

export function parseDeviceInfo(ua: string, isPwa = false): DeviceInfo {
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

  // Extract OS version from UA string
  let osVersion = '';
  const androidMatch = ua.match(/Android\s([\d.]+)/i);
  const iPhoneMatch = ua.match(/iPhone OS\s([\d_]+)/i);
  const iPadMatch = ua.match(/iPad.*OS\s([\d_]+)/i);
  const windowsMatch = ua.match(/Windows NT\s([\d.]+)/i);
  const macMatch = ua.match(/Mac OS X\s([\d_.]+)/i);

  if (androidMatch) {
    osVersion = androidMatch[1];
  } else if (iPhoneMatch) {
    osVersion = iPhoneMatch[1].replace(/_/g, '.');
  } else if (iPadMatch) {
    osVersion = iPadMatch[1].replace(/_/g, '.');
  } else if (windowsMatch) {
    // Map Windows NT version to marketing name
    const ntVersion: Record<string, string> = {
      '10.0': '10/11',
      '6.3': '8.1',
      '6.2': '8',
      '6.1': '7',
    };
    osVersion = ntVersion[windowsMatch[1]] ?? windowsMatch[1];
  } else if (macMatch) {
    osVersion = macMatch[1].replace(/_/g, '.');
  }

  return { browser, os, osVersion, isMobile, isPwa };
}

/**
 * Get device info for the current browser.
 */
export function getLocalDeviceInfo(): DeviceInfo {
  const isPwa =
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator && (navigator as { standalone?: boolean }).standalone === true);

  return parseDeviceInfo(navigator.userAgent, isPwa);
}
