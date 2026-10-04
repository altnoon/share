// Spatial "shelf" comparison — stores laid out as cards you scan across.
// Bar race on recalculation. Signature savings reveal uses AnimatedNumber + serif numerals.

function ComparePane({ lang, basket, pref, appliedSubs, storeTotals, winner, compareView, calculating, onCheckout, onViewChange }) {
  const view = compareView || 'ladder';
  return (
    <div style={{ display:'flex', flexDirection:'column', gap: 14 }}>
      {calculating && !winner && (
        <div className="serif" style={{ fontSize: 26, lineHeight: 1.05, fontStyle:'italic', color:'var(--ink-3)' }}>{tr('calculating', lang)}</div>
      )}

      {winner && basket.length > 0 && (
        <>
          <HeroCard winner={winner} storeTotals={storeTotals} basket={basket} appliedSubs={appliedSubs} variant="web"/>
          <CoverageNote winner={winner} basket={basket} appliedSubs={appliedSubs}/>
          <SplitCard winner={winner} basket={basket} appliedSubs={appliedSubs} variant="web"/>
        </>
      )}

      {winner && basket.length > 0 && (
        <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', gap: 12, flexWrap:'wrap', marginTop: 4 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{L(lang, `Los ${storeTotals.length} supers`, `All ${storeTotals.length} stores`)}</div>
            <div style={{ fontSize: 11, color:'var(--ink-3)', marginTop: 1 }}>{L(lang, 'misma cesta · con envío · tu CP', 'same basket · incl. delivery · your postcode')}</div>
          </div>
          <Segment value={view} onChange={onViewChange} size="sm" options={[
            { value: 'ladder', label: L(lang, 'Ranking', 'Ranking') },
            { value: 'shelf', label: tr('shelf', lang) },
            { value: 'bars',  label: tr('bars', lang) },
            { value: 'table', label: tr('table', lang) },
          ]}/>
        </div>
      )}

      {winner && basket.length > 0 && (
        <>
          {view === 'ladder' && <MobileStoreLadder lang={lang} storeTotals={storeTotals} winner={winner} basket={basket} appliedSubs={appliedSubs} calculating={calculating} bare/>}
          {view === 'shelf' && <ShelfView lang={lang} storeTotals={storeTotals} winner={winner} calculating={calculating}/>}
          {view === 'bars'  && <BarsView  lang={lang} storeTotals={storeTotals} winner={winner} calculating={calculating}/>}
          {view === 'table' && <TableView lang={lang} storeTotals={storeTotals} winner={winner} basket={basket} appliedSubs={appliedSubs}/>}
        </>
      )}
      {winner && basket.length > 0 && <StoresAsk/>}
    </div>
  );
}

