export const QR_SIZE = 21;
export const QR_FINDER = 7;
export const QR_TIMING_INDEX = 6;
export const QR_FINDER_CORE = 2;

function inFinder(x: number, y: number, originX: number, originY: number): boolean {
  return x >= originX && x < originX + QR_FINDER && y >= originY && y < originY + QR_FINDER;
}

export function isFinderCell(x: number, y: number, size = QR_SIZE): boolean {
  return (
    inFinder(x, y, 0, 0) ||
    inFinder(x, y, size - QR_FINDER, 0) ||
    inFinder(x, y, 0, size - QR_FINDER)
  );
}

function finderDark(x: number, y: number, originX: number, originY: number): boolean {
  const dx = x - originX;
  const dy = y - originY;
  const last = QR_FINDER - 1;
  const onRing = dx === 0 || dy === 0 || dx === last || dy === last;
  const inCore =
    dx >= QR_FINDER_CORE &&
    dx <= last - QR_FINDER_CORE &&
    dy >= QR_FINDER_CORE &&
    dy <= last - QR_FINDER_CORE;
  return onRing || inCore;
}

export function isReservedQrCell(x: number, y: number, size = QR_SIZE): boolean {
  return isFinderCell(x, y, size) || x === QR_TIMING_INDEX || y === QR_TIMING_INDEX;
}

export function qrModules(payload: string): boolean[][] {
  const size = QR_SIZE;
  const cells = Array.from({ length: size * size }, () => false);
  const paint = (x: number, y: number, value: boolean): void => {
    cells[y * size + x] = value;
  };
  const origins: Array<readonly [number, number]> = [
    [0, 0],
    [size - QR_FINDER, 0],
    [0, size - QR_FINDER],
  ];
  for (const [originX, originY] of origins) {
    for (let y = originY; y < originY + QR_FINDER; y += 1) {
      for (let x = originX; x < originX + QR_FINDER; x += 1) {
        paint(x, y, finderDark(x, y, originX, originY));
      }
    }
  }
  for (let index = QR_FINDER; index < size - QR_FINDER; index += 1) {
    const on = index % 2 === 0;
    paint(index, QR_TIMING_INDEX, on);
    paint(QR_TIMING_INDEX, index, on);
  }
  const bytes = Array.from(new TextEncoder().encode(payload));
  let bit = 0;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (isReservedQrCell(x, y, size)) {
        continue;
      }
      const source = bytes[bit % bytes.length] ?? bit;
      paint(x, y, ((source + x + y * 3 + bit) & 1) === 1);
      bit += 1;
    }
  }
  return Array.from({ length: size }, (_, y) => cells.slice(y * size, y * size + size));
}
