import { describe, it, expect } from "bun:test";
import { parseDeviceInfo } from "../../src/lib/deviceInfo";

describe("parseDeviceInfo", () => {
  describe("browser detection", () => {
    it("detects Chrome", () => {
      const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
      expect(parseDeviceInfo(ua).browser).toBe("Chrome");
    });

    it("detects Firefox", () => {
      const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0";
      expect(parseDeviceInfo(ua).browser).toBe("Firefox");
    });

    it("detects Safari", () => {
      const ua = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15";
      expect(parseDeviceInfo(ua).browser).toBe("Safari");
    });

    it("detects Edge", () => {
      const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0";
      expect(parseDeviceInfo(ua).browser).toBe("Edge");
    });

    it("detects Opera", () => {
      const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 OPR/106.0.0.0";
      expect(parseDeviceInfo(ua).browser).toBe("Opera");
    });

    it("detects Samsung Browser", () => {
      const ua = "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/23.0 Chrome/115.0.0.0 Mobile Safari/537.36";
      expect(parseDeviceInfo(ua).browser).toBe("Samsung Browser");
    });

    it("falls back to Browser for unknown UA", () => {
      expect(parseDeviceInfo("UnknownAgent/1.0").browser).toBe("Browser");
    });
  });

  describe("OS detection", () => {
    it("detects Android", () => {
      const ua = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36";
      expect(parseDeviceInfo(ua).os).toBe("Android");
      expect(parseDeviceInfo(ua).osVersion).toBe("14");
    });

    it("detects iPhone", () => {
      const ua = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148";
      expect(parseDeviceInfo(ua).os).toBe("iPhone");
      expect(parseDeviceInfo(ua).osVersion).toBe("17.2");
    });

    it("detects iPad", () => {
      const ua = "Mozilla/5.0 (iPad; CPU OS 17_2 like Mac OS X) AppleWebKit/605.1.15";
      expect(parseDeviceInfo(ua).os).toBe("iPad");
    });

    it("detects Windows", () => {
      const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)";
      expect(parseDeviceInfo(ua).os).toBe("Windows");
      expect(parseDeviceInfo(ua).osVersion).toBe("10/11");
    });

    it("detects macOS", () => {
      const ua = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)";
      expect(parseDeviceInfo(ua).os).toBe("macOS");
      expect(parseDeviceInfo(ua).osVersion).toBe("10.15.7");
    });

    it("detects Linux", () => {
      const ua = "Mozilla/5.0 (X11; Linux x86_64)";
      expect(parseDeviceInfo(ua).os).toBe("Linux");
    });

    it("returns Unknown for unrecognized OS", () => {
      expect(parseDeviceInfo("SomeAgent/1.0").os).toBe("Unknown");
    });
  });

  describe("mobile detection", () => {
    it("detects Android as mobile", () => {
      const ua = "Mozilla/5.0 (Linux; Android 14)";
      expect(parseDeviceInfo(ua).isMobile).toBe(true);
    });

    it("detects iPhone as mobile", () => {
      const ua = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2)";
      expect(parseDeviceInfo(ua).isMobile).toBe(true);
    });

    it("detects desktop as not mobile", () => {
      const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)";
      expect(parseDeviceInfo(ua).isMobile).toBe(false);
    });
  });

  describe("PWA detection", () => {
    it("passes isPwa flag through", () => {
      expect(parseDeviceInfo("any", true).isPwa).toBe(true);
      expect(parseDeviceInfo("any", false).isPwa).toBe(false);
    });

    it("defaults isPwa to false", () => {
      expect(parseDeviceInfo("any").isPwa).toBe(false);
    });
  });

  describe("Windows NT version mapping", () => {
    it("maps NT 6.1 to 7", () => {
      const ua = "Mozilla/5.0 (Windows NT 6.1; Win64; x64)";
      expect(parseDeviceInfo(ua).osVersion).toBe("7");
    });

    it("maps NT 6.2 to 8", () => {
      const ua = "Mozilla/5.0 (Windows NT 6.2; Win64; x64)";
      expect(parseDeviceInfo(ua).osVersion).toBe("8");
    });

    it("maps NT 6.3 to 8.1", () => {
      const ua = "Mozilla/5.0 (Windows NT 6.3; Win64; x64)";
      expect(parseDeviceInfo(ua).osVersion).toBe("8.1");
    });
  });
});