function WinnerCard({ lang, winner, storeTotals, onCheckout }) {
  const store = STORES.find(s => s.id === winner.id);
  const worst = storeTotals[storeTotals.length - 1];
  const savings = worst.total - winner.total;
  const avg = storeTotals.reduce((s, x) => s + x.total, 0) / storeTotals.length;
  const savingsVsAvg = avg - winner.total;

  return (
    <div style={{
      position:'relative', overflow:'hidden',
      border:'1px solid var(--line)', borderRadius: 12,
      background: 'linear-gradient(180deg, var(--bg-panel) 0%, var(--bg-sunk) 100%)',
      padding: '18px 20px',
    }}>
      <div style={{ position:'absolute', inset: 0, pointerEvents:'none',
        background: `radial-gradient(600px 180px at 85% 0%, oklch(0.96 0.04 ${store.hue} / 0.6), transparent 70%)` }}/>

      <div style={{ position:'relative', display:'flex', alignItems:'flex-start', gap: 20, flexWrap:'wrap' }}>
        {/* Left — store + total */}
        <div style={{ flex: '1 1 280px', minWidth: 240 }}>
          <div style={{ display:'flex', alignItems:'center', gap: 10, marginBottom: 12 }}>
            <StoreMark store={store} size={32}/>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15, letterSpacing:'-0.01em' }}>{store.name}</div>
              <div style={{ fontSize: 12, color:'var(--ink-3)' }}>
                {tr('delivery', lang)} {tr('eta', lang)} {store.eta} · {Math.round(store.coverage*100)}% {tr('coverage', lang)}
              </div>
            </div>
          </div>

          <div style={{ display:'flex', alignItems:'baseline', gap: 10, marginBottom: 6 }}>
            <div style={{ fontSize: 11, color:'var(--ink-3)', textTransform:'uppercase', letterSpacing:'0.08em' }}>
              {tr('total', lang)}
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'baseline', gap: 12 }}>
            <div className="serif" style={{ fontSize: 52, lineHeight: 1, letterSpacing:'-0.02em', whiteSpace:'nowrap' }}>
              <AnimatedNumber value={winner.total} decimals={2}/>
              <span style={{ fontSize: 32, marginLeft: 6, color:'var(--ink-2)' }}>€</span>
            </div>
          </div>
          <div style={{ marginTop: 6, fontSize: 12, color:'var(--ink-3)', display:'flex', gap: 10, flexWrap:'wrap' }}>
            <span>{tr('shipping', lang)}: <b style={{ color:'var(--ink-2)', fontWeight:500 }}>{winner.shipping === 0 ? tr('freeShipping', lang) : eur(winner.shipping)}</b></span>
            {store.note === 'prime' && <span style={{ color:'var(--ink-3)' }}>· Prime</span>}
            <LoyaltyNote storeId={store.id}/>
          </div>
        </div>

        {/* Right — savings reveal */}
        <div style={{ flex: '0 0 auto', minWidth: 200, display:'flex', flexDirection:'column', gap: 8 }}>
          <SavingsDial savings={savings} savingsVsAvg={savingsVsAvg} lang={lang}/>
          <button onClick={onCheckout} style={{
            marginTop: 4, padding: '10px 14px', borderRadius: 12,
            background:'var(--ink)', color:'var(--bg)',
            fontSize: 13, fontWeight: 500,
            display:'inline-flex', alignItems:'center', justifyContent:'center', gap: 8,
          }}>
            {tr('checkout', lang)} <Icon name="arrow" size={13}/>
          </button>
        </div>
      </div>
    </div>
  );
}

function SavingsDial({ savings, savingsVsAvg, lang }) {
  const pct = Math.max(0, Math.min(1, savings / 30));
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <div style={{
      display:'flex', alignItems:'center', gap: 14,
      padding: '10px 12px', borderRadius: 12,
      background:'var(--bg-panel)', border:'1px solid var(--line-2)',
    }}>
      <div style={{ position:'relative', width: 80, height: 80, flexShrink: 0 }}>
        <svg width="80" height="80" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r={r} fill="none" stroke="var(--line)" strokeWidth="6"/>
          <circle cx="40" cy="40" r={r} fill="none" stroke="var(--sage)" strokeWidth="6"
            strokeDasharray={`${c*pct} ${c}`} strokeLinecap="round"
            transform="rotate(-90 40 40)"
            style={{ transition: 'stroke-dasharray 900ms cubic-bezier(.2,.7,.3,1)' }}/>
        </svg>
        <div style={{
          position:'absolute', inset: 0, display:'flex', alignItems:'center', justifyContent:'center',
          flexDirection:'column',
        }}>
          <div className="serif" style={{ fontSize: 22, lineHeight: 1, color:'var(--sage)' }}>
            <AnimatedNumber value={savings} decimals={2} suffix="€"/>
          </div>
        </div>
      </div>
      <div>
        <div style={{ fontSize: 11, color:'var(--ink-3)', textTransform:'uppercase', letterSpacing:'0.06em' }}>
          {tr('youSave', lang)}
        </div>
        <div style={{ fontSize: 13, color:'var(--ink-2)', marginTop: 2 }}>
          {tr('vsWorst', lang)}
        </div>
        <div style={{ fontSize: 12, color:'var(--ink-3)', marginTop: 4 }}>
          {eur(savingsVsAvg)} {tr('vsAvg', lang)}
        </div>
      </div>
    </div>
  );
}

function LoyaltyNote({ storeId }) {
  const ctx = React.useContext(AppCtx);
  const card = LOYALTY.find(c => c.id === storeId && ((ctx.profile && ctx.profile.cards) || []).includes(c.id));
  if (!card) return null;
  return <span style={{ color:'var(--accent-ink)' }}>· {card.name} {L(ctx.lang, 'se aplica en caja', 'applied at checkout')}</span>;
}

