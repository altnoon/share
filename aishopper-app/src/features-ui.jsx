// Shared feature UI: sheet shell, quick tools, stock gaps, split basket, delivery slots, store status, toasts.
const fxKicker = { fontSize: 11, color:'var(--ink-3)', textTransform:'uppercase', letterSpacing:'0.08em' };
const fxBtnPrimary = { minHeight: 44, padding:'0 16px', whiteSpace:'nowrap', borderRadius: 12, background:'var(--ink)', color:'var(--bg)', fontSize: 13, fontWeight: 500, display:'inline-flex', alignItems:'center', justifyContent:'center', gap: 8 };
const fxBtnGhost = { minHeight: 40, padding:'0 13px', whiteSpace:'nowrap', borderRadius: 12, background:'var(--bg-panel)', color:'var(--ink)', border:'1px solid var(--line)', fontSize: 13, fontWeight: 500, display:'inline-flex', alignItems:'center', justifyContent:'center', gap: 7 };
const fxCard = { padding: 16, borderRadius: 12, background:'var(--bg-panel)', border:'1px solid var(--line-2)' };

function Sheet({ variant, onClose, kicker, title, children, footer, width = 560 }) {
  const mobile = variant === 'mobile';
  const boxRef = useRef(null);
  useFocusTrap(boxRef);
  useEffect(() => {
    const k = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    const prev = document.activeElement;
    setTimeout(() => boxRef.current && boxRef.current.focus(), 30);
    return () => { window.removeEventListener('keydown', k); prev && prev.focus && prev.focus(); };
  }, []);
  return (
    <div role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : (kicker || '')}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: mobile ? 'absolute' : 'fixed', inset: 0, zIndex: 220, background:'oklch(0.20 0.01 60 / 0.45)', display:'flex', alignItems: mobile ? 'flex-end' : 'center', justifyContent:'center', padding: mobile ? 0 : 20, animation:'fadeIn 200ms' }}>
      <div ref={boxRef} tabIndex={-1} style={{ outline:'none', width: mobile ? '100%' : `min(${width}px, 100%)`, maxHeight: mobile ? '92%' : '90vh', display:'flex', flexDirection:'column', background:'var(--bg-panel)', borderRadius: mobile ? '20px 20px 0 0' : 16, border: mobile ? 'none' : '1px solid var(--line)', boxShadow:'0 20px 60px oklch(0.2 0.02 60 / 0.2)', animation: mobile ? 'sheetUp 320ms cubic-bezier(.2,.7,.3,1)' : 'riseIn 260ms cubic-bezier(.2,.7,.3,1)', overflow:'hidden' }}>
        {mobile && <div style={{ padding:'8px 0 0', display:'flex', justifyContent:'center' }}><div style={{ width: 38, height: 4, borderRadius: 2, background:'var(--line)' }}></div></div>}
        <div style={{ padding: mobile ? '8px 12px 10px 18px' : '16px 14px 12px 22px', display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap: 12, borderBottom:'1px solid var(--line-2)' }}>
          <div style={{ minWidth: 0, paddingTop: 4 }}>
            {kicker && <div style={fxKicker}>{kicker}</div>}
            <div className="serif" style={{ fontSize: mobile ? 24 : 28, lineHeight: 1.12, letterSpacing:'-0.015em', marginTop: 2, textWrap:'pretty' }}>{title}</div>
          </div>
          <button onClick={onClose} aria-label="Cerrar / Close" style={{ width: 44, height: 44, flexShrink: 0, borderRadius: 12, color:'var(--ink-2)', display:'inline-flex', alignItems:'center', justifyContent:'center' }}><Icon name="x" size={16}/></button>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflowY:'auto', padding: mobile ? '14px 18px' : '16px 22px' }}>{children}</div>
        {footer && <div style={{ padding: mobile ? '12px 18px 18px' : '14px 22px 18px', borderTop:'1px solid var(--line-2)', background:'var(--bg-panel)' }}>{footer}</div>}
      </div>
    </div>
  );
}

