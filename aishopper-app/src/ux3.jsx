// UX round 3: out-of-stock rules, slot-aware pick, budget cap, delivery check + refunds,
// in-store mode, streamed thinking, fly-to-basket, larger text.

// ─── Out-of-stock rules ───
const OOS_RULES = {
  similar: { es:'Algo parecido', en:'Something similar', short:{ es:'Parecido', en:'Similar' } },
  skip:    { es:'Quitarlo', en:'Skip it', short:{ es:'Quitar', en:'Skip' } },
  ask:     { es:'Pregúntame', en:'Ask me', short:{ es:'Preguntar', en:'Ask' } },
};
// Brand-locked items never get silently swapped.
function oosRuleOf(profile, id) {
  const own = (profile.oosItem || {})[id];
  if (own) return own;
  if ((profile.lockBrand || []).includes(id)) return 'ask';
  return profile.oosRule || 'similar';
}
function oosSeg(on) { return { flex: 1, minHeight: 34, padding:'0 8px', borderRadius: 8, fontSize: 12, fontWeight: 500, background: on ? 'var(--ink)' : 'var(--bg-panel)', color: on ? 'var(--bg)' : 'var(--ink)', border:`1px solid ${on ? 'var(--ink)' : 'var(--line)'}` }; }

function OosItemRow({ id }) {
  const ctx = React.useContext(AppCtx); const lang = ctx.lang;
  const cur = oosRuleOf(ctx.profile, id);
  const set = (v) => ctx.updateProfile({ oosItem: { ...(ctx.profile.oosItem || {}), [id]: v } });
  return (
    <div>
      <div style={{ fontSize: 12, color:'var(--ink-3)', marginBottom: 5 }}>{L(lang, 'Si no lo tienen', 'If it’s out of stock')}</div>
      <div role="radiogroup" style={{ display:'flex', gap: 6 }}>
        {Object.entries(OOS_RULES).map(([k, r]) => <button key={k} role="radio" aria-checked={cur === k} onClick={() => set(k)} style={oosSeg(cur === k)}>{r.short[lang]}</button>)}
      </div>
    </div>
  );
}

function SubRulesCard({ basket }) {
  const ctx = React.useContext(AppCtx); const lang = ctx.lang; const p = ctx.profile;
  const def = p.oosRule || 'similar';
  const own = basket.filter(b => oosRuleOf(p, b.id) !== def);
  return (
    <div style={{ padding:'12px 14px', borderRadius: 12, border:'1px solid var(--line-2)', display:'flex', flexDirection:'column', gap: 8 }}>
      <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', gap: 8 }}>
        <div style={fxKicker}>{L(lang, 'Si falta algo', 'If something’s missing')}</div>
        <span style={{ fontSize: 12, color:'var(--ink-3)' }}>{L(lang, 'para todo el pedido', 'for the whole order')}</span>
      </div>
      <div role="radiogroup" style={{ display:'flex', gap: 6 }}>
        {Object.entries(OOS_RULES).map(([k, r]) => <button key={k} role="radio" aria-checked={def === k} onClick={() => ctx.updateProfile({ oosRule: k })} style={{ ...oosSeg(def === k), minHeight: 40 }}>{r[lang]}</button>)}
      </div>
      {own.length > 0 && (
        <div style={{ display:'flex', flexWrap:'wrap', gap: 6, alignItems:'center' }}>
          <span style={{ fontSize: 12, color:'var(--ink-3)' }}>{L(lang, 'Excepciones:', 'Exceptions:')}</span>
          {own.map(b => <span key={b.id} style={uxChip}><span aria-hidden="true">{CATALOG[b.id].emoji}</span>{CATALOG[b.id].name[lang]} · {OOS_RULES[oosRuleOf(p, b.id)].short[lang].toLowerCase()}</span>)}
        </div>
      )}
      <div style={{ fontSize: 12, color:'var(--ink-3)' }}>{L(lang, 'Cámbialo por producto desde la cesta. Las marcas fijas siempre te las pregunto.', 'Change it per item from the basket. I always ask about locked brands.')}</div>
    </div>
  );
}

