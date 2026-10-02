// UX round 2: meals in basket, smart quantities, brand lock, price promise + delivered savings,
// savings ledger, household approvals, haptics/sound, dark mode prefs. Also tunes demo prices so split baskets pay off.

// Amazon Fresh undercuts on packaged/household goods (free Prime delivery); Lidl's delivery fee drops.
// Result: fresh from Lidl + pantry from Amazon beats any single store on typical baskets.
(() => {
  const PANTRY = ['detergente', 'aceite', 'papel', 'cafe'];
  Object.values(CATALOG).forEach(p => {
    if (PANTRY.includes(p.id) || ['limpieza', 'higiene', 'bebidas'].includes(p.category)) {
      const low = Math.min(...Object.values(p.prices));
      p.prices.amz = Math.round(low * 0.82 * 100) / 100;
    } else if (p.category === 'despensa') {
      const low = Math.min(...Object.values(p.prices));
      p.prices.amz = Math.round(low * 0.88 * 100) / 100;
    }
  });
  const lidl = STORES.find(s => s.id === 'lidl'); if (lidl) lidl.delivery = 3.5;
})();

// ─── Haptics + sound (mobile) ───
let uxAudio = null;
function feedback(kind) {
  if (window.__aiSound === false) return;
  try { navigator.vibrate && navigator.vibrate(kind === 'undo' ? [8, 40, 8] : 10); } catch (e) {}
  try {
    uxAudio = uxAudio || new (window.AudioContext || window.webkitAudioContext)();
    const f = { add: 880, undo: 520, micOn: 660, micOff: 440 }[kind] || 700;
    const o = uxAudio.createOscillator(), g = uxAudio.createGain();
    o.type = 'sine'; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, uxAudio.currentTime);
    g.gain.exponentialRampToValueAtTime(0.05, uxAudio.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, uxAudio.currentTime + 0.09);
    o.connect(g); g.connect(uxAudio.destination); o.start(); o.stop(uxAudio.currentTime + 0.1);
  } catch (e) {}
}

// ─── Smart quantities: fresh food that will spoil before a small household finishes it ───
// [shelf days, max packs per person within that time]
const PERISH = { naranjas:[10, 0.5], manzanas:[14, 0.5], pan:[3, 0.5], tomate:[6, 0.5], pimiento:[7, 0.5], pollo:[2, 0.5], yogur:[14, 1] };
const perishOf = (id) => PERISH[id] || (['carne', 'pescado'].includes((CATALOG[id] || {}).category) ? [2, 0.5] : null);
function qtyAdvice(basket, household, keep) {
  return basket.map(b => {
    const r = perishOf(b.id); if (!r || (b.meals || []).length || (keep || []).includes(b.id)) return null;
    const max = Math.max(1, Math.ceil(r[1] * household));
    return b.qty > max ? { id: b.id, qty: b.qty, max, days: r[0] } : null;
  }).filter(Boolean);
}

