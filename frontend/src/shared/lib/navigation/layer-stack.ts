import { LAYER_SENTINEL_KEY } from "@/shared/lib/navigation/constants";

type LayerEntry = { close: () => void; id: string };

const stack: LayerEntry[] = [];

let pushedCount = 0;
let ignorePops = 0;
let reconcileScheduled = false;
let currentSession = 0;
let installed = false;

function currentUrl(): string {
  return window.location.pathname + window.location.search;
}

function reconcile(): void {
  reconcileScheduled = false;
  while (pushedCount < stack.length) {
    window.history.pushState(
      { [LAYER_SENTINEL_KEY]: true, session: currentSession },
      "",
      currentUrl(),
    );
    pushedCount += 1;
  }
  while (pushedCount > stack.length) {
    pushedCount -= 1;
    ignorePops += 1;
    window.history.back();
  }
}

function schedule(): void {
  if (reconcileScheduled) {
    return;
  }
  reconcileScheduled = true;
  queueMicrotask(reconcile);
}

function onPopstate(event: PopStateEvent): void {
  if (ignorePops > 0) {
    ignorePops -= 1;
    return;
  }

  const state = event.state as { [LAYER_SENTINEL_KEY]?: boolean; session?: number } | null;
  if (pushedCount === 0) {
    if (
      state &&
      state[LAYER_SENTINEL_KEY] === true &&
      typeof state.session === "number" &&
      state.session < currentSession
    ) {
      window.history.back();
    }
    return;
  }

  pushedCount -= 1;
  const top = stack.pop();
  if (top) {
    top.close();
  }
}

function install(): void {
  if (installed) {
    return;
  }
  installed = true;
  window.addEventListener("popstate", onPopstate);
}

function removeFromStack(id: string): boolean {
  for (let index = stack.length - 1; index >= 0; index -= 1) {
    const entry = stack[index] as LayerEntry;
    if (entry.id === id) {
      stack.splice(index, 1);
      return true;
    }
  }
  return false;
}

export function addLayer(id: string, close: () => void): void {
  install();
  removeFromStack(id);
  stack.push({ close, id });
  schedule();
}

export function removeLayer(id: string): void {
  if (removeFromStack(id)) {
    schedule();
  }
}

export function clearLayers(): boolean {
  if (pushedCount === 0 && stack.length === 0) {
    return false;
  }
  const closers = stack.map((entry) => entry.close).reverse();
  stack.length = 0;
  pushedCount = 0;
  ignorePops = 0;
  currentSession += 1;
  closers.forEach((close) => {
    try {
      close();
    } catch {
      return;
    }
  });
  return true;
}

export function abortAllLayers(): void {
  if (pushedCount === 0 && stack.length === 0) {
    return;
  }
  stack.length = 0;
  pushedCount = 0;
  ignorePops = 0;
  currentSession += 1;
}

export function layerStackDepth(): number {
  return stack.length;
}

export function _testReset(): void {
  stack.length = 0;
  pushedCount = 0;
  ignorePops = 0;
  currentSession = 0;
  reconcileScheduled = false;
}

export function _testSetPushedCount(value: number): void {
  pushedCount = value;
}

export function _testSnapshot(): {
  ignorePops: number;
  pushedCount: number;
  session: number;
  stackIds: string[];
} {
  return {
    ignorePops,
    pushedCount,
    session: currentSession,
    stackIds: stack.map((entry) => entry.id),
  };
}