// ─── Next delivery slot per store (demo) ───
const STORE_NEXT = { merc:{ day:1, time:0 }, carr:{ day:0, time:2 }, lidl:{ day:1, time:2 }, dia:{ day:0, time:3 }, eci:{ day:0, time:2 }, amz:{ day:0, time:3 }, sco:{ day:1, time:1 } };
function HeroSlotLine({ winner, storeTotals }) {
  const lang = React.useContext(AppCtx).lang;
  const n = STORE_NEXT[winner.id] || { day: 1, time: 0 };
  const today = n.day > 0 && storeTotals.find(s => s.id !== winner.id && (STORE_NEXT[s.id] || {}).day === 0 && !s.missing.length && s.total - winner.total <= winner.total * 0.1);
  const ts = today && STORES.find(s => s.id === today.id);
  return (
    <div style={{ position:'relative', display:'flex', flexDirection:'column', gap: 4 }}>
      <div style={{ display:'flex', alignItems:'center', gap: 6, fontSize: 13, fontWeight: 500 }}>
        <Icon name="truck" size={12}/>{L(lang, 'Primera entrega:', 'Earliest delivery:')} <span style={{ color: n.day === 0 ? 'var(--sage-ink)' : 'var(--ink)' }}>{SLOT_DAYS[n.day][lang].toLowerCase()} {SLOT_TIMES[n.time]}</span>
      </div>
      {ts && <div style={{ fontSize: 12, color:'var(--ink-3)' }}>{L(lang, `¿Lo necesitas hoy? ${ts.name} entrega a las ${SLOT_TIMES[STORE_NEXT[ts.id].time].slice(0, 5)} por ${eur(today.total - winner.total)} más.`, `Need it today? ${ts.name} delivers at ${SLOT_TIMES[STORE_NEXT[ts.id].time].slice(0, 5)} for ${eur(today.total - winner.total)} more.`)}</div>}
    </div>
  );
}