// — SHELF VIEW — stores as cards that wrap, winner highlighted, spatial scan.
function ShelfView({ lang, storeTotals, winner, calculating }) {
  const ctx = React.useContext(AppCtx);
  const fav = (ctx.profile && ctx.profile.fav) || [];
  return (
    <div style={{
      display:'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(124px, 1fr))',
      gap: 8,
    }}>
      {storeTotals.map((s, i) => {
        const store = STORES.find(x => x.id === s.id);
        const isWinner = winner && s.id === winner.id;
        const rank = i + 1;
        return (
          <div key={s.id} style={{
            position:'relative',
            padding: '12px 10px 10px',
            borderRadius: 12,
            background: isWinner ? 'var(--bg-panel)' : 'var(--bg-sunk)',
            border: `1px solid ${isWinner ? 'var(--ink)' : 'var(--line-2)'}`,
            display:'flex', flexDirection:'column', gap: 8,
            transition: 'all 400ms cubic-bezier(.2,.7,.3,1)',
            minWidth: 0,
          }}>
            {isWinner && (
              <div style={{
                position:'absolute', top: -7, right: 10,
                background:'var(--ink)', color:'var(--bg)',
                padding: '2px 8px', borderRadius: 999,
                fontSize: 10, fontWeight: 600, letterSpacing: '0.04em', textTransform:'uppercase',
              }}>{lang === 'es' ? 'Mejor' : 'Best'}</div>
            )}
            <div style={{ display:'flex', alignItems:'center', gap: 8 }}>
              <StoreMark store={store} size={24}/>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{
                  fontSize: 12, fontWeight: 500, color:'var(--ink)', lineHeight: 1.25,
                }}>{store.name}</div>
                <div style={{ fontSize: 10, color:'var(--ink-3)' }} className="mono">#{rank}{fav.includes(s.id) ? ` · ${L(lang,'habitual','usual')}` : ''}</div>
              </div>
            </div>
            {calculating || (ctx.storeStatus || {})[s.id] === 'loading'
              ? <div className="fx-shimmer" style={{ height: 22, borderRadius: 5, width: '75%' }} aria-label={L(lang,'Cargando','Loading')}></div>
              : <div className="serif" style={{
                  fontSize: 22, lineHeight: 1, letterSpacing:'-0.015em',
                  color: isWinner ? 'var(--ink)' : 'var(--ink-2)',
                }}><AnimatedNumber value={s.total} decimals={2} suffix="€"/></div>}
            <div style={{ fontSize: 12, color:'var(--ink-3)' }}>
              {s.shipping === 0 ? tr('freeShipping', lang) : `+${eur(s.shipping)} ${tr('shipping', lang)}`}
            </div>
            <div style={{ fontSize: 12, color: s.missing && s.missing.length ? 'var(--warn-ink)' : 'var(--ink-3)' }}>
              {store.eta}{s.missing && s.missing.length ? ` · ${L(lang, `faltan ${s.missing.length}`, `${s.missing.length} missing`)}` : ''}
            </div>
            <StoreStatus id={s.id}/>
          </div>
        );
      })}
    </div>
  );
}

// — BARS VIEW — animated bar-race
function BarsView({ lang, storeTotals, winner, calculating }) {
  const max = Math.max(...storeTotals.map(s => s.total));
  const min = Math.min(...storeTotals.map(s => s.total));
  return (
    <div style={{
      display:'flex', flexDirection:'column', gap: 7,
      padding: '14px', border:'1px solid var(--line-2)', borderRadius: 12, background:'var(--bg-panel)',
    }}>
      {storeTotals.map((s, i) => {
        const store = STORES.find(x => x.id === s.id);
        const pct = (s.total / max) * 100;
        const isWinner = winner && s.id === winner.id;
        return (
          <div key={s.id} style={{
            display:'grid', gridTemplateColumns: '140px 1fr 90px', gap: 10, alignItems:'center',
          }}>
            <div style={{ display:'flex', alignItems:'center', gap: 7 }}>
              <StoreMark store={store} size={20}/>
              <span style={{ fontSize: 12, fontWeight: isWinner ? 600 : 400, color: isWinner ? 'var(--ink)' : 'var(--ink-2)' }}>
                {store.name}
              </span>
            </div>
            <div style={{ position:'relative', height: 20, background:'var(--bg-sunk)', borderRadius: 4 }}>
              <div style={{
                height:'100%', width: `${pct}%`,
                background: isWinner ? 'var(--ink)' : 'var(--ink-4)',
                borderRadius: 4,
                transition: 'width 700ms cubic-bezier(.2,.7,.3,1)',
              }}/>
              {isWinner && min !== max && (
                <div style={{
                  position:'absolute', left: `${(min/max)*100}%`, top: -2, bottom: -2,
                  borderLeft: '1.5px dashed var(--sage)', pointerEvents:'none',
                }}/>
              )}
            </div>
            <div className="mono" style={{
              fontSize: 12, textAlign:'right',
              color: isWinner ? 'var(--ink)' : 'var(--ink-2)',
              fontWeight: isWinner ? 600 : 400,
            }}>{eur(s.total)}</div>
          </div>
        );
      })}
    </div>
  );
}