// Chip row above the chat input — the entry point for the non-chat flows.
function QuickTools() {
  const ctx = React.useContext(AppCtx);
  const lang = ctx.lang;
  const [more, setMore] = useState(false);
  const started = ctx.state && ctx.state.started;
  if (!(ctx.profile.asked || {}).pick) return null;
  const tools = [
    { k:'browse', icon:'search',   label: L(lang,'Catálogo y recetas','Products & recipes'), on: () => ctx.openOverlay('browse') },
    { k:'menu',   icon:'calendar', label: L(lang,'Menú semanal','Weekly menu'), on: () => ctx.openOverlay('menu') },
    { k:'photo',  icon:'camera',   label: L(lang,'Foto de lista','Photo of list'), on: () => ctx.openOverlay('photo') },
    { k:'repeat', icon:'repeat',   label: L(lang,'Repetir pedido','Repeat order'), on: () => ctx.repeatLast() },
    { k:'share',  icon:'share',    label: L(lang,'Compartir','Share'), on: () => ctx.openOverlay('share') },
  ];
  // Once the shop is under way, these step back behind one chip so the next step stays obvious.
  const chipS = { flexShrink: 0, height: 34, padding:'0 12px 0 10px', borderRadius: 999, background:'var(--bg-sunk)', border:'1px solid var(--line-2)', fontSize: 12, fontWeight: 500, color:'var(--ink-2)', display:'inline-flex', alignItems:'center', gap: 6, whiteSpace:'nowrap' };
  if (started && !more) {
    return (
      <div style={{ display:'flex', margin:'0 0 8px' }}>
        <button onClick={() => setMore(true)} aria-expanded={false} style={chipS}><Icon name="plus" size={12}/>{L(lang,'Más formas de añadir','More ways to add')}</button>
      </div>
    );
  }
  return (
    <div className="fx-noscroll" style={{ display:'flex', gap: 6, overflowX:'auto', margin:'0 -2px 8px', padding:'0 2px' }}>
      {tools.map(t => (
        <button key={t.k} onClick={t.on} style={chipS}>
          <Icon name={t.icon} size={13}/>{t.label}
        </button>
      ))}
      {started && <button onClick={() => setMore(false)} aria-label={L(lang,'Ocultar','Hide')} style={{ ...chipS, padding:'0 10px' }}><Icon name="x" size={11}/></button>}
    </div>
  );
}