// ─── Budget cap ───
function BudgetBar() {
  const ctx = React.useContext(AppCtx); const lang = ctx.lang;
  const [edit, setEdit] = useState(false);
  const cap = ctx.profile.budget;
  const w = ctx.winner;
  if (!w) return null;
  const set = (v) => { ctx.updateProfile({ budget: v }); setEdit(false); };
  const picker = (
    <div style={{ display:'flex', flexWrap:'wrap', gap: 6, alignItems:'center' }}>
      {[40, 60, 80, 100, 120].map(v => <button key={v} aria-pressed={cap === v} onClick={() => set(v)} style={{ ...uxChip, minHeight: 34, padding:'0 12px', color: cap === v ? 'var(--bg)' : 'var(--ink)', background: cap === v ? 'var(--ink)' : 'var(--bg-panel)', borderColor: cap === v ? 'var(--ink)' : 'var(--line)' }}>{v} €</button>)}
      {cap && <button onClick={() => set(null)} style={{ fontSize: 12, color:'var(--danger-ink)', fontWeight: 500, minHeight: 34, padding:'0 6px' }}>{L(lang, 'Sin tope', 'No cap')}</button>}
    </div>
  );
  if (!cap) {
    return edit ? <div style={{ ...fxCard, padding:'10px 12px', display:'flex', flexDirection:'column', gap: 8 }}><div style={{ fontSize: 13, fontWeight: 500 }}>{L(lang, '¿Cuánto quieres gastar como máximo?', 'What’s the most you want to spend?')}</div>{picker}</div> : null;
  }
  const over = w.total - cap;
  const fill = Math.min(1, w.total / cap);
  const locked = ctx.profile.lockBrand || [];
  const subSave = ctx.basket.filter(b => CATALOG[b.id].whiteLabel && !ctx.appliedSubs.includes(b.id) && !locked.includes(b.id)).reduce((s, b) => s + CATALOG[b.id].whiteLabel.save * b.qty, 0);
  const loose = ctx.basket.filter(b => !(b.meals || []).length).map(b => ({ b, c: itemCost(b, w.id, ctx.appliedSubs) })).sort((a, z) => z.c - a.c)[0];
  const tone = over > 0 ? { bg:'var(--warn-soft)', line:'var(--warn-line)', ink:'var(--warn-ink)', bar:'oklch(0.62 0.14 45)' } : { bg:'var(--bg-panel)', line:'var(--line-2)', ink:'var(--ink-2)', bar:'var(--sage)' };
  return (
    <div style={{ padding:'10px 12px', borderRadius: 12, background: tone.bg, border:`1px solid ${tone.line}`, display:'flex', flexDirection:'column', gap: 8 }}>
      <div style={{ display:'flex', alignItems:'baseline', gap: 8 }}>
        <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: tone.ink }}>
          {over > 0 ? L(lang, `Te pasas ${eur(over)} de tu tope`, `${eur(over)} over your cap`) : L(lang, `Te quedan ${eur(-over)}`, `${eur(-over)} left`)}
        </span>
        <button onClick={() => setEdit(e => !e)} aria-expanded={edit} className="mono" style={{ fontSize: 12, color:'var(--ink-2)', minHeight: 28, padding:'0 4px' }}>{eur(w.total)} / {eur(cap)}</button>
      </div>
      <div role="progressbar" aria-valuemin={0} aria-valuemax={cap} aria-valuenow={Math.round(w.total)} style={{ height: 6, borderRadius: 3, background:'var(--bg-sunk)', overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${fill * 100}%`, background: tone.bar, transition:'width 300ms' }}></div>
      </div>
      {edit && picker}
      {over > 0 && (
        <div style={{ display:'flex', flexWrap:'wrap', gap: 6 }}>
          {subSave > 0.05 && <button onClick={() => ctx.actions.applyAllSubs()} style={{ ...fxBtnGhost, minHeight: 34, fontSize: 12 }}>{L(lang, 'Marca blanca', 'Store brand')} · −{eur(subSave)}</button>}
          {loose && <button onClick={() => ctx.actions.removeFromBasket(loose.b.id)} style={{ ...fxBtnGhost, minHeight: 34, fontSize: 12 }}>{L(lang, 'Quitar', 'Remove')} {CATALOG[loose.b.id].name[lang].toLowerCase()} · −{eur(loose.c)}</button>}
        </div>
      )}
    </div>
  );
}

// Toolbar above basket items: budget + in-store mode.
function BasketTools({ right }) {
  const ctx = React.useContext(AppCtx); const lang = ctx.lang;
  const [ask, setAsk] = useState(false);
  const cap = ctx.profile.budget;
  return (
    <>
      <div style={{ display:'flex', flexWrap:'wrap', gap: 6, alignItems:'center' }}>
        {!cap && (ctx.profile.asked || {}).pick && <button onClick={() => { setAsk(a => !a); }} aria-expanded={ask} style={{ ...uxChip, minHeight: 32, padding:'0 11px', color:'var(--ink)' }}><Icon name="plus" size={10}/>{L(lang, 'Poner un tope', 'Set a budget')}</button>}
        <button onClick={() => ctx.openOverlay('instore')} style={{ ...uxChip, minHeight: 32, padding:'0 11px', color:'var(--ink)' }}><Icon name="check" size={10}/>{L(lang, 'Modo tienda', 'In-store mode')}</button>
        {right && <div style={{ marginLeft:'auto' }}>{right}</div>}
      </div>
      {!cap && ask && <BudgetAsk onDone={() => setAsk(false)}/>}
      {cap && <BudgetBar/>}
    </>
  );
}
function BudgetAsk({ onDone }) {
  const ctx = React.useContext(AppCtx); const lang = ctx.lang;
  return (
    <div style={{ ...fxCard, padding:'10px 12px', display:'flex', flexDirection:'column', gap: 8 }}>
      <div style={{ fontSize: 13, fontWeight: 500 }}>{L(lang, '¿Cuánto quieres gastar como máximo?', 'What’s the most you want to spend?')}</div>
      <div style={{ display:'flex', flexWrap:'wrap', gap: 6 }}>
        {[40, 60, 80, 100, 120].map(v => <button key={v} onClick={() => { ctx.updateProfile({ budget: v }); onDone(); }} style={{ ...uxChip, minHeight: 34, padding:'0 12px', color:'var(--ink)' }}>{v} €</button>)}
      </div>
    </div>
  );
}

// One quiet line for spoilage + price-drop notes; expands on tap.
function BasketHelpers() {
  const ctx = React.useContext(AppCtx); const lang = ctx.lang;
  const [open, setOpen] = useState(false);
  const q = qtyAdvice(ctx.basket, ctx.profile.household || 2, ctx.profile.keepQty).length;
  const d = ctx.basket.filter(b => priceSignal(b.id, ctx.alerts)).length;
  if (!q && !d) return null;
  const parts = [q && L(lang, `${q} aviso${q > 1 ? 's' : ''} de cantidad`, `${q} quantity tip${q > 1 ? 's' : ''}`), d && L(lang, `${d} bajada${d > 1 ? 's' : ''} de precio`, `${d} price drop${d > 1 ? 's' : ''}`)].filter(Boolean);
  return (
    <div style={{ display:'flex', flexDirection:'column', gap: 8 }}>
      <button onClick={() => setOpen(o => !o)} aria-expanded={open} style={{ display:'flex', alignItems:'center', gap: 8, minHeight: 40, padding:'0 12px', borderRadius: 12, background:'var(--bg-sunk)', border:'1px solid var(--line-2)', fontSize: 13, fontWeight: 500, textAlign:'left' }}>
        <span style={{ width: 7, height: 7, borderRadius: 4, background: q ? 'var(--warn)' : 'var(--sage)', flexShrink: 0 }}></span>
        <span style={{ flex: 1 }}>{parts.join(' · ')}</span>
        <span style={{ color:'var(--ink-3)', display:'inline-flex', transform: open ? 'rotate(180deg)' : 'none', transition:'transform 160ms' }}><Icon name="down" size={11}/></span>
      </button>
      {open && <><SmartQtyNote/><PriceDropNote/></>}
    </div>
  );
}

// ─── Product imagery: real photo when available, tinted tile + emoji until then ───
// Drop files in products/ and register them here, e.g. PRODUCT_IMG.leche = 'products/leche.jpg'.
// Otherwise: Wikimedia Commons for produce (stable file redirects), Open Food Facts live lookup for packaged goods.
const PRODUCT_IMG = {};
const wm = (f) => `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(f)}?width=240`;
const PRODUCT_IMG_STATIC = {
  naranjas: wm('Oranges_-_whole-halved-segment.jpg'), manzanas: wm('Golden_delicious_apple.jpg'), tomate: wm('Tomato_je.jpg'),
  patatas: wm('Patates.jpg'), cebolla: wm('Onion_on_White.JPG'), ajo: wm('Garlic.jpg'), pimiento: wm('Red_capsicum_and_cross_section.jpg'),
  pollo: null, pan: wm('Pain_de_campagne.jpg'), huevos: wm('Brown_chicken_eggs.jpg'), queso: wm('Manchego.jpg'),
};
const OFF_TERMS = {
  leche: 'leche entera hacendado', aceite: 'aceite de oliva virgen extra', detergente: 'detergente liquido', yogur: 'yogur natural', papel: 'papel higienico',
  pasta: 'espaguetis', cafe: 'cafe en grano', arroz: 'arroz bomba', guisantes: 'guisantes', bacon: 'bacon ahumado', nata: 'nata para cocinar', pollo: 'pechuga de pollo',
};
const offCache = (() => { try { return JSON.parse(localStorage.getItem('ai-shopper-img') || '{}'); } catch (e) { return {}; } })();
const offPending = {};
function offLookup(id, term, cb) {
  if (offCache[id] !== undefined) return cb(offCache[id]);
  if (offPending[id]) return offPending[id].push(cb);
  offPending[id] = [cb];
  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(term)}&search_simple=1&action=process&json=1&page_size=8&fields=image_front_small_url`;
  fetch(url).then(r => r.json()).then(j => {
    const hit = (j.products || []).find(p => p.image_front_small_url);
    const v = hit ? hit.image_front_small_url : null;
    offCache[id] = v; try { localStorage.setItem('ai-shopper-img', JSON.stringify(offCache)); } catch (e) {}
    offPending[id].forEach(f => f(v)); delete offPending[id];
  }).catch(() => { offPending[id].forEach(f => f(null)); delete offPending[id]; });
}
function useProductImage(id) {
  const [src, setSrc] = useState(PRODUCT_IMG[id] || PRODUCT_IMG_STATIC[id] || (offCache[id] || null));
  useEffect(() => {
    if (PRODUCT_IMG[id] || PRODUCT_IMG_STATIC[id]) { setSrc(PRODUCT_IMG[id] || PRODUCT_IMG_STATIC[id]); return; }
    const term = OFF_TERMS[id] || (CATALOG[id] && CATALOG[id].name.es);
    if (!term) return;
    let on = true; offLookup(id, term, v => on && setSrc(v)); return () => { on = false; };
  }, [id]);
  return src;
}
function ProductThumb({ id }) {
  const [bad, setBad] = useState(false);
  const src = useProductImage(id);
  const p = CATALOG[id]; if (!p) return null;
  const meta = CATEGORY_META[p.category];
  const tint = meta ? `color-mix(in oklch, ${meta.dot} 16%, var(--bg-panel))` : 'var(--bg-sunk)';
  const tile = { width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', background: tint, boxShadow:'inset 0 0 0 1px oklch(0.2 0.01 60 / 0.04)', containerType:'inline-size' };
  const dark = typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark';
  if (src && !bad) return <span aria-hidden="true" style={tile}><img src={src} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setBad(true)} style={{ width:'82%', height:'82%', objectFit:'contain', display:'block', filter:'drop-shadow(0 2px 3px oklch(0.2 0.01 60 / 0.18))', mixBlendMode: dark ? 'normal' : 'multiply', borderRadius: dark ? 4 : 0 }}/></span>;
  return <span aria-hidden="true" style={{ ...tile, fontSize: 'clamp(12px, 55cqw, 22px)' }}>{p.emoji}</span>;
}
// Inline thumb for rows that used a bare emoji: fixed square tile, same visual language everywhere.
function PThumb({ id, size = 28, radius = 7, style }) {
  return <span style={{ width: size, height: size, borderRadius: radius, overflow:'hidden', flexShrink: 0, display:'inline-flex', border:'1px solid var(--line-2)', ...style }}><ProductThumb id={id}/></span>;
}

