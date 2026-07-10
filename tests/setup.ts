import "fake-indexeddb/auto";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
  url: "http://localhost",
  pretendToBeVisual: true,
});

Object.defineProperty(globalThis, "window", { value: dom.window, writable: true, configurable: true });
Object.defineProperty(globalThis, "document", { value: dom.window.document, writable: true, configurable: true });
Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator, writable: true, configurable: true });
Object.defineProperty(globalThis, "location", { value: dom.window.location, writable: true, configurable: true });
Object.defineProperty(globalThis, "HTMLElement", { value: dom.window.HTMLElement, writable: true, configurable: true });
Object.defineProperty(globalThis, "CustomEvent", { value: dom.window.CustomEvent, writable: true, configurable: true });
Object.defineProperty(globalThis, "Event", { value: dom.window.Event, writable: true, configurable: true });
Object.defineProperty(globalThis, "Node", { value: dom.window.Node, writable: true, configurable: true });
Object.defineProperty(globalThis, "NodeList", { value: dom.window.NodeList, writable: true, configurable: true });
Object.defineProperty(globalThis, "HTMLInputElement", { value: dom.window.HTMLInputElement, writable: true, configurable: true });
Object.defineProperty(globalThis, "HTMLButtonElement", { value: dom.window.HTMLButtonElement, writable: true, configurable: true });
Object.defineProperty(globalThis, "HTMLDivElement", { value: dom.window.HTMLDivElement, writable: true, configurable: true });
Object.defineProperty(globalThis, "MutationObserver", { value: dom.window.MutationObserver, writable: true, configurable: true });
Object.defineProperty(globalThis, "getComputedStyle", { value: (el: Element) => dom.window.getComputedStyle(el), writable: true, configurable: true });
Object.defineProperty(globalThis, "localStorage", { value: dom.window.localStorage, writable: true, configurable: true });
Object.defineProperty(globalThis, "sessionStorage", { value: dom.window.sessionStorage, writable: true, configurable: true });
Object.defineProperty(globalThis, "matchMedia", {
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
  writable: true,
  configurable: true,
});
Object.defineProperty(dom.window, "matchMedia", {
  value: globalThis.matchMedia,
  writable: true,
  configurable: true,
});
