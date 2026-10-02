// UX round 4: failure states (slot race, price change, offline queue, coverage), notifications, focus trap.

// ─── Accessibility: keep Tab inside an open dialog ───
function useFocusTrap(ref) {
  useEffect(() => {
    const box = ref.current; if (!box) return;
    if (!box.contains(document.activeElement)) { if (!box.hasAttribute('tabindex')) box.setAttribute('tabindex', '-1'); box.focus({ preventScroll: true }); }
    const sel = 'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';
    const onKey = (e) => {
      if (e.key !== 'Tab' || !ref.current) return;
      const els = [...ref.current.querySelectorAll(sel)].filter(el => el.offsetParent !== null);
      if (!els.length) return;
      const first = els[0], last = els[els.length - 1];
      if (e.shiftKey && (document.activeElement === first || !ref.current.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (document.activeElement === last || !ref.current.contains(document.activeElement))) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);
}

// ─── Slot taken while confirming (demo: first "today" slot is always lost once) ───
function slotRace(slot) {
  if (window.__slotRaced || slot.day !== 0) return false;
  window.__slotRaced = true;
  SLOT_GRID[slot.day][slot.time] = null;
  return true;
}
function nextFreeSlot(from) {
  for (let d = from.day; d < SLOT_GRID.length; d++) for (let t = d === from.day ? from.time + 1 : 0; t < SLOT_TIMES.length; t++) if (SLOT_GRID[d][t] !== null) return { day: d, time: t, fee: SLOT_GRID[d][t] };
  return null;
}
function SlotTakenNote({ slot, onPick }) {
  const lang = React.useContext(AppCtx).lang;
  const nx = nextFreeSlot(slot);
  return (
    <div role="alert" style={{ marginTop: 16, padding:'12px 14px', borderRadius: 12, background:'var(--warn-soft)', border:'1px solid var(--warn-line)', display:'flex', flexDirection:'column', gap: 8 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color:'var(--warn-ink)' }}>{L(lang, `Se acaba de llenar ${slotLabel(slot, lang).toLowerCase()}`, `${slotLabel(slot, lang)} just filled up`)}</div>
      <div style={{ fontSize: 12, color:'var(--ink-2)' }}>{L(lang, 'No se ha cobrado nada. Tu cesta sigue igual.', 'Nothing was charged. Your basket is unchanged.')}</div>
      {nx && <button onClick={() => onPick(nx)} style={{ ...fxBtnPrimary, minHeight: 40, alignSelf:'flex-start' }}>{L(lang, 'Usar', 'Use')} {slotLabel(nx, lang).toLowerCase()} · {nx.fee === 0 ? L(lang, 'sin coste extra', 'no extra cost') : `+${eur(nx.fee)}`}</button>}
    </div>
  );
}

// ─── A price moved between adding and paying ───
function PriceChangeNote({ basket, storeId }) {
  const ctx = React.useContext(AppCtx); const lang = ctx.lang;
  const [done, setDone] = useState(false);
  const b = basket.find(x => ['aceite', 'cafe', 'pollo', 'gambas'].includes(x.id)) || basket[0];
  if (!b || done) return null;
  const p = CATALOG[b.id];
  const up = Math.max(0.1, Math.round(p.prices[storeId] * 0.04 * 100) / 100) * b.qty;
  const canSub = p.whiteLabel && !ctx.appliedSubs.includes(b.id) && !(ctx.profile.lockBrand || []).includes(b.id);
  return (
    <div role="status" style={{ marginTop: 16, padding:'12px 14px', borderRadius: 12, background:'var(--bg-sunk)', border:'1px solid var(--line)', display:'flex', flexDirection:'column', gap: 8 }}>
      <div style={{ display:'flex', gap: 8, alignItems:'flex-start' }}>
        <span style={{ color:'var(--danger-ink)', paddingTop: 1 }}><Icon name="up" size={12}/></span>
        <div style={{ flex: 1, fontSize: 13 }}><b style={{ fontWeight: 600 }}>{p.name[lang]} {L(lang, 'ha subido', 'went up')} {eur(up)}</b> {L(lang, 'desde que lo añadiste. Ya está en el total.', 'since you added it. It’s already in the total.')}</div>
      </div>
      <div style={{ display:'flex', flexWrap:'wrap', gap: 6 }}>
        <button onClick={() => setDone(true)} style={{ ...fxBtnGhost, minHeight: 36, fontSize: 12 }}>{L(lang, 'Vale', 'OK')}</button>
        {canSub && <button onClick={() => { ctx.actions.applySub(b.id); setDone(true); }} style={{ ...fxBtnGhost, minHeight: 36, fontSize: 12 }}>{L(lang, 'Cambiar a', 'Switch to')} {p.whiteLabel.name[lang]}</button>}
        <button onClick={() => { ctx.actions.removeFromBasket(b.id); setDone(true); }} style={{ ...fxBtnGhost, minHeight: 36, fontSize: 12, color:'var(--danger-ink)' }}>{L(lang, 'Quitar', 'Remove')}</button>
      </div>
    </div>
  );
}

// ─── Offline ───
function OfflineBanner({ variant }) {
  const ctx = React.useContext(AppCtx); const lang = ctx.lang;
  if (!ctx.offline) return null;
  const q = (ctx.state.messages || []).filter(m => m.queued).length;
  return (
    <div role="status" style={{ position: variant === 'mobile' ? 'absolute' : 'fixed', top: variant === 'mobile' ? 64 : 62, left:'50%', transform:'translateX(-50%)', zIndex: 230, maxWidth:'calc(100% - 24px)', padding:'8px 14px', borderRadius: 999, background:'var(--ink)', color:'var(--bg)', fontSize: 12, fontWeight: 500, display:'flex', alignItems:'center', gap: 8, boxShadow:'0 8px 24px oklch(0.2 0.01 60 / 0.2)', animation:'toastIn 220ms' }}>
      <span style={{ width: 7, height: 7, borderRadius: 4, background:'var(--warn)' }}></span>
      {L(lang, 'Sin conexión', 'Offline')}{q > 0 ? L(lang, ` · ${q} en cola`, ` · ${q} queued`) : L(lang, ' · lo que pidas se envía al volver', ' · requests send when you’re back')}
    </div>
  );
}

// ─── Postcode coverage ───
const COVERED_CP = /^(28|08|46|41|29|48)/;
const COVERED_CITIES = { es: 'Madrid, Barcelona, Valencia, Sevilla, Málaga y Bilbao', en: 'Madrid, Barcelona, Valencia, Seville, Málaga and Bilbao' };

// ─── Notifications ───
const NOTIF_TYPES = [
  { k:'weekly', es:'Tu compra semanal', en:'Your weekly shop', sub:{ es:'Jueves a las 18:00, con el precio de esta semana', en:'Thursdays at 18:00, with this week’s price' } },
  { k:'drops', es:'Bajadas de precio', en:'Price drops', sub:{ es:'Solo de lo que compras o vigilas', en:'Only things you buy or watch' } },
  { k:'order', es:'Estado del pedido', en:'Order status', sub:{ es:'Preparación, faltas y entrega', en:'Picking, missing items and delivery' } },
  { k:'household', es:'Tu hogar', en:'Household', sub:{ es:'Cuando alguien añade algo a la cesta', en:'When someone adds to the basket' } },
];
function notifOn(profile, k) { return ((profile.notif || {})[k]) !== false; }
function NotificationsCard() {
  const ctx = React.useContext(AppCtx); const lang = ctx.lang; const p = ctx.profile;
  const tog = (k) => ctx.updateProfile({ notif: { ...(p.notif || {}), [k]: !notifOn(p, k) } });
  return (
    <div style={{ ...fxCard, display:'flex', flexDirection:'column', gap: 2 }}>
      <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom: 4 }}>
        <div style={fxKicker}>{L(lang, 'Avisos', 'Notifications')}</div>
        <button onClick={() => ctx.openOverlay('notifs')} style={{ fontSize: 12, fontWeight: 500, color:'var(--accent-ink)', minHeight: 32 }}>{L(lang, 'Ver ejemplos', 'See examples')}</button>
      </div>
      {NOTIF_TYPES.map(n => {
        const on = notifOn(p, n.k);
        return (
          <div key={n.k} style={{ display:'flex', alignItems:'center', gap: 10, minHeight: 52 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13 }}>{n[lang]}</div>
              <div style={{ fontSize: 12, color:'var(--ink-3)' }}>{n.sub[lang]}</div>
            </div>
            <button onClick={() => tog(n.k)} role="switch" aria-checked={on} aria-label={n[lang]} style={{ width: 44, height: 26, borderRadius: 13, padding: 3, flexShrink: 0, background: on ? 'var(--sage)' : 'var(--ink-4)', transition:'background 160ms', display:'flex', justifyContent: on ? 'flex-end' : 'flex-start' }}>
              <span style={{ width: 20, height: 20, borderRadius: 10, background:'#fff', boxShadow:'0 1px 3px oklch(0.2 0 0 / .2)' }}></span>
            </button>
          </div>
        );
      })}
      <div style={{ fontSize: 12, color:'var(--ink-3)', marginTop: 4 }}>{L(lang, 'Como mucho 3 avisos a la semana. Nunca publicidad.', 'At most 3 a week. Never ads.')}</div>
    </div>
  );
}

function NotificationsSheet({ variant, onClose }) {
  const ctx = React.useContext(AppCtx); const lang = ctx.lang;
  const o = (ctx.orders || []).find(x => x.date && x.date.es !== 'Hoy' && x.items);
  const best = o && STORES.map(s => { const it = o.items.reduce((t, b) => t + itemCost(b, s.id, []), 0); return { s, t: it + (it >= s.minFree ? 0 : s.delivery) }; }).sort((a, z) => a.t - z.t)[0];
  const ol = CATALOG.aceite;
  const olBest = Object.entries(ol.prices).sort((a, z) => a[1] - z[1])[0];
  const items = [
    o && best && { k:'weekly', when: L(lang, 'jue 18:00', 'Thu 18:00'), title: L(lang, `Tu compra del jueves: ${eur(best.t)} en ${best.s.name}`, `Your Thursday shop: ${eur(best.t)} at ${best.s.name}`), body: (() => { const d = o.total - best.t; return d > 0.05 ? L(lang, `${eur(d)} menos que la última vez. Toca para cargarla.`, `${eur(d)} less than last time. Tap to load it.`) : d < -0.05 ? L(lang, `${eur(-d)} más que la última vez. Toca para revisarla.`, `${eur(-d)} more than last time. Tap to review it.`) : L(lang, 'Mismo precio que la última vez. Toca para cargarla.', 'Same price as last time. Tap to load it.'); })(), go: () => ctx.repeatOrder(o) },
    { k:'drops', when: L(lang, 'hace 2 h', '2 h ago'), title: L(lang, 'El aceite de oliva ha bajado', 'Olive oil just dropped'), body: L(lang, `Ahora ${eur(olBest[1])} en ${STORES.find(s => s.id === olBest[0]).name}, por debajo de tu alerta.`, `Now ${eur(olBest[1])} at ${STORES.find(s => s.id === olBest[0]).name}, under your alert.`), go: () => ctx.openHistory('aceite') },
    { k:'order', when: L(lang, 'ahora', 'now'), title: L(lang, 'Tu pedido está en camino', 'Your order is on its way'), body: L(lang, 'Luis llega entre 18:40 y 18:55. Falta 1 producto: te lo hemos descontado.', 'Luis arrives 18:40–18:55. One item was missing and has been refunded.'), go: () => ctx.activeOrder ? ctx.openOverlay('tracking') : ctx.notify(L(lang, 'Ejemplo: abriría el seguimiento', 'Example: this would open tracking')) },
    { k:'household', when: L(lang, 'hace 5 min', '5 min ago'), title: L(lang, 'Ana quiere añadir yogur natural', 'Ana wants to add plain yogurt'), body: L(lang, 'Apruébalo antes de las 20:00 para que entre en el pedido.', 'Approve it before 20:00 so it makes the order.'), go: () => ctx.setSharedOn(true) },
  ].filter(Boolean).filter(n => notifOn(ctx.profile, n.k));
  const run = (n) => { onClose(); setTimeout(n.go, 60); };
  return (
    <Sheet variant={variant} onClose={onClose} width={460} kicker={L(lang, 'Avisos', 'Notifications')} title={L(lang, 'Así te avisaré', 'How I’ll reach you')}>
      <div style={{ borderRadius: 20, padding:'22px 12px 14px', background:'linear-gradient(170deg, oklch(0.38 0.05 255), oklch(0.26 0.04 280))', color:'#fff' }}>
        <div style={{ textAlign:'center', marginBottom: 16 }}>
          <div style={{ fontSize: 13, opacity: 0.85 }}>{L(lang, 'jueves, 2 de octubre', 'Thursday, 2 October')}</div>
          <div style={{ fontSize: 56, fontWeight: 300, lineHeight: 1, letterSpacing:'-0.02em', marginTop: 2 }}>18:02</div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap: 8 }}>
          {items.length === 0 && <div style={{ textAlign:'center', fontSize: 13, opacity: 0.85, padding: 16 }}>{L(lang, 'Has desactivado todos los avisos.', 'You’ve turned all notifications off.')}</div>}
          {items.map(n => (
            <button key={n.k} onClick={() => run(n)} style={{ textAlign:'left', padding:'10px 12px', borderRadius: 16, background:'oklch(1 0 0 / 0.86)', color:'oklch(0.2 0.01 60)', display:'flex', gap: 10, alignItems:'flex-start', backdropFilter:'blur(10px)' }}>
              <span style={{ width: 30, height: 30, borderRadius: 8, background:'oklch(0.2 0.012 60)', color:'#fff', display:'inline-flex', alignItems:'center', justifyContent:'center', flexShrink: 0 }}><Icon name="sparkle" size={14}/></span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display:'flex', justifyContent:'space-between', gap: 8, fontSize: 11, color:'oklch(0.45 0.01 60)' }}><span style={{ textTransform:'uppercase', letterSpacing:'0.04em' }}>{tr('appName', lang)}</span><span>{n.when}</span></span>
                <span style={{ display:'block', fontSize: 13, fontWeight: 600, marginTop: 1 }}>{n.title}</span>
                <span style={{ display:'block', fontSize: 13, marginTop: 1, lineHeight: 1.35 }}>{n.body}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
      <div style={{ fontSize: 12, color:'var(--ink-3)', marginTop: 12 }}>{L(lang, 'Toca un aviso para ver adónde lleva. Cámbialos en Tú → Avisos.', 'Tap one to see where it leads. Change them in You → Notifications.')}</div>
    </Sheet>
  );
}

