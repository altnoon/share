// Basket summary — category-grouped list with quantities, swap affordances.
function BasketPane({ lang, basket, onRemove, onQtyChange, appliedSubs, pref }) {
  const ctx = React.useContext(AppCtx);
  const hasMeals = basket.some(b => (b.meals || []).length);
  const [by, setBy] = useState('meal');
  const mode = hasMeals ? by : 'aisle';
  const grouped = useMemo(() => {
    const g = {};
    if (mode === 'meal') {
      basket.forEach(b => { const k = (b.meals && b.meals[0]) || '_other'; (g[k] = g[k] || []).push(b); });
      if (g._other) { const o = g._other; delete g._other; g._other = o; }
      return g;
    }
    Object.keys(CATEGORY_META).forEach(k => { g[k] = []; });
    basket.forEach(b => { const c = CATALOG[b.id] ? CATALOG[b.id].category : 'despensa'; (g[c] = g[c] || []).push(b); });
    return g;
  }, [basket, mode]);

  if (basket.length === 0) {
    return <TeachEmpty title={lang === 'es' ? 'Tu cesta está vacía' : 'Your basket is empty'} sub={lang === 'es' ? 'Toca un ejemplo y mira cómo se llena.' : 'Tap an example and watch it fill.'}/>;
  }

  const row = (b) => (
    <BasketRow key={b.id} b={b} lang={lang} appliedSubs={appliedSubs}
      onRemove={() => onRemove(b.id)}
      onQtyChange={(q) => onQtyChange(b.id, q)}
      substituted={appliedSubs.includes(b.id)}/>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', gap: 16 }}>
      <PendingCard/>
      <BasketHelpers/>
      <BasketTools right={hasMeals && <Segment value={by} onChange={setBy} size="sm" options={[{ value:'meal', label: L(lang,'Por plato','By dish') }, { value:'aisle', label: L(lang,'Por pasillo','By aisle') }]}/>}/>
      {mode === 'meal' && Object.entries(grouped).map(([k, items]) => (
        <div key={k}>
          <MealHeader rid={k} count={items.length}/>
          <div style={{ display:'flex', flexDirection:'column', gap: 1 }}>{items.map(row)}</div>
        </div>
      ))}
      {mode === 'aisle' && Object.entries(grouped).map(([cat, items]) => {
        if (items.length === 0) return null;
        const meta = CATEGORY_META[cat];
        return (
          <div key={cat}>
            <div style={{
              display:'flex', alignItems:'center', justifyContent:'space-between',
              fontSize: 11, color:'var(--ink-3)',
              textTransform:'uppercase', letterSpacing:'0.08em', marginBottom: 8,
            }}>
              <span style={{ display:'inline-flex', alignItems:'center', gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius:'50%', background: meta.dot }}/>
                {meta[lang]}
              </span>
              <span className="mono" style={{ fontSize: 10 }}>{items.length}</span>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap: 1 }}>
              {items.map(row)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BasketRow({ b, lang, onRemove, onQtyChange, substituted, appliedSubs }) {
  const p = CATALOG[b.id];
  const cheapestStore = useMemo(() => {
    return Object.entries(p.prices).sort(([,a], [,b]) => a - b)[0];
  }, [p]);
  const cheap = STORES.find(s => s.id === cheapestStore[0]);
  const ctx = React.useContext(AppCtx);
  const [open, setOpen] = useState(false);
  const why = whyItem(b, cheap.id, appliedSubs || [], lang);
  const sig = priceSignal(b.id, ctx.alerts);
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const start = useRef(null);
  const onDown = (e) => { if (e.target.closest('button')) return; start.current = { x: e.clientX, y: e.clientY, locked: null }; };
  const onMove = (e) => {
    const s = start.current; if (!s) return;
    const mx = e.clientX - s.x, my = e.clientY - s.y;
    if (s.locked === null && (Math.abs(mx) > 6 || Math.abs(my) > 6)) s.locked = Math.abs(mx) > Math.abs(my) ? 'x' : 'y';
    if (s.locked === 'x') { setDragging(true); setDx(Math.min(0, Math.max(-140, mx))); }
  };
  const onUp = () => {
    if (!start.current) return;
    start.current = null; setDragging(false);
    if (dx < -90) { setDx(-400); setTimeout(onRemove, 180); } else setDx(0);
  };

  return (
    <div style={{ position:'relative', overflow:'hidden', borderBottom: '1px solid var(--line-2)' }}>
    <div style={{ position:'absolute', inset: 0, background:'oklch(0.58 0.17 28)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'flex-end', paddingRight: 18, fontSize: 12, fontWeight: 500, opacity: dx < 0 ? 1 : 0 }}>
      {lang === 'es' ? 'Eliminar' : 'Delete'}
    </div>
    <div onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onPointerLeave={onUp} style={{
      display:'flex', alignItems:'center', gap: 10, padding: '9px 2px',
      background:'var(--bg-panel)', position:'relative', touchAction:'pan-y',
      transform: `translateX(${dx}px)`, transition: dragging ? 'none' : 'transform 200ms cubic-bezier(.2,.7,.3,1)',
      animation: 'rowIn 400ms both',
    }}>
      <style>{`@keyframes rowIn { from { opacity: 0; transform: translateX(-4px) } to { opacity: 1; transform: none } }`}</style>
      <button onClick={() => setOpen(o => !o)} aria-expanded={open} aria-label={`${p.name[lang]} · ${L(lang,'editar','edit')}`} style={{
        width: 40, height: 40, borderRadius: 8, padding: 0, overflow:'hidden',
        border:'1px solid var(--line-2)', flexShrink: 0, display:'flex',
      }}><ProductThumb id={b.id}/></button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display:'flex', alignItems:'center', gap: 6, flexWrap:'wrap' }}>
          <button onClick={() => setOpen(o => !o)} aria-expanded={open} style={{ fontWeight: 500, fontSize: 13, textAlign:'left', display:'inline-flex', alignItems:'center', gap: 4 }}>
            {substituted && p.whiteLabel ? p.whiteLabel.name[lang] : p.name[lang]}
            <span style={{ color:'var(--ink-3)', display:'inline-flex', transform: open ? 'rotate(180deg)' : 'none', transition:'transform 160ms' }}><Icon name="down" size={10}/></span>
          </button>
          {sig && <Pill tone="sage" size="sm"><Icon name={sig.kind === 'alert' ? 'bell' : 'down'} size={9}/>{sig[lang]}</Pill>}
          {b.by && <Pill size="sm" style={{ background:'var(--person-bg)', color:'var(--person-ink)', borderColor:'var(--person-line)' }}>{b.by}</Pill>}
          {substituted && <Pill tone="sage" size="sm"><Icon name="check" size={9}/>{tr('applied', lang)}</Pill>}
          {(ctx.profile.lockBrand || []).includes(b.id) && <Pill size="sm">{L(lang,'Siempre esta marca','Always this brand')}</Pill>}
          {p.seasonal && !substituted && <Pill tone="sage" size="sm">{tr('seasonNow', lang)}</Pill>}
          {p.offer && !substituted && <Pill tone="accent" size="sm">{p.offer[lang]}</Pill>}
        </div>
        <div style={{ fontSize: 12, color:'var(--ink-3)', display:'flex', alignItems:'center', gap:'2px 6px', marginTop: 2, flexWrap:'wrap', minWidth: 0 }}>
          <span className="mono" style={{ whiteSpace:'nowrap' }}>{p.unit[lang]}</span>
          <span>·</span>
          <span style={{ minWidth: 0, overflowWrap:'anywhere' }}>{tr('cheapestAt', lang)} <b style={{ color:'var(--ink-2)', fontWeight: 500 }}>{cheap.name}</b>{why && <span style={{ color:'var(--sage-ink)' }}> · {why}</span>}</span>
          {unitPrice(b.id, cheap.id, lang) && <span className="mono" style={{ minWidth: 0, overflowWrap:'anywhere' }}>{unitPrice(b.id, cheap.id, lang)}</span>}
          <button onClick={() => ctx.openHistory && ctx.openHistory(b.id)} aria-label={L(lang,'Historial de precio','Price history')} style={{ padding: '4px 2px' }}><Sparkline values={p.history} trend={p.trend}/></button>
        </div>
      </div>
      <QtyStepper qty={b.qty} onChange={onQtyChange}/>
      <button onClick={onRemove} title={tr('remove', lang)} aria-label={`${tr('remove', lang)} ${p.name[lang]}`} style={{
        width: 32, height: 32, display:'inline-flex', alignItems:'center', justifyContent:'center', color:'var(--ink-3)', borderRadius: 8,
      }} onMouseOver={e => { e.currentTarget.style.background='var(--bg-sunk)'; e.currentTarget.style.color='var(--ink)'; }}
         onMouseOut={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--ink-3)'; }}>
        <Icon name="x" size={12}/>
      </button>
    </div>
    {open && <ItemEditor b={b} substituted={substituted}/>}
    </div>
  );
}

function QtyStepper({ qty, onChange }) {
  return (
    <div style={{
      display:'inline-flex', alignItems:'center', gap: 0,
      border: '1px solid var(--line)', borderRadius: 7,
      background: 'var(--bg-panel)',
    }}>
      <button aria-label="−" onClick={() => onChange(Math.max(1, qty - 1))} style={stepBtn}>−</button>
      <span className="mono" aria-live="polite" style={{
        minWidth: 20, textAlign:'center', fontSize: 12, color:'var(--ink)',
      }}>{qty}</span>
      <button aria-label="+" onClick={() => onChange(qty + 1)} style={stepBtn}>+</button>
    </div>
  );
}
const stepBtn = {
  width: 30, height: 32, fontSize: 14, color:'var(--ink-2)',
  display:'inline-flex', alignItems:'center', justifyContent:'center',
};

Object.assign(window, { BasketPane });
