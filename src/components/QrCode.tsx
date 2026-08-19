type Props = { value: string; size?: number; className?: string };

/** Deterministic decorative QR-style matrix rendered as crisp SVG. */
export function QrCode({ value, size = 200, className }: Props) {
  const modules = 29;
  const cells: boolean[] = [];
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  let state = hash >>> 0 || 123456789;
  for (let i = 0; i < modules * modules; i++) {
    state = (state * 1664525 + 1013904223) >>> 0;
    cells.push(((state >>> 16) & 0xff) > 118);
  }

  const isFinder = (r: number, c: number) => {
    const zones = [
      [0, 0],
      [0, modules - 7],
      [modules - 7, 0],
    ];
    return zones.some(([zr, zc]) => r >= zr && r < zr + 7 && c >= zc && c < zc + 7);
  };
  const finderOn = (r: number, c: number) => {
    const zones = [
      [0, 0],
      [0, modules - 7],
      [modules - 7, 0],
    ];
    const zone = zones.find(([zr, zc]) => r >= zr && r < zr + 7 && c >= zc && c < zc + 7)!;
    const dr = r - zone[0];
    const dc = c - zone[1];
    const ring = Math.max(Math.abs(dr - 3), Math.abs(dc - 3));
    return ring !== 2;
  };

  const rects: React.ReactElement[] = [];
  for (let r = 0; r < modules; r++) {
    for (let c = 0; c < modules; c++) {
      const on = isFinder(r, c) ? finderOn(r, c) : cells[r * modules + c];
      if (!on) continue;
      rects.push(
        <rect key={`${r}-${c}`} x={c} y={r} width={1} height={1} rx={0.28} />,
      );
    }
  }

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox={`-1 -1 ${modules + 2} ${modules + 2}`}
      role="img"
      aria-label={`QR code du billet ${value}`}
      fill="currentColor"
      shapeRendering="crispEdges"
    >
      {rects}
    </svg>
  );
}