// ─── Journey helpers ───
function CartPeek({ n, children }) {
  const lang = React.useContext(AppCtx).lang;
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginTop: 14 }}>
      <button onClick={() => setOpen(o => !o)} aria-expanded={open} style={{ ...fxBtnGhost, width:'100%', justifyContent:'space-between', background:'transparent' }}>
        <span>{open ? L(lang, 'Ocultar productos', 'Hide items') : L(lang, `Ver los ${n} productos`, `See all ${n} items`)}</span>
        <span style={{ color:'var(--ink-3)', display:'inline-flex', transform: open ? 'rotate(180deg)' : 'none', transition:'transform 160ms' }}><Icon name="down" size={11}/></span>
      </button>
      {open && <div style={{ marginTop: 8 }}>{children}</div>}
    </div>
  );
}

// Diet as an optional chip in the "I understood" line, not a gate in front of Add.
function DietChip() {
  const ctx = React.useContext(AppCtx); const lang = ctx.lang;
  const [open, setOpen] = useState(false);
  const a = ctx.profile.asked || {};
  if (a.diet || (ctx.diet || []).length || !a.pick) return null;
  const pick = (k) => { if (k) ctx.toggleDiet(k); ctx.markAsked('diet'); };
  if (!open) return <button onClick={() => setOpen(true)} style={{ ...uxChip, minHeight: 28, color:'var(--accent-ink)', borderColor:'var(--accent-line)', background:'var(--accent-soft)' }}><Icon name="plus" size={9}/>{L(lang, '¿Alguna dieta?', 'Any diet?')}</button>;
  return (
    <span style={{ display:'inline-flex', flexWrap:'wrap', gap: 6 }}>
      {Object.entries(DIETS).map(([k, d]) => <button key={k} onClick={() => pick(k)} style={{ ...uxChip, minHeight: 28, color:'var(--ink)' }}>{d[lang]}</button>)}
      <button onClick={() => pick(null)} style={{ ...uxChip, minHeight: 28, border:'none', background:'transparent' }}>{L(lang, 'Ninguna', 'None')}</button>
    </span>
  );
}