// ─── Price freshness ───
function agoLabel(ms, lang) {
  const m = Math.round(ms / 60000);
  if (m < 1) return L(lang, 'ahora mismo', 'just now');
  if (m < 60) return L(lang, `hace ${m} min`, `${m} min ago`);
  return L(lang, `hace ${Math.floor(m / 60)} h`, `${Math.floor(m / 60)} h ago`);
}
function PriceFresh() {
  const ctx = React.useContext(AppCtx); const lang = ctx.lang;
  const age = Date.now() - (ctx.pricesAt || Date.now());
  const stale = age > 3600e3;
  return (
    <div style={{ position:'relative', display:'flex', alignItems:'center', gap: 8, fontSize: 12, color: stale ? 'var(--warn-ink)' : 'var(--ink-3)' }}>
      <span style={{ width: 6, height: 6, borderRadius: 3, background: stale ? 'var(--warn)' : 'var(--sage)' }}></span>
      <span>{L(lang, 'Precios', 'Prices')} {agoLabel(age, lang)}</span>
      {stale && <button onClick={ctx.refreshPrices} style={{ fontSize: 12, fontWeight: 600, color:'var(--accent-ink)', minHeight: 32, padding:'0 4px' }}>{L(lang, 'Actualizar', 'Refresh')}</button>}
    </div>
  );
}

