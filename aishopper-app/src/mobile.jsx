// Mobile-first AI Shopper — tab-based with chat as primary, compare + basket + you as tabs.
// Optimized for ~390px portrait iPhone.

function MobileApp({ tweaks, setTweaks, state, actions }) {
  window.__aiWeb = false;
  const lang = tweaks.language;
  const appCtx = React.useContext(AppCtx);
  const [tab, setTab] = useState('chat');
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [checkout, setCheckout] = useState(false);
  const [tour, setTour] = useState(false);
  const [basketSheet, setBasketSheet] = useState(false);

  const { messages, basket, appliedSubs, pref, memory, calculating, storeTotals, winner, started } = state;
  const count = basket.reduce((s,b)=>s+b.qty,0);
  const prevCount = useRef(count);
  const prevSnap = useRef({ basket, appliedSubs });
  const skipNext = useRef(false);
  const [toast, setToast] = useState(null);
  const scrollBox = useRef(null);
  useEffect(() => {
    const diff = count - prevCount.current;
    const snap = prevSnap.current;
    prevCount.current = count;
    prevSnap.current = { basket, appliedSubs };
    if (diff > 0 && !window.__aiSkipToast) feedback('add');
    if (skipNext.current || window.__aiSkipToast) { skipNext.current = false; window.__aiSkipToast = false; return; }
    if (diff > 0 && tab === 'chat' && !basketSheet) {
      setToast({ n: diff, removed: null, snap, k: Date.now() });
    }
  }, [count, basket.length]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4200);
    return () => clearTimeout(t);
  }, [toast]);
  const undo = () => { if (!toast) return; feedback('undo'); skipNext.current = true; actions.restoreBasket(toast.snap); setToast(null); };
  const go = (t) => { setTab(t); setToast(null); if (scrollBox.current) scrollBox.current.scrollTop = 0; };
  useEffect(() => { const on = () => go('chat'); window.addEventListener('ai-go-chat', on); return () => window.removeEventListener('ai-go-chat', on); }, []);
  useEffect(() => { const on = () => go('you'); window.addEventListener('ai-go-you', on); return () => window.removeEventListener('ai-go-you', on); }, []);
  useEffect(() => { const on = (e) => go(e.detail); window.addEventListener('ai-go-tab', on); return () => window.removeEventListener('ai-go-tab', on); }, []);
  useEffect(() => { const c = () => go('compare'), k = () => setCheckout(true); window.addEventListener('ai-go-compare', c); window.addEventListener('ai-open-checkout', k); return () => { window.removeEventListener('ai-go-compare', c); window.removeEventListener('ai-open-checkout', k); }; }, []);

  return (
    <div style={{
      position:'relative', width: '100%', height: '100%',
      background: 'var(--bg)', overflow:'hidden',
      display:'flex', flexDirection:'column',
    }}>
      {/* Status bar + top nav */}
      <style>{`@keyframes toastIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}@keyframes badgePop{0%{transform:scale(1)}40%{transform:scale(1.35)}100%{transform:scale(1)}}@keyframes micPulse{0%{box-shadow:0 0 0 0 oklch(0.55 0.15 255 / .35)}100%{box-shadow:0 0 0 12px oklch(0.55 0.15 255 / 0)}}@keyframes wave{0%,100%{transform:scaleY(.3)}50%{transform:scaleY(1)}}`}</style>
      <MobileTopBar lang={lang} tab={tab} winner={winner} basket={basket} onRestart={actions.reset} started={started} calculating={calculating} onGoCompare={() => go('compare')}/>

      {/* Scrollable content */}
      <div ref={scrollBox} style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', position: 'relative' }}>
        {tab === 'chat' && (
          <MobileChatView key="chat"
            lang={lang} messages={messages} started={started} pref={pref}
            memory={memory} calculating={calculating}
            winner={winner} storeTotals={storeTotals} basket={basket}
            onStartScenario={actions.startScenario}
            onUserSend={actions.handleUserSend}
            onQuickReply={actions.handleQuickReply}
            onGoCompare={() => go('compare')}
            entryMode={tweaks.entryMode}
            onAddFromForm={actions.handleAddFromForm}
            onTour={() => setTour(true)}
            onOpenBasket={() => { setToast(null); setBasketSheet(true); }}
          />
        )}
        {tab === 'compare' && (
          <MobileCompareView key="compare"
            lang={lang} storeTotals={storeTotals} winner={winner}
            basket={basket} appliedSubs={appliedSubs}
            calculating={calculating} onCheckout={() => setCheckout(true)} onOpenBasket={() => setBasketSheet(true)}
          />
        )}
        {tab === 'basket' && (
          <MobileBasketView
            lang={lang} basket={basket} appliedSubs={appliedSubs}
            onRemove={actions.removeFromBasket} onQtyChange={actions.changeQty}
            onApply={actions.applySub} onApplyAll={actions.applyAllSubs}
            onCheckout={() => setCheckout(true)} winner={winner}
          />
        )}
        {tab === 'you' && (
          <MobileYouView key="you" lang={lang} memory={memory} pref={pref} basket={basket} onTour={() => setTour(true)}
            onLoadList={(items) => { actions.loadList(items); go('chat'); setBasketSheet(true); }}/>
        )}
      </div>

      {/* Bottom tab bar (glass) */}
      {toast && !(appCtx.notice) && (
        <MobileToast key={toast.k} lang={lang} toast={toast} winner={winner} top={tab === 'chat'} onUndo={undo} onView={() => { setToast(null); setBasketSheet(true); }}/>
      )}
      <MobileTabBar tab={tab} setTab={go} lang={lang} basket={basket} bumpKey={count}/>

      {tour && <TourModal lang={lang} variant="mobile" onClose={() => setTour(false)}/>}
      {basketSheet && <MobileBasketSheet onClose={() => setBasketSheet(false)} onCheckout={() => { setBasketSheet(false); setCheckout(true); }} onCompare={() => { setBasketSheet(false); go('compare'); }}/>}
      <FeatureOverlays variant="mobile"/>
      {checkout && winner && (
        <MobileCheckoutSheet
          lang={lang} winner={winner} storeTotals={storeTotals}
          basket={basket} appliedSubs={appliedSubs}
          onClose={() => setCheckout(false)}
        />
      )}
    </div>
  );
}

