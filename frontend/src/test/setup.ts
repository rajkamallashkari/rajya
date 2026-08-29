import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeAll } from "vitest";
import "@/test/memory-storage";
import { setAccessSession } from "@/features/auth/model/access-session";
import { resetAccountsStore } from "@/features/auth/store/accounts-store";
import { resetLockStore } from "@/features/auth/store/lock-store";
import { initI18n } from "@/shared/lib/i18n";
import { en } from "@/shared/lib/i18n/catalog";
import { resetAccountDatabases } from "@/shared/lib/db";
import { _testReset as resetLayerStack } from "@/shared/lib/navigation/layer-stack";
import { resetLayerStore } from "@/shared/lib/navigation/layer-store";
import { FakeAudio } from "@/test/fake-audio";

afterEach(() => {
  cleanup();
  FakeAudio.reset();
  window.history.replaceState({}, "", "/");
  window.localStorage.clear();
  setAccessSession(null);
  resetLockStore();
  resetAccountsStore();
  resetAccountDatabases();
  resetLayerStore();
  resetLayerStack();
});

beforeAll(async () => {
  await initI18n({ catalog: en });
});

if (typeof Element !== "undefined") {
  const proto = Element.prototype as Element & {
    hasPointerCapture?: (pointerId: number) => boolean;
    setPointerCapture?: (pointerId: number) => void;
    releasePointerCapture?: (pointerId: number) => void;
  };
  proto.hasPointerCapture ??= () => false;
  proto.setPointerCapture ??= () => undefined;
  proto.releasePointerCapture ??= () => undefined;
  proto.scrollIntoView ??= () => undefined;
}

Object.defineProperty(window, "Audio", { configurable: true, value: FakeAudio });
Object.defineProperty(globalThis, "Audio", { configurable: true, value: FakeAudio });

if (typeof URL.createObjectURL !== "function") {
  URL.createObjectURL = () => "blob:rajya-test";
}
if (typeof URL.revokeObjectURL !== "function") {
  URL.revokeObjectURL = () => undefined;
}

if (typeof window.ResizeObserver !== "function") {
  window.ResizeObserver = class {
    public observe(): void {
      return undefined;
    }
    public unobserve(): void {
      return undefined;
    }
    public disconnect(): void {
      return undefined;
    }
  };
}

if (typeof HTMLCanvasElement !== "undefined") {
  HTMLCanvasElement.prototype.getContext = function getContext(id: string) {
    if (id !== "2d") {
      return null;
    }
    return {
      beginPath: () => undefined,
      clearRect: () => undefined,
      fill: () => undefined,
      fillRect: () => undefined,
      fillStyle: "",
      roundRect: () => undefined,
      setTransform: () => undefined,
    } as unknown as CanvasRenderingContext2D;
  } as HTMLCanvasElement["getContext"];
}

if (typeof window.PointerEvent !== "function") {
  class PointerEventShim extends MouseEvent {
    public readonly pointerId: number;
    public readonly pointerType: string;
    public constructor(
      type: string,
      params: MouseEventInit & { pointerId?: number; pointerType?: string } = {},
    ) {
      super(type, params);
      this.pointerId = params.pointerId ?? 1;
      this.pointerType = params.pointerType ?? "mouse";
    }
  }
  Object.defineProperty(window, "PointerEvent", { configurable: true, value: PointerEventShim });
}

if (typeof window.matchMedia !== "function") {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: query.includes("dark"),
      media: query,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
      onchange: null,
    }),
  });
}