// ─── Savings as signature ───
function savingsTotal(orders) {
  const os = (orders || []).filter(o => o.saved > 0);
  return { total: SAVINGS_BASE.amount + os.reduce((s, o) => s + o.saved, 0), n: SAVINGS_BASE.orders + os.length };
}
function shareSavings(lang, amount) {
  const txt = L(lang, `He ahorrado ${eur(amount)} en la compra desde junio con ${tr('appName', lang)}. Compara 7 supers por ti.`, `I’ve saved ${eur(amount)} on groceries since June with ${tr('appName', lang)}. It compares 7 stores for you.`);
  try { window.open('https://wa.me/?text=' + encodeURIComponent(txt), '_blank', 'noopener'); } catch (e) {}
}
function SavingsPill({ onOpen }) {
  const ctx = React.useContext(AppCtx); const lang = ctx.lang;
  const s = savingsTotal(ctx.orders);
  return (
    <button onClick={onOpen} aria-label={L(lang, `Ahorrado desde junio: ${eur(s.total)}`, `Saved since June: ${eur(s.total)}`)} style={{ height: 32, padding:'0 11px', borderRadius: 8, background:'var(--sage-soft)', border:'1px solid var(--sage-line)', color:'var(--sage-ink)', display:'inline-flex', alignItems:'center', gap: 6, fontSize: 12, fontWeight: 600, whiteSpace:'nowrap' }}>
      <Icon name="down" size={11}/><span className="serif" style={{ fontSize: 16, fontWeight: 400 }}>{eur(s.total)}</span><span className="wtb-lbl" style={{ fontWeight: 500 }}>{L(lang, 'ahorrados', 'saved')}</span>
    </button>
  );
}
function ShareSavingsButton({ compact }) {
  const ctx = React.useContext(AppCtx); const lang = ctx.lang;
  const s = savingsTotal(ctx.orders);
  return <button onClick={() => shareSavings(lang, s.total)} style={{ ...fxBtnGhost, minHeight: compact ? 36 : 40, fontSize: 12, background:'transparent' }}><Icon name="wa" size={12}/>{L(lang, 'Compartir', 'Share')}</button>;
}

// ─── Household invite (after first order) ───
function HouseholdInvite() {
  const ctx = React.useContext(AppCtx); const lang = ctx.lang;
  if ((ctx.shared || {}).on || (ctx.profile.asked || {}).household) return null;
  return (
    <div style={{ ...fxCard, padding:'12px 14px', marginBottom: 16, display:'flex', flexDirection:'column', gap: 8 }}>
      <div style={{ fontSize: 13, fontWeight: 600 }}>{L(lang, '¿Compras con alguien?', 'Shop with someone?')}</div>
      <div style={{ fontSize: 12, color:'var(--ink-2)' }}>{L(lang, 'Invítale a la cesta: añade lo que necesite y tú lo apruebas antes de pedir.', 'Invite them to the basket: they add what they need and you approve it before ordering.')}</div>
      <div style={{ display:'flex', gap: 8 }}>
        <button onClick={() => { ctx.setSharedOn(true); ctx.markAsked('household'); ctx.notify(L(lang, 'Invitación enviada a Ana', 'Invite sent to Ana')); }} style={{ ...fxBtnPrimary, minHeight: 40, flex: 1 }}><Icon name="share" size={12}/>{L(lang, 'Invitar por WhatsApp', 'Invite via WhatsApp')}</button>
        <button onClick={() => ctx.markAsked('household')} style={{ ...fxBtnGhost, minHeight: 40, background:'transparent' }}>{L(lang, 'Solo yo', 'Just me')}</button>
      </div>
    </div>
  );
}

