// Bonus scene for the intro videos: weekly menu → photo list → split basket → order tracking.
// Pure function of T. Screen coords 390×844 (content 47..754). X = start of the Extras scene.
const VX_SEG = 2.25;
const VX_MENU = ['paella', 'tortilla', 'pastatomate', 'ensalada'];
const VX_MENU_LIST = (() => {
  const acc = {}, uses = {};
  VX_MENU.forEach(r => RECIPES[r].ingredients.forEach(i => { acc[i.id] = (acc[i.id] || 0) + i.per * 4; uses[i.id] = (uses[i.id] || 0) + 1; }));
  const items = Object.entries(acc).map(([id, q]) => ({ id, qty: Math.max(1, Math.ceil(q)), shared: uses[id] > 1 }));
  const cost = items.reduce((s, i) => s + Math.min(...Object.values(CATALOG[i.id].prices)) * i.qty, 0);
  return { items, cost, budget: Math.ceil((cost + 4) / 10) * 10 };
})();
const VX_PHOTO = [['leche', 'leche', 0.98], ['pan', '2 barras pan', 0.95], ['huevos', 'huevos', 0.97], ['tomate', 'tomat', 0.61], ['yogur', 'yogures x2', 0.92]];
const VX_SPLIT = (() => {
  const single = (bk) => Math.min(...STORES.filter(s => !missingAt(s.id, bk).length).map(s => { const it = bk.reduce((t, b) => t + itemCost(b, s.id, []), 0); return it + (it >= s.minFree ? 0 : s.delivery); }));
  const cands = [ORDERS_SEED[0].items, ORDERS_SEED[1].items, VX_MENU_LIST.items, [...ORDERS_SEED[0].items, { id: 'aceite', qty: 2 }, { id: 'detergente', qty: 3 }, { id: 'pasta', qty: 4 }]];
  return cands.map(bk => { const sp = bestSplit(bk, []); return sp && { bk, sp, save: single(bk) - sp.total }; }).filter(Boolean).sort((a, b) => b.save - a.save)[0];
})();

