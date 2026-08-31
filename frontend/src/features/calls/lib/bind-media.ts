export function bindVideoElement(
  el: HTMLVideoElement | null,
  stream: MediaStream | null,
  play: boolean,
): void {
  if (!el) {
    return;
  }
  el.srcObject = stream;
  if (play) {
    void Promise.resolve(el.play()).catch(() => undefined);
  }
}

export function bindAudioElement(
  el: HTMLAudioElement | null,
  stream: MediaStream,
  volume: number,
  applyOutput: (element: HTMLAudioElement) => void,
): void {
  if (!el) {
    return;
  }
  if (el.srcObject !== stream) {
    el.srcObject = stream;
    void el.play().catch(() => undefined);
    applyOutput(el);
  }
  el.volume = volume;
}
