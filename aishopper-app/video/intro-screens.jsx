// Screens for the intro video — pure functions of T. Screen coords: 390×844.
const VC = {
  bg:'oklch(0.985 0.004 85)', panel:'oklch(0.995 0.003 85)', sunk:'oklch(0.965 0.006 85)',
  ink:'oklch(0.20 0.012 60)', ink2:'oklch(0.42 0.012 60)', ink3:'oklch(0.62 0.010 60)',
  line:'oklch(0.91 0.006 70)', line2:'oklch(0.94 0.005 70)',
  accent:'oklch(0.55 0.18 255)', accentSoft:'oklch(0.94 0.04 255)',
  sage:'oklch(0.58 0.10 150)', sageSoft:'oklch(0.93 0.05 150)', sageInk:'oklch(0.36 0.10 150)', red:'oklch(0.55 0.14 30)',
};
const VF = { serif:"'Instrument Serif', Georgia, serif", sans:"Inter, system-ui, sans-serif", mono:"'JetBrains Mono', ui-monospace, monospace" };
const vcl = (v) => Math.max(0, Math.min(1, v));
const vmix = (a, b, p) => a + (b - a) * p;
const MOTION = {
  enter: (T, a, d = 0.5) => Easing.easeOutCubic(vcl((T - a) / d)),
  pop:   (T, a, d = 0.45) => Easing.easeOutBack(vcl((T - a) / d)),
  glide: (T, a, d = 0.8) => Easing.easeInOutCubic(vcl((T - a) / d)),
};
// Sequential keyframe track: each key glides from the running value toward key.v over [t, t+d].
function vtrack(T, keys) {
  const v = { ...keys[0].v };
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (T < k.t) break;
    const p = MOTION.glide(T, k.t, k.d || 0.8);
    for (const n in k.v) v[n] = vmix(v[n], k.v[n], p);
  }
  return v;
}
const win = (T, a, b, f = 0.2) => MOTION.enter(T, a, f) * (1 - MOTION.enter(T, b, f));

// ─── Data derived from the real catalog ─────────────────────────────
const VR = RECIPES.paella;
const vItems = (s) => VR.ingredients.map(i => ({ id: i.id, qty: Math.max(1, Math.ceil(i.per * s)) }));
const VBASKET = vItems(6);
// Store-brand equivalents used in the video where the catalog has none.
const VWL = { pollo: { name: { es: 'Hacendado pechuga', en: 'Hacendado breast' } }, aceite: { name: { es: 'Hacendado virgen extra', en: 'Hacendado extra virgin' } }, tomate: { name: { es: 'Hacendado tomate', en: 'Hacendado tomato' } } };
const vwl = (id) => CATALOG[id].whiteLabel || VWL[id];
function vTotals(subs) {
  return STORES.map(s => {
    const items = VBASKET.reduce((sum, b) => {
      const p = CATALOG[b.id]; const base = p.prices[s.id] * b.qty;
      return sum + base - (subs && vwl(p.id) ? 0.12 * base : 0);
    }, 0);
    const ship = items >= s.minFree ? 0 : s.delivery;
    return { id: s.id, items, ship, total: items + ship };
  }).sort((a, b) => a.total - b.total);
}
const VTOT0 = vTotals(false);
const VWIN = VTOT0[0];
const VWSTORE = STORES.find(s => s.id === VWIN.id);
const VWIN1 = (() => { const a = vTotals(true).find(x => x.id === VWIN.id); return { ...a, ship: VWIN.ship, total: a.items + VWIN.ship }; })();
const VSUBS = VBASKET.filter(b => vwl(b.id));
const VCOUNT = VBASKET.length;
const VWORST = VTOT0[VTOT0.length - 1];
const VAVG = VTOT0.reduce((s, x) => s + x.total, 0) / VTOT0.length;
const vDomain = (st) => st.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f\s]/g, '') + '.es';

function VMark({ store, size = 28 }) { return <StoreMark store={store} size={size}/>; }
function VPill({ children, tone = 'sage' }) {
  const t = tone === 'sage' ? [VC.sageSoft, VC.sageInk] : [VC.accentSoft, 'oklch(0.40 0.15 255)'];
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 999,
    background: t[0], color: t[1], fontSize: 11, fontWeight: 500, whiteSpace: 'nowrap' }}>{children}</span>;
}
const abs = (x, y, w, h, extra) => ({ position: 'absolute', left: x, top: y, width: w, height: h, ...extra });
const upLabel = { fontSize: 11, color: VC.ink3, textTransform: 'uppercase', letterSpacing: '0.08em' };

