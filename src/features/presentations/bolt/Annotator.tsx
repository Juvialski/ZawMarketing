import React, { useEffect, useRef, useState } from 'react';

type Tool =
  | 'pen'
  | 'highlighter'
  | 'line'
  | 'arrow'
  | 'rect'
  | 'ellipse'
  | 'eraser';

type Pt = { x: number; y: number }; // relative to anchor box (0..1)

export type Stroke = {
  tool: Tool;
  color: string;
  size: number;
  points: Pt[];
  anchor?: string;
};

type Box = { left: number; top: number; width: number; height: number };

const TOOLS: { id: Tool; label: string; path: string }[] = [
  { id: 'pen', label: 'Pen', path: 'M4 20h4L18 10a2 2 0 0 0-3-3L5 17z' },
  {
    id: 'highlighter',
    label: 'Highlighter',
    path: 'M4 20h5l8-8-4-4-9 9zM13 7l4 4',
  },
  { id: 'line', label: 'Line', path: 'M5 19L19 5' },
  { id: 'arrow', label: 'Arrow', path: 'M6 18L18 6M18 6h-6M18 6v6' },
  { id: 'rect', label: 'Rectangle', path: 'M4 6h16v12H4z' },
  {
    id: 'ellipse',
    label: 'Ellipse',
    path: 'M12 6c4.5 0 8 2.7 8 6s-3.5 6-8 6-8-2.7-8-6 3.5-6 8-6z',
  },
  {
    id: 'eraser',
    label: 'Eraser',
    path: 'M8 18l-4-4a2 2 0 0 1 0-3l7-7a2 2 0 0 1 3 0l4 4a2 2 0 0 1 0 3l-7 7zM7 17h11',
  },
];

const COLORS = ['var(--primary)', '#ffffff', '#ef4444', '#f5b73a', '#4aa8ff'];
const COLOR_LABELS: Record<string, string> = {
  'var(--primary)': 'Accent',
  '#ffffff': 'White',
  '#ef4444': 'Red',
  '#f5b73a': 'Amber',
  '#4aa8ff': 'Blue',
};
const SIZES = [3, 6, 11];
const SIZE_LABELS = ['Small stroke', 'Medium stroke', 'Large stroke'];

const IconUndo = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.9}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M9 8L5 12l4 4" />
    <path d="M5 12h9a4 4 0 1 1 0 8h-3" />
  </svg>
);

const IconTrash = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.9}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M5 7h14M10 7V5h4v2M6 7l1 13h10l1-13" />
  </svg>
);

const stage = () => document.querySelector('.slide-stage');
const viewportBox = (): Box => ({
  left: 0,
  top: 0,
  width: typeof window !== 'undefined' ? window.innerWidth : 1280,
  height: typeof window !== 'undefined' ? window.innerHeight : 720,
});

function pathOf(el: Element): string {
  const root = stage();
  const parts: number[] = [];
  let cur: Element | null = el;
  while (cur && cur !== root) {
    const parent: Element | null = cur.parentElement;
    if (!parent) return '';
    parts.unshift(Array.prototype.indexOf.call(parent.children, cur));
    cur = parent;
  }
  return cur === root ? parts.join('.') : '';
}

function resolveAnchor(path?: string): Box | null {
  if (path === undefined) return null;
  const root = stage();
  if (!root) return null;
  let cur: Element = root;
  if (path !== '') {
    for (const i of path.split('.').map(Number)) {
      const next = cur.children[i];
      if (!next) return null;
      cur = next;
    }
  }
  const r = cur.getBoundingClientRect();
  return r.width > 4 && r.height > 4 ? r : null;
}

function anchorAt(cx: number, cy: number): string {
  if (typeof document === 'undefined' || !document.elementsFromPoint) return '';
  for (const el of document.elementsFromPoint(cx, cy)) {
    if (!el.closest('.slide-stage')) continue;
    let block: Element | null = el;
    while (
      block &&
      block !== stage() &&
      getComputedStyle(block).display === 'inline'
    ) {
      block = block.parentElement;
    }
    return block ? pathOf(block) : '';
  }
  return '';
}

function clientPts(s: Stroke): Pt[] {
  const r = resolveAnchor(s.anchor) ?? viewportBox();
  return s.points.map((p) => ({
    x: r.left + p.x * r.width,
    y: r.top + p.y * r.height,
  }));
}