// ─── In-store mode: checklist in aisle order ───
const AISLE_ORDER = ['frescos', 'carne', 'pescado', 'panaderia', 'lacteos', 'despensa', 'bebidas', 'limpieza', 'higiene'];
function InStoreSheet({ variant, onClose }) {
  const ctx = React.useContext(AppCtx); const lang = ctx.lang;
  const [got, setGot] = useState([]);
  const cats = [...AISLE_ORDER, ...Object.keys(CATEGORY_META).filter(k => !AISLE_ORDER.includes(k))];
  const items = ctx.basket.slice().sort((a, z) => cats.indexOf(CATALOG[a.id].category) - cats.indexOf(CATALOG[z.id].category));
  const st = ctx.winner && STORES.find(s => s.id === ctx.winner.id);
  const done = got.length === items.length && items.length > 0;
  let last = null;
  return (
    <Sheet variant={variant} onClose={onClose} width={520} kicker={st ? L(lang, `Modo tienda · ${st.name}`, `In-store · ${st.name}`) : L(lang, 'Modo tienda', 'In-store')} title={done ? L(lang, 'Lo tienes todo', 'You’ve got everything') : L(lang, `${got.length} de ${items.length} en el carro`, `${got.length} of ${items.length} in the cart`)}
      footer={<button onClick={() => { if (done) ctx.notify(L(lang, 'Compra hecha en tienda', 'In-store shop done')); onClose(); }} style={{ ...fxBtnPrimary, width:'100%', minHeight: 52, fontSize: 14 }}>{done ? L(lang, 'Terminar', 'Finish') : L(lang, 'Salir del modo tienda', 'Leave in-store mode')}</button>}>
      <div aria-hidden="true" style={{ height: 6, borderRadius: 3, background:'var(--bg-sunk)', overflow:'hidden', marginBottom: 14 }}>
        <div style={{ height:'100%', width:`${items.length ? got.length / items.length * 100 : 0}%`, background:'var(--sage)', transition:'width 240ms' }}></div>
      </div>
      {items.map(b => {
        const p = CATALOG[b.id]; const on = got.includes(b.id);
        const head = p.category !== last; last = p.category;
        const meta = CATEGORY_META[p.category];
        return (
          <React.Fragment key={b.id}>
            {head && <div style={{ ...fxKicker, margin:'12px 0 4px' }}>{meta ? meta[lang] : p.category}</div>}
            <button role="checkbox" aria-checked={on} onClick={() => { feedback(on ? 'undo' : 'add'); setGot(g => on ? g.filter(x => x !== b.id) : [...g, b.id]); }}
              style={{ width:'100%', minHeight: 60, display:'flex', alignItems:'center', gap: 14, padding:'0 4px', borderBottom:'1px solid var(--line-2)', textAlign:'left', opacity: on ? 0.55 : 1, transition:'opacity 160ms' }}>
              <span style={{ width: 30, height: 30, borderRadius: 15, flexShrink: 0, border:`2px solid ${on ? 'var(--sage)' : 'var(--ink-4)'}`, background: on ? 'var(--sage)' : 'transparent', color:'#fff', display:'inline-flex', alignItems:'center', justifyContent:'center' }}>{on && <Icon name="check" size={14}/>}</span>
              <span style={{ width: 44, height: 44, borderRadius: 8, overflow:'hidden', flexShrink: 0, display:'flex', border:'1px solid var(--line-2)' }}><ProductThumb id={b.id}/></span>
              <span style={{ flex: 1, minWidth: 0, fontSize: 15.5, fontWeight: 500, textDecoration: on ? 'line-through' : 'none' }}>{ctx.appliedSubs.includes(b.id) && p.whiteLabel ? p.whiteLabel.name[lang] : p.name[lang]}</span>
              <span className="mono" style={{ fontSize: 15, color:'var(--ink-2)' }}>×{b.qty}</span>
            </button>
          </React.Fragment>
        );
      })}
    </Sheet>
  );
}