// — TABLE VIEW — product × store matrix, winning cells highlighted
function TableView({ lang, storeTotals, winner, basket, appliedSubs }) {
  const orderedStores = storeTotals.map(s => STORES.find(x => x.id === s.id));
  return (
    <div style={{
      border: '1px solid var(--line-2)', borderRadius: 12, overflow:'hidden',
      background:'var(--bg-panel)',
    }}>
      <div style={{ overflowX:'auto' }}>
        <table style={{ borderCollapse:'collapse', width: '100%', fontSize: 12 }}>
          <thead>
            <tr style={{ background:'var(--bg-sunk)' }}>
              <th style={thTdBase('left', true)}>{lang === 'es' ? 'Producto' : 'Product'}</th>
              {orderedStores.map(s => (
                <th key={s.id} style={thTdBase('center', true)}>
                  <div style={{ display:'flex', alignItems:'center', gap: 6, justifyContent:'center' }}>
                    <StoreMark store={s} size={18}/>
                    <span style={{ fontSize: 12 }}>{s.name}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {basket.map(b => {
              const p = CATALOG[b.id];
              const cheapest = Object.entries(p.prices).sort(([,a],[,bb])=>a-bb)[0][0];
              return (
                <tr key={b.id} style={{ borderTop:'1px solid var(--line-2)' }}>
                  <td style={thTdBase('left')}>
                    <div style={{ display:'flex', alignItems:'center', gap: 6 }}>
                      <PThumb id={b.id} size={22} radius={5}/>
                      <span style={{ fontWeight: 500 }}>{p.name[lang]}</span>
                      <span className="mono" style={{ color:'var(--ink-3)', fontSize: 10 }}>×{b.qty}</span>
                    </div>
                  </td>
                  {orderedStores.map(s => {
                    const price = p.prices[s.id] * b.qty;
                    const best = s.id === cheapest;
                    const out = (MISSING[s.id] || []).includes(b.id);
                    return (
                      <td key={s.id} style={{
                        ...thTdBase('center'),
                        background: best ? 'var(--sage-soft)' : 'transparent',
                        color: out ? 'var(--warn-ink)' : best ? 'var(--sage-ink)' : 'var(--ink-2)',
                        fontWeight: best ? 600 : 400,
                      }} className="mono">
                        {out ? <span style={{ fontFamily:'Inter, system-ui', fontSize: 12 }}>{L(lang,'sin stock','out')}</span> : eur(price)}
                        {!out && unitPrice(b.id, s.id, lang) && <div style={{ fontSize: 9.5, color:'var(--ink-3)', fontWeight: 400 }}>{unitPrice(b.id, s.id, lang)}</div>}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            <tr style={{ borderTop:'2px solid var(--ink)' }}>
              <td style={{ ...thTdBase('left'), fontWeight: 600 }}>{tr('total', lang)}</td>
              {orderedStores.map(s => {
                const st = storeTotals.find(x => x.id === s.id);
                const isWinner = winner && s.id === winner.id;
                return (
                  <td key={s.id} style={{
                    ...thTdBase('center'),
                    fontWeight: isWinner ? 700 : 500,
                    color: isWinner ? 'var(--ink)' : 'var(--ink-2)',
                    background: isWinner ? 'var(--bg-sunk)' : 'transparent',
                  }} className="mono">{eur(st.total)}</td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
function thTdBase(align, head) {
  return {
    padding: head ? '10px 10px' : '9px 10px',
    textAlign: align,
    fontWeight: head ? 500 : 400,
    color: head ? 'var(--ink-2)' : 'var(--ink)',
    fontSize: head ? 11 : 12,
    letterSpacing: head ? '0.04em' : 0,
    textTransform: head ? 'uppercase' : 'none',
    whiteSpace: 'nowrap',
  };
}

// — Optimizer — white-label substitutions panel
function OptimizerPane({ lang, basket: allBasket, appliedSubs, onApply, onApplyAll }) {
  const octx = React.useContext(AppCtx);
  const basket = allBasket.filter(b => !((octx.profile && octx.profile.lockBrand) || []).includes(b.id));
  const available = basket.filter(b => CATALOG[b.id].whiteLabel && !appliedSubs.includes(b.id));
  const totalSave = available.reduce((s, b) => s + (CATALOG[b.id].whiteLabel.save * b.qty), 0);
  if (basket.filter(b => CATALOG[b.id].whiteLabel).length === 0) return null;
  return (
    <div style={{
      border: '1px solid var(--line-2)', borderRadius: 12,
      background:'var(--bg-panel)', padding: '14px 16px',
    }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 10 }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap: 6, fontSize: 13, fontWeight: 500 }}>
            <Icon name="sparkle" size={12}/>
            {tr('subs', lang)}
          </div>
          <div style={{ fontSize: 12, color:'var(--ink-3)', marginTop: 2 }}>{tr('subsSub', lang)}</div>
        </div>
        {available.length > 0 && (
          <button onClick={onApplyAll} style={{
            padding: '6px 10px', borderRadius: 7, background:'var(--sage-soft)',
            color: 'var(--sage-ink)', border:'1px solid var(--sage-line)',
            fontSize: 12, fontWeight: 500,
          }}>
            {tr('applyAll', lang)} · −{eur(totalSave)}
          </button>
        )}
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap: 6 }}>
        {basket.filter(b => CATALOG[b.id].whiteLabel).map(b => {
          const p = CATALOG[b.id];
          const applied = appliedSubs.includes(b.id);
          return (
            <div key={b.id} style={{
              display:'flex', alignItems:'center', gap: 10,
              padding: '8px 10px', borderRadius: 8,
              background: applied ? 'var(--sage-soft)' : 'var(--bg-sunk)',
              border: `1px solid ${applied ? 'var(--sage-line)' : 'var(--line-2)'}`,
              transition: 'background 200ms',
            }}>
              <PThumb id={b.id} size={30}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, display:'flex', alignItems:'center', gap: 6 }}>
                  <span style={{ color:'var(--ink-3)', textDecoration: applied ? 'none' : 'line-through' }}>
                    {p.name[lang]}
                  </span>
                  <Icon name="arrow" size={10}/>
                  <span style={{ color: applied ? 'var(--sage-ink)' : 'var(--ink)' }}>{p.whiteLabel.name[lang]}</span>
                </div>
                <div style={{ fontSize: 12, color:'var(--ink-3)' }}>
                  {lang === 'es' ? 'Ahorro' : 'Save'} <b style={{ color:'var(--sage)', fontWeight: 500 }}>−{eur(p.whiteLabel.save * b.qty)}</b>
                  {unitPrice(b.id, 'merc', lang) && <span className="mono"> · {unitPrice(b.id, 'merc', lang)} → {eur((p.prices.merc - p.whiteLabel.save) / UNIT_SIZE[b.id][0])}</span>}
                </div>
              </div>
              <button onClick={() => onApply(b.id)} disabled={applied} style={{
                padding: '5px 10px', borderRadius: 6, fontSize: 12, fontWeight: 500,
                background: applied ? 'transparent' : 'var(--ink)',
                color: applied ? 'var(--sage-ink)' : 'var(--bg)',
                border: applied ? '1px solid var(--sage-line)' : 'none',
              }}>
                {applied ? tr('applied', lang) : tr('apply', lang)}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

Object.assign(window, { ComparePane, OptimizerPane, LoyaltyNote, ShelfView, BarsView });