function MobileToast({ lang, toast, winner, onUndo, onView, top }) {
  const store = winner ? STORES.find(s => s.id === winner.id) : null;
  const n = toast.n;
  const title = toast.removed
    ? (lang === 'es' ? `${CATALOG[toast.removed].name.es} eliminado` : `${CATALOG[toast.removed].name.en} removed`)
    : (lang === 'es' ? `${n} en la cesta` : `${n} in basket`);
  const tbtn = { padding:'8px 11px', borderRadius: 8, background:'oklch(1 0 0 / 0.14)', color:'var(--bg)', fontSize: 12, fontWeight: 500, flex:'none', whiteSpace:'nowrap' };
  return (
    <div style={{ position:'absolute', left: 12, right: 12, ...(top ? { top: 66 } : { bottom: 78 }), zIndex: 50, animation:'toastIn 260ms cubic-bezier(.2,.7,.3,1)' }}>
      <div style={{ display:'flex', alignItems:'center', gap: 10, padding:'10px 10px 10px 14px', borderRadius: 12, background:'var(--ink)', color:'var(--bg)', boxShadow:'0 10px 30px oklch(0.2 0.01 60 / 0.25)' }}>
        <Icon name="check" size={13} style={{ flex:'none' }}/>
        <div style={{ flex: 1, minWidth: 0, fontSize: 13, lineHeight: 1.3 }}>
          <div style={{ fontWeight: 500, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{title}</div>
          {store && <div style={{ opacity: 0.7, fontSize: 12, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{store.name} · {eur(winner.total)}</div>}
        </div>
        <button onClick={onUndo} style={{ ...tbtn, background:'transparent', textDecoration:'underline', textUnderlineOffset: 3, padding:'8px 6px' }}>
          {lang === 'es' ? 'Deshacer' : 'Undo'}
        </button>
        {onView && !toast.removed && <button onClick={onView} style={tbtn}>{lang === 'es' ? 'Ver' : 'View'}</button>}
      </div>
    </div>
  );
}

function MobileTopBar({ lang, tab, winner, basket, onRestart, started, calculating, onGoCompare }) {
  const ctx = React.useContext(AppCtx);
  const titles = {
    chat:    { es:'Concierge',   en:'Concierge' },
    compare: { es:'Comparar',    en:'Compare' },
    basket:  { es:'Cesta',       en:'Basket' },
    you:     { es:'Tú',          en:'You' },
  };
  return (
    <div style={{
      flexShrink: 0, padding: '12px 16px 10px',
      borderBottom: '1px solid var(--line-2)',
      background: 'var(--bg-panel)',
      display:'flex', alignItems:'center', justifyContent:'space-between',
    }}>
      <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
        {tab === 'chat' && (
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, var(--accent-soft) 0%, var(--accent-soft) 100%)',
            border: '1px solid var(--accent-line)',
            display:'flex', alignItems:'center', justifyContent:'center',
            color: 'var(--accent-ink)',
          }}>
            <Icon name="sparkle" size={15}/>
          </div>
        )}
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, letterSpacing:'-0.01em', lineHeight: 1.1 }}>
            {titles[tab][lang]}
          </div>
          {tab === 'chat' && (
            <div style={{ fontSize: 12, color: 'var(--ink-3)', display:'flex', alignItems:'center', gap: 5, marginTop: 2, whiteSpace:'nowrap' }}>
              <span style={{ width: 5, height: 5, borderRadius:'50%', background:'var(--sage)' }}/>
              <span>{lang === 'es' ? '7 supers · entrega en' : '7 stores · delivering to'} <span className="mono">{ctx.profile.cp}</span></span>
            </div>
          )}
          {tab === 'compare' && winner && basket.length > 0 && (
            <div style={{ fontSize: 12, color:'var(--ink-3)', marginTop: 2 }}>
              {lang === 'es' ? 'Mejor cesta en' : 'Best basket in'}{' '}
              <b style={{ color:'var(--ink-2)', fontWeight:500 }}>
                {STORES.find(s => s.id === winner.id).name}
              </b>
            </div>
          )}
          {tab === 'basket' && (
            <div style={{ fontSize: 12, color:'var(--ink-3)', marginTop: 2 }}>
              {basket.length} {tr('items', lang)}
            </div>
          )}
        </div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap: 6 }}>
        {false && tab === 'chat' && winner && basket.length > 0 && !calculating && (() => {
          const st = STORES.find(s => s.id === winner.id);
          return (
            <button onClick={onGoCompare} style={{ display:'inline-flex', alignItems:'center', gap: 7, height: 34, padding:'0 10px 0 4px', borderRadius: 12, background:'var(--bg-sunk)', border:'1px solid var(--line-2)' }}>
              <StoreMark store={st} size={24}/>
              <span className="serif" style={{ fontSize: 16, lineHeight: 1 }}>{eur(winner.total)}</span>
              <span style={{ color:'var(--ink-3)' }}><Icon name="arrow" size={11}/></span>
            </button>
          );
        })()}
        {tab === 'chat' && !started && <SavingsPill onOpen={() => window.dispatchEvent(new Event('ai-go-you'))}/>}
        {tab !== 'you' && <InboxButton size={34} radius={12}/>}
        {started && (
          <button onClick={onRestart} title={tr('restart', lang)} aria-label={tr('restart', lang)} style={{
            width: 34, height: 34, borderRadius: 12,
            background: 'var(--bg-sunk)', color: 'var(--ink-2)',
            display:'inline-flex', alignItems:'center', justifyContent:'center',
            border: '1px solid var(--line-2)',
          }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 3v4h-4M3 13v-4h4"/>
              <path d="M3.5 7a5 5 0 019-1.5M12.5 9a5 5 0 01-9 1.5"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

function MobileTabBar({ tab, setTab, lang, basket, bumpKey }) {
  const tabs = [
    { id:'chat',    label: { es:'Chat',     en:'Chat' },     icon: 'sparkle' },
    { id:'compare', label: { es:'Comparar', en:'Compare' },  icon: 'cart' },
    { id:'you',     label: { es:'Tú',       en:'You' },      icon: 'memory' },
  ];
  return (
    <div style={{
      flexShrink: 0,
      borderTop: '1px solid var(--line-2)',
      background: 'var(--bg-panel)',
      padding: '6px 8px 10px',
      display: 'flex', justifyContent:'space-around', alignItems:'center',
    }}>
      {tabs.map(t => {
        const active = tab === t.id;
        const count = t.id === 'basket' ? basket.length : 0;
        return (
          <button key={t.id} {...(t.id === 'basket' ? { 'data-fly-target': '1' } : {})} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: '8px 6px', borderRadius: 12,
            display:'flex', flexDirection:'column', alignItems:'center', gap: 3,
            color: active ? 'var(--ink)' : 'var(--ink-3)',
            position:'relative',
          }}>
            <div style={{ position:'relative' }}>
              <TabIcon name={t.icon} size={20} active={active}/>
              {count > 0 && t.id === 'basket' && (
                <span key={bumpKey} style={{
                  animation:'badgePop 420ms ease-out',
                  position:'absolute', top:-4, right:-8,
                  minWidth: 16, height: 16, padding: '0 4px', borderRadius: 8,
                  background:'var(--ink)', color:'var(--bg)',
                  fontSize: 10, fontWeight: 600,
                  display:'inline-flex', alignItems:'center', justifyContent:'center',
                }}>{count}</span>
              )}
            </div>
            <span style={{ fontSize: 12, fontWeight: active ? 600 : 500, letterSpacing:'-0.01em' }}>
              {t.label[lang]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function TabIcon({ name, size = 20, active }) {
  const stroke = 'currentColor';
  const fill = active ? 'currentColor' : 'none';
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke, strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'sparkle': return <svg {...p}>
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M6 6l2 2M16 16l2 2M6 18l2-2M16 8l2-2" stroke={stroke}/>
      <circle cx="12" cy="12" r="3" fill={fill} stroke={stroke}/>
    </svg>;
    case 'cart': return <svg {...p}>
      <path d="M3 3h3l2.5 12h11l2-9H7" fill={fill === 'none' ? 'none' : 'currentColor'} fillOpacity={active ? 0.15 : 0}/>
      <circle cx="10" cy="20" r="1.5" fill={active ? 'currentColor' : 'none'}/>
      <circle cx="18" cy="20" r="1.5" fill={active ? 'currentColor' : 'none'}/>
    </svg>;
    case 'basket': return <svg {...p}>
      <path d="M4 9h16l-2 11H6L4 9z" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.15 : 0}/>
      <path d="M8 9l4-6 4 6"/>
      <path d="M10 13v3M14 13v3"/>
    </svg>;
    case 'memory': return <svg {...p}>
      <rect x="5" y="5" width="14" height="14" rx="2" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.12 : 0}/>
      <circle cx="12" cy="12" r="3"/>
    </svg>;
    default: return null;
  }
}

// ─── Chat view (mobile) ──────────────────────────────────────────────
function MobileChatView({
  lang, messages, started, pref, memory, calculating, winner, storeTotals, basket,
  onStartScenario, onUserSend, onQuickReply, onGoCompare, entryMode, onAddFromForm, onTour, onOpenBasket,
}) {
  const scrollRef = useRef(null);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages.length]);

  return (
    <div className="fx-tab" style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <div ref={scrollRef} style={{
        flex: 1, minHeight: 0, overflowY:'auto', padding: '14px 16px 10px',
        display:'flex', flexDirection:'column', gap: 12,
      }}>
        {!started && <WeeklyCard/>}
        {!started && <ReturnCard onSend={onUserSend}/>}
        {!started && <FirstRunCoach onSend={onUserSend}/>}
        {!started && <MobileEmptyState lang={lang} onStart={onStartScenario} onUserSend={onUserSend} onTour={onTour}/>}
        {messages.map((m, i) => <Message key={i} msg={m} lang={lang} onQuickReply={onQuickReply}/>)}
        {pref && started && (
          <div style={{ alignSelf:'center' }}>
            <Pill tone="accent" size="sm">
              <Icon name="sparkle" size={10}/> {tr('pref' + pref[0].toUpperCase() + pref.slice(1), lang)}
            </Pill>
          </div>
        )}
        {memory && memory.length > 0 && <MemoryCard lang={lang} memory={memory}/>}
      </div>

      {/* Sticky input */}
      <div style={{
        flexShrink: 0, zIndex: 2,
        padding: '10px 12px 12px',
        background: 'var(--bg-panel)',
        borderTop: '1px solid var(--line-2)',
      }}>
        {entryMode === 'form' ? (
          <FormEntry lang={lang} onAdd={onAddFromForm}/>
        ) : (
          <>
            <MobileBasketPeek onOpen={onOpenBasket}/>
            <QuickTools/>
            <MobileVoiceInput draft={draft} setDraft={setDraft} onSend={(t) => { onUserSend(t); setDraft(''); }}/>
          </>
        )}
      </div>
    </div>
  );
}

function MobileEmptyState({ lang, onStart, onUserSend, onTour }) {
  const dishes = ['paella', 'tortilla', 'lentejas', 'gazpacho', 'croquetas', 'albondigas'];
  return (
    <div style={{ display:'flex', flexDirection:'column', gap: 14, padding: '10px 0 4px' }}>
      <div>
        <div className="serif" style={{ fontSize: 30, lineHeight: 1.1, letterSpacing:'-0.02em' }}>
          {lang === 'es' ? (
            <>Dime un plato.<br/><span style={{ fontStyle:'italic', color:'var(--ink-3)' }}>Te digo dónde sale más barato.</span></>
          ) : (
            <>Name a dish.<br/><span style={{ fontStyle:'italic', color:'var(--ink-3)' }}>I'll tell you where it's cheapest.</span></>
          )}
        </div>
        <div style={{ fontSize: 13, color:'var(--ink-2)', marginTop: 10, lineHeight: 1.5 }}>
          {lang === 'es'
            ? 'Un plato o productos sueltos. Yo comparo los 7 supers.'
            : 'A dish or loose items. I compare all 7 stores.'}
        </div>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap: 7 }}>
        <div style={{ fontSize: 11, color:'var(--ink-3)', textTransform:'uppercase', letterSpacing:'0.07em' }}>
          {lang === 'es' ? 'Prueba un plato' : 'Try a dish'}
        </div>
        <div style={{ display:'flex', flexWrap:'wrap', gap: 6 }}>
          {dishes.map(d => {
            const r = RECIPES[d];
            return (
              <button key={d} onClick={() => onUserSend && onUserSend(r.name[lang])} style={{
                display:'inline-flex', alignItems:'center', gap: 6,
                padding: '7px 12px 7px 9px', borderRadius: 999,
                background: 'var(--bg-panel)', border: '1px solid var(--line)',
                fontSize: 13, color:'var(--ink)', fontWeight: 500,
              }}>
                <span style={{ fontSize: 15 }}>{r.emoji}</span>
                {r.name[lang]}
              </button>
            );
          })}
        </div>
      </div>
      <AllRecipesLink/>
      <button onClick={onStart} style={{
        marginTop: 2, padding: '11px 14px', borderRadius: 12,
        background: 'transparent', color:'var(--ink-2)', border:'1px solid var(--line)',
        fontSize: 13, fontWeight: 500,
        display:'inline-flex', alignItems:'center', justifyContent:'center', gap: 8,
      }}>
        <Icon name="sparkle" size={12}/>
        {tr('startScenario', lang)}
      </button>
      <button onClick={onTour} style={{
        alignSelf: 'center', padding: '8px 12px', borderRadius: 999, fontSize: 13, color: 'var(--ink-2)',
        display: 'inline-flex', alignItems: 'center', gap: 7,
      }}>
        <span style={{ width: 22, height: 22, borderRadius: 11, background: 'var(--ink)', color: 'var(--bg)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><PlayGlyph size={8}/></span>
        {lang === 'es' ? 'Ver cómo funciona · 1 min' : 'See how it works · 1 min'}
      </button>
    </div>
  );
}

function LiveCompareStrip({ lang, winner, storeTotals, onTap }) {
  const store = STORES.find(s => s.id === winner.id);
  const savings = storeTotals[storeTotals.length - 1].total - winner.total;
  return (
    <button onClick={onTap} style={{
      margin: '10px 12px 2px', padding: '10px 12px',
      borderRadius: 12, background:'var(--bg-panel)',
      border:'1px solid var(--line)',
      display:'flex', alignItems:'center', gap: 10,
      textAlign:'left', width:'calc(100% - 24px)',
    }}>
      <StoreMark store={store} size={30}/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color:'var(--ink-3)', textTransform:'uppercase', letterSpacing:'0.06em' }}>
          {tr('bestCart', lang)}
        </div>
        <div style={{ display:'flex', alignItems:'baseline', gap: 6, marginTop: 1 }}>
          <span className="serif" style={{ fontSize: 20, letterSpacing:'-0.01em' }}>
            {eur(winner.total)}
          </span>
          <span style={{ fontSize: 12, color:'var(--sage)', fontWeight: 500 }}>
            −{eur(savings)}
          </span>
        </div>
      </div>
      <div style={{ color:'var(--ink-3)' }}><Icon name="arrow" size={14}/></div>
    </button>
  );
}

// ─── Compare view (mobile) ───────────────────────────────────────────
function MobileCompareView({ lang, storeTotals, winner, basket, appliedSubs, calculating, onCheckout, onOpenBasket }) {
  if (basket.length === 0) {
    return <TeachEmpty title={lang === 'es' ? 'Aún no hay nada que comparar' : 'Nothing to compare yet'} sub={lang === 'es' ? 'Añade algo y comparo los 7 supers al momento.' : 'Add something and I’ll compare all 7 stores instantly.'}/>;
  }
  return (
    <div className="fx-tab" style={{ padding: '14px 16px 100px' }}>
      {winner && <HeroCard winner={winner} storeTotals={storeTotals} basket={basket} appliedSubs={appliedSubs} variant="mobile"/>}
      {winner && (
        <div style={{ display:'flex', flexDirection:'column', gap: 10, marginTop: 12 }}>
          <CoverageNote winner={winner} basket={basket} appliedSubs={appliedSubs}/>
          <SplitCard winner={winner} basket={basket} appliedSubs={appliedSubs} variant="mobile"/>
        </div>
      )}

      {winner && <MobileStoreLadder lang={lang} storeTotals={storeTotals} winner={winner} basket={basket} appliedSubs={appliedSubs} calculating={calculating}/>}
      {winner && <div style={{ marginTop: 14 }}><StoresAsk/></div>}
      {winner && (
        <div style={{ position:'sticky', bottom: 10, marginTop: 18, zIndex: 3, display:'flex', gap: 8 }}>
          <button onClick={onOpenBasket} style={{ ...fxBtnGhost, minHeight: 50, boxShadow:'0 8px 24px oklch(0.2 0.01 60 / 0.12)' }}>{L(lang, 'Cesta', 'Basket')} · {basket.length}</button>
          <button onClick={onCheckout} style={{ ...fxBtnPrimary, flex: 1, minHeight: 50, boxShadow:'0 8px 24px oklch(0.2 0.01 60 / 0.18)' }}>
            {L(lang, 'Pedir', 'Order')} · {eur(winner.total)} <Icon name="arrow" size={13}/>
          </button>
        </div>
      )}
    </div>
  );
}

function MobileWinnerCard({ lang, winner, storeTotals, onCheckout }) {
  const store = STORES.find(s => s.id === winner.id);
  const worst = storeTotals[storeTotals.length - 1];
  const savings = worst.total - winner.total;
  const avg = storeTotals.reduce((s, x) => s + x.total, 0) / storeTotals.length;
  const savingsVsAvg = avg - winner.total;
  const pct = Math.max(0, Math.min(1, savings / 30));
  const c = 2 * Math.PI * 30;

  return (
    <div style={{
      position:'relative', overflow:'hidden',
      border:'1px solid var(--line)', borderRadius: 20,
      background: 'linear-gradient(180deg, var(--bg-panel) 0%, var(--bg-sunk) 100%)',
      padding: '16px 16px',
    }}>
      <div style={{
        position:'absolute', inset: 0, pointerEvents:'none',
        background: `radial-gradient(320px 140px at 100% 0%, oklch(0.96 0.04 ${store.hue} / 0.7), transparent 70%)`,
      }}/>
      <div style={{ position:'relative', display:'flex', alignItems:'center', gap: 10, marginBottom: 14 }}>
        <StoreMark store={store} size={36}/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, color:'var(--sage)', fontWeight: 600, letterSpacing:'0.08em', textTransform:'uppercase' }}>
            {tr('bestCart', lang)}
          </div>
          <div style={{ fontWeight: 600, fontSize: 16, letterSpacing:'-0.01em', lineHeight: 1.1, marginTop: 2 }}>{store.name}</div>
          <div style={{ fontSize: 12, color:'var(--ink-3)', marginTop: 2 }}>
            {store.eta} · {winner.shipping === 0 ? tr('freeShipping', lang) : eur(winner.shipping) + ' ' + tr('shipping', lang)}
          </div>
        </div>
      </div>

      <div style={{ position:'relative', display:'flex', alignItems:'center', gap: 14 }}>
        {/* Savings dial */}
        <div style={{ position:'relative', width: 72, height: 72, flexShrink: 0 }}>
          <svg width="72" height="72" viewBox="0 0 72 72">
            <circle cx="36" cy="36" r="30" fill="none" stroke="var(--line)" strokeWidth="5"/>
            <circle cx="36" cy="36" r="30" fill="none" stroke="var(--sage)" strokeWidth="5"
              strokeDasharray={`${c*pct} ${c}`} strokeLinecap="round"
              transform="rotate(-90 36 36)"
              style={{ transition: 'stroke-dasharray 900ms cubic-bezier(.2,.7,.3,1)' }}/>
          </svg>
          <div style={{
            position:'absolute', inset: 0, display:'flex', alignItems:'center', justifyContent:'center',
            flexDirection:'column',
          }}>
            <div className="serif" style={{ fontSize: 17, lineHeight: 1, color:'var(--sage)' }}>
              <AnimatedNumber value={savings} decimals={2} suffix="€"/>
            </div>
            <div style={{ fontSize: 9, color:'var(--ink-3)', textTransform:'uppercase', letterSpacing:'0.06em', marginTop: 3 }}>
              {lang === 'es' ? 'ahorras' : 'saved'}
            </div>
          </div>
        </div>
        {/* Big total */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color:'var(--ink-3)', textTransform:'uppercase', letterSpacing:'0.08em' }}>
            {tr('total', lang)}
          </div>
          <div style={{ display:'flex', alignItems:'baseline', gap: 4, marginTop: 2 }}>
            <div className="serif" style={{ fontSize: 40, lineHeight: 1, letterSpacing:'-0.02em', whiteSpace:'nowrap' }}>
              <AnimatedNumber value={winner.total} decimals={2}/>
            </div>
            <span className="serif" style={{ fontSize: 24, color:'var(--ink-2)' }}>€</span>
          </div>
          <div style={{ fontSize: 12, color:'var(--ink-3)', marginTop: 3 }}>
            {eur(savingsVsAvg)} {tr('vsAvg', lang)}
          </div>
        </div>
      </div>

      <button onClick={onCheckout} style={{
        marginTop: 14, width:'100%', padding: '12px 14px', borderRadius: 12,
        background: 'var(--ink)', color: 'var(--bg)',
        fontSize: 13, fontWeight: 500,
        display:'inline-flex', alignItems:'center', justifyContent:'center', gap: 8,
      }}>
        {tr('checkout', lang)} <Icon name="arrow" size={13}/>
      </button>
    </div>
  );
}