// ─── Delivery check: what arrived vs what was ordered ───
// Never swap across a diet line (sin gluten / sin lactosa / veg ↔ regular).
const isDietVariant = (id) => Object.values(DIETS).some(d => Object.values(d.swap).includes(id));
const dietLinked = (a, b) => Object.values(DIETS).some(d => d.swap[a] === b || d.swap[b] === a);
const safeAlts = (id) => isDietVariant(id) ? [] : ambigAlts(id).filter(x => x !== id && !dietLinked(id, x) && !isDietVariant(x));
function altFor(id) {
  const p = CATALOG[id];
  if (p.whiteLabel) return p.whiteLabel.name;
  if (isDietVariant(id)) return { es: `${p.name.es} (otra marca)`, en: `${p.name.en} (another brand)` };
  const amb = safeAlts(id)[0];
  if (amb) return CATALOG[amb].name;
  const first = deaccent(p.name.es.split(' ')[0]);
  const x = Object.values(CATALOG).find(y => y.id !== id && y.category === p.category && !dietLinked(id, y.id) && !isDietVariant(y.id) && deaccent(y.name.es).startsWith(first));
  if (x) return x.name;
  return { es: `${p.name.es} (otra marca)`, en: `${p.name.en} (another brand)` };
}
const hasAlt = (id) => !!(CATALOG[id].whiteLabel || safeAlts(id).length);
function DeliveryCheck({ order }) {
  const ctx = React.useContext(AppCtx); const lang = ctx.lang;
  const [st, setSt] = useState({});
  const items = order.items || [];
  if (items.length < 3) return null;
  const sid = order.stores[0];
  const oos = items.find(b => hasAlt(b.id)) || items[2];
  const miss = items.find(b => b !== oos && b !== items[0]) || items[1];
  const rule = (order.rules || {})[oos.id] || oosRuleOf(ctx.profile, oos.id);
  const price = (b) => itemCost(b, sid, []);
  const ok = items.length - 2;
  const claim = (k, amt) => { setSt(s => ({ ...s, [k]: 'claimed' })); ctx.notify(L(lang, `Reembolso de ${eur(amt)} solicitado`, `${eur(amt)} refund requested`)); };
  const row = (emoji, title, sub, action, tone) => (
    <div style={{ display:'flex', alignItems:'center', gap: 10, padding:'10px 0', borderTop:'1px solid var(--line-2)' }}>
      <span aria-hidden="true" style={{ fontSize: 18, width: 24, textAlign:'center' }}>{emoji}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: tone || 'var(--ink)' }}>{title}</div>
        <div style={{ fontSize: 12, color:'var(--ink-3)' }}>{sub}</div>
      </div>
      {action}
    </div>
  );
  const pm = CATALOG[miss.id], po = CATALOG[oos.id];
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ ...fxKicker, marginBottom: 4 }}>{L(lang, 'Revisión de la entrega', 'Delivery check')}</div>
      {row('✓', L(lang, `${ok} productos correctos`, `${ok} items as ordered`), L(lang, 'Cantidades y precios cuadran con el ticket.', 'Quantities and prices match the receipt.'), null, 'var(--sage-ink)')}
      {row(pm.emoji, L(lang, `No ha llegado: ${pm.name.es.toLowerCase()}`, `Missing: ${pm.name.en.toLowerCase()}`), L(lang, `Cobrado ${eur(price(miss))} · aparece en el ticket`, `Charged ${eur(price(miss))} · on the receipt`),
        st.miss === 'claimed' ? <Pill tone="sage" size="sm"><Icon name="check" size={9}/>{L(lang, '3–5 días', '3–5 days')}</Pill>
          : <button onClick={() => claim('miss', price(miss))} style={{ ...fxBtnPrimary, minHeight: 36, padding:'0 12px', fontSize: 12 }}>{L(lang, `Reclamar ${eur(price(miss))}`, `Claim ${eur(price(miss))}`)}</button>, 'var(--danger-ink)')}
      {rule === 'skip'
        ? row(po.emoji, L(lang, `No había ${po.name.es.toLowerCase()}`, `${po.name.en} was out`), L(lang, 'Lo quitamos como pediste · no se cobró', 'Skipped as you asked · not charged'), null)
        : row(po.emoji, L(lang, `${po.name.es} → ${altFor(oos.id).es}`, `${po.name.en} → ${altFor(oos.id).en}`), rule === 'ask' ? L(lang, 'Te lo propuse durante la preparación y aceptaste', 'I asked while picking and you said yes') : L(lang, 'Sustituido por algo parecido · mismo precio o menos', 'Swapped for something similar · same price or less'),
            st.oos === 'claimed' ? <Pill size="sm">{L(lang, 'Devolución pedida', 'Return requested')}</Pill>
              : st.oos === 'kept' ? <Pill tone="sage" size="sm"><Icon name="check" size={9}/>{L(lang, 'Aceptado', 'Kept')}</Pill>
              : <div style={{ display:'flex', gap: 6 }}><button onClick={() => claim('oos', price(oos))} style={{ ...fxBtnGhost, minHeight: 36, padding:'0 10px', fontSize: 12 }}>{L(lang, 'Devolver', 'Return')}</button><button onClick={() => setSt(s => ({ ...s, oos: 'kept' }))} style={{ ...fxBtnGhost, minHeight: 36, padding:'0 10px', fontSize: 12 }}>{L(lang, 'Vale', 'Keep')}</button></div>)}
    </div>
  );
}