// Items the winning store doesn't have today, and where to get them.
function CoverageNote({ winner, basket, appliedSubs }) {
  const ctx = React.useContext(AppCtx);
  const lang = ctx.lang;
  const missing = missingAt(winner.id, basket);
  const store = STORES.find(s => s.id === winner.id);
  if (missing.length === 0) {
    return (
      <div style={{ display:'flex', alignItems:'center', gap: 8, fontSize: 12, color:'var(--sage-ink)' }}>
        <Icon name="check" size={12}/>{L(lang, `${store.name} tiene los ${basket.length} productos de tu cesta`, `${store.name} has all ${basket.length} items in your basket`)}
      </div>
    );
  }
  return (
    <div style={{ padding:'10px 12px', borderRadius: 12, background:'var(--warn-soft)', border:'1px solid var(--warn-line)' }}>
      <div style={{ display:'flex', alignItems:'center', gap: 7, fontSize: 13, fontWeight: 500, color:'var(--warn-ink)' }}>
        <Icon name="warn" size={13}/>
        {L(lang, `Sin stock hoy en ${store.name}: ${missing.length}`, `Out of stock at ${store.name} today: ${missing.length}`)}
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap: 4, marginTop: 6 }}>
        {missing.map(b => {
          const p = CATALOG[b.id];
          const alt = STORES.filter(s => !(MISSING[s.id] || []).includes(b.id)).map(s => ({ s, c: itemCost(b, s.id, appliedSubs) })).sort((a, z) => a.c - z.c)[0];
          return (
            <div key={b.id} style={{ display:'flex', alignItems:'center', gap: 8, fontSize: 12, color:'var(--ink-2)' }}>
              <PThumb id={b.id} size={24} radius={6}/>
              <span style={{ flex: 1, minWidth: 0 }}>{p.name[lang]}</span>
              {alt && <span style={{ whiteSpace:'nowrap' }}>{L(lang,'en','at')} <b style={{ fontWeight: 500, color:'var(--ink)' }}>{alt.s.name}</b> <span className="mono">{eur(alt.c)}</span></span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SplitCard({ winner, basket, appliedSubs, variant }) {
  const ctx = React.useContext(AppCtx);
  const lang = ctx.lang;
  const [open, setOpen] = useState(false);
  const split = useMemo(() => bestSplit(basket, appliedSubs), [basket, appliedSubs]);
  if (!split || basket.length < 2) return null;
  const diff = winner.total - split.total;
  const worth = diff >= Math.max(3, winner.total * 0.05);
  if (!worth) return null;
  const names = split.parts.map(p => STORES.find(s => s.id === p.id).name);
  return (
    <div style={{ ...fxCard, padding: '12px 14px', background: worth ? 'var(--bg-panel)' : 'var(--bg-sunk)' }}>
      <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: worth ? 'var(--sage-soft)' : 'var(--bg-panel)', color: worth ? 'var(--sage-ink)' : 'var(--ink-3)', border:'1px solid var(--line-2)', display:'inline-flex', alignItems:'center', justifyContent:'center', flexShrink: 0 }}><Icon name="split" size={15}/></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500 }}>
            {worth ? L(lang, `Divide en ${names[0]} + ${names[1]}`, `Split ${names[0]} + ${names[1]}`) : L(lang, 'Dividir la cesta no compensa hoy', 'Splitting doesn’t pay off today')}
          </div>
          <div style={{ fontSize: 12, color:'var(--ink-3)', marginTop: 1 }}>
            {worth
              ? <>{L(lang,'Ahorras','You save')} <b style={{ color:'var(--sage-ink)', fontWeight: 600 }}>{eur(diff)}</b> {L(lang,'más, envíos incluidos','more, delivery included')}</>
              : L(lang, `El mejor reparto (${names.join(' + ')}) sale ${eur(-diff)} más caro por el envío extra`, `Best split (${names.join(' + ')}) costs ${eur(-diff)} more due to the extra delivery`)}
          </div>
        </div>
        <button onClick={() => setOpen(o => !o)} aria-expanded={open} style={{ ...fxBtnGhost, minHeight: 36, padding:'0 10px', fontSize: 12 }}>
          {open ? L(lang,'Ocultar','Hide') : L(lang,'Detalle','Details')}
        </button>
      </div>
      {open && (
        <div style={{ display:'grid', gridTemplateColumns: variant === 'mobile' ? '1fr' : 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8, marginTop: 12 }}>
          {split.parts.map(part => {
            const st = STORES.find(s => s.id === part.id);
            return (
              <div key={part.id} style={{ padding:'10px 12px', borderRadius: 12, background:'var(--bg-sunk)', border:'1px solid var(--line-2)' }}>
                <div style={{ display:'flex', alignItems:'center', gap: 8, marginBottom: 6 }}>
                  <StoreMark store={st} size={22}/>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{st.name}</span>
                  <span className="mono" style={{ fontSize: 12 }}>{eur(part.total)}</span>
                </div>
                {part.lines.map(b => (
                  <div key={b.id} style={{ display:'flex', gap: 6, fontSize: 12, color:'var(--ink-2)', padding:'2px 0' }}>
                    <PThumb id={b.id} size={22} radius={5}/>
                    <span style={{ flex: 1, minWidth: 0 }}>{CATALOG[b.id].name[lang]} <span className="mono" style={{ color:'var(--ink-3)' }}>×{b.qty}</span></span>
                  </div>
                ))}
                <div style={{ fontSize: 12, color:'var(--ink-3)', marginTop: 4 }}>{tr('shipping', lang)}: {part.shipping === 0 ? tr('freeShipping', lang) : eur(part.shipping)}</div>
              </div>
            );
          })}
          {worth && (
            <button onClick={() => ctx.openOverlay('split', { split })} style={{ ...fxBtnPrimary, gridColumn:'1 / -1' }}>
              {L(lang,'Pedir en los 2 supers','Order from both stores')} · {eur(split.total)} <Icon name="arrow" size={12}/>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Stale / loading price feed marker for a store tile.
function StoreStatus({ id, compact }) {
  const ctx = React.useContext(AppCtx);
  const lang = ctx.lang;
  const st = (ctx.storeStatus || {})[id];
  if (!st || st === 'ok') return null;
  if (st === 'loading') return <div className="fx-shimmer" style={{ height: 10, borderRadius: 4, width: compact ? 60 : '80%' }}></div>;
  return (
    <button onClick={() => ctx.retryStore(id)} style={{ display:'inline-flex', alignItems:'center', gap: 4, fontSize: 12, color:'var(--warn-ink)', fontWeight: 500, padding:'3px 0', textAlign:'left' }}>
      <Icon name="warn" size={10}/>{L(lang,'Precios de hace 3 h · Reintentar','Prices 3 h old · Retry')}
    </button>
  );
}

function SlotPicker({ value, onChange }) {
  const ctx = React.useContext(AppCtx);
  const lang = ctx.lang;
  const [day, setDay] = useState(value ? value.day : 1);
  return (
    <div>
      <div style={{ ...fxKicker, marginBottom: 8 }}>{L(lang,'Franja de entrega','Delivery slot')}</div>
      <div role="tablist" style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap: 6, marginBottom: 8 }}>
        {SLOT_DAYS.map((d, i) => (
          <button key={d.id} role="tab" aria-selected={day === i} onClick={() => setDay(i)} style={{ minHeight: 44, borderRadius: 12, border:`1px solid ${day === i ? 'var(--ink)' : 'var(--line)'}`, background: day === i ? 'var(--ink)' : 'var(--bg-panel)', color: day === i ? 'var(--bg)' : 'var(--ink)', fontSize: 13, fontWeight: 500, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', lineHeight: 1.2 }}>
            {d[lang]}<span style={{ fontSize: 12, opacity: 0.75, fontWeight: 400 }}>{d.sub[lang]}</span>
          </button>
        ))}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap: 6 }}>
        {SLOT_TIMES.map((t, ti) => {
          const fee = SLOT_GRID[day][ti];
          const full = fee === null;
          const sel = value && value.day === day && value.time === ti;
          return (
            <button key={t} disabled={full} aria-pressed={sel} onClick={() => onChange({ day, time: ti, fee })} style={{ minHeight: 48, padding:'6px 10px', borderRadius: 12, textAlign:'left', border:`1px solid ${sel ? 'var(--ink)' : 'var(--line)'}`, boxShadow: sel ? 'inset 0 0 0 1px var(--ink)' : 'none', background: full ? 'var(--bg-sunk)' : 'var(--bg-panel)', color: full ? 'var(--ink-3)' : 'var(--ink)', cursor: full ? 'not-allowed' : 'pointer', display:'flex', flexDirection:'column', justifyContent:'center' }}>
              <span className="mono" style={{ fontSize: 13, fontWeight: 500, textDecoration: full ? 'line-through' : 'none' }}>{t}</span>
              <span style={{ fontSize: 12, color: full ? 'var(--ink-3)' : fee === 0 ? 'var(--sage-ink)' : 'var(--ink-2)' }}>
                {full ? L(lang,'Completa','Full') : fee === 0 ? L(lang,'Sin coste extra','No extra cost') : `+${eur(fee)}`}
              </span>
            </button>
          );
        })}
      </div>
      <PricePromise/>
    </div>
  );
}
const slotLabel = (slot, lang) => slot ? `${SLOT_DAYS[slot.day][lang]} ${SLOT_TIMES[slot.time]}` : '';

function FxToast({ variant }) {
  const ctx = React.useContext(AppCtx);
  if (!ctx.notice) return null;
  const mobile = variant === 'mobile';
  return (
    <div role="status" aria-live="polite" key={ctx.notice.k} style={{ position: mobile ? 'absolute' : 'fixed', left: mobile ? 12 : '50%', right: mobile ? 12 : 'auto', bottom: mobile ? 78 : 24, transform: mobile ? 'none' : 'translateX(-50%)', zIndex: 260, animation:'toastIn 260ms cubic-bezier(.2,.7,.3,1)' }}>
      <div style={{ display:'flex', alignItems:'center', gap: 10, padding:'11px 14px', borderRadius: 12, background:'var(--ink)', color:'var(--bg)', fontSize: 13, fontWeight: 500, boxShadow:'0 10px 30px oklch(0.2 0.01 60 / 0.25)', maxWidth: 440 }}>
        <Icon name="check" size={13}/><span style={{ flex: 1 }}>{ctx.notice.text}</span>
        {ctx.notice.undo && <button onClick={() => { if (mobile) feedback('undo'); ctx.notice.undo(); ctx.notify(null); }} style={{ color:'var(--bg)', textDecoration:'underline', textUnderlineOffset: 3, fontSize: 12, padding:'4px 2px' }}>{L(ctx.lang,'Deshacer','Undo')}</button>}
      </div>
    </div>
  );
}

// Compact "order on its way" pill — web top bar + mobile You tab.
function ActiveOrderPill() {
  const ctx = React.useContext(AppCtx);
  const o = ctx.activeOrder;
  if (!o) return null;
  const step = orderStep(o, ctx.now);
  const st = STORES.find(s => s.id === o.stores[0]);
  return (
    <button onClick={() => ctx.openOverlay('tracking')} aria-label={ORDER_STEPS[step][ctx.lang]} title={ORDER_STEPS[step][ctx.lang]} style={{ height: 32, padding:'0 10px 0 4px', borderRadius: 999, background:'var(--sage-soft)', border:'1px solid var(--sage-line)', color:'var(--sage-ink)', display:'inline-flex', alignItems:'center', gap: 7, fontSize: 12, fontWeight: 500, whiteSpace:'nowrap' }}>
      <StoreMark store={st} size={24}/><span className="wtb-lbl">{ORDER_STEPS[step][ctx.lang]}</span>
    </button>
  );
}
// Demo clock: each tracking step advances every 8 s after the order is placed.
const orderStep = (o, now) => Math.min(ORDER_STEPS.length - 1, Math.floor(((now || Date.now()) - o.placedAt) / 8000));

Object.assign(window, { Sheet, QuickTools, CoverageNote, SplitCard, StoreStatus, SlotPicker, slotLabel, FxToast, ActiveOrderPill, orderStep, fxKicker, fxBtnPrimary, fxBtnGhost, fxCard });
