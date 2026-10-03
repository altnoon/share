// Desktop / web layout — three-column dashboard reusing ChatPane, ComparePane, BasketPane, OptimizerPane.
// Left: Concierge chat. Center: Comparison + winner + optimizer. Right: Basket.

function WebApp({ tweaks, setTweaks, state, actions }) {
  window.__aiWeb = true;
  const lang = tweaks.language;
  const [checkout, setCheckout] = useState(false);
  const [tour, setTour] = useState(false);
  const [compareView, setCompareView] = useState(tweaks.compareView || 'ladder');
  useEffect(() => { const k = () => setCheckout(true); window.addEventListener('ai-open-checkout', k); return () => window.removeEventListener('ai-open-checkout', k); }, []);

  // Keep compareView in sync with tweaks
  useEffect(() => { setCompareView(tweaks.compareView || 'ladder'); }, [tweaks.compareView]);

  const { messages, basket, appliedSubs, pref, memory, calculating, storeTotals, winner, started } = state;

  const [cw, setCw] = useState(typeof window !== 'undefined' ? window.innerWidth : 1400);
  useEffect(() => { const on = () => setCw(window.innerWidth); window.addEventListener('resize', on); return () => window.removeEventListener('resize', on); }, []);
  const narrow = cw < 1200;
  const views = ['ladder', 'shelf', 'bars', 'table'];
  useWebShortcuts({ onCycleView: () => setCompareView(v => views[(views.indexOf(v) + 1) % views.length]), onCheckout: () => setCheckout(true) });

  return (
    <div style={{
      width:'100%', height:'100%', display:'flex', flexDirection:'column',
      background:'var(--bg)', overflow:'hidden',
    }}>
      <WebTopBar lang={lang} started={started} basket={basket} onRestart={actions.reset} pref={pref} winner={winner}
        stage={checkout ? 2 : basket.length ? 1 : 0}
        onTour={() => setTour(true)}
        onSwitchView={() => {
          setTweaks(prev => ({ ...prev, viewMode: 'mobile' }));
          try { window.parent.postMessage({ type:'__edit_mode_set_keys', edits: { viewMode: 'mobile' } }, '*'); } catch(e){}
        }}
      />

      <div style={{
        flex: 1, minHeight: 0,
        display:'grid',
        gridTemplateColumns: narrow
          ? 'minmax(320px, 360px) minmax(0, 1fr)'
          : 'minmax(360px, 400px) minmax(0, 1fr) minmax(300px, 340px)',
        gap: 0,
      }}>
        {/* LEFT — Chat */}
        <div style={{ minWidth: 0, minHeight: 0, overflow:'hidden' }}>
          <ChatPane
            lang={lang}
            messages={messages}
            started={started}
            pref={pref}
            memory={memory}
            onStartScenario={actions.startScenario}
            onUserSend={actions.handleUserSend}
            onQuickReply={actions.handleQuickReply}
            entryMode={tweaks.entryMode}
            onAddFromForm={actions.handleAddFromForm}
          />
        </div>

        {/* CENTER — Compare + Optimizer */}
        <div style={{
          minWidth: 0, minHeight: 0, overflowY:'auto', overflowX:'hidden',
          padding: '22px 26px 26px',
          display:'flex', flexDirection:'column', gap: 18,
          background:'var(--bg)',
        }}>
          {basket.length === 0 ? (
            <WebEmptyCenter lang={lang} onStart={actions.startScenario} started={started}/>
          ) : (
            <>
              <ComparePane
                lang={lang}
                basket={basket}
                pref={pref}
                appliedSubs={appliedSubs}
                storeTotals={storeTotals}
                winner={winner}
                compareView={compareView}
                calculating={calculating}
                onCheckout={() => setCheckout(true)}
                onViewChange={setCompareView}
              />
              <WebPriceIntel lang={lang}/>
              {narrow && (
                <div style={{
                  border:'1px solid var(--line)', borderRadius: 12,
                  background:'var(--bg-panel)', padding: '14px 16px 10px',
                }}>
                  <div data-fly-target="1" style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom: 10 }}>
                    <div style={{ fontSize: 11, color:'var(--ink-3)', textTransform:'uppercase', letterSpacing:'0.08em' }}>
                      {tr('basket', lang)} · {basket.length} {tr('items', lang)}
                    </div>
                    {winner && (
                      <div className="serif" style={{ fontSize: 18, whiteSpace:'nowrap' }}>{eur(winner.total)}</div>
                    )}
                  </div>
                  <BasketPane
                    lang={lang} basket={basket} appliedSubs={appliedSubs}
                    onRemove={actions.removeFromBasket} onQtyChange={actions.changeQty} pref={pref}
                  />
                  <div style={{ marginTop: 14 }}><OptimizerPane lang={lang} basket={basket} appliedSubs={appliedSubs} onApply={actions.applySub} onApplyAll={actions.applyAllSubs}/></div>
                  {winner && (
                    <button onClick={() => setCheckout(true)} style={{
                      marginTop: 12, width:'100%', padding: '11px 14px', borderRadius: 12,
                      background:'var(--ink)', color:'var(--bg)',
                      fontSize: 13, fontWeight: 500,
                      display:'inline-flex', alignItems:'center', justifyContent:'center', gap: 8,
                    }}>
                      {tr('checkout', lang)} · {eur(winner.total)}
                      <Icon name="arrow" size={13}/>
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* RIGHT — Basket (wide only) */}
        {!narrow && (
        <div style={{
          minWidth: 0, minHeight: 0, overflow:'hidden',
          borderLeft:'1px solid var(--line)',
          background:'var(--bg-panel)',
          display:'flex', flexDirection:'column',
        }}>
          <div data-fly-target="1" style={{
            padding: '14px 18px 12px', borderBottom:'1px solid var(--line-2)',
            display:'flex', alignItems:'flex-end', justifyContent:'space-between',
          }}>
            <div>
              <div style={{ fontSize: 11, color:'var(--ink-3)', textTransform:'uppercase', letterSpacing:'0.08em' }}>
                {tr('basket', lang)}
              </div>
              <div className="serif" style={{ fontSize: 22, lineHeight: 1.05, letterSpacing:'-0.01em', marginTop: 2 }}>
                {basket.length > 0
                  ? <>{basket.length} <span style={{ fontSize: 14, color:'var(--ink-3)', fontStyle:'italic' }}>{tr('items', lang)}</span></>
                  : <span style={{ fontStyle:'italic', color:'var(--ink-3)' }}>{lang === 'es' ? 'Vacía' : 'Empty'}</span>
                }
              </div>
            </div>
            {winner && basket.length > 0 && (
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize: 10.5, color:'var(--ink-3)', textTransform:'uppercase', letterSpacing:'0.06em' }}>
                  {tr('total', lang)}
                </div>
                <div className="serif" style={{ fontSize: 22, letterSpacing:'-0.01em', whiteSpace:'nowrap', marginTop: 2 }}>
                  {eur(winner.total)}
                </div>
              </div>
            )}
          </div>
          <div style={{ flex: 1, overflowY:'auto', padding: '16px 18px', display:'flex', flexDirection:'column', gap: 14 }}>
            <BasketPane
              lang={lang} basket={basket} appliedSubs={appliedSubs}
              onRemove={actions.removeFromBasket} onQtyChange={actions.changeQty} pref={pref}
            />
            {basket.length > 0 && <OptimizerPane lang={lang} basket={basket} appliedSubs={appliedSubs} onApply={actions.applySub} onApplyAll={actions.applyAllSubs}/>}
          </div>
          {winner && basket.length > 0 && (
            <div style={{ padding: '12px 18px 16px', borderTop:'1px solid var(--line-2)', background:'var(--bg-panel)' }}>
              <button onClick={() => setCheckout(true)} style={{
                width:'100%', padding: '12px 14px', borderRadius: 12,
                background:'var(--ink)', color:'var(--bg)',
                fontSize: 13, fontWeight: 500,
                display:'inline-flex', alignItems:'center', justifyContent:'center', gap: 8,
              }}>
                {tr('checkout', lang)} · {eur(winner.total)}
                <Icon name="arrow" size={13}/>
              </button>
            </div>
          )}
        </div>
        )}
      </div>

      {tour && <TourModal lang={lang} variant="desktop" onClose={() => setTour(false)}/>}
      <FeatureOverlays variant="web"/>
      {checkout && winner && (
        <CheckoutModal
          lang={lang} winner={winner} storeTotals={storeTotals}
          basket={basket} appliedSubs={appliedSubs}
          onClose={() => setCheckout(false)}
        />
      )}
    </div>
  );
}

function WebTopBar({ lang, started, basket, onRestart, pref, winner, onSwitchView, onTour, stage }) {
  const ctx = React.useContext(AppCtx);
  return (
    <div style={{
      flexShrink: 0, padding: '12px 22px',
      borderBottom:'1px solid var(--line)',
      background:'var(--bg-panel)',
      display:'flex', alignItems:'center', justifyContent:'space-between', gap: 18,
    }}>
      {/* Logo */}
      <div style={{ display:'flex', alignItems:'center', gap: 12, minWidth: 0, flexShrink: 0 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background:'linear-gradient(135deg, var(--ink) 0%, oklch(0.30 0.02 60) 100%)',
          color:'var(--bg)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize: 14, fontWeight: 600,
        }} className="serif">ai</div>
        <div style={{ whiteSpace:'nowrap' }}>
          <div style={{ fontSize: 14, fontWeight: 600, letterSpacing:'-0.01em', lineHeight: 1.1 }}>
            {tr('appName', lang)}
          </div>
          <div className="wtb-tagline" style={{ fontSize: 11, color:'var(--ink-3)', lineHeight: 1.1, marginTop: 1 }}>
            {tr('tagline', lang)}
          </div>
        </div>
      </div>

      {/* Steps — hide on narrower desktop */}
      <div className="web-steps" style={{
        display:'flex', alignItems:'center', gap: 10, minWidth: 0, flex: 1, justifyContent:'center',
      }}>
        <StageSteps stage={stage || 0}/>
      </div>

      {/* Postal + restart + view toggle */}
      <div className="wtb-right" style={{ display:'flex', alignItems:'center', gap: 10, flexShrink: 0 }}>
        <ActiveOrderPill/>
        <SavingsPill onOpen={() => ctx.openOverlay('you')}/>
        <InboxButton/>
        <button onClick={onTour} style={{
          height: 32, padding: '0 12px 0 6px', borderRadius: 8,
          background:'var(--bg-sunk)', border:'1px solid var(--line-2)', color:'var(--ink)',
          display:'inline-flex', alignItems:'center', gap: 7, fontSize: 12, fontWeight: 500, whiteSpace:'nowrap',
        }}>
          <span style={{ width: 20, height: 20, borderRadius: 12, background:'var(--ink)', color:'var(--bg)', display:'inline-flex', alignItems:'center', justifyContent:'center' }}><PlayGlyph size={7}/></span>
          <span className="wtb-lbl">{lang === 'es' ? 'Cómo funciona' : 'How it works'}</span>
        </button>
        <button onClick={() => ctx.openOverlay('onboarding')} title={lang === 'es' ? 'Cambiar código postal' : 'Change postcode'} style={{
          height: 32, padding: '0 10px', borderRadius: 7,
          background:'var(--bg-sunk)', border:'1px solid var(--line-2)',
          display:'inline-flex', alignItems:'center', gap: 6,
          fontSize: 11.5,
        }}>
          <span style={{ width: 6, height: 6, borderRadius:'50%', background:'var(--sage)' }}/>
          <span className="wtb-lbl" style={{ color:'var(--ink-3)' }}>{tr('postal', lang)}</span>
          <span className="mono" style={{ color:'var(--ink)', fontWeight: 500 }}>{ctx.profile.cp}</span>
          <span className="wtb-lbl" style={{ color:'var(--ink-3)' }}>· 7 {tr('stores', lang)}</span>
        </button>
        <button onClick={() => ctx.openOverlay('you')} aria-label={lang === 'es' ? 'Tú: perfil, pedidos y alertas' : 'You: profile, orders and alerts'} style={{
          height: 32, padding: '0 11px 0 8px', borderRadius: 8, background:'var(--bg-sunk)', border:'1px solid var(--line-2)',
          display:'inline-flex', alignItems:'center', gap: 6, fontSize: 12, fontWeight: 500,
        }}><Icon name="user" size={14}/>{lang === 'es' ? 'Tú' : 'You'}</button>
        {started && (
          <button onClick={onRestart} title={tr('restart', lang)} aria-label={tr('restart', lang)} style={{
            width: 32, height: 32, borderRadius: 8,
            background:'var(--bg-sunk)', color:'var(--ink-2)',
            display:'inline-flex', alignItems:'center', justifyContent:'center',
            border:'1px solid var(--line-2)',
          }}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 3v4h-4M3 13v-4h4"/>
              <path d="M3.5 7a5 5 0 019-1.5M12.5 9a5 5 0 01-9 1.5"/>
            </svg>
          </button>
        )}
        <span className="wtb-lbl" style={{ display:'inline-flex' }}><ShortcutHint/></span>
        <div style={{ width: 1, height: 22, background: 'var(--line)' }}/>
        <InlineViewToggle onSwitch={onSwitchView}/>
      </div>

      <style>{`
        @media (max-width: 1180px) {
          .web-steps { display: none !important; }
        }
        @media (max-width: 1100px) {
          .wtb-lbl { display: none !important; }
          .wtb-right { gap: 6px !important; }
          .wtb-tagline { display: none !important; }
        }
      `}</style>
    </div>
  );
}

function WebEmptyCenter({ lang, onStart, started }) {
  return (
    <div style={{
      flex: 1, display:'flex', alignItems:'center', justifyContent:'center',
      minHeight: 420,
    }}>
      <div style={{
        maxWidth: 540, textAlign:'center',
        padding: '32px 24px',
      }}>
        <div style={{
          display:'inline-flex', padding: '5px 11px', borderRadius: 999,
          background:'var(--bg-panel)', border:'1px solid var(--line)',
          fontSize: 11, color:'var(--ink-3)',
          letterSpacing:'0.08em', textTransform:'uppercase',
          marginBottom: 18,
        }}>
          <span style={{ color:'var(--sage)' }}>●</span>&nbsp;&nbsp;{lang === 'es' ? '7 supers · CP 28004' : '7 stores · ZIP 28004'}
        </div>
        <div className="serif" style={{ fontSize: 'clamp(32px, 4vw, 52px)', lineHeight: 1.05, letterSpacing:'-0.025em' }}>
          {lang === 'es' ? <>Dime un plato.<br/><span style={{ fontStyle:'italic', color:'var(--ink-3)' }}>Te digo dónde sale más barato.</span></>
                         : <>Name a dish.<br/><span style={{ fontStyle:'italic', color:'var(--ink-3)' }}>I’ll tell you where it’s cheapest.</span></>}
        </div>
        <div style={{ fontSize: 14, color:'var(--ink-2)', marginTop: 18, lineHeight: 1.55, maxWidth: 440, marginLeft:'auto', marginRight:'auto' }}>
          {lang === 'es'
            ? 'Pide un plato y el concierge saca los ingredientes y los escala a comensales — o dicta productos sueltos. Aplica temporada y ofertas, sustituye por marca blanca y calcula la cesta real en cada super que entrega en tu CP.'
            : 'Ask for a dish and the concierge derives the ingredients and scales them to servings — or dictate loose items. It applies season and deals, swaps to store brands, and computes the real total for every store that delivers to your ZIP.'}
        </div>
        {!started && (
          <button onClick={onStart} style={{
            marginTop: 22, padding: '11px 16px', borderRadius: 12,
            background:'var(--ink)', color:'var(--bg)',
            fontSize: 13, fontWeight: 500,
            display:'inline-flex', alignItems:'center', gap: 8,
          }}>
            <Icon name="sparkle" size={12}/>
            {tr('startScenario', lang)} →
          </button>
        )}

        <div style={{ marginTop: 20, textAlign:'left', display:'flex', flexDirection:'column', gap: 14 }}>
          <FirstRunCoach onSend={(t) => window.__aiSend && window.__aiSend(t)}/>
          <TeachEmpty/>
        </div>
      </div>
    </div>
  );
}

function WebPriceIntel({ lang }) {
  // Market pulse: one line by default, grid on demand.
  const [open, setOpen] = useState(false);
  const items = [
    { emoji:'🫒', name:{es:'Aceite virgen extra', en:'Extra virgin olive oil'}, trend:'down', value:'−5%', sub:{es:'hoy vs. ayer', en:'today vs. yesterday'} },
    { emoji:'🍎', name:{es:'Manzanas Golden', en:'Golden apples'}, trend:'peak', value:{es:'Temporada', en:'In season'}, sub:{es:'octubre–diciembre', en:'Oct–Dec'} },
    { emoji:'☕', name:{es:'Café en grano', en:'Coffee beans'}, trend:'up', value:'+8%', sub:{es:'últimos 30 días', en:'last 30 days'} },
    { emoji:'🥚', name:{es:'Huevos camperos', en:'Free-range eggs'}, trend:'stable', value:'—', sub:{es:'estable', en:'stable'} },
  ];
  return (
    <div style={{
      border:'1px solid var(--line-2)', borderRadius: 12, background:'var(--bg-panel)',
      padding: '14px 16px',
    }}>
      <button onClick={() => setOpen(o => !o)} aria-expanded={open} style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', gap: 10, marginBottom: open ? 12 : 0, minHeight: 28, textAlign:'left' }}>
        <div style={{ fontSize: 11, color:'var(--ink-3)', textTransform:'uppercase', letterSpacing:'0.08em' }}>
          {lang === 'es' ? 'Pulso del mercado' : 'Market pulse'}
        </div>
        <div style={{ fontSize: 11, color:'var(--ink-3)' }}>
          {lang === 'es' ? 'Aceite −5% · Café +8% · Manzanas de temporada' : 'Olive oil −5% · Coffee +8% · Apples in season'}
        </div>
        <span style={{ color:'var(--ink-3)', display:'inline-flex', transform: open ? 'rotate(180deg)' : 'none', transition:'transform 160ms' }}><Icon name="down" size={11}/></span>
      </button>
      {open && <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
        {items.map((it, i) => {
          const color = it.trend === 'down' ? 'var(--sage)'
            : it.trend === 'up' ? 'var(--danger-ink)'
            : it.trend === 'peak' ? 'var(--sage)'
            : 'var(--ink-3)';
          const arrow = it.trend === 'down' ? '↓' : it.trend === 'up' ? '↑' : it.trend === 'peak' ? '◉' : '—';
          return (
            <div key={i} style={{
              display:'flex', alignItems:'center', gap: 10,
              padding: '10px 12px', borderRadius: 12,
              background:'var(--bg-sunk)', border:'1px solid var(--line-2)',
            }}>
              <span style={{ fontSize: 18 }}>{it.emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 500, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                  {it.name[lang]}
                </div>
                <div style={{ fontSize: 11, color:'var(--ink-3)', marginTop: 1 }}>
                  {it.sub[lang]}
                </div>
              </div>
              <div style={{
                fontSize: 12, fontWeight: 500, color, whiteSpace:'nowrap',
                display:'inline-flex', alignItems:'center', gap: 3,
              }}>
                <span>{arrow}</span>
                <span>{typeof it.value === 'string' ? it.value : it.value[lang]}</span>
              </div>
            </div>
          );
        })}
      </div>}
    </div>
  );
}

Object.assign(window, { WebApp });

function InlineViewToggle({ onSwitch }) {
  return (
    <div style={{
      display:'inline-flex', gap: 2, padding: 3, borderRadius: 999,
      background:'var(--bg-sunk)', border:'1px solid var(--line-2)',
    }}>
      <span style={{
        padding: '4px 10px', borderRadius: 999,
        background:'var(--ink)', color:'var(--bg)',
        fontSize: 11, fontWeight: 500,
        display:'inline-flex', alignItems:'center', gap: 5,
      }}>
        <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="12" height="9" rx="1"/><path d="M2 6h12M6 12v2M10 12v2M5 14h6"/></svg>
        Web
      </span>
      <button onClick={onSwitch} style={{
        padding: '4px 10px', borderRadius: 999,
        color:'var(--ink-2)',
        fontSize: 11, fontWeight: 500,
        display:'inline-flex', alignItems:'center', gap: 5,
      }}>
        <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="4" y="2" width="8" height="12" rx="1.5"/><circle cx="8" cy="12" r="0.5" fill="currentColor"/></svg>
        Móvil
      </button>
    </div>
  );
}