// ─── Streamed thinking ───
function ThinkingSteps() {
  const lang = React.useContext(AppCtx).lang;
  const steps = [L(lang, 'Leyendo lo que pides…', 'Reading your request…'), L(lang, 'Buscando en 7 supers cerca de ti…', 'Checking 7 stores near you…'), L(lang, 'Comparando precios y ofertas…', 'Comparing prices and deals…')];
  const [i, setI] = useState(0);
  useEffect(() => { const t = setInterval(() => setI(x => Math.min(x + 1, steps.length - 1)), 380); return () => clearInterval(t); }, []);
  return (
    <div style={{ display:'flex', flexDirection:'column', gap: 4 }}>
      {steps.slice(0, i + 1).map((s, k) => (
        <div key={k} style={{ display:'flex', alignItems:'center', gap: 8, fontSize: 13, color: k < i ? 'var(--ink-3)' : 'var(--ink-2)', animation:'fadeIn 200ms' }}>
          {k < i ? <span style={{ color:'var(--sage)', width: 21, display:'inline-flex', justifyContent:'center' }}><Icon name="check" size={11}/></span> : <DotsLoader/>}
          <span>{s}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Fly-to-basket ───
function flyToBasket(emoji) {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  window.dispatchEvent(new CustomEvent('ai-fly', { detail: { emoji } }));
}
function FlyLayer() {
  const queue = useRef(0);
  useEffect(() => {
    const on = (e) => {
      const n = queue.current++;
      setTimeout(() => { queue.current = Math.max(0, queue.current - 1); launch(e.detail.emoji); }, n * 110);
    };
    window.addEventListener('ai-fly', on);
    return () => window.removeEventListener('ai-fly', on);
  }, []);
  return null;
}
function launch(emoji) {
  const vis = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight; };
  const tgt = [...document.querySelectorAll('[data-fly-target]')].find(vis);
  if (!tgt) return;
  const t = tgt.getBoundingClientRect();
  const srcEl = [...document.querySelectorAll('[data-fly-source]')].find(vis);
  const s = srcEl ? srcEl.getBoundingClientRect() : { left: t.left - 40, top: t.top - 240, width: 0, height: 0 };
  const sx = s.left + s.width / 2, sy = s.top + Math.min(s.height / 2, 30);
  const tx = t.left + t.width / 2, ty = t.top + t.height / 2;
  const el = document.createElement('div');
  el.textContent = emoji;
  el.setAttribute('aria-hidden', 'true');
  Object.assign(el.style, { position:'fixed', left: `${sx - 14}px`, top: `${sy - 14}px`, width:'28px', height:'28px', fontSize:'22px', lineHeight:'28px', textAlign:'center', zIndex: 9999, pointerEvents:'none', filter:'drop-shadow(0 4px 8px rgba(0,0,0,.18))' });
  document.body.appendChild(el);
  const dx = tx - sx, dy = ty - sy, lift = Math.min(-60, dy / 2 - 80);
  const a = el.animate([
    { transform:'translate(0,0) scale(1)', opacity: 1 },
    { transform:`translate(${dx * 0.5}px, ${lift}px) scale(1.15)`, opacity: 1, offset: 0.45 },
    { transform:`translate(${dx}px, ${dy}px) scale(0.35)`, opacity: 0.4 },
  ], { duration: 620, easing:'cubic-bezier(.3,.6,.4,1)' });
  a.onfinish = () => { el.remove(); tgt.animate([{ transform:'scale(1)' }, { transform:'scale(1.12)' }, { transform:'scale(1)' }], { duration: 260, easing:'ease-out' }); };
  setTimeout(() => el.remove(), 1500);
}

// ─── Larger text ───
function TextSizeRow() {
  const ctx = React.useContext(AppCtx); const lang = ctx.lang;
  const big = ctx.profile.textScale === 'lg';
  return (
    <div style={{ display:'flex', alignItems:'center', gap: 10, minHeight: 44 }}>
      <span style={{ flex: 1, fontSize: 13 }}>{L(lang, 'Texto más grande', 'Larger text')}</span>
      <button onClick={() => ctx.updateProfile({ textScale: big ? 'md' : 'lg' })} role="switch" aria-checked={big} aria-label={L(lang, 'Texto más grande', 'Larger text')} style={{ width: 44, height: 26, borderRadius: 13, padding: 3, flexShrink: 0, background: big ? 'var(--sage)' : 'var(--ink-4)', transition:'background 160ms', display:'flex', justifyContent: big ? 'flex-end' : 'flex-start' }}>
        <span style={{ width: 20, height: 20, borderRadius: 12, background:'#fff', boxShadow:'0 1px 3px oklch(0.2 0 0 / .2)' }}></span>
      </button>
    </div>
  );
}

Object.assign(window, { PRODUCT_IMG, ProductThumb, PThumb, PriceFresh, agoLabel, savingsTotal, SavingsPill, ShareSavingsButton, HouseholdInvite, BasketHelpers, OOS_RULES, oosRuleOf, OosItemRow, SubRulesCard, STORE_NEXT, HeroSlotLine, BudgetBar, BasketTools, InStoreSheet, DeliveryCheck, ThinkingSteps, flyToBasket, FlyLayer, TextSizeRow });
