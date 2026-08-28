export class FakeAudio {
  public static instances: FakeAudio[] = [];
  public currentTime = 0;
  public duration = 4.2;
  public paused = true;
  public playResult: Promise<void> = Promise.resolve();
  public readonly src: string;
  private readonly listeners = new Map<string, Set<() => void>>();

  public constructor(src = "") {
    this.src = src;
    FakeAudio.instances.push(this);
  }

  public static reset(): void {
    FakeAudio.instances = [];
  }

  public static latest(): FakeAudio {
    const audio = FakeAudio.instances.at(-1);
    if (!audio) {
      throw new Error("expected FakeAudio instance");
    }
    return audio;
  }

  public static broadcast(type: string, mutate?: (audio: FakeAudio) => void): void {
    FakeAudio.instances.forEach((audio) => {
      mutate?.(audio);
      audio.emit(type);
    });
  }

  public addEventListener(type: string, listener: () => void): void {
    const set = this.listeners.get(type) ?? new Set();
    set.add(listener);
    this.listeners.set(type, set);
  }

  public removeEventListener(type: string, listener: () => void): void {
    this.listeners.get(type)?.delete(listener);
  }

  public emit(type: string): void {
    this.listeners.get(type)?.forEach((listener) => listener());
  }

  public play = (): Promise<void> => {
    this.paused = false;
    return this.playResult;
  };

  public pause = (): void => {
    this.paused = true;
  };
}