function VExtras({ T, X, lang }) {
  const L = (es, en) => lang === 'es' ? es : en;
  const seg = (i) => X + i * VX_SEG;
  const vis = (i) => i === 3 ? MOTION.enter(T, seg(3), 0.25) : win(T, seg(i), seg(i + 1), 0.25);
  const layer = (i, el) => { const o = vis(i); return o > 0.001 && <div style={{ position: 'absolute', inset: 0, opacity: o, background: VC.bg }}>{el}</div>; };
  const card = { borderRadius: 14, background: VC.panel, border: `1px solid ${VC.line2}` };
  // 0 — weekly menu
  const t0 = seg(0), fill = MOTION.glide(T, t0 + 0.7, 0.9) * (VX_MENU_LIST.cost / VX_MENU_LIST.budget);
  const days = L(['Lun', 'Mar', 'Mié', 'Jue'], ['Mon', 'Tue', 'Wed', 'Thu']);
  // 1 — photo
  const t1 = seg(1), scanP = vcl((T - t1 - 0.2) / 0.9), scanOn = T > t1 + 0.15 && T < t1 + 1.15;
  // 2 — split
  const t2 = seg(2), sp = VX_SPLIT;
  // 3 — tracking
  const t3 = seg(3), step = Math.max(0, Math.min(3, Math.floor((T - t3 - 0.35) / 0.6)));
  const steps = [L('Pedido confirmado', 'Order confirmed'), L('Preparando tu cesta', 'Picking your basket'), L('En reparto', 'Out for delivery'), L('Entregado', 'Delivered')];
  const trackStore = STORES.find(s => s.id === 'dia');
  return (
    <>
      {layer(0, <>
        <VTopBar title={L('Menú semanal', 'Weekly menu')} sub={L('4 platos · 4 comensales', '4 dishes · 4 servings')}/>
        {VX_MENU.map((r, i) => {
          const p = MOTION.pop(T, t0 + 0.15 + i * 0.12);
          return (
            <div key={r} style={{ ...abs(16 + (i % 2) * 187, 120 + Math.floor(i / 2) * 76, 171, 64), ...card, background: VC.sunk, padding: '10px 12px', opacity: vcl(p * 1.4), transform: `scale(${0.9 + 0.1 * p})` }}>
              <div style={{ fontFamily: VF.mono, fontSize: 11, color: VC.ink3 }}>{days[i]}</div>
              <div style={{ fontSize: 13.5, fontWeight: 500, marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{RECIPES[r].emoji} {RECIPES[r].name[lang]}</div>
            </div>
          );
        })}
        <div style={{ ...abs(16, 284, 358, 104), ...card, padding: '14px 16px', background: VC.sageSoft, border: 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: 13, color: VC.sageInk, fontWeight: 500 }}>{L('Presupuesto', 'Budget')} {VX_MENU_LIST.budget} €</span>
            <span style={{ fontFamily: VF.serif, fontSize: 28 }}>~{eur(VX_MENU_LIST.cost * MOTION.glide(T, t0 + 0.7, 0.9))}</span>
          </div>
          <div style={{ height: 8, borderRadius: 4, background: 'oklch(1 0 0 / 0.7)', marginTop: 10, overflow: 'hidden' }}><div style={{ height: '100%', width: `${fill * 100}%`, background: VC.sage }}></div></div>
          <div style={{ fontSize: 12, color: VC.sageInk, marginTop: 8, opacity: MOTION.enter(T, t0 + 1.5, 0.3) }}>{L(`Te sobran ${eur(VX_MENU_LIST.budget - VX_MENU_LIST.cost)}`, `${eur(VX_MENU_LIST.budget - VX_MENU_LIST.cost)} under budget`)}</div>
        </div>
        {VX_MENU_LIST.items.filter(i => i.shared).slice(0, 4).map((it, i) => (
          <div key={it.id} style={{ ...abs(16, 404 + i * 46, 358, 40), display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${VC.line2}`, opacity: MOTION.enter(T, t0 + 1.1 + i * 0.1, 0.3) }}>
            <span style={{ fontSize: 17 }}>{CATALOG[it.id].emoji}</span>
            <span style={{ flex: 1, fontSize: 13.5 }}>{CATALOG[it.id].name[lang]}</span>
            <VPill tone="accent">{L('compartido', 'shared')}</VPill>
            <span style={{ fontFamily: VF.mono, fontSize: 12, color: VC.ink3 }}>×{it.qty}</span>
          </div>
        ))}
      </>)}
      {layer(1, <>
        <VTopBar title={L('Foto de lista', 'Photo of list')} sub={T < t1 + 1.15 ? L('Leyendo…', 'Reading…') : L('He leído 5 productos', 'I read 5 items')}/>
        <div style={{ ...abs(16, 118, 358, 232), borderRadius: 14, overflow: 'hidden', background: 'oklch(0.97 0.02 90)', border: `1px solid ${VC.line}` }}>
          <div style={{ padding: '14px 26px', fontFamily: "'Caveat', 'Segoe Print', cursive", fontSize: 27, lineHeight: '40px', color: 'oklch(0.32 0.04 260)', transform: 'rotate(-1.5deg)' }}>
            {VX_PHOTO.map(([, raw]) => <div key={raw}>– {raw}</div>)}
          </div>
          {scanOn && <div style={{ position: 'absolute', left: 0, right: 0, top: 4 + scanP * 220, height: 3, background: VC.accent, boxShadow: '0 0 18px 6px oklch(0.55 0.18 255 / 0.35)' }}></div>}
        </div>
        {VX_PHOTO.map(([id, raw, c], i) => {
          const o = MOTION.enter(T, t1 + 1.15 + i * 0.09, 0.3);
          return (
            <div key={id} style={{ ...abs(16, 366 + i * 50, 358, 44), display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${VC.line2}`, opacity: o, transform: `translateY(${(1 - o) * 8}px)` }}>
              <span style={{ width: 18, height: 18, borderRadius: 4, background: VC.ink, color: VC.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="check" size={11}/></span>
              <span style={{ fontSize: 17 }}>{CATALOG[id].emoji}</span>
              <span style={{ flex: 1 }}>
                <span style={{ display: 'block', fontSize: 13.5, fontWeight: 500 }}>{CATALOG[id].name[lang]}</span>
                <span style={{ display: 'block', fontSize: 11, color: c < 0.75 ? 'oklch(0.45 0.12 45)' : VC.ink3 }}>“{raw}”{c < 0.75 ? L(' · revisa', ' · check') : ''}</span>
              </span>
              {c < 0.75 && <span style={{ padding: '2px 8px', borderRadius: 999, background: 'oklch(0.94 0.05 55)', color: 'oklch(0.42 0.12 45)', fontSize: 11, fontWeight: 500 }}>{Math.round(c * 100)}%</span>}
            </div>
          );
        })}
      </>)}
      {layer(2, sp && <>
        <VTopBar title={L('Divide la cesta', 'Split basket')} sub={L('Cada producto donde sale más barato', 'Each item where it’s cheapest')}/>
        {sp.sp.parts.map((part, i) => {
          const st = STORES.find(s => s.id === part.id);
          const p = MOTION.enter(T, t2 + 0.15 + i * 0.25, 0.45);
          return (
            <div key={part.id} style={{ ...abs(16, 120 + i * 150, 358, 136), ...card, padding: '12px 14px', opacity: p, transform: `translateX(${(1 - p) * (i ? 40 : -40)}px)` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <VMark store={st} size={30}/>
                <span style={{ flex: 1, fontSize: 15, fontWeight: 600 }}>{st.name}</span>
                <span style={{ fontFamily: VF.serif, fontSize: 26 }}>{eur(part.total)}</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 10 }}>
                {part.lines.slice(0, 9).map(b => <span key={b.id} style={{ width: 32, height: 32, borderRadius: 9, background: VC.sunk, fontSize: 17, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{CATALOG[b.id].emoji}</span>)}
              </div>
              <div style={{ fontSize: 11.5, color: VC.ink3, marginTop: 8 }}>{part.lines.length} {part.lines.length === 1 ? L('producto', 'item') : L('productos', 'items')} · {part.shipping === 0 ? L('envío gratis', 'free delivery') : `${eur(part.shipping)} ${L('envío', 'delivery')}`}</div>
            </div>
          );
        })}
        <div style={{ ...abs(16, 424, 358, 64), borderRadius: 14, background: sp.save > 0 ? VC.sageSoft : VC.sunk, display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px', opacity: MOTION.enter(T, t2 + 0.9, 0.35), transform: `scale(${0.94 + 0.06 * MOTION.pop(T, t2 + 0.9)})` }}>
          <span style={{ color: VC.sageInk }}><Icon name="split" size={20}/></span>
          <span style={{ flex: 1, fontSize: 13.5, color: VC.sageInk, fontWeight: 500 }}>
            {sp.save > 0 ? L(`${eur(sp.save)} menos que en un solo súper`, `${eur(sp.save)} less than one store`) : L('Hoy no compensa, y te lo digo', 'Not worth it today, and I say so')}
          </span>
        </div>
      </>)}
      {layer(3, <>
        <VTopBar title={L('Tu pedido', 'Your order')} sub={L('Mañana 18:00–20:00', 'Tomorrow 18:00–20:00')}/>
        <div style={{ ...abs(16, 120, 358, 66), ...card, background: VC.sunk, display: 'flex', alignItems: 'center', gap: 12, padding: '0 14px' }}>
          <VMark store={trackStore} size={34}/>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{trackStore.name}</div>
            <div style={{ fontSize: 11.5, color: VC.ink3 }}>{VCOUNT} {L('productos', 'items')}</div>
          </div>
          <Icon name="truck" size={20}/>
        </div>
        {steps.map((s, i) => {
          const done = i < step || (i === 3 && step === 3), now = i === step && !done;
          return (
            <div key={i} style={{ ...abs(28, 212 + i * 64, 340, 64), display: 'flex', gap: 14 }}>
              <div style={{ position: 'relative', width: 24 }}>
                <span style={{ position: 'absolute', left: 0, top: 0, width: 24, height: 24, borderRadius: 12, background: done ? VC.sage : now ? VC.ink : VC.panel, border: `1.5px solid ${done || now ? 'transparent' : VC.line}`, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {done && <Icon name="check" size={12}/>}{now && <span style={{ width: 7, height: 7, borderRadius: 4, background: VC.bg }}></span>}
                </span>
                {i < 3 && <span style={{ position: 'absolute', left: 11, top: 27, width: 2, height: 34, background: done ? VC.sage : VC.line }}></span>}
              </div>
              <div style={{ paddingTop: 2 }}>
                <div style={{ fontSize: 14.5, fontWeight: now ? 600 : 500, color: i > step ? VC.ink3 : VC.ink }}>{s}</div>
                {now && i === 2 && <div style={{ fontSize: 12, color: VC.ink3, marginTop: 2 }}>{L('Llega en unos 12 min', 'Arriving in about 12 min')}</div>}
              </div>
            </div>
          );
        })}
      </>)}
    </>
  );
}
const VX_TAB = (T, X) => T >= X + 3 * VX_SEG ? 'you' : T >= X + 2 * VX_SEG ? 'compare' : 'chat';

const VX_CAPS = [
  ['Planea la semana', 'Plan the week', 'Un menú, una lista y un presupuesto.', 'One menu, one list, one budget.'],
  ['Fotografía tu lista', 'Snap your list', 'A mano o en un tique: la leo yo.', 'Handwritten or a receipt: I read it.'],
  ['Divide la cesta', 'Split the basket', 'Dos supers si sale más barato.', 'Two stores when it’s cheaper.'],
  ['Sigue tu pedido', 'Track your order', 'Elige franja y míralo llegar.', 'Pick a slot and watch it arrive.'],
];
function vxCaptions(X, lang, Outro, size = { num: 28, chip: 54, title: 96, sub: 34 }) {
  return VX_CAPS.map(([te, tn, se, sn], i) => ({
    at: X + i * VX_SEG + (i === 0 ? 0 : 0.1),
    until: i === 3 ? Outro : undefined,
    text: (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontFamily: VF.mono, fontSize: size.num, color: VC.sageInk, fontWeight: 500 }}>
          <span style={{ height: size.chip, padding: '0 20px', borderRadius: size.chip / 2, background: VC.sageSoft, display: 'flex', alignItems: 'center' }}>{lang === 'es' ? '+ Además' : '+ Plus'}</span>
          <span style={{ color: VC.ink3 }}>{i + 1} / 4</span>
        </div>
        <div style={{ fontFamily: VF.serif, fontSize: size.title, lineHeight: 1, letterSpacing: '-0.02em', marginTop: 22, color: VC.ink, textWrap: 'balance' }}>{lang === 'es' ? te : tn}</div>
        <div style={{ fontSize: size.sub, lineHeight: 1.35, color: VC.ink2, marginTop: 14 }}>{lang === 'es' ? se : sn}</div>
      </div>
    ),
  }));
}

Object.assign(window, { VExtras, VX_TAB, vxCaptions, VX_SEG });
