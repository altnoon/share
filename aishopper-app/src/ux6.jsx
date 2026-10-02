// Round 6 — store handoff end-state. Two modes decided by the feasibility test:
// 'cart' = retailer accepts a pre-filled cart; 'list' = we open the store with a checklist alongside.
function handoffMode(tweaks) { return (tweaks && tweaks.handoff) || (window.__TWEAKS && window.__TWEAKS.handoff) || 'cart'; }

function HandoffSheet({ variant, onClose, data }) {
  const ctx = React.useContext(AppCtx); const lang = ctx.lang;
  const store = STORES.find(s => s.id === (data && data.storeId || (ctx.winner && ctx.winner.id)));
  const mode = handoffMode();
  const items = ctx.basket;
  const total = ctx.winner ? ctx.winner.total : 0;
  const [phase, setPhase] = useState('opening'); // opening → filled | partial
  const [got, setGot] = useState([]);
  const miss = items.length > 4 ? [items[Math.min(2, items.length - 1)].id] : [];
  useEffect(() => { const t = setTimeout(() => setPhase(mode === 'cart' ? (miss.length ? 'partial' : 'filled') : 'list'), 1400); return () => clearTimeout(t); }, []);
  const host = store.name.toLowerCase().replace(/\s|é/g, '').replace('í','i').replace('á','a') + '.es';
  const browserBar = (
    <div style={{ padding:'8px 12px', borderBottom:'1px solid var(--line-2)', display:'flex', alignItems:'center', gap: 10, background:'var(--bg-panel)' }}>
      <StoreMark store={store} size={20}/>
      <div className="mono" style={{ flex: 1, padding:'4px 10px', borderRadius: 6, background:'var(--bg-sunk)', fontSize: 12, color:'var(--ink-3)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{host}/{mode === 'cart' ? 'cesta' : 'buscar'}</div>
      {phase === 'opening' && <span className="fx-shimmer" style={{ width: 54, height: 14, borderRadius: 4 }}></span>}
    </div>
  );
  const row = (b, state) => { const p = CATALOG[b.id]; const sub = ctx.appliedSubs.includes(b.id) && p.whiteLabel; return (
    <div key={b.id} style={{ display:'flex', alignItems:'center', gap: 10, minHeight: 44, padding:'4px 0', borderBottom:'1px solid var(--line-2)', opacity: state === 'pending' ? 0.45 : 1 }}>
      <span style={{ width: 32, height: 32, borderRadius: 6, overflow:'hidden', flexShrink: 0, display:'flex', border:'1px solid var(--line-2)' }}><ProductThumb id={b.id}/></span>
      <span style={{ flex: 1, minWidth: 0, fontSize: 13 }}>{sub ? p.whiteLabel.name[lang] : p.name[lang]} <span className="mono" style={{ color:'var(--ink-3)' }}>×{b.qty}</span></span>
      {state === 'ok' && <span style={{ color:'var(--sage)', display:'inline-flex' }}><Icon name="check" size={13}/></span>}
      {state === 'miss' && <Pill tone="warn" size="sm">{L(lang,'no encontrado','not found')}</Pill>}
      {state === 'pending' && <span className="fx-shimmer" style={{ width: 14, height: 14, borderRadius: 7 }}></span>}
    </div>
  ); };
  const title = mode === 'cart'
    ? (phase === 'opening' ? L(lang,'Llenando tu carrito…','Filling your cart…') : phase === 'partial' ? L(lang, `Carrito listo, falta ${miss.length}`, `Cart ready, ${miss.length} missing`) : L(lang,'Carrito listo','Cart is ready'))
    : (phase === 'opening' ? L(lang, `Abriendo ${store.name}…`, `Opening ${store.name}…`) : L(lang,'Tu lista, a tu lado','Your list, alongside'));
  return (
    <Sheet variant={variant} onClose={onClose} width={520} kicker={`${L(lang,'Último paso','Last step')} · ${store.name}`} title={title}
      footer={phase === 'opening' ? null : mode === 'cart' ? (
        <div style={{ display:'flex', flexDirection:'column', gap: 8 }}>
          <button onClick={() => { ctx.notify(L(lang, `Pagas en ${store.name}. Te aviso cuando salga el pedido.`, `You pay at ${store.name}. I’ll ping you when it ships.`)); onClose(); }} style={{ ...fxBtnPrimary, width:'100%' }}>{L(lang, `Pagar en ${store.name}`, `Pay at ${store.name}`)} · {eur(total)} <Icon name="arrow" size={12}/></button>
          <div style={{ fontSize: 12, color:'var(--ink-3)', textAlign:'center' }}>{L(lang,'El pago lo hace el súper. Nosotros no vemos tu tarjeta.','The store takes payment. We never see your card.')}</div>
        </div>
      ) : (
        <div style={{ display:'flex', gap: 8 }}>
          <button onClick={() => ctx.openOverlay('instore')} style={fxBtnGhost}><Icon name="cart" size={12}/>{L(lang,'Modo tienda','In-store mode')}</button>
          <button onClick={() => { ctx.notify(L(lang, `Lista fijada sobre ${store.name}`, `List pinned over ${store.name}`)); onClose(); }} style={{ ...fxBtnPrimary, flex: 1 }}>{L(lang,'Abrir y fijar la lista','Open with list pinned')} <Icon name="arrow" size={12}/></button>
        </div>
      )}>
      <div style={{ border:'1px solid var(--line)', borderRadius: 12, overflow:'hidden', background:'var(--bg-sunk)' }}>
        {browserBar}
        <div style={{ padding:'6px 12px 4px' }}>
          {items.map(b => row(b, phase === 'opening' ? 'pending' : (mode === 'cart' && miss.includes(b.id)) ? 'miss' : 'ok'))}
        </div>
        {phase !== 'opening' && mode === 'cart' && (
          <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 12px', fontSize: 13, background:'var(--bg-panel)', borderTop:'1px solid var(--line-2)' }}>
            <span style={{ color:'var(--ink-2)' }}>{L(lang,'Total en el súper','Store total')}</span>
            <span className="serif" style={{ fontSize: 18 }}>{eur(total - miss.reduce((s, id) => s + itemCost(items.find(b => b.id === id), store.id, ctx.appliedSubs), 0))}</span>
          </div>
        )}
      </div>
      {phase === 'partial' && miss.map(id => {
        const alt = Object.keys(CATALOG).find(k => k !== id && CATALOG[k].category === CATALOG[id].category && !ctx.basket.some(b => b.id === k));
        return (
          <div key={id} style={{ marginTop: 12, padding:'12px 14px', borderRadius: 12, background:'var(--warn-soft)', border:'1px solid var(--warn-line)', display:'flex', flexDirection:'column', gap: 8 }}>
            <div style={{ fontSize: 13, color:'var(--warn-ink)' }}>{L(lang, `${store.name} no tiene «${CATALOG[id].name.es}» hoy.`, `${store.name} doesn’t have “${CATALOG[id].name.en}” today.`)}</div>
            <div style={{ display:'flex', gap: 8, flexWrap:'wrap' }}>
              {alt && <button onClick={() => { ctx.actions.swapItem(id, alt); setPhase('filled'); }} style={{ ...fxBtnGhost, minHeight: 36, fontSize: 12 }}>{L(lang, `Cambiar por ${CATALOG[alt].name.es}`, `Swap for ${CATALOG[alt].name.en}`)}</button>}
              <button onClick={() => { ctx.actions.removeFromBasket(id); setPhase('filled'); }} style={{ ...fxBtnGhost, minHeight: 36, fontSize: 12, background:'transparent' }}>{L(lang,'Quitar','Drop it')}</button>
            </div>
          </div>
        );
      })}
      {phase === 'list' && (
        <div style={{ marginTop: 12, fontSize: 13, color:'var(--ink-2)', lineHeight: 1.5 }}>
          {L(lang, `${store.name} no deja rellenar el carrito desde fuera. Abro su web y dejo tu lista flotando: marca cada producto al añadirlo y te aviso si el total se desvía del nuestro.`, `${store.name} doesn’t accept an external cart. I’ll open their site with your list floating alongside: tick each item as you add it, and I’ll flag it if their total drifts from ours.`)}
        </div>
      )}
      {phase !== 'opening' && (
        <div style={{ marginTop: 12, fontSize: 12, color:'var(--ink-3)', display:'flex', alignItems:'center', gap: 6 }}><Icon name="check" size={11}/>{L(lang, `Precios de ${store.name} comprobados ahora mismo`, `${store.name} prices checked just now`)}</div>
      )}
    </Sheet>
  );
}

Object.assign(window, { HandoffSheet, handoffMode });