// ─── Chrome ─────────────────────────────────────────────────────────
function VStatus() {
  return (
    <div style={abs(0, 0, 390, 47)}>
      <div style={{ position: 'absolute', left: 34, top: 15, fontSize: 16, fontWeight: 600, color: VC.ink }}>9:41</div>
      <div style={{ position: 'absolute', left: 135, top: 11, width: 120, height: 34, borderRadius: 20, background: '#111' }}></div>
      <div style={{ position: 'absolute', right: 30, top: 18, display: 'flex', gap: 5, alignItems: 'flex-end' }}>
        {[5, 8, 11].map(h => <span key={h} style={{ width: 3, height: h, borderRadius: 1, background: VC.ink }}></span>)}
        <span style={{ width: 24, height: 11, borderRadius: 3, border: `1.5px solid ${VC.ink}`, padding: 1.5, marginLeft: 4, display: 'flex' }}>
          <span style={{ flex: 1, borderRadius: 1, background: VC.ink }}></span>
        </span>
      </div>
    </div>
  );
}
function VTopBar({ title, sub, left, right }) {
  return (
    <div style={{ ...abs(0, 47, 390, 58), background: VC.panel, borderBottom: `1px solid ${VC.line2}`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {left}
        <div>
          <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.1 }}>{title}</div>
          <div style={{ fontSize: 12, color: VC.ink3, marginTop: 2 }}>{sub}</div>
        </div>
      </div>
      {right}
    </div>
  );
}
function BasketGlyph({ size = 22 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 9h16l-2 11H6L4 9z"></path><path d="M8 9l4-6 4 6"></path><path d="M10 13v3M14 13v3"></path></svg>;
}
const VTAB_X = [65, 195, 325];
function VTabBar({ T, lang, active, count, bump }) {
  const L = (es, en) => lang === 'es' ? es : en;
  const tabs = [
    { id: 'chat', label: 'Chat', icon: <Icon name="sparkle" size={21}/> },
    { id: 'compare', label: L('Comparar', 'Compare'), icon: <Icon name="cart" size={21}/> },
    { id: 'you', label: L('Tú', 'You'), icon: <Icon name="memory" size={21}/> },
  ];
  const bs = 1 + 0.4 * Math.sin(Math.PI * vcl((T - bump) / 0.4));
  return (
    <div style={{ ...abs(0, 754, 390, 90), background: VC.panel, borderTop: `1px solid ${VC.line2}` }}>
      {tabs.map((t, i) => (
        <div key={t.id} style={{ position: 'absolute', left: VTAB_X[i] - 45, top: 10, width: 90,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          color: active === t.id ? VC.ink : VC.ink3 }}>
          <div style={{ position: 'relative', height: 22 }}>
            {t.icon}
            {t.id === 'compare' && count > 0 && (
              <span style={{ position: 'absolute', top: -5, right: -11, minWidth: 18, height: 18, padding: '0 5px', borderRadius: 9,
                background: VC.ink, color: VC.bg, fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center',
                justifyContent: 'center', transform: `scale(${bs})` }}>{count}</span>
            )}
          </div>
          <span style={{ fontSize: 11, fontWeight: active === t.id ? 600 : 500 }}>{t.label}</span>
        </div>
      ))}
      <div style={{ position: 'absolute', left: 128, bottom: 8, width: 134, height: 5, borderRadius: 3, background: VC.ink }}></div>
    </div>
  );
}

// ─── Chat screen ────────────────────────────────────────────────────
function VChat({ T, K, lang, fly }) {
  const L = (es, en) => lang === 'es' ? es : en;
  const V = K.Voice, R = K.Recipe, A = K.Add;
  const phrase = L('Una paella para cuatro', 'A paella for four');
  const listen = win(T, V + 1.6, V + 4.1, 0.15);
  const typed = phrase.slice(0, Math.round(phrase.length * vcl((T - (V + 2.0)) / 1.5)));
  const emptyO = 1 - MOTION.enter(T, V + 4.2, 0.4);
  const bubble = MOTION.enter(T, V + 4.3, 0.4);
  const dots = win(T, V + 4.8, V + 6.5, 0.2);
  const card = MOTION.enter(T, V + 6.6, 0.6);
  const serv = T >= R + 4.3 ? 6 : T >= R + 3.3 ? 5 : 4;
  const items = vItems(serv);
  const prev = vItems(serv === 6 ? 5 : 4);
  const flashAt = serv === 6 ? R + 4.3 : R + 3.3;
  const est = items.reduce((s, it) => s + Math.min(...Object.values(CATALOG[it.id].prices)) * it.qty, 0);
  const added = T >= A + 1.05;
  const chipO = MOTION.enter(T, A + 2.2, 0.4);
  const btnPress = (t) => 1 - 0.06 * Math.sin(Math.PI * vcl((T - t) / 0.3));
  const cardY = 176;
  return (
    <>
      <VTopBar title="Concierge"
        sub={<span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 5, height: 5, borderRadius: '50%', background: VC.sage }}></span><span style={{ fontFamily: VF.mono }}>28004</span> · 7 supers</span>}
        left={<div style={{ width: 34, height: 34, borderRadius: 10, background: VC.accentSoft, color: 'oklch(0.40 0.15 255)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="sparkle" size={16}/></div>}
        right={<div style={{ display: 'flex', alignItems: 'center', gap: 7, height: 36, padding: '0 11px 0 5px', borderRadius: 11,
          background: VC.sunk, border: `1px solid ${VC.line2}`, opacity: chipO, transform: `scale(${0.8 + 0.2 * chipO})` }}>
          <VMark store={VWSTORE} size={26}/><span style={{ fontFamily: VF.serif, fontSize: 18 }}>{eur(VWIN.total)}</span></div>}/>
      {/* Empty state */}
      <div style={{ ...abs(20, 128, 350, 300), opacity: emptyO }}>
        <div style={{ fontFamily: VF.serif, fontSize: 38, lineHeight: 1.05, letterSpacing: '-0.02em' }}>
          {L('Dime un plato.', 'Name a dish.')}<br/><span style={{ fontStyle: 'italic', color: VC.ink3 }}>{L('Te digo dónde sale más barato.', "I'll tell you where it's cheapest.")}</span>
        </div>
        <div style={{ fontSize: 14, color: VC.ink2, marginTop: 14, lineHeight: 1.5 }}>
          {L('Pide un plato o dicta tu lista. Comparo 7 supers y te digo dónde sale más barato.', 'Ask for a dish or dictate your list. I compare 7 stores and find the cheapest.')}
        </div>
        <div style={{ ...upLabel, marginTop: 22 }}>{L('Prueba un plato', 'Try a dish')}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 9 }}>
          {['paella', 'tortilla', 'carbonara', 'ensalada'].map(d => (
            <span key={d} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 13px 8px 10px', borderRadius: 999,
              background: VC.panel, border: `1px solid ${VC.line}`, fontSize: 13, fontWeight: 500 }}>
              <span style={{ fontSize: 16 }}>{RECIPES[d].emoji}</span>{RECIPES[d].name[lang]}</span>
          ))}
        </div>
      </div>
      {/* User bubble */}
      <div style={{ position: 'absolute', right: 16, top: 122, opacity: bubble, transform: `translateY(${(1 - bubble) * 14}px)`,
        padding: '10px 15px', borderRadius: '18px 18px 4px 18px', background: VC.ink, color: VC.bg, fontSize: 15 }}>{phrase}</div>
      {/* Typing */}
      <div style={{ ...abs(12, 178, 120, 30), opacity: dots, display: 'flex', alignItems: 'center', gap: 8 }}>
        <VAvatar/>
        <div style={{ display: 'flex', gap: 4, padding: '9px 12px', borderRadius: 14, background: VC.sunk }}>
          {[0, 1, 2].map(i => <span key={i} style={{ width: 6, height: 6, borderRadius: 3, background: VC.ink3,
            opacity: 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(T * 9 - i * 1.1)) }}></span>)}
        </div>
      </div>
      {/* Recipe card */}
      <div style={{ opacity: card, transform: `translateY(${(1 - card) * 24}px)` }}>
        <div style={{ ...abs(12, cardY, 28, 28) }}><VAvatar/></div>
        <div style={{ ...abs(46, cardY + 2, 330, 24), display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: VC.ink2 }}>
          <VPill tone="accent"><Icon name="sparkle" size={10}/>{L('Receta detectada', 'Recipe found')}</VPill>
          {L('Esto es lo que necesitas', "Here's what you need")}
        </div>
        <div style={{ ...abs(46, cardY + 32, 332, 376), background: VC.panel, border: `1px solid ${VC.line}`, borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ height: 60, display: 'flex', alignItems: 'center', gap: 12, padding: '0 14px', background: VC.sunk, borderBottom: `1px solid ${VC.line2}` }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: VC.panel, border: `1px solid ${VC.line2}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{VR.emoji}</div>
            <div style={{ flex: 1, whiteSpace: 'nowrap' }}>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{VR.name[lang]}</div>
              <div style={{ fontSize: 12, color: VC.ink3 }}>{VR.time[lang]} · {items.length} {L('ingredientes', 'ingredients')}</div>
            </div>
          </div>
          <div style={{ height: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px', borderBottom: `1px solid ${VC.line2}` }}>
            <span style={{ fontSize: 13, color: VC.ink2 }}>{L('Comensales', 'Servings')}</span>
            <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${VC.line}`, borderRadius: 9, height: 34 }}>
              <span style={{ width: 36, textAlign: 'center', fontSize: 16, color: VC.ink2 }}>−</span>
              <span style={{ minWidth: 26, textAlign: 'center', fontFamily: VF.mono, fontSize: 14, fontWeight: 500,
                transform: `scale(${1 + 0.25 * Math.sin(Math.PI * vcl((T - flashAt) / 0.35))})` }}>{serv}</span>
              <span style={{ width: 36, textAlign: 'center', fontSize: 16, color: VC.ink2 }}>+</span>
            </div>
          </div>
          <div style={{ padding: '8px 14px', height: 205 }}>
            {items.map((it, i) => {
              const p = CATALOG[it.id];
              const ri = MOTION.enter(T, V + 6.8 + i * 0.09, 0.4);
              const changed = prev[i].qty !== it.qty && T >= flashAt && T < flashAt + 0.9;
              const flash = changed ? 1 - vcl((T - flashAt) / 0.9) : 0;
              return (
                <div key={it.id} style={{ height: 27, display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, opacity: ri, transform: `translateX(${(1 - ri) * -8}px)` }}>
                  <span style={{ fontSize: 15, width: 20, textAlign: 'center', opacity: added && T < A + 2.4 ? 0.25 : 1 }}>{p.emoji}</span>
                  <span style={{ flex: 1 }}>{p.name[lang]}</span>
                  {p.seasonal && <VPill><Icon name="leaf" size={9}/></VPill>}
                  <span style={{ fontFamily: VF.mono, fontSize: 12, padding: '1px 5px', borderRadius: 5,
                    background: `oklch(0.94 0.04 255 / ${flash})`, color: flash > 0.1 ? 'oklch(0.40 0.15 255)' : VC.ink3 }}>×{it.qty}</span>
                  <span style={{ fontSize: 11.5, color: VC.ink3, width: 62, textAlign: 'right', whiteSpace: 'nowrap' }}>{p.unit[lang]}</span>
                </div>
              );
            })}
          </div>
          <div style={{ height: 60, display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', borderTop: `1px solid ${VC.line2}`, background: VC.sunk }}>
            <div style={{ flex: 1 }}>
              <div style={{ ...upLabel, fontSize: 10.5 }}>{L('Coste estimado', 'Est. cost')}</div>
              <div style={{ fontFamily: VF.serif, fontSize: 20, lineHeight: 1.1 }}>{eur(est)}</div>
            </div>
            <div style={{ height: 40, padding: '0 15px', borderRadius: 11, display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 500,
              background: added ? VC.sageSoft : VC.ink, color: added ? VC.sageInk : VC.bg, transform: `scale(${btnPress(A + 0.95)})` }}>
              <Icon name={added ? 'check' : 'plus'} size={12}/>{added ? L('Añadido', 'Added') : L('Añadir todo', 'Add all')}
            </div>
          </div>
        </div>
      </div>
      {/* Input */}
      <div style={{ ...abs(12, 690, 366, 54), borderRadius: 16, border: `1px solid ${listen > 0.5 ? 'oklch(0.85 0.05 255)' : VC.line}`,
        background: listen > 0.5 ? 'oklch(0.97 0.015 255)' : VC.panel, display: 'flex', alignItems: 'center', gap: 10, padding: '0 6px 0 14px' }}>
        {listen > 0.5 ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, height: 20 }}>
              {[0, 1, 2, 3, 4].map(k => <span key={k} style={{ width: 3, height: 20, borderRadius: 2, background: VC.accent,
                transform: `scaleY(${0.3 + 0.7 * Math.abs(Math.sin(T * 7 + k * 0.9))})` }}></span>)}
            </div>
            <div style={{ flex: 1, fontSize: 15, color: typed ? VC.ink : VC.ink3 }}>{typed || L('Escuchando…', 'Listening…')}</div>
            <div style={{ width: 42, height: 42, borderRadius: 13, background: VC.accent, display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 0 0 ${6 + 5 * Math.sin(T * 6)}px oklch(0.55 0.15 255 / 0.15)` }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, background: '#fff' }}></span>
            </div>
          </>
        ) : (
          <>
            <div style={{ flex: 1, fontSize: 14.5, color: VC.ink3 }}>{L('Pide un plato o dicta tu lista', 'Name a dish or dictate your list')}</div>
            <div style={{ width: 42, height: 42, borderRadius: 13, background: VC.ink, color: VC.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
              transform: `scale(${btnPress(V + 1.5)})` }}><Icon name="mic" size={18}/></div>
          </>
        )}
      </div>
      <VFly T={T} A={A} to={fly}/>
    </>
  );
}
function VAvatar() {
  return <div style={{ width: 28, height: 28, borderRadius: 9, background: VC.accentSoft, color: 'oklch(0.40 0.15 255)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="sparkle" size={13}/></div>;
}
// Ingredient emojis arc from the card down into the Basket tab.
function VFly({ T, A, to = { x: VTAB_X[1], y: 772 } }) {
  return VBASKET.map((b, i) => {
    const s = A + 1.1 + i * 0.08;
    const p = MOTION.glide(T, s, 0.75);
    if (T < s || p >= 1) return null;
    const x0 = 72, y0 = 176 + 32 + 110 + 8 + i * 27 + 13;
    const x = vmix(x0, to.x, p), y = vmix(y0, to.y, p) - (to.arc || 90) * Math.sin(Math.PI * p);
    return <div key={b.id} style={{ position: 'absolute', left: x - 16, top: y - 16, width: 32, height: 32, borderRadius: 16,
      background: VC.panel, border: `1px solid ${VC.line}`, boxShadow: '0 6px 16px oklch(0.2 0.01 60 / 0.15)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17,
      transform: `scale(${1 - 0.45 * p})`, opacity: 1 - vcl((p - 0.85) / 0.15) }}>{CATALOG[b.id].emoji}</div>;
  });
}
function VToast({ T, K, lang, y = 684 }) {
  const L = (es, en) => lang === 'es' ? es : en;
  const o = win(T, K.Add + 2.2, K.Add + 4.6, 0.3);
  if (o <= 0) return null;
  return (
    <div style={{ ...abs(12, y, 366, 58), opacity: o, transform: `translateY(${(1 - o) * 14}px)`, borderRadius: 16, background: VC.ink, color: VC.bg,
      display: 'flex', alignItems: 'center', gap: 11, padding: '0 10px 0 16px', boxShadow: '0 12px 30px oklch(0.2 0.01 60 / 0.25)' }}>
      <Icon name="check" size={14}/>
      <div style={{ flex: 1, lineHeight: 1.3 }}>
        <div style={{ fontSize: 13.5, fontWeight: 500 }}>{L(`${VCOUNT} añadidos a la cesta`, `${VCOUNT} added to basket`)}</div>
        <div style={{ fontSize: 12, opacity: 0.7 }}>{L('Mejor en', 'Best at')} {VWSTORE.name} · {eur(VWIN.total)}</div>
      </div>
      <span style={{ fontSize: 12.5, textDecoration: 'underline', textUnderlineOffset: 3, padding: '0 6px' }}>{L('Deshacer', 'Undo')}</span>
      <span style={{ padding: '8px 12px', borderRadius: 10, background: 'oklch(1 0 0 / 0.14)', fontSize: 12.5, fontWeight: 500 }}>{L('Ver', 'View')}</span>
    </div>
  );
}

function VPaneEmpty({ T, show, title, sub, calc, calcText }) {
  if (show <= 0.001) return null;
  return (
    <div style={{ ...abs(0, 105, 390, 649), opacity: show, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 8, zIndex: 1 }}>
      {calc ? (
        <>
          <span style={{ width: 26, height: 26, borderRadius: 13, border: `2.5px solid ${VC.line}`, borderTopColor: VC.accent, transform: `rotate(${T * 540}deg)` }}></span>
          <div style={{ fontSize: 14, color: VC.ink2, marginTop: 6 }}>{calcText}</div>
        </>
      ) : (
        <>
          <div style={{ fontFamily: VF.serif, fontSize: 26 }}>{title}</div>
          <div style={{ fontSize: 13.5, color: VC.ink3 }}>{sub}</div>
        </>
      )}
    </div>
  );
}

// ─── Compare screen ─────────────────────────────────────────────────
function VCompare({ T, K, lang, desk }) {
  const L = (es, en) => lang === 'es' ? es : en;
  const Cm = K.Compare;
  const ce = MOTION.enter(T, Cm + 1.0, 0.5);
  const dp = MOTION.glide(T, Cm + 1.3, 1.3);
  const savings = VWORST.total - VWIN.total;
  const circ = 2 * Math.PI * 34;
  return (
    <>
      {desk && <VPaneEmpty T={T} show={1 - MOTION.enter(T, Cm + 1.0, 0.3)} calc={T >= K.Add + 1.9}
        title={L('Aún no hay productos', 'No products yet')} sub={L('Pide un plato para comparar precios.', 'Ask for a dish to compare prices.')}
        calcText={L('Comparando 7 supers…', 'Comparing 7 stores…')}/>}
      <VTopBar title={L('Comparar', 'Compare')} sub={desk && T < Cm + 1.0 ? L('7 supers en tu zona', '7 stores near you') : <>{L('Mejor cesta en', 'Best basket in')} <b style={{ color: VC.ink2, fontWeight: 500 }}>{VWSTORE.name}</b></>} right={!desk && <div style={{ display: 'flex', alignItems: 'center', gap: 6, height: 34, padding: '0 12px', borderRadius: 12, border: `1px solid ${VC.line}`, background: VC.panel, fontSize: 13, fontWeight: 600 }}><BasketGlyph size={16}/>{VCOUNT}</div>}/>
      <div style={{ ...abs(16, 118, 358, 226), borderRadius: 18, border: `1px solid ${VC.line}`, overflow: 'hidden', padding: 16,
        background: `radial-gradient(320px 150px at 100% 0%, oklch(0.95 0.04 ${VWSTORE.hue}), ${VC.panel} 70%)`,
        opacity: ce, transform: `translateY(${(1 - ce) * 18}px)` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <VMark store={VWSTORE} size={40}/>
          <div style={{ flex: 1, whiteSpace: 'nowrap' }}>
            <div style={{ fontSize: 10.5, color: VC.sage, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{L('Mejor cesta', 'Best basket')}</div>
            <div style={{ fontWeight: 600, fontSize: 18, lineHeight: 1.15 }}>{VWSTORE.name}</div>
            <div style={{ fontSize: 12, color: VC.ink3 }}>{VWSTORE.eta} · {VWIN.ship === 0 ? L('Envío gratis', 'Free delivery') : `+${eur(VWIN.ship)} ${L('envío', 'delivery')}`}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 14 }}>
          <div style={{ position: 'relative', width: 80, height: 80 }}>
            <svg width="80" height="80" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" fill="none" stroke={VC.line} strokeWidth="6"></circle>
              <circle cx="40" cy="40" r="34" fill="none" stroke={VC.sage} strokeWidth="6" strokeLinecap="round"
                strokeDasharray={`${circ * Math.min(1, savings / 30) * dp} ${circ}`} transform="rotate(-90 40 40)"></circle>
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontFamily: VF.serif, fontSize: 18, color: VC.sage, lineHeight: 1 }}>{(savings * dp).toFixed(2).replace('.', ',')}€</div>
              <div style={{ fontSize: 9, color: VC.ink3, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 3 }}>{L('ahorras', 'saved')}</div>
            </div>
          </div>
          <div>
            <div style={upLabel}>Total</div>
            <div style={{ fontFamily: VF.serif, fontSize: 50, lineHeight: 1, letterSpacing: '-0.02em' }}>
              {(VWIN.total * dp).toFixed(2).replace('.', ',')}<span style={{ fontSize: 26, color: VC.ink2, marginLeft: 3 }}>€</span></div>
            <div style={{ fontSize: 12, color: VC.ink3, marginTop: 4 }}>{eur(VAVG - VWIN.total)} {L('menos que la media', 'below average')}</div>
          </div>
        </div>
      </div>
      <div style={{ ...abs(18, 360, 200, 16), ...upLabel, opacity: desk ? ce : 1 }}>{L('Los 7 supers', 'All 7 stores')}</div>
      {VTOT0.map((s, i) => {
        const st = STORES.find(x => x.id === s.id);
        const isW = i === 0;
        const re = MOTION.enter(T, Cm + 1.8 + i * 0.14, 0.45);
        return (
          <div key={s.id} style={{ ...abs(16, 384 + i * 53, 358, 47), borderRadius: 12, display: 'flex', alignItems: 'center', gap: 11, padding: '0 13px',
            background: isW ? VC.panel : VC.sunk, border: `1px solid ${isW ? VC.ink : VC.line2}`, opacity: re, transform: `translateX(${(1 - re) * 24}px)` }}>
            <span style={{ fontFamily: VF.mono, fontSize: 10.5, color: VC.ink3, width: 16 }}>#{i + 1}</span>
            <VMark store={st} size={28}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: isW ? 600 : 500 }}>{st.name}</div>
              <div style={{ fontSize: 11, color: VC.ink3 }}>{st.eta} · {s.ship === 0 ? L('Envío gratis', 'Free delivery') : `+${eur(s.ship)}`}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: VF.serif, fontSize: 21, lineHeight: 1, color: isW ? VC.ink : VC.ink2 }}>{eur(s.total)}</div>
              <div style={{ fontFamily: VF.mono, fontSize: 10.5, marginTop: 3, color: isW ? VC.sage : VC.red }}>{isW ? L('mejor', 'best') : '+' + eur(s.total - VWIN.total)}</div>
            </div>
          </div>
        );
      })}
    </>
  );
}

// ─── Basket screen ──────────────────────────────────────────────────
function VBasket({ T, K, lang, revealAt = -Infinity }) {
  const L = (es, en) => lang === 'es' ? es : en;
  const Sw = K.Swap;
  const applied = T >= Sw + 2.5;
  const tp = MOTION.glide(T, Sw + 2.5, 1.0);
  const total = vmix(VWIN.total, VWIN1.total, tp);
  const save = VWIN.total - VWIN1.total;
  const press = 1 - 0.06 * Math.sin(Math.PI * vcl((T - (Sw + 2.4)) / 0.3));
  const pressCk = 1 - 0.05 * Math.sin(Math.PI * vcl((T - (K.Checkout + 0.7)) / 0.3));
  return (
    <>
      {isFinite(revealAt) && <VPaneEmpty T={T} show={1 - MOTION.enter(T, revealAt, 0.3)} title={L('Cesta vacía', 'Empty basket')} sub={L('Pide algo al concierge.', 'Ask the concierge for something.')}/>}
      <VTopBar title={L('Cesta', 'Basket')} sub={T >= revealAt ? `${VCOUNT} ${L('productos', 'items')}` : `0 ${L('productos', 'items')}`}/>
      <div style={{ ...abs(16, 116, 358, 96), opacity: MOTION.enter(T, revealAt + 0.5, 0.4), borderRadius: 16, border: `1px solid oklch(0.86 0.05 150)`, background: VC.sageSoft,
        display: 'flex', alignItems: 'center', gap: 12, padding: '0 14px 0 16px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10.5, color: VC.sageInk, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{L('Marca blanca', 'Store brand')}</div>
          <div style={{ fontFamily: VF.serif, fontSize: 24, lineHeight: 1.1, marginTop: 3, color: VC.ink }}>
            {applied ? L(`Ahorras ${eur(save)}`, `You save ${eur(save)}`) : L(`Ahorra ${eur(save)}`, `Save ${eur(save)}`)}</div>
          <div style={{ fontSize: 12, color: VC.ink2, marginTop: 2 }}>{VSUBS.length} {L('cambios · mismo producto', 'swaps · same product')}</div>
        </div>
        <div style={{ height: 40, padding: '0 14px', borderRadius: 11, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500,
          background: applied ? VC.panel : VC.ink, color: applied ? VC.sageInk : VC.bg, transform: `scale(${press})` }}>
          {applied && <Icon name="check" size={12}/>}{applied ? L('Aplicado', 'Applied') : L('Aplicar todo', 'Apply all')}
        </div>
      </div>
      {VBASKET.map((b, i) => {
        const p = CATALOG[b.id];
        const sub = applied && vwl(p.id);
        const flip = sub ? MOTION.pop(T, Sw + 2.5 + i * 0.05, 0.4) : 0;
        const price = p.prices[VWIN.id] * b.qty * (vwl(p.id) ? vmix(1, 0.88, tp) : 1);
        return (
          <div key={b.id} style={{ ...abs(16, 226 + i * 52, 358, 52), opacity: MOTION.enter(T, revealAt + i * 0.08, 0.35), display: 'flex', alignItems: 'center', gap: 11, borderBottom: `1px solid ${VC.line2}` }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: VC.sunk, border: `1px solid ${VC.line2}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19 }}>{p.emoji}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 500 }}>{sub ? vwl(p.id).name[lang] : p.name[lang]}</span>
                {sub && <span style={{ transform: `scale(${flip})`, display: 'inline-flex' }}><VPill><Icon name="check" size={9}/></VPill></span>}
              </div>
              <div style={{ fontSize: 11.5, color: VC.ink3, marginTop: 1 }}><span style={{ fontFamily: VF.mono }}>{p.unit[lang]}</span> · ×{b.qty}</div>
            </div>
            <div style={{ fontFamily: VF.serif, fontSize: 18, color: sub ? VC.sageInk : VC.ink }}>{eur(price)}</div>
          </div>
        );
      })}
      <div style={{ ...abs(16, 676, 358, 52), opacity: MOTION.enter(T, revealAt + 0.6, 0.4), borderRadius: 14, background: VC.ink, color: VC.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        fontSize: 14, fontWeight: 500, boxShadow: '0 10px 24px oklch(0.2 0.01 60 / 0.18)', transform: `scale(${pressCk})` }}>
        {L('Revisar', 'Checkout')} · {eur(total)} <Icon name="arrow" size={13}/>
      </div>
    </>
  );
}