// Ranked ladder: every store visible at a glance, price bar inline, tap a row for detail.
function MobileStoreLadder({ lang, storeTotals, winner, basket, appliedSubs, calculating, bare }) {
  const ctx = React.useContext(AppCtx);
  const fav = (ctx.profile && ctx.profile.fav) || [];
  const [all, setAll] = useState(!!bare);
  const [sel, setSel] = useState(null);
  const min = storeTotals[0].total, max = storeTotals[storeTotals.length - 1].total;
  const rows = all ? storeTotals : storeTotals.slice(0, 3);
  const rest = storeTotals.length - 3;
  return (
    <div style={{ marginTop: bare ? 0 : 18 }}>
      {!bare && <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 600, letterSpacing:'-0.005em' }}>{L(lang, `Los ${storeTotals.length} supers`, `All ${storeTotals.length} stores`)}</div>
        <div style={{ fontSize: 11, color:'var(--ink-3)' }}>{L(lang, 'misma cesta · con envío', 'same basket · incl. delivery')}</div>
      </div>}
      <div role="list" style={{ display:'flex', flexDirection:'column', gap: 6 }}>
        {rows.map((s, i) => {
          const store = STORES.find(x => x.id === s.id);
          const isWinner = s.id === winner.id;
          const isSel = sel === s.id;
          const loading = (ctx.storeStatus || {})[s.id] === 'loading' || calculating;
          const missing = missingAt(s.id, basket);
          const w = max > min ? 0.38 + 0.62 * (s.total - min) / (max - min) : 1;
          const barColor = isWinner ? 'var(--sage)' : missing.length ? 'var(--warn-ink)' : 'var(--ink-3)';
          return (
            <div key={s.id} role="listitem" style={{ borderRadius: 14, background: isWinner ? 'var(--bg-panel)' : 'var(--bg-sunk)', border: `1px solid ${isWinner ? 'var(--ink)' : isSel ? 'var(--line)' : 'var(--line-2)'}`, overflow:'hidden', transition:'border-color 160ms' }}>
              <button onClick={() => setSel(isSel ? null : s.id)} aria-expanded={isSel} style={{ display:'block', width:'100%', textAlign:'left', padding:'10px 12px 10px 10px', background:'transparent', minHeight: 56 }}>
                <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
                  <span className="mono" style={{ fontSize: 10, color: isWinner ? 'var(--sage-ink)' : 'var(--ink-3)', width: 16, textAlign:'center' }}>{i + 1}</span>
                  <StoreMark store={store} size={28}/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display:'flex', alignItems:'baseline', gap: 6, fontSize: 14, fontWeight: isWinner ? 600 : 500, letterSpacing:'-0.005em', whiteSpace:'nowrap', overflow:'hidden' }}>
                      <span style={{ overflow:'hidden', textOverflow:'ellipsis' }}>{store.name}</span>
                      {fav.includes(s.id) && <span style={{ fontSize: 11, color:'var(--ink-3)', fontWeight: 400 }}>{L(lang, 'tu súper', 'your usual')}</span>}
                    </div>
                    <div style={{ fontSize: 11.5, color:'var(--ink-3)', marginTop: 1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                      {store.eta} · {s.shipping === 0 ? tr('freeShipping', lang) : `+${eur(s.shipping)} ${tr('shipping', lang)}`}
                      {missing.length > 0 && <span role="button" tabIndex={0} onClick={e => { e.stopPropagation(); track('delivery_checked', { missing_n: missing.length, store: s.id }); ctx.openOverlay('missing', { storeId: s.id }); }} onKeyDown={e => { if (e.key === 'Enter') { e.stopPropagation(); ctx.openOverlay('missing', { storeId: s.id }); } }} style={{ color:'var(--warn-ink)', textDecoration:'underline', textDecorationStyle:'dotted', textUnderlineOffset: 2, cursor:'pointer' }}> · {L(lang, `faltan ${missing.length}`, `${missing.length} missing`)}</span>}
                    </div>
                  </div>
                  {loading ? <div className="fx-shimmer" style={{ width: 64, height: 22, borderRadius: 6 }}></div> : (
                    <div style={{ textAlign:'right', flexShrink: 0 }}>
                      <div className="serif" style={{ fontSize: bare ? 26 : 22, lineHeight: 1, color:'var(--ink)', whiteSpace:'nowrap', fontVariantNumeric:'tabular-nums' }}>
                        <AnimatedNumber value={s.total} decimals={2}/><span style={{ fontSize: bare ? 17 : 14, color:'var(--ink-2)', marginLeft: 3 }}>€</span>
                      </div>
                      <div className="mono" style={{ display:'inline-block', fontSize: 11, marginTop: 5, padding:'2px 7px', borderRadius: 999, color: isWinner ? 'var(--sage-ink)' : 'var(--ink-2)', background: isWinner ? 'var(--sage-soft)' : 'var(--bg-panel)', border:`1px solid ${isWinner ? 'var(--sage-line)' : 'var(--line)'}` }}>
                        {isWinner ? L(lang, 'la más barata', 'cheapest') : '+' + eur(s.total - winner.total)}
                      </div>
                    </div>
                  )}
                </div>
                <div aria-hidden="true" style={{ marginTop: 8, marginLeft: 26, height: 4, borderRadius: 2, background:'var(--line-2)', overflow:'hidden' }}>
                  <div style={{ width: `${w * 100}%`, height:'100%', borderRadius: 2, background: barColor, opacity: isWinner ? 1 : 0.55, transition:'width 700ms cubic-bezier(.2,.7,.3,1)' }}></div>
                </div>
              </button>
              {isSel && (
                <div className="fx-tab" style={{ padding:'0 12px 12px 36px', fontSize: 12, color:'var(--ink-2)', display:'flex', flexDirection:'column', gap: 6 }}>
                  <div style={{ display:'flex', justifyContent:'space-between' }}><span style={{ color:'var(--ink-3)' }}>{L(lang, 'Productos', 'Items')}</span><span className="mono">{eur(s.total - s.shipping)}</span></div>
                  <div style={{ display:'flex', justifyContent:'space-between' }}><span style={{ color:'var(--ink-3)' }}>{tr('shipping', lang)}</span><span className="mono">{s.shipping === 0 ? tr('freeShipping', lang) : eur(s.shipping)}</span></div>
                  {missing.length > 0 ? (
                    <div>
                      <div style={{ color:'var(--warn-ink)', fontWeight: 500, marginBottom: 4 }}>{L(lang, 'Sin stock hoy', 'Out of stock today')}</div>
                      <div style={{ display:'flex', flexWrap:'wrap', gap: 6 }}>
                        {missing.map(b => <span key={b.id} style={{ padding:'3px 8px', borderRadius: 999, background:'var(--warn-soft)', border:'1px solid var(--warn-line)', color:'var(--warn-ink)', fontSize: 11.5 }}>{CATALOG[b.id].emoji} {CATALOG[b.id].name[lang]}</span>)}
                      </div>
                    </div>
                  ) : <div style={{ color:'var(--sage-ink)', display:'flex', alignItems:'center', gap: 6 }}><Icon name="check" size={11}/>{L(lang, `Tiene los ${basket.length} productos`, `Has all ${basket.length} items`)}</div>}
                  <StoreStatus id={s.id} compact/>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {rest > 0 && !bare && (
        <button onClick={() => setAll(a => !a)} aria-expanded={all} style={{ ...fxBtnGhost, background:'transparent', width:'100%', justifyContent:'center', marginTop: 6, minHeight: 44 }}>
          <span style={{ display:'inline-flex', transform: all ? 'rotate(180deg)' : 'none', transition:'transform 160ms' }}><Icon name="down" size={12}/></span>
          {all ? L(lang, 'Ver menos', 'Show less') : L(lang, `Ver los ${rest} restantes`, `See the other ${rest}`)}
        </button>
      )}
    </div>
  );
}

function MobileShelfView({ lang, storeTotals, winner }) {
  const ctx = React.useContext(AppCtx);
  const fav = (ctx.profile && ctx.profile.fav) || [];
  return (
    <div style={{ display:'flex', flexDirection:'column', gap: 6 }}>
      {storeTotals.map((s, i) => {
        const store = STORES.find(x => x.id === s.id);
        const isWinner = winner && s.id === winner.id;
        const loading = (ctx.storeStatus || {})[s.id] === 'loading';
        return (
          <div key={s.id} style={{
            display:'flex', alignItems:'center', gap: 12,
            padding: '10px 12px', borderRadius: 12,
            background: isWinner ? 'var(--bg-panel)' : 'var(--bg-sunk)',
            border: `1px solid ${isWinner ? 'var(--ink)' : 'var(--line-2)'}`,
          }}>
            <span className="mono" style={{ fontSize: 10, color:'var(--ink-3)', width: 14 }}>#{i+1}</span>
            <StoreMark store={store} size={26}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: isWinner ? 600 : 500, letterSpacing:'-0.005em' }}>
                {store.name}{fav.includes(s.id) && <span style={{ fontSize: 12, color:'var(--ink-3)', fontWeight: 400 }}> · {L(lang,'habitual','usual')}</span>}
              </div>
              <div style={{ fontSize: 12, color:'var(--ink-3)' }}>
                {store.eta} · {s.shipping === 0 ? tr('freeShipping', lang) : `+${eur(s.shipping)}`}
                {s.missing && s.missing.length > 0 && <span style={{ color:'var(--warn-ink)' }}> · {L(lang, `faltan ${s.missing.length}`, `${s.missing.length} missing`)}</span>}
              </div>
              <StoreStatus id={s.id} compact/>
            </div>
            {loading ? <div className="fx-shimmer" style={{ width: 64, height: 20, borderRadius: 5 }}></div> : (
            <div style={{ textAlign:'right' }}>
              <div className="serif" style={{
                fontSize: 20, lineHeight: 1,
                color: isWinner ? 'var(--ink)' : 'var(--ink-2)',
                whiteSpace:'nowrap',
              }}>
                <AnimatedNumber value={s.total} decimals={2}/>
                <span style={{ fontSize: 13, color:'var(--ink-3)', marginLeft: 3 }}>€</span>
              </div>
              <div className="mono" style={{ fontSize: 12, marginTop: 3, color: isWinner ? 'var(--sage)' : 'var(--danger-ink)' }}>
                {isWinner ? (lang === 'es' ? 'mejor' : 'best') : '+' + eur(s.total - winner.total)}
              </div>
            </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Basket view (mobile) ────────────────────────────────────────────
function MobileBasketView({ lang, basket, appliedSubs, onRemove, onQtyChange, onApply, onApplyAll, onCheckout, winner }) {
  if (basket.length === 0) {
    return <TeachEmpty title={lang === 'es' ? 'Cesta vacía' : 'Empty basket'} sub={lang === 'es' ? 'Toca un ejemplo y mira cómo se llena.' : 'Tap an example and watch it fill.'}/>;
  }
  return (
    <div style={{ padding: '14px 16px 120px' }}>
      <BasketPane lang={lang} basket={basket} appliedSubs={appliedSubs} onRemove={onRemove} onQtyChange={onQtyChange}/>
      <div style={{ marginTop: 18 }}>
        <OptimizerPane lang={lang} basket={basket} appliedSubs={appliedSubs} onApply={onApply} onApplyAll={onApplyAll}/>
      </div>
      <div style={{
        position:'sticky', bottom: 10, marginTop: 18,
      }}>
        <button onClick={onCheckout} style={{
          width:'100%', padding:'12px 14px', borderRadius: 12,
          background:'var(--ink)', color:'var(--bg)', fontSize: 13, fontWeight: 500,
          display:'inline-flex', alignItems:'center', justifyContent:'center', gap: 8,
          boxShadow:'0 8px 24px oklch(0.2 0.01 60 / 0.15)',
        }}>
          {tr('checkout', lang)} · {winner ? eur(winner.total) : ''}
          <Icon name="arrow" size={13}/>
        </button>
      </div>
    </div>
  );
}

// ─── You view (mobile) ──────────────────────────────────────────────
const SAVED_LISTS = [
  { id:'weekly', name:{ es:'Semanal familia', en:'Weekly family' }, last:'−4,20', watching: 3,
    items:[{id:'leche',qty:3},{id:'pan',qty:2},{id:'huevos',qty:1},{id:'yogur',qty:2},{id:'naranjas',qty:2},{id:'tomate',qty:1},{id:'papel',qty:1},{id:'cafe',qty:1}] },
  { id:'weekend', name:{ es:'Fin de semana', en:'Weekend' }, last:'−1,05', watching: 1,
    items:[{id:'pan',qty:1},{id:'huevos',qty:1},{id:'aceite',qty:1},{id:'pasta',qty:2}] },
];

function MobileYouView({ lang, memory, pref, basket, onLoadList, onTour }) {
  const ctx = React.useContext(AppCtx);
  const alerts = ctx.alerts || [];
  const upd = (id, patch) => ctx.updateAlert(id, patch);
  return (
    <div className="fx-tab" style={{ padding: '14px 16px 100px', display:'flex', flexDirection:'column', gap: 12 }}>
      <ActiveOrderCard/>
      <SavingsCard/>
      {onTour && <TourCard lang={lang} onOpen={onTour}/>}
      <YouSection lang={lang} title={L(lang,'Guardado','Saved')}/>
      <div style={{
        padding: '16px', borderRadius: 12,
        background:'var(--bg-panel)', border:'1px solid var(--line-2)',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap: 10, marginBottom: 10 }}>
          <div style={{ color:'var(--ink-3)' }}><Icon name="bell" size={14}/></div>
          <div style={{ fontSize: 11, color:'var(--ink-3)', textTransform:'uppercase', letterSpacing:'0.08em' }}>
            {tr('savedLists', lang)}
          </div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap: 6 }}>
          {SAVED_LISTS.map(l => (
            <SavedListRow key={l.id} lang={lang} name={l.name} items={l.items.reduce((s,i)=>s+i.qty,0)}
              last={l.last} watching={l.watching} onLoad={() => onLoadList(l.items)}/>
          ))}
        </div>
      </div>
      <OrdersCard/>
      {alerts.length > 0 && <div style={{
        padding: '16px', borderRadius: 12,
        background:'var(--bg-panel)', border:'1px solid var(--line-2)',
      }}>
        <div style={{ fontSize: 11, color:'var(--ink-3)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom: 10 }}>
          {lang === 'es' ? 'Alertas activas' : 'Active alerts'}
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap: 8 }}>
          {alerts.map(a => (
            <AlertRow key={a.id} lang={lang} a={a} onOpen={() => ctx.openHistory(a.id)}
              onToggle={() => upd(a.id, { on: !a.on })}
              onThreshold={(v) => upd(a.id, { threshold: Math.max(1, v) })}/>
          ))}
        </div>
      </div>}
      <YouSection lang={lang} title={L(lang,'Tú','You')}/>
      <ProfileCard/>
      <HouseholdCard/>
      <PrefsCard/>
      <NotificationsCard/>
      {memory && memory.length > 0 && <div style={{
        padding: '16px', borderRadius: 12,
        background:'var(--bg-panel)', border:'1px solid var(--line-2)',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap: 10, marginBottom: 8 }}>
          <div style={{ color:'var(--ink-3)' }}><Icon name="memory" size={14}/></div>
          <div style={{ fontSize: 11, color:'var(--ink-3)', textTransform:'uppercase', letterSpacing:'0.08em' }}>
            {tr('memory', lang)}
          </div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap: 4 }}>
          {memory.map((m, i) => (
            <div key={i} style={{ fontSize: 13, color:'var(--ink)' }}>· {m[lang]}</div>
          ))}
        </div>
        {pref && (
          <div style={{ marginTop: 10 }}>
            <Pill tone="accent" size="md">
              <Icon name="sparkle" size={11}/>
              {tr('pref' + pref[0].toUpperCase() + pref.slice(1), lang)}
            </Pill>
          </div>
        )}
      </div>}
    </div>
  );
}

function YouSection({ title }) {
  return <div style={{ fontSize: 11, color:'var(--ink-3)', textTransform:'uppercase', letterSpacing:'0.08em', padding:'10px 2px 0' }}>{title}</div>;
}

function SavedListRow({ lang, name, items, last, watching, onLoad }) {
  return (
    <div style={{
      display:'flex', alignItems:'center', gap: 10,
      padding: '10px 10px 10px 12px', borderRadius: 12,
      background:'var(--bg-sunk)', border:'1px solid var(--line-2)',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{name[lang]}</div>
        <div style={{ fontSize: 12, color:'var(--ink-3)', marginTop: 2 }}>
          {items} {tr('items', lang)} · {watching} {lang === 'es' ? 'en seguimiento' : 'watching'}
        </div>
      </div>
      <div style={{ textAlign:'right' }}>
        <div className="mono" style={{ fontSize: 12, color:'var(--sage)', fontWeight: 500 }}>{last} €</div>
        <div style={{ fontSize: 10, color:'var(--ink-3)' }}>{lang === 'es' ? 'última' : 'last week'}</div>
      </div>
      <button onClick={onLoad} title={lang === 'es' ? 'Añadir a la cesta' : 'Add to basket'} style={{
        height: 36, padding:'0 12px', borderRadius: 12, background:'var(--ink)', color:'var(--bg)',
        fontSize: 12, fontWeight: 500, display:'inline-flex', alignItems:'center', gap: 5,
      }}>
        <Icon name="plus" size={11}/>{lang === 'es' ? 'Cesta' : 'Basket'}
      </button>
    </div>
  );
}

function AlertRow({ lang, a, onToggle, onThreshold, onOpen }) {
  const p = CATALOG[a.id];
  const h = p.history;
  const pct = Math.round((h[h.length - 1] - h[0]) / h[0] * 100);
  const down = pct <= 0;
  const sb = { width: 40, height: 40, fontSize: 15, color:'var(--ink-2)', display:'inline-flex', alignItems:'center', justifyContent:'center' };
  return (
    <div style={{
      padding: '10px 12px', borderRadius: 12,
      background:'var(--bg-sunk)', border:'1px solid var(--line-2)',
      display:'flex', flexDirection:'column', gap: 10, opacity: a.on ? 1 : 0.6,
    }}>
      <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
        <button onClick={onOpen} style={{ flex: 1, minWidth: 0, display:'flex', alignItems:'center', gap: 10, textAlign:'left', minHeight: 40 }}>
          <PThumb id={a.id} size={34} radius={8}/>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display:'block', fontSize: 13, fontWeight: 500 }}>{p.name[lang]}</span>
            <span style={{ display:'block', fontSize: 12, color: down ? 'var(--sage-ink)' : 'var(--danger-ink)', marginTop: 1 }}>
              {down ? '↓' : '↑'} {Math.abs(pct)}% {L(lang,'en 6 meses','in 6 months')}
            </span>
          </span>
          <Sparkline values={h} trend={p.trend}/>
        </button>
        <button onClick={onToggle} role="switch" aria-checked={a.on} aria-label={`${L(lang,'Alerta','Alert')} ${p.name[lang]}`} style={{
          width: 44, height: 26, borderRadius: 13, padding: 3, flexShrink: 0,
          background: a.on ? 'var(--sage)' : 'var(--ink-4)', transition:'background 160ms',
          display:'flex', justifyContent: a.on ? 'flex-end' : 'flex-start',
        }}>
          <span style={{ width: 20, height: 20, borderRadius: 12, background:'#fff', boxShadow:'0 1px 3px oklch(0.2 0 0 / .2)' }}></span>
        </button>
      </div>
      {a.on && (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop: 8, borderTop:'1px solid var(--line-2)' }}>
          <span style={{ fontSize: 12, color:'var(--ink-2)' }}>{lang === 'es' ? 'Avisarme por debajo de' : 'Alert me under'}</span>
          <div style={{ display:'inline-flex', alignItems:'center', border:'1px solid var(--line)', borderRadius: 8, background:'var(--bg-panel)' }}>
            <button aria-label="−" onClick={() => onThreshold(a.threshold - 1)} style={sb}>−</button>
            <span className="mono" style={{ minWidth: 38, textAlign:'center', fontSize: 13, fontWeight: 500 }}>{eur(a.threshold)}</span>
            <button aria-label="+" onClick={() => onThreshold(a.threshold + 1)} style={sb}>+</button>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyTab({ lang, title, sub }) {
  return (
    <div style={{
      flex: 1, display:'flex', alignItems:'center', justifyContent:'center',
      textAlign:'center', padding: 40, height: '100%', minHeight: 300,
    }}>
      <div>
        <div className="serif" style={{ fontSize: 24, letterSpacing:'-0.01em', marginBottom: 6 }}>{title}</div>
        <div style={{ fontSize: 13, color:'var(--ink-3)' }}>{sub}</div>
      </div>
    </div>
  );
}

// ─── Mobile checkout sheet (bottom sheet) ─────────────────────────
function MobileCheckoutSheet({ lang, winner, basket, storeTotals, appliedSubs, onClose }) {
  const store = STORES.find(s => s.id === winner.id);
  const avg = storeTotals.reduce((s, x) => s + x.total, 0) / storeTotals.length;
  const ctx = React.useContext(AppCtx);
  const uId = usualStoreId(ctx.profile); const vsUsual = uId !== winner.id;
  const savings = vsUsual ? basketAt(basket, uId) - winner.total : avg - winner.total;
  const savingsSub = vsUsual ? L(lang, `vs. ${STORES.find(s => s.id === uId).name}, tu súper`, `vs. ${STORES.find(s => s.id === uId).name}, your usual`) : tr('vsTypical', lang);
  const [savedAs, setSavedAs] = useState('');
  const [slot, setSlot] = useState(null);
  const [taken, setTaken] = useState(null);
  const [more, setMore] = useState(false);
  const trapRef = useRef(null); useFocusTrap(trapRef);
  const confirm = () => { if (!slot) return; if (slotRace(slot)) { setTaken(slot); setSlot(null); return; } ctx.placeOrder({ stores: [winner.id], total: winner.total + slot.fee, slot, items: basket }); onClose(); };

  return (
    <div role="dialog" aria-modal="true" aria-label={tr('cartReady', lang)} style={{
      position:'absolute', inset: 0, zIndex: 200,
      background: 'oklch(0.20 0.01 60 / 0.45)',
      display:'flex', alignItems:'flex-end', justifyContent:'stretch',
      animation: 'fadeIn 200ms',
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <style>{`@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes sheetUp { from { transform: translateY(100%) } to { transform: none } }`}</style>
      <div ref={trapRef} style={{
        width:'100%', maxHeight:'92%', overflow:'auto', outline:'none',
        background:'var(--bg-panel)',
        borderRadius: '20px 20px 0 0',
        animation: 'sheetUp 320ms cubic-bezier(.2,.7,.3,1)',
        display:'flex', flexDirection:'column',
      }}>
        <div style={{
          padding: '8px 0 0', display:'flex', justifyContent:'center',
        }}>
          <div style={{ width: 38, height: 4, borderRadius: 2, background:'var(--line)' }}/>
        </div>
        <div style={{
          padding: '12px 18px 6px', display:'flex', alignItems:'center', justifyContent:'space-between',
        }}>
          <div>
            <div style={{ fontSize: 11, color:'var(--ink-3)', textTransform:'uppercase', letterSpacing:'0.08em' }}>
              {tr('cartReady', lang)}
            </div>
            <div className="serif" style={{ fontSize: 24, letterSpacing:'-0.015em', lineHeight: 1.15, marginTop: 2 }}>
              {lang === 'es' ? <>Tu pedido en <span style={{ fontStyle:'italic' }}>{store.name}</span></>
                             : <>Your order at <span style={{ fontStyle:'italic' }}>{store.name}</span></>}
            </div>
          </div>
          <button onClick={onClose} aria-label="Cerrar / Close" style={{ width: 44, height: 44, display:'inline-flex', alignItems:'center', justifyContent:'center', color:'var(--ink-3)' }}><Icon name="x" size={16}/></button>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', padding: '10px 18px 0' }}>
          <SummaryStat lang={lang} label={tr('totalBasket', lang)} value={eur(winner.total)} serif/>
          <SummaryStat lang={lang} label={tr('savings', lang)} value={eur(savings)} serif tone="sage" subtitle={savingsSub}/>
        </div>

        <div style={{ padding: '14px 18px' }}>
          <SlotPicker value={slot} onChange={setSlot}/>
          {taken && <SlotTakenNote slot={taken} onPick={(s) => { setSlot(s); setTaken(null); }}/>}
          <button onClick={confirm} disabled={!slot} style={{
            marginTop: 12, width:'100%', minHeight: 48, padding: '12px 14px', borderRadius: 12,
            background: 'var(--ink)', color:'var(--bg)', opacity: slot ? 1 : 0.5,
            fontSize: 13, fontWeight: 500,
            display:'inline-flex', alignItems:'center', justifyContent:'center', gap: 8,
          }}>
            <Icon name="truck" size={13}/>
            {slot ? <>{L(lang,'Confirmar','Confirm')} · {slotLabel(slot, lang)} · {eur(winner.total + slot.fee)}</> : L(lang,'Elige una franja para confirmar','Pick a slot to confirm')}
          </button>
          <button onClick={() => setMore(m => !m)} aria-expanded={more} style={{ marginTop: 10, width:'100%', minHeight: 44, display:'flex', alignItems:'center', justifyContent:'space-between', fontSize: 13, color:'var(--ink-2)' }}>
            <span>{L(lang,'Cambios de precio, sustituciones y más','Price changes, substitutions and more')}</span>
            <span style={{ display:'inline-block', transform: more ? 'rotate(180deg)' : 'none', transition:'transform 160ms' }}><Icon name="down" size={14}/></span>
          </button>
          {more && <div style={{ display:'flex', flexDirection:'column', gap: 12 }}>
          <PriceChangeNote basket={basket} storeId={winner.id}/>
          <SubRulesCard basket={basket}/>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 8 }}>
            <button style={actionBtn} onClick={() => ctx.openOverlay('handoff', { storeId: winner.id })}><Icon name="cart" size={12}/>{L(lang,'Abrir en','Open in')} {store.name}</button>
            <button style={actionBtn} onClick={() => ctx.openOverlay('share')}><Icon name="wa" size={12}/>{tr('whatsapp', lang)}</button>
          </div>

          <CartPeek n={basket.length}>
          <div style={{
            border:'1px solid var(--line)', borderRadius: 12, overflow:'hidden',
            background:'var(--bg-sunk)',
          }}>
            <div style={{
              padding: '7px 10px', borderBottom:'1px solid var(--line-2)', background:'var(--bg-panel)',
              fontSize: 12, color:'var(--ink-3)',
            }} className="mono">
              {store.name.toLowerCase().replace(/\s|é/g,'').replace('í','i').replace('á','a')}.es/cart?list=4f2a
            </div>
            <div style={{ padding: '10px 12px', display:'flex', flexDirection:'column', gap: 6, maxHeight: 180, overflow:'auto' }}>
              {basket.map(b => {
                const p = CATALOG[b.id];
                const sub = appliedSubs.includes(b.id);
                return (
                  <div key={b.id} style={{ display:'flex', alignItems:'center', gap: 8, fontSize: 12 }}>
                    <PThumb id={b.id} size={24} radius={6}/>
                    <span style={{ flex: 1, color:'var(--ink-2)' }}>
                      {sub && p.whiteLabel ? p.whiteLabel.name[lang] : p.name[lang]}
                      <span className="mono" style={{ color:'var(--ink-3)', marginLeft: 6 }}>×{b.qty}</span>
                    </span>
                    <span className="mono" style={{ color:'var(--ink)' }}>
                      {eur(p.prices[winner.id] * b.qty * (sub ? 0.88 : 1))}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          </CartPeek>
          <div style={{
            marginTop: 14, padding: '12px 14px',
            borderRadius: 12, background:'var(--bg-sunk)', border:'1px solid var(--line-2)',
            display:'flex', alignItems:'center', gap: 10,
          }}>
            <Icon name="bell" size={13}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{tr('savedLists', lang)}</div>
              <div style={{ fontSize: 12, color:'var(--ink-3)' }}>
                {lang === 'es' ? 'Avisos cuando tus productos bajen' : 'Alerts when your regulars drop'}
              </div>
            </div>
            {savedAs ? (
              <Pill tone="sage" size="sm"><Icon name="check" size={10}/>{savedAs}</Pill>
            ) : (
              <button onClick={() => setSavedAs(tr('listFrequent', lang))}
                style={{ ...actionBtn, padding: '6px 10px', fontSize: 12 }}>
                <Icon name="plus" size={11}/>
                {lang === 'es' ? 'Guardar' : 'Save'}
              </button>
            )}
          </div>
          </div>}
        </div>

        <div style={{ height: 16 }}/>
      </div>
    </div>
  );
}

Object.assign(window, { MobileApp, MobileYouView, MobileStoreLadder });
