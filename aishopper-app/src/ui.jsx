const { useState, useEffect, useRef, useMemo, useLayoutEffect, Fragment } = React;

// ——————————————————————————————— helpers ———————————————————————————————
function eur(n) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(n);
}

function classNames(...xs) { return xs.filter(Boolean).join(' '); }

// Official logos are loaded from logos/<store-id>.(svg|png|jpg|webp) when present; falls back to the letter mark.
// Add a store here once its official file is in logos/, e.g. { merc: 'merc.svg' }. Others use the site favicon.
const LOCAL_LOGOS = { merc:'merc.png', carr:'carr.png', lidl:'lidl.png', dia:'dia.png', eci:'eci.png', amz:'amz.png', sco:'sco.png' };
const STORE_DOMAINS = { merc:'mercadona.es', carr:'carrefour.es', lidl:'lidl.es', dia:'dia.es', eci:'elcorteingles.es', amz:'amazon.es', sco:'supercor.es' };
const logoChain = (id) => [LOCAL_LOGOS[id] && `assets/logos/${LOCAL_LOGOS[id]}`, window.__storeLogos === 'favicons' && `https://www.google.com/s2/favicons?domain=${STORE_DOMAINS[id]}&sz=256`].filter(Boolean);
const logoCache = {};
// Letter mark always renders underneath; the logo image sits on top only once it has actually loaded,
// so a slow, blocked or broken image never shows alt text or a broken-image glyph.
function StoreMark({ store, size = 28 }) {
  const cached = logoCache[store.id];
  const [idx, setIdx] = useState(cached === undefined ? 0 : cached);
  const [loaded, setLoaded] = useState(cached !== undefined && cached !== -1);
  const chain = logoChain(store.id);
  const failed = idx === -1 || idx >= chain.length;
  const showImg = !failed && loaded;
  return (
    <div role="img" aria-label={store.name} style={{
      position: 'relative', width: size, height: size, flexShrink: 0,
      borderRadius: showImg ? size * 0.28 : '50%', overflow: 'hidden',
      background: showImg ? '#fff' : `oklch(var(--mark-bg-l) 0.03 ${store.hue})`,
      border: showImg ? '1px solid var(--line-2)' : `1px solid oklch(var(--mark-line-l) 0.04 ${store.hue})`,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {!showImg && <span className="serif" aria-hidden="true" style={{ color: `oklch(var(--mark-ink-l) 0.08 ${store.hue})`, fontSize: size * 0.55, lineHeight: 1 }}>{store.mark}</span>}
      {!failed && (
        <img src={chain[idx]} alt="" aria-hidden="true"
          onLoad={(e) => { if (!chain[idx].startsWith('assets/logos/') && e.currentTarget.naturalWidth < 24) { logoCache[store.id] = -1; setIdx(-1); return; } logoCache[store.id] = idx; setLoaded(true); }}
          onError={() => { const n = idx + 1; if (n >= chain.length) logoCache[store.id] = -1; setLoaded(false); setIdx(n >= chain.length ? -1 : n); }}
          style={{ position: 'absolute', inset: '9%', width: '82%', height: '82%', objectFit: 'contain', display: 'block', opacity: loaded ? 1 : 0 }}/>
      )}
    </div>
  );
}

function CategoryDot({ cat }) {
  const meta = CATEGORY_META[cat];
  if (!meta) return null;
  return <span style={{
    display:'inline-block', width: 6, height: 6, borderRadius: '50%',
    background: meta.dot, marginRight: 6, verticalAlign: 'middle',
  }}/>;
}

function Sparkline({ values, width = 64, height = 18, trend }) {
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const last = values[values.length - 1], first = values[0];
  const color = trend === 'up' ? 'oklch(0.58 0.14 30)' :
                (last < first ? 'oklch(0.55 0.12 150)' : 'oklch(0.55 0.01 60)');
  return (
    <svg width={width} height={height} style={{ display:'block', overflow:'visible' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.25" strokeLinejoin="round" strokeLinecap="round"/>
      <circle cx={width} cy={height - ((last - min) / range) * height} r="1.8" fill={color}/>
    </svg>
  );
}

function Icon({ name, size = 14 }) {
  const common = { width: size, height: size, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'send':    return <svg {...common}><path d="M2 8l12-5-5 12-2-5-5-2z"/></svg>;
    case 'mic':     return <svg {...common}><rect x="6" y="2" width="4" height="8" rx="2"/><path d="M3 8a5 5 0 0010 0M8 13v2"/></svg>;
    case 'x':       return <svg {...common}><path d="M4 4l8 8M12 4l-8 8"/></svg>;
    case 'check':   return <svg {...common}><path d="M3 8l3 3 7-7"/></svg>;
    case 'arrow':   return <svg {...common}><path d="M3 8h10M9 4l4 4-4 4"/></svg>;
    case 'bell':    return <svg {...common}><path d="M4 6a4 4 0 018 0c0 4 1 5 1 5H3s1-1 1-5zM6.5 13a1.5 1.5 0 003 0"/></svg>;
    case 'plus':    return <svg {...common}><path d="M8 3v10M3 8h10"/></svg>;
    case 'down':    return <svg {...common}><path d="M4 6l4 4 4-4"/></svg>;
    case 'up':      return <svg {...common}><path d="M4 10l4-4 4 4"/></svg>;
    case 'leaf':    return <svg {...common}><path d="M3 13c0-6 4-10 10-10 0 6-4 10-10 10zM3 13l5-5"/></svg>;
    case 'sparkle': return <svg {...common}><path d="M8 2v3M8 11v3M2 8h3M11 8h3M4 4l2 2M12 12l-2-2M4 12l2-2M12 4l-2 2"/></svg>;
    case 'sun':     return <svg {...common}><circle cx="8" cy="8" r="3"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.5 1.5M11.5 11.5L13 13M3 13l1.5-1.5M11.5 4.5L13 3"/></svg>;
    case 'cart':    return <svg {...common}><path d="M2 2h2l2 9h8l1-6H5"/><circle cx="7" cy="14" r="1"/><circle cx="13" cy="14" r="1"/></svg>;
    case 'pdf':     return <svg {...common}><path d="M4 1h6l3 3v11H4z"/><path d="M10 1v3h3"/></svg>;
    case 'wa':      return <svg {...common}><path d="M2 14l1-3a6 6 0 11 3 3l-4 0z"/></svg>;
    case 'dot':     return <svg {...common}><circle cx="8" cy="8" r="3" fill="currentColor"/></svg>;
    case 'calendar':return <svg {...common}><rect x="2.5" y="3.5" width="11" height="10" rx="1.5"/><path d="M2.5 6.5h11M5.5 2v3M10.5 2v3"/></svg>;
    case 'camera':  return <svg {...common}><path d="M2 5.5h2.5L6 3.5h4l1.5 2H14v7.5H2z"/><circle cx="8" cy="9" r="2.3"/></svg>;
    case 'repeat':  return <svg {...common}><path d="M3 7V6a2 2 0 012-2h8M11 2l2 2-2 2M13 9v1a2 2 0 01-2 2H3M5 14l-2-2 2-2"/></svg>;
    case 'share':   return <svg {...common}><circle cx="4" cy="8" r="1.8"/><circle cx="12" cy="4" r="1.8"/><circle cx="12" cy="12" r="1.8"/><path d="M5.6 7.2l4.8-2.4M5.6 8.8l4.8 2.4"/></svg>;
    case 'truck':   return <svg {...common}><path d="M1.5 4h8v7h-8zM9.5 6.5h3l2 2.5v2h-5"/><circle cx="4.5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/></svg>;
    case 'user':    return <svg {...common}><circle cx="8" cy="5.5" r="2.6"/><path d="M2.8 14c.6-2.8 2.7-4.2 5.2-4.2s4.6 1.4 5.2 4.2"/></svg>;
    case 'refresh': return <svg {...common}><path d="M13 3v4h-4M3 13v-4h4"/><path d="M3.5 7a5 5 0 019-1.5M12.5 9a5 5 0 01-9 1.5"/></svg>;
    case 'home':    return <svg {...common}><path d="M2.5 7.5L8 3l5.5 4.5V13.5h-11z"/><path d="M6.5 13.5v-3.5h3v3.5"/></svg>;
    case 'split':   return <svg {...common}><path d="M8 14V9M8 9L3.5 4.5M8 9l4.5-4.5M3 7.5V4h3.5M13 7.5V4H9.5"/></svg>;
    case 'warn':    return <svg {...common}><path d="M8 2.5l6 11H2z"/><path d="M8 6.5v3M8 11.6v.1"/></svg>;
    case 'search':  return <svg {...common}><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14"/></svg>;
    case 'memory':  return <svg {...common}><rect x="3" y="3" width="10" height="10" rx="1"/><path d="M5 3v-1M8 3v-1M11 3v-1M5 14v-1M8 14v-1M11 14v-1M3 5h-1M3 8h-1M3 11h-1M14 5h-1M14 8h-1M14 11h-1"/></svg>;
    default: return null;
  }
}

function Pill({ children, tone = 'default', size = 'sm', style }) {
  const tones = {
    default:  { bg: 'var(--bg-sunk)', fg: 'var(--ink-2)', bd: 'var(--line)' },
    accent:   { bg: 'var(--accent-soft)', fg: 'var(--accent-ink)', bd: 'var(--accent-line)' },
    sage:     { bg: 'var(--sage-soft)', fg: 'var(--sage-ink)', bd: 'var(--sage-line)' },
    warn:     { bg: 'var(--warn-soft)', fg: 'var(--warn-ink)', bd: 'var(--warn-line)' },
    ink:      { bg: 'var(--ink)', fg: 'var(--bg)', bd: 'var(--ink)' },
  }[tone];
  const s = {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: size === 'sm' ? '2px 7px' : '4px 10px',
    fontSize: size === 'sm' ? 11 : 12,
    fontWeight: 500, letterSpacing: '-0.005em',
    borderRadius: 999,
    background: tones.bg, color: tones.fg,
    border: `1px solid ${tones.bd}`,
    lineHeight: 1.2, whiteSpace: 'nowrap',
    ...style,
  };
  return <span style={s}>{children}</span>;
}

function Divider({ v, style }) {
  return <div style={{
    background: 'var(--line-2)',
    ...(v ? { width: 1, alignSelf: 'stretch' } : { height: 1, width: '100%' }),
    ...style,
  }}/>;
}

// Spring-style animated number for the savings reveal
// First render shows the real value; later changes ease from the previous value. Respects reduced motion.
const reduceMotion = () => typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function AnimatedNumber({ value, duration = 900, decimals = 2, prefix = '', suffix = '' }) {
  const [display, setDisplay] = useState(value);
  const startRef = useRef(null);
  const fromRef = useRef(value);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (reduceMotion() || document.hidden) { setDisplay(value); return; }
    fromRef.current = display;
    startRef.current = null;
    let raf;
    const step = (t) => {
      if (!startRef.current) startRef.current = t;
      const p = Math.min(1, (t - startRef.current) / duration);
      // easeOutCubic
      const e = 1 - Math.pow(1 - p, 3);
      setDisplay(fromRef.current + (value - fromRef.current) * e);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    const safety = setTimeout(() => setDisplay(value), duration + 150);
    return () => { cancelAnimationFrame(raf); clearTimeout(safety); };
  }, [value]);
  return <>{prefix}{display.toFixed(decimals).replace('.', ',')}{suffix}</>;
}

// Small toggle (Linear-esque segment)
function Segment({ value, onChange, options, size = 'md' }) {
  return (
    <div style={{
      display:'inline-flex', background:'var(--bg-sunk)',
      border:'1px solid var(--line)', borderRadius: 8, padding: 2, gap: 2,
    }}>
      {options.map(o => {
        const active = o.value === value;
        return (
          <button key={o.value} onClick={() => onChange(o.value)}
            style={{
              padding: size === 'sm' ? '3px 8px' : '5px 10px',
              fontSize: size === 'sm' ? 11 : 12,
              fontWeight: 500,
              borderRadius: 6,
              color: active ? 'var(--ink)' : 'var(--ink-3)',
              background: active ? 'var(--bg-panel)' : 'transparent',
              boxShadow: active ? '0 1px 2px oklch(0.5 0.01 60 / 0.08)' : 'none',
              transition: 'background 120ms, color 120ms',
            }}>{o.label}</button>
        );
      })}
    </div>
  );
}

Object.assign(window, { eur, classNames, StoreMark, CategoryDot, Sparkline, Icon, Pill, Divider, AnimatedNumber, Segment });