function distToSeg(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number
) {
  const dx = bx - ax;
  const dy = by - ay;
  const len = dx * dx + dy * dy || 1;
  let t = ((px - ax) * dx + (py - ay) * dy) / len;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function outline(tool: Tool, pts: Pt[]): Pt[] {
  if (pts.length < 2) return pts;
  const a = pts[0];
  const b = pts[pts.length - 1];
  if (tool === 'rect') return [a, { x: b.x, y: a.y }, b, { x: a.x, y: b.y }, a];
  if (tool === 'ellipse') {
    const cx = (a.x + b.x) / 2;
    const cy = (a.y + b.y) / 2;
    const rx = Math.abs(b.x - a.x) / 2;
    const ry = Math.abs(b.y - a.y) / 2;
    return Array.from({ length: 25 }, (_, i) => ({
      x: cx + rx * Math.cos((i / 24) * 2 * Math.PI),
      y: cy + ry * Math.sin((i / 24) * 2 * Math.PI),
    }));
  }
  return pts;
}

function hits(s: Stroke, x: number, y: number, r: number) {
  const pts = outline(s.tool, clientPts(s));
  if (pts.length === 1)
    return Math.hypot(pts[0].x - x, pts[0].y - y) < r + s.size;
  for (let i = 0; i < pts.length - 1; i++) {
    if (
      distToSeg(x, y, pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y) <
      r + s.size / 2
    ) {
      return true;
    }
  }
  return false;
}

export default function Annotator({
  slide,
  store,
  active,
}: {
  slide: number;
  store: Record<number, Stroke[]>;
  active: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  if (!store[slide]) store[slide] = [];
  const strokes = useRef<Stroke[]>(store[slide]);
  const draft = useRef<Stroke | null>(null);
  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState(COLORS[0]);
  const [size, setSize] = useState(SIZES[1]);
  const toolRef = useRef(tool);
  const colorRef = useRef(color);
  const sizeRef = useRef(size);
  toolRef.current = tool;
  colorRef.current = color;
  sizeRef.current = size;

  const resolve = (c: string) => {
    if (typeof document === 'undefined') return '#c85a32';
    return c.startsWith('var(')
      ? getComputedStyle(document.documentElement)
          .getPropertyValue('--primary')
          .trim() || '#c85a32'
      : c;
  };

  function paint(ctx: CanvasRenderingContext2D, s: Stroke, p: Pt[]) {
    if (!p.length) return;
    ctx.save();
    ctx.strokeStyle = resolve(s.color);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = s.size;
    if (s.tool === 'highlighter') {
      ctx.globalAlpha = 0.32;
      ctx.lineWidth = s.size * 3.2;
    }
    const a = p[0];
    const b = p[p.length - 1];
    ctx.beginPath();
    if (s.tool === 'pen' || s.tool === 'highlighter') {
      ctx.moveTo(a.x, a.y);
      for (let i = 1; i < p.length; i++) ctx.lineTo(p[i].x, p[i].y);
      ctx.stroke();
    } else if (s.tool === 'line' || s.tool === 'arrow') {
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      if (s.tool === 'arrow') {
        const ang = Math.atan2(b.y - a.y, b.x - a.x);
        const h = 8 + s.size * 1.8;
        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(
          b.x - h * Math.cos(ang - 0.4),
          b.y - h * Math.sin(ang - 0.4)
        );
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(
          b.x - h * Math.cos(ang + 0.4),
          b.y - h * Math.sin(ang + 0.4)
        );
        ctx.stroke();
      }
    } else if (s.tool === 'rect') {
      ctx.strokeRect(
        Math.min(a.x, b.x),
        Math.min(a.y, b.y),
        Math.abs(b.x - a.x),
        Math.abs(b.y - a.y)
      );
    } else if (s.tool === 'ellipse') {
      ctx.ellipse(
        (a.x + b.x) / 2,
        (a.y + b.y) / 2,
        Math.abs(b.x - a.x) / 2,
        Math.abs(b.y - a.y) / 2,
        0,
        0,
        Math.PI * 2
      );
      ctx.stroke();
    }
    ctx.restore();
  }

  function redraw() {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cv.width / dpr, cv.height / dpr);
    for (const s of strokes.current) paint(ctx, s, clientPts(s));
    if (draft.current) paint(ctx, draft.current, draft.current.points);
  }

  function commit() {
    store[slide] = strokes.current;
    redraw();
  }

  function erase(x: number, y: number) {
    const before = strokes.current.length;
    strokes.current = strokes.current.filter((s) => !hits(s, x, y, 12));
    if (strokes.current.length !== before) commit();
  }

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const fit = () => {
      const dpr = window.devicePixelRatio || 1;
      cv.width = window.innerWidth * dpr;
      cv.height = window.innerHeight * dpr;
      cv.style.width = window.innerWidth + 'px';
      cv.style.height = window.innerHeight + 'px';
      redraw();
    };
    fit();
    const onUp = () => {
      const d = draft.current;
      if (!d) return;
      draft.current = null;
      const xs = d.points.map((p) => p.x);
      const ys = d.points.map((p) => p.y);
      const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
      const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
      d.anchor = anchorAt(cx, cy);
      const r = resolveAnchor(d.anchor) ?? viewportBox();
      d.points = d.points.map((p) => ({
        x: (p.x - r.left) / r.width,
        y: (p.y - r.top) / r.height,
      }));
      strokes.current.push(d);
      commit();
    };
    const t1 = window.setTimeout(redraw, 400);
    const t2 = window.setTimeout(redraw, 1100);
    window.addEventListener('resize', fit);
    window.addEventListener('pointerup', onUp);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('resize', fit);
      window.removeEventListener('pointerup', onUp);
    };
  }, []);

  function down(e: React.PointerEvent) {
    if (toolRef.current === 'eraser') {
      erase(e.clientX, e.clientY);
      return;
    }
    draft.current = {
      tool: toolRef.current,
      color: colorRef.current,
      size: sizeRef.current,
      points: [{ x: e.clientX, y: e.clientY }],
    };
    redraw();
  }

  function move(e: React.PointerEvent) {
    if (toolRef.current === 'eraser') {
      if (e.buttons) erase(e.clientX, e.clientY);
      return;
    }
    const d = draft.current;
    if (!d) return;
    if (d.tool === 'pen' || d.tool === 'highlighter') {
      d.points.push({ x: e.clientX, y: e.clientY });
    } else {
      d.points = [d.points[0], { x: e.clientX, y: e.clientY }];
    }
    redraw();
  }

  return (
    <>
      <canvas
        ref={canvasRef}
        className="ann-canvas"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 45,
          pointerEvents: active ? 'auto' : 'none',
          cursor: tool === 'eraser' ? 'cell' : 'crosshair',
        }}
        onPointerDown={down}
        onPointerMove={move}
      />
      {active && (
        <div
          className="ann-bar"
          style={{
            position: 'absolute',
            top: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 55,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            borderRadius: 999,
            background: 'rgba(9, 14, 23, 0.9)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 16px 36px -10px rgba(0, 0, 0, 0.7)',
          }}
        >
          {TOOLS.map((t) => (
            <button
              key={t.id}
              className={'noir-icon-btn' + (tool === t.id ? ' on' : '')}
              data-tip={t.label}
              aria-label={t.label}
              aria-pressed={tool === t.id}
              onClick={() => setTool(t.id)}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ width: 17, height: 17 }}
                aria-hidden="true"
              >
                <path d={t.path} />
              </svg>
            </button>
          ))}
          <span className="noir-sep" />
          {COLORS.map((c) => (
            <button
              key={c}
              className="noir-icon-btn"
              data-tip="Color"
              aria-label={(COLOR_LABELS[c] ?? 'Color') + ' pen'}
              aria-pressed={color === c}
              onClick={() => setColor(c)}
              style={{
                width: 24,
                height: 24,
                borderRadius: 999,
                background: c,
                border: color === c ? '2px solid #ffffff' : '1px solid rgba(255,255,255,0.3)',
                padding: 0,
              }}
            />
          ))}
          <span className="noir-sep" />
          {SIZES.map((s, i) => (
            <button
              key={s}
              className={'noir-icon-btn' + (size === s ? ' on' : '')}
              data-tip="Stroke size"
              aria-label={SIZE_LABELS[i]}
              aria-pressed={size === s}
              onClick={() => setSize(s)}
            >
              <span
                style={{
                  width: s + 3,
                  height: s + 3,
                  borderRadius: 999,
                  background: 'currentColor',
                  display: 'block',
                }}
              />
            </button>
          ))}
          <span className="noir-sep" />
          <button
            className="noir-icon-btn"
            data-tip="Undo"
            aria-label="Undo"
            onClick={() => {
              strokes.current = strokes.current.slice(0, -1);
              commit();
            }}
          >
            <IconUndo />
          </button>
          <button
            className="noir-icon-btn"
            data-tip="Clear all"
            aria-label="Clear all"
            onClick={() => {
              strokes.current = [];
              commit();
            }}
          >
            <IconTrash />
          </button>
        </div>
      )}
    </>
  );
}