// Clear next step after a big add: where it's cheapest + the two ways forward.
function NextStepCard({ msg }) {
  const ctx = React.useContext(AppCtx); const lang = ctx.lang;
  const w = ctx.winner;
  const nexts = (ctx.state.messages || []).filter(m => m.type === 'ai-next');
  const last = nexts[nexts.length - 1] === msg;
  if (!w || !last) return null;
  const st = STORES.find(s => s.id === w.id);
  const nx = ctx.storeTotals[1]; const nxs = nx && STORES.find(s => s.id === nx.id);
  return (
    <div style={{ display:'flex', gap: 8, alignItems:'flex-start', animation:'riseIn 260ms cubic-bezier(.2,.7,.3,1)' }}>
      <ConciergeAvatar/>
      <div style={{ flex: 1, minWidth: 0, padding:'12px 14px', borderRadius: 12, background:'var(--bg-panel)', border:'1px solid var(--line)', display:'flex', flexDirection:'column', gap: 10 }}>
        <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
          <StoreMark store={st} size={30}/>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13 }}>{L(lang, `Listo: ${ctx.basket.length} productos. Lo más barato ahora:`, `Done: ${ctx.basket.length} items. Cheapest right now:`)}</div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{st.name} · <span className="serif" style={{ fontSize: 18, fontWeight: 400 }}>{eur(w.total)}</span></div>
            {nx && nx.total - w.total > 0.05 && <div style={{ fontSize: 12, color:'var(--sage-ink)' }}>{L(lang, `${eur(nx.total - w.total)} menos que ${nxs.name}`, `${eur(nx.total - w.total)} less than ${nxs.name}`)}</div>}
          </div>
        </div>
        <div style={{ display:'flex', gap: 8 }}>
          {!window.__aiWeb && <button onClick={() => window.dispatchEvent(new Event('ai-go-compare'))} style={{ ...fxBtnGhost, flex: 1 }}>{L(lang, 'Ver por qué', 'See why')}</button>}
          <button onClick={() => window.dispatchEvent(new Event('ai-open-checkout'))} style={{ ...fxBtnPrimary, flex: 1.4, minHeight: 40 }}>{L(lang, 'Elegir franja', 'Pick a slot')} <Icon name="arrow" size={12}/></button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { CartPeek, DietChip, NextStepCard, useFocusTrap, slotRace, nextFreeSlot, SlotTakenNote, PriceChangeNote, OfflineBanner, COVERED_CP, COVERED_CITIES, NOTIF_TYPES, NotificationsCard, NotificationsSheet });