// ─── Checkout sheet ─────────────────────────────────────────────────
function VSheet({ T, K, lang, modal }) {
  const L = (es, en) => lang === 'es' ? es : en;
  const Ck = K.Checkout;
  const p = MOTION.enter(T, Ck + 0.8, 0.55) * (1 - MOTION.glide(T, Ck + 5.3, 0.5));
  if (p <= 0.001) return null;
  const opening = T >= Ck + 3.4, done = T >= Ck + 4.3;
  const press = 1 - 0.05 * Math.sin(Math.PI * vcl((T - (Ck + 3.3)) / 0.3));
  const dom = vDomain(VWSTORE);
  return (
    <div style={{ ...abs(0, 0, 390, modal ? 470 : 844) }}>
      {!modal && <div style={{ position: 'absolute', inset: 0, background: `oklch(0.20 0.01 60 / ${0.45 * p})` }}></div>}
      <div style={modal
        ? { ...abs(0, 0, 390, 470), background: VC.panel, borderRadius: 22, opacity: p, transform: `translateY(${(1 - p) * 30}px) scale(${0.96 + 0.04 * p})`, padding: '0 20px', boxShadow: '0 30px 80px oklch(0.2 0.01 60 / 0.3)' }
        : { ...abs(0, 236, 390, 620), background: VC.panel, borderRadius: '24px 24px 0 0', transform: `translateY(${(1 - p) * 620}px)`, padding: '0 20px' }}>
        <div style={{ width: 40, height: 5, borderRadius: 3, background: VC.line, margin: '9px auto 0' }}></div>
        <div style={{ ...upLabel, marginTop: 16 }}>{L('Carrito listo', 'Cart ready')}</div>
        <div style={{ fontFamily: VF.serif, fontSize: 32, lineHeight: 1.1, marginTop: 3 }}>{L('Abriendo en ', 'Opening in ')}<i>{VWSTORE.name}</i></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', marginTop: 16 }}>
          <div><div style={upLabel}>Total</div><div style={{ fontFamily: VF.serif, fontSize: 30 }}>{eur(VWIN1.total)}</div></div>
          <div><div style={upLabel}>{L('Ahorro', 'Savings')}</div><div style={{ fontFamily: VF.serif, fontSize: 30, color: VC.sage }}>{eur(VAVG - VWIN1.total)}</div></div>
        </div>
        <div style={{ marginTop: 14, border: `1px solid ${VC.line}`, borderRadius: 12, overflow: 'hidden', background: VC.sunk }}>
          <div style={{ padding: '8px 12px', borderBottom: `1px solid ${VC.line2}`, background: VC.panel, fontFamily: VF.mono, fontSize: 11, color: VC.ink3 }}>{dom}/cart?list=4f2a</div>
          <div style={{ padding: '8px 12px' }}>
            {VBASKET.slice(0, 4).map(b => {
              const c = CATALOG[b.id];
              return <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, height: 22, color: VC.ink2 }}>
                <span>{c.emoji}</span><span style={{ flex: 1 }}>{vwl(c.id) ? vwl(c.id).name[lang] : c.name[lang]} <span style={{ fontFamily: VF.mono, color: VC.ink3 }}>×{b.qty}</span></span>
                <span style={{ fontFamily: VF.mono, color: VC.ink }}>{eur(c.prices[VWIN.id] * b.qty * (vwl(c.id) ? 0.88 : 1))}</span></div>;
            })}
            <div style={{ fontSize: 12, color: VC.ink3, height: 20 }}>+ {VBASKET.length - 4} {L('más', 'more')}</div>
          </div>
        </div>
        <div style={{ marginTop: 14, height: 52, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, fontSize: 14.5, fontWeight: 500,
          background: done ? VC.sage : VC.ink, color: VC.bg, transform: `scale(${press})` }}>
          {done ? <><Icon name="check" size={14}/>{L('Carrito abierto', 'Cart opened')}</>
            : opening ? <><span style={{ width: 14, height: 14, borderRadius: 7, border: '2px solid oklch(1 0 0 / 0.3)', borderTopColor: '#fff', transform: `rotate(${T * 720}deg)` }}></span>{L(`Abriendo ${dom}…`, `Opening ${dom}…`)}</>
            : <><Icon name="cart" size={14}/>{L('Abrir carrito en ', 'Open cart in ')}{VWSTORE.name}<Icon name="arrow" size={13}/></>}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 9 }}>
          {[['pdf', 'PDF'], ['wa', 'WhatsApp']].map(([ic, t]) => (
            <div key={ic} style={{ height: 42, borderRadius: 12, border: `1px solid ${VC.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontSize: 13, color: VC.ink2 }}>
              <Icon name={ic} size={13}/>{t}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── You screen ─────────────────────────────────────────────────────
function VYou({ T, K, lang }) {
  const L = (es, en) => lang === 'es' ? es : en;
  const Al = K.Alerts;
  const on = MOTION.glide(T, Al + 2.05, 0.25);
  const ex = MOTION.enter(T, Al + 2.15, 0.45);
  const thr = T >= Al + 3.6 ? 7 : 8;
  const bump = 1 + 0.25 * Math.sin(Math.PI * vcl((T - (Al + 3.6)) / 0.35));
  const toggle = (v) => (
    <div style={{ width: 46, height: 28, borderRadius: 14, padding: 3, background: v > 0.5 ? VC.sage : VC.line, position: 'relative' }}>
      <span style={{ position: 'absolute', top: 3, left: 3 + 18 * v, width: 22, height: 22, borderRadius: 11, background: '#fff', boxShadow: '0 1px 3px oklch(0.2 0 0 / .25)' }}></span>
    </div>
  );
  const stepper = (val, s = 1) => (
    <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${VC.line}`, borderRadius: 9, background: VC.panel, height: 34 }}>
      <span style={{ width: 32, textAlign: 'center', fontSize: 16, color: VC.ink2 }}>−</span>
      <span style={{ minWidth: 42, textAlign: 'center', fontFamily: VF.mono, fontSize: 13, fontWeight: 500, transform: `scale(${s})` }}>{val} €</span>
      <span style={{ width: 32, textAlign: 'center', fontSize: 16, color: VC.ink2 }}>+</span>
    </div>
  );
  return (
    <>
      <VTopBar title={L('Tú', 'You')} sub={L('Preferencias y alertas', 'Preferences and alerts')}/>
      <div style={{ ...abs(16, 116, 358, 84), borderRadius: 16, background: VC.panel, border: `1px solid ${VC.line2}`, padding: '12px 16px' }}>
        <div style={{ ...upLabel, display: 'flex', alignItems: 'center', gap: 7 }}><Icon name="memory" size={13}/>{L('Memoria', 'Memory')}</div>
        <div style={{ fontSize: 13.5, marginTop: 7 }}>· {L('Prefieres precio sobre marca', 'You prefer price over brand')}</div>
        <div style={{ fontSize: 13.5, marginTop: 3 }}>· {L('Cocinas para 6 los domingos', 'You cook for 6 on Sundays')}</div>
      </div>
      <div style={{ ...abs(16, 212, 358, 196 + 50 * ex), borderRadius: 16, background: VC.panel, border: `1px solid ${VC.line2}`, overflow: 'hidden' }}>
        <div style={{ ...upLabel, position: 'absolute', left: 16, top: 14, display: 'flex', alignItems: 'center', gap: 7 }}><Icon name="bell" size={13}/>{L('Alertas de precio', 'Price alerts')}</div>
        <div style={{ ...abs(12, 40, 334, 52 + 50 * ex), borderRadius: 12, background: VC.sunk, border: `1px solid ${VC.line2}`, overflow: 'hidden' }}>
          <div style={{ height: 52, display: 'flex', alignItems: 'center', gap: 10, padding: '0 10px 0 12px', opacity: 0.6 + 0.4 * on }}>
            <span style={{ fontSize: 20 }}>{CATALOG.aceite.emoji}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{CATALOG.aceite.name[lang]}</div>
              <div style={{ fontSize: 11.5, color: VC.sage }}>↓ {L('5% hoy', '5% today')}</div>
            </div>
            {toggle(on)}
          </div>
          <div style={{ height: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 10px 0 12px', borderTop: `1px solid ${VC.line2}`, opacity: ex }}>
            <span style={{ fontSize: 12.5, color: VC.ink2 }}>{L('Avisarme por debajo de', 'Alert me under')}</span>
            {stepper(thr, bump)}
          </div>
        </div>
        <div style={{ ...abs(12, 102 + 50 * ex, 334, 102), borderRadius: 12, background: VC.sunk, border: `1px solid ${VC.line2}` }}>
          <div style={{ height: 52, display: 'flex', alignItems: 'center', gap: 10, padding: '0 10px 0 12px' }}>
            <span style={{ fontSize: 20 }}>{CATALOG.cafe.emoji}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{CATALOG.cafe.name[lang]}</div>
              <div style={{ fontSize: 11.5, color: VC.red }}>↑ {L('8% este mes', '8% this month')}</div>
            </div>
            {toggle(1)}
          </div>
          <div style={{ height: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 10px 0 12px', borderTop: `1px solid ${VC.line2}` }}>
            <span style={{ fontSize: 12.5, color: VC.ink2 }}>{L('Avisarme por debajo de', 'Alert me under')}</span>
            {stepper(12)}
          </div>
        </div>
      </div>
    </>
  );
}

Object.assign(window, { VPaneEmpty, BasketGlyph, VMark, VWSTORE, VC, VF, MOTION, vtrack, vcl, vmix, win, VStatus, VTabBar, VChat, VToast, VCompare, VBasket, VSheet, VYou, VCOUNT, VTAB_X, VTopBar, VPill, abs, upLabel });
