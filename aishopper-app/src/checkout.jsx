// Checkout / export screen — deeplink affordance + PDF + WhatsApp + alerts
function CheckoutModal({ lang, winner, basket, storeTotals, appliedSubs, onClose, onSaveList }) {
  const store = STORES.find(s => s.id === winner.id);
  const avg = storeTotals.reduce((s, x) => s + x.total, 0) / storeTotals.length;
  const uId = usualStoreId(React.useContext(AppCtx).profile); const vsUsual = uId !== winner.id;
  const savings = vsUsual ? basketAt(basket, uId) - winner.total : avg - winner.total;
  const savingsSub = vsUsual ? L(lang, `vs. ${STORES.find(s => s.id === uId).name}, tu súper`, `vs. ${STORES.find(s => s.id === uId).name}, your usual`) : tr('vsTypical', lang);
  const [savedAs, setSavedAs] = useState('');
  const [watching, setWatching] = useState([]);
  const ctx = React.useContext(AppCtx);
  const [pick, setPick] = useState(() => defaultFulfil(storeTotals, winner.id));
  const sel = STORES.find(s => s.id === (pick ? pick.store : winner.id));
  const trapRef = useRef(null); useFocusTrap(trapRef);
  useEffect(() => { const k = e => { if (e.key === 'Escape') onClose(); }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, []);
  const confirm = () => { if (!pick) return; onClose(); ctx.openOverlay('handoff', { storeId: pick.store }); };

  return (
    <div role="dialog" aria-modal="true" aria-label={tr('cartReady', lang)} onClick={e => { if (e.target === e.currentTarget) onClose(); }} style={{ position:'fixed', inset: 0, background: 'oklch(0.20 0.01 60 / 0.4)',
      backdropFilter: 'blur(4px)',
      display:'flex', alignItems:'center', justifyContent:'center',
      zIndex: 100, animation: 'fadeIn 200ms',
      padding: 20,
    }}>
      <style>{`@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }`}</style>
      <div ref={trapRef} style={{
        outline: 'none', width: 'min(780px, 100%)', maxHeight: '90vh', overflow:'auto',
        background:'var(--bg-panel)', borderRadius: 20,
        border: '1px solid var(--line)',
        boxShadow: '0 20px 60px oklch(0.2 0.02 60 / 0.2)',
        animation: 'riseIn 260ms cubic-bezier(.2,.7,.3,1)',
      }}>
        <style>{`@keyframes riseIn { from { transform: translateY(12px); opacity: 0 } to { transform: none; opacity: 1 } }`}</style>
        {/* Header */}
        <div style={{
          padding: '18px 24px 16px',
          borderBottom:'1px solid var(--line-2)',
          display:'flex', alignItems:'center', justifyContent:'space-between',
        }}>
          <div>
            <div style={{ fontSize: 11, color:'var(--ink-3)', textTransform:'uppercase', letterSpacing:'0.08em' }}>
              {tr('cartReady', lang)}
            </div>
            <div className="serif" style={{ fontSize: 28, lineHeight: 1.1, letterSpacing:'-0.015em', marginTop: 2 }}>
              {lang === 'es' ? <>Tu cesta en <span style={{ fontStyle:'italic' }}>{sel.name}</span></> : <>Your basket at <span style={{ fontStyle:'italic' }}>{sel.name}</span></>}
            </div>
          </div>
          <button onClick={onClose} aria-label="Cerrar / Close" style={{ width: 44, height: 44, display:'inline-flex', alignItems:'center', justifyContent:'center', color:'var(--ink-3)', borderRadius: 8 }}><Icon name="x" size={16}/></button>
        </div>

        {/* Summary row */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap: 0, borderBottom:'1px solid var(--line-2)' }}>
          <SummaryStat lang={lang} label={tr('totalBasket', lang)} value={eur(winner.total)} serif/>
          <SummaryStat lang={lang} label={tr('savings', lang)} value={eur(savings)} serif tone="sage" subtitle={savingsSub}/>
          <SummaryStat lang={lang} label={L(lang,'Con entrega','With delivery')} value={pick ? eur(pick.total) : '—'} serif subtitle={pick ? sel.name : ''}/>
        </div>

        {/* Mock deeplink preview */}
        <div style={{ padding: '18px 24px' }}>
          <PriceChangeNote basket={basket} storeId={winner.id}/>
          <div style={{ marginTop: 16 }}><DeliveryChooser storeTotals={storeTotals} value={pick} onChange={setPick}/></div>
          <div style={{ marginTop: 16 }}><SubRulesCard basket={basket}/></div>
          {/* Actions */}
          <div style={{ display:'flex', gap: 8, marginTop: 16, flexWrap:'wrap' }}>
            <button onClick={confirm} disabled={!pick} style={{ ...actionBtn, minHeight: 44, background:'var(--ink)', color:'var(--bg)', flex: '1 1 260px', opacity: pick ? 1 : 0.5 }}>
              <Icon name="cart" size={13}/>
              {pick ? <>{L(lang,'Abrir cesta en','Open basket at')} {sel.name} · {eur(pick.total)} <Icon name="arrow" size={12}/></> : L(lang,'Elige cómo te llega','Pick how it reaches you')}
            </button>
            <button style={actionBtn}>
              <Icon name="pdf" size={13}/>{tr('export', lang)}
            </button>
            <button style={actionBtn} onClick={() => ctx.openOverlay('share')}>
              <Icon name="wa" size={13}/>{tr('whatsapp', lang)}
            </button>
          </div>

          <CartPeek n={basket.length}>
          <div style={{
            border:'1px solid var(--line)', borderRadius: 12, overflow:'hidden',
            background:'var(--bg-sunk)',
          }}>
            <div style={{
              padding: '8px 12px', borderBottom:'1px solid var(--line-2)',
              display:'flex', alignItems:'center', gap: 10, background:'var(--bg-panel)',
            }}>
              <div style={{ display:'flex', gap: 4 }}>
                <span style={{ width:8, height:8, borderRadius:'50%', background:'oklch(0.78 0.12 30)' }}/>
                <span style={{ width:8, height:8, borderRadius:'50%', background:'oklch(0.85 0.10 85)' }}/>
                <span style={{ width:8, height:8, borderRadius:'50%', background:'var(--sage-line)' }}/>
              </div>
              <div style={{
                flex: 1, padding: '3px 10px', borderRadius: 6,
                background:'var(--bg-sunk)', fontSize: 12, color:'var(--ink-3)',
              }} className="mono">
                {store.name.toLowerCase().replace(/\s|é/g, '').replace('í','i').replace('á','a')}.es/cart?list=ai-shopper-{winner.id}-4f2a
              </div>
            </div>
            <div style={{ padding: '14px 16px', display:'flex', flexDirection:'column', gap: 8, maxHeight: 200, overflow:'auto' }}>
              {basket.map(b => {
                const p = CATALOG[b.id];
                const substituted = appliedSubs.includes(b.id);
                return (
                  <div key={b.id} style={{
                    display:'flex', alignItems:'center', gap: 10,
                    fontSize: 12, color:'var(--ink-2)',
                  }}>
                    <PThumb id={b.id} size={24} radius={6}/>
                    <span style={{ flex: 1 }}>
                      {substituted && p.whiteLabel ? p.whiteLabel.name[lang] : p.name[lang]}
                      <span className="mono" style={{ color:'var(--ink-3)', marginLeft: 6 }}>×{b.qty}</span>
                    </span>
                    <span className="mono" style={{ color:'var(--ink)' }}>{eur(p.prices[winner.id] * b.qty * (substituted ? 0.88 : 1))}</span>
                  </div>
                );
              })}
              <div style={{ borderTop:'1px dashed var(--line)', marginTop: 4, paddingTop: 8, display:'flex', alignItems:'center', gap: 10, fontSize: 12 }}>
                <span style={{ flex:1, color:'var(--ink-3)' }}>{tr('shipping', lang)}</span>
                <span className="mono">{winner.shipping === 0 ? tr('freeShipping', lang) : eur(winner.shipping)}</span>
              </div>
            </div>
          </div>

          </CartPeek>
          {/* Save list + watch price */}
          <div style={{
            marginTop: 14, padding: '12px 14px',
            borderRadius: 12, background:'var(--bg-sunk)', border:'1px solid var(--line-2)',
          }}>
            <div style={{ display:'flex', alignItems:'center', gap: 10, marginBottom: 10 }}>
              <Icon name="bell" size={13}/>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{tr('savedLists', lang)}</div>
                <div style={{ fontSize: 12, color:'var(--ink-3)' }}>
                  {lang === 'es' ? 'Te aviso cuando bajen los precios de tus productos habituales.' : 'We\'ll alert you when your regulars drop in price.'}
                </div>
              </div>
              {savedAs ? (
                <Pill tone="sage" size="sm"><Icon name="check" size={10}/>{savedAs}</Pill>
              ) : (
                <button onClick={() => { setSavedAs(tr('listFrequent', lang)); onSaveList && onSaveList(); }}
                  style={{ ...actionBtn, padding: '6px 10px', fontSize: 12 }}>
                  <Icon name="plus" size={11}/>
                  {lang === 'es' ? 'Guardar esta lista' : 'Save this list'}
                </button>
              )}
            </div>
            <div style={{ display:'flex', flexWrap:'wrap', gap: 6 }}>
              {basket.slice(0, 5).map(b => {
                const p = CATALOG[b.id];
                const w = watching.includes(b.id);
                return (
                  <button key={b.id} onClick={() => setWatching(w ? watching.filter(x => x !== b.id) : [...watching, b.id])}
                    style={{
                      display:'inline-flex', alignItems:'center', gap: 5,
                      padding: '4px 9px', borderRadius: 999, fontSize: 12,
                      background: w ? 'var(--accent-soft)' : 'var(--bg-panel)',
                      color: w ? 'var(--accent-ink)' : 'var(--ink-2)',
                      border: `1px solid ${w ? 'var(--accent-line)' : 'var(--line)'}`,
                    }}>
                    <Icon name="bell" size={10}/>
                    <span>{p.emoji}</span>
                    <span>{w ? tr('watching', lang) : tr('watchPrice', lang)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryStat({ label, value, subtitle, serif, tone }) {
  const color = tone === 'sage' ? 'var(--sage)' : 'var(--ink)';
  return (
    <div style={{
      padding: '14px 20px',
      borderRight: '1px solid var(--line-2)',
    }}>
      <div style={{ fontSize: 11, color:'var(--ink-3)', textTransform:'uppercase', letterSpacing:'0.08em' }}>
        {label}
      </div>
      <div className={serif ? 'serif' : ''} style={{
        fontSize: serif ? 26 : 20, color, lineHeight: 1.1, marginTop: 4, letterSpacing:'-0.01em',
      }}>{value}</div>
      {subtitle && <div style={{ fontSize: 12, color:'var(--ink-3)', marginTop: 2 }}>{subtitle}</div>}
    </div>
  );
}

const actionBtn = { ...fxBtnGhost, minHeight: 40, padding: '0 13px', fontSize: 12 };

Object.assign(window, { CheckoutModal });