function SmartQtyNote() {
  const ctx = React.useContext(AppCtx); const lang = ctx.lang;
  const hh = ctx.profile.household || 2;
  const adv = qtyAdvice(ctx.basket, hh, ctx.profile.keepQty);
  if (!adv.length) return null;
  return (
    <div style={{ display:'flex', flexDirection:'column', gap: 8 }}>
      {adv.map(a => {
        const p = CATALOG[a.id];
        return (
          <div key={a.id} style={{ padding:'10px 12px', borderRadius: 12, background:'var(--warn-soft)', border:'1px solid var(--warn-line)', display:'flex', flexDirection:'column', gap: 8 }}>
            <div style={{ display:'flex', gap: 8, fontSize: 13, color:'var(--warn-ink)' }}>
              <span aria-hidden="true">{p.emoji}</span>
              <span style={{ flex: 1, lineHeight: 1.4 }}>
                <b style={{ fontWeight: 600 }}>{a.qty}× {p.name[lang]}</b> {L(lang, `para ${hh} personas: se estropea antes de acabarlo (dura ~${a.days} días).`, `for ${hh} people: it’ll spoil before you finish it (lasts ~${a.days} days).`)}
              </span>
            </div>
            <div style={{ display:'flex', gap: 6 }}>
              <button onClick={() => ctx.actions.setQtySmart(a.id, a.max)} style={{ ...fxBtnPrimary, minHeight: 34, padding:'0 12px', fontSize: 12 }}>{L(lang, `Bajar a ${a.max}`, `Cut to ${a.max}`)}</button>
              <button onClick={() => ctx.updateProfile({ keepQty: [...(ctx.profile.keepQty || []), a.id] })} style={{ ...fxBtnGhost, minHeight: 34, padding:'0 12px', fontSize: 12, background:'transparent' }}>{L(lang, 'Mantener', 'Keep')}</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Household approvals ───
function PendingCard() {
  const ctx = React.useContext(AppCtx); const lang = ctx.lang;
  const sh = ctx.shared || {};
  const pend = sh.pending || [];
  if (!sh.on || (!pend.length && !sh.editing)) return null;
  const av = (name, hue) => <span style={{ width: 26, height: 26, borderRadius: 13, background:'var(--person-bg)', color:'var(--person-ink)', display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>{name[0]}</span>;
  return (
    <div style={{ ...fxCard, padding:'10px 12px', display:'flex', flexDirection:'column', gap: 8 }}>
      {sh.editing && (
        <div style={{ display:'flex', alignItems:'center', gap: 8, fontSize: 12, color:'var(--ink-2)' }}>
          {av(sh.editing, 20)}<span>{L(lang, `${sh.editing} está editando la cesta…`, `${sh.editing} is editing the basket…`)}</span><DotsLoader/>
        </div>
      )}
      {pend.map(r => (
        <div key={r.id} style={{ display:'flex', alignItems:'center', gap: 8 }}>
          {av(r.by, 20)}
          <div style={{ flex: 1, minWidth: 0, fontSize: 13 }}>
            <b style={{ fontWeight: 600 }}>{r.by}</b> {L(lang, 'quiere añadir', 'wants to add')} <span aria-hidden="true">{CATALOG[r.id].emoji}</span> {CATALOG[r.id].name[lang]}
          </div>
          <button onClick={() => ctx.rejectPending(r.id)} aria-label={L(lang, 'Rechazar', 'Decline')} style={{ ...fxBtnGhost, minHeight: 34, padding:'0 10px' }}><Icon name="x" size={11}/></button>
          <button onClick={() => ctx.approvePending(r.id)} style={{ ...fxBtnPrimary, minHeight: 34, padding:'0 12px', fontSize: 12 }}><Icon name="check" size={11}/>{L(lang, 'Aprobar', 'Approve')}</button>
        </div>
      ))}
    </div>
  );
}

// ─── Price promise (checkout) + savings after delivery ───
function PricePromise() {
  const lang = React.useContext(AppCtx).lang;
  return (
    <div style={{ display:'flex', alignItems:'flex-start', gap: 8, marginTop: 10, fontSize: 12, color:'var(--ink-2)', lineHeight: 1.45 }}>
      <span style={{ color:'var(--sage-ink)', paddingTop: 1 }}><Icon name="check" size={12}/></span>
      <span>{L(lang, 'Precio vigilado: si algo cambia antes de la entrega, te aviso y puedes cancelar sin coste.', 'Price watch: if anything changes before delivery, I’ll tell you and you can cancel for free.')}</span>
    </div>
  );
}

function usualStoreId(profile) { return (profile.fav && profile.fav[0]) || 'dia'; }
function basketAt(items, sid) {
  const s = STORES.find(x => x.id === sid);
  const it = items.reduce((t, b) => t + itemCost(b, sid, []), 0);
  return it + (it >= s.minFree ? 0 : s.delivery);
}

function DeliveredSavings({ order }) {
  const dctx = React.useContext(AppCtx); const lang = dctx.lang;
  if (!order.saved || order.saved <= 0.05) return null;
  const us = STORES.find(s => s.id === order.usual);
  return (
    <div style={{ marginTop: 6, marginBottom: 14, padding:'14px', borderRadius: 12, background:'var(--sage-soft)', border:'1px solid var(--sage-line)' }}>
      <div style={{ ...fxKicker, color:'var(--sage-ink)' }}>{L(lang, 'Entregado', 'Delivered')}</div>
      <div className="serif" style={{ fontSize: 26, lineHeight: 1.1, marginTop: 2, color:'var(--sage-ink)' }}>{L(lang, `Has ahorrado ${eur(order.saved)}`, `You saved ${eur(order.saved)}`)}</div>
      <div style={{ fontSize: 12, color:'var(--ink-2)', marginTop: 2 }}>{L(lang, `frente a la misma cesta en ${us.name}, tu super habitual.`, `versus the same basket at ${us.name}, your usual store.`)}</div>
      <div style={{ display:'flex', alignItems:'center', gap: 10, marginTop: 10, flexWrap:'wrap' }}>
        <span style={{ flex: 1, fontSize: 12, color:'var(--sage-ink)', fontWeight: 500 }}>{L(lang, `${eur(savingsTotal(dctx.orders).total)} desde junio`, `${eur(savingsTotal(dctx.orders).total)} since June`)}</span>
        <ShareSavingsButton compact/>
      </div>
    </div>
  );
}

// ─── Savings ledger ───
const SAVINGS_BASE = { amount: 71.40, orders: 11 };
function SavingsCard() {
  const ctx = React.useContext(AppCtx); const lang = ctx.lang;
  const os = (ctx.orders || []).filter(o => o.saved > 0);
  const total = SAVINGS_BASE.amount + os.reduce((s, o) => s + o.saved, 0);
  const n = SAVINGS_BASE.orders + os.length;
  const bars = [4.2, 6.8, 3.1, 7.4, 5.5, 6.1, ...os.slice().reverse().map(o => o.saved)].slice(-10);
  const mx = Math.max(...bars);
  return (
    <div style={{ ...fxCard, display:'flex', alignItems:'flex-end', gap: 14 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={fxKicker}>{L(lang, 'Ahorrado desde junio', 'Saved since June')}</div>
        <div className="serif" style={{ fontSize: 34, lineHeight: 1.05, marginTop: 2, color:'var(--sage-ink)' }}><AnimatedNumber value={total} decimals={2} suffix=" €"/></div>
        <div style={{ fontSize: 12, color:'var(--ink-3)', marginTop: 2 }}>{L(lang, `${n} pedidos · ${eur(total / n)} de media`, `${n} orders · ${eur(total / n)} on average`)}</div>
        <div style={{ marginTop: 8 }}><ShareSavingsButton compact/></div>
      </div>
      <div aria-hidden="true" style={{ display:'flex', alignItems:'flex-end', gap: 3, height: 44 }}>
        {bars.map((v, i) => <span key={i} style={{ width: 6, height: Math.max(4, v / mx * 44), borderRadius: 2, background: i === bars.length - 1 ? 'var(--sage)' : 'var(--sage-line)' }}></span>)}
      </div>
    </div>
  );
}

// ─── Preferences: sound/haptics + dark mode ───
function PrefsCard() {
  const ctx = React.useContext(AppCtx); const lang = ctx.lang;
  const p = ctx.profile;
  const sw = (on, onClick, label) => (
    <button onClick={onClick} role="switch" aria-checked={on} aria-label={label} style={{ width: 44, height: 26, borderRadius: 13, padding: 3, flexShrink: 0, background: on ? 'var(--sage)' : 'var(--ink-4)', transition:'background 160ms', display:'flex', justifyContent: on ? 'flex-end' : 'flex-start' }}>
      <span style={{ width: 20, height: 20, borderRadius: 12, background:'#fff', boxShadow:'0 1px 3px oklch(0.2 0 0 / .2)' }}></span>
    </button>
  );
  const row = { display:'flex', alignItems:'center', gap: 10, minHeight: 44 };
  const dark = p.theme === 'dark', sound = p.sound !== false;
  return (
    <div style={{ ...fxCard, display:'flex', flexDirection:'column', gap: 2 }}>
      <div style={{ ...fxKicker, marginBottom: 4 }}>{L(lang, 'Preferencias', 'Preferences')}</div>
      <div style={row}><span style={{ flex: 1, fontSize: 13 }}>{L(lang, 'Sonidos y vibración', 'Sounds and haptics')}</span>{sw(sound, () => { ctx.updateProfile({ sound: !sound }); if (!sound) setTimeout(() => feedback('add'), 50); }, L(lang, 'Sonidos y vibración', 'Sounds and haptics'))}</div>
      <div style={row}><span style={{ flex: 1, fontSize: 13 }}>{L(lang, 'Modo oscuro', 'Dark mode')}</span>{sw(dark, () => ctx.updateProfile({ theme: dark ? 'light' : 'dark' }), L(lang, 'Modo oscuro', 'Dark mode'))}</div>
      <TextSizeRow/>
    </div>
  );
}

// ─── Meal header (basket grouped by dish) ───
function MealHeader({ rid, count }) {
  const ctx = React.useContext(AppCtx); const lang = ctx.lang;
  const r = RECIPES[rid];
  return (
    <div style={{ display:'flex', alignItems:'center', gap: 8, marginBottom: 6 }}>
      <span aria-hidden="true" style={{ fontSize: 16 }}>{r ? r.emoji : '🛒'}</span>
      <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 600 }}>{r ? r.name[lang] : L(lang, 'Otros productos', 'Other items')} <span style={{ fontWeight: 400, color:'var(--ink-3)', fontSize: 12 }}>· {count}</span></span>
      {r && <button onClick={() => ctx.actions.removeMeal(rid)} style={{ fontSize: 12, color:'var(--danger-ink)', fontWeight: 500, minHeight: 30, padding:'0 4px' }}>{L(lang, 'Quitar plato', 'Remove dish')}</button>}
    </div>
  );
}

Object.assign(window, { feedback, PERISH, qtyAdvice, SmartQtyNote, PendingCard, PricePromise, usualStoreId, basketAt, DeliveredSavings, SavingsCard, PrefsCard, MealHeader });
