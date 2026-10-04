// UX layer: hero pick + reasons, inline item editor, intent line, guess picker, lazy asks,
// stage stepper, teaching empty states, weekly card, price-drop notes, mobile basket sheet, voice-first input.
const uxChip = { display:'inline-flex', alignItems:'center', gap: 5, padding:'4px 9px', borderRadius: 999, fontSize: 12, fontWeight: 500, background:'var(--bg-panel)', border:'1px solid var(--line)', color:'var(--ink-2)', whiteSpace:'nowrap' };
const uxInfo = { display:'inline-flex', alignItems:'center', gap: 5, fontSize: 12, color:'var(--ink-2)', whiteSpace:'nowrap' };
const avgPrice = (id) => { const v = Object.values(CATALOG[id].prices); return v.reduce((a, b) => a + b, 0) / v.length; };

// Generic words that map to several products — the matcher's pick is a guess the user should confirm.
const AMBIG = { leche:['leche','leche_semi','leche_sl'], queso:['queso','queso_fresco','queso_rallado','queso_sl'], pan:['pan','pan_sg'], yogur:['yogur','yogur_sl'], pasta:['pasta','pasta_sg'] };
const ambigAlts = (id) => (AMBIG[id] || []).filter(x => CATALOG[x]);

function whyItem(b, sid, subs, lang) {
  const p = CATALOG[b.id];
  if (subs.includes(b.id) && p.whiteLabel) return L(lang, 'marca blanca', 'store brand');
  if (p.offer && b.qty >= 3) return p.offer[lang];
  const pct = Math.round((1 - p.prices[sid] / avgPrice(b.id)) * 100);
  return pct >= 3 ? L(lang, `−${pct}% vs media`, `−${pct}% vs avg`) : null;
}

function storeReasons(winner, basket, subs, lang) {
  const sid = winner.id;
  const here = basket.filter(b => {
    const best = STORES.filter(s => !(MISSING[s.id] || []).includes(b.id)).sort((a, z) => itemCost(b, a.id, subs) - itemCost(b, z.id, subs))[0];
    return best && best.id === sid;
  }).length;
  const r = [];
  if (here) r.push(L(lang, `${here} de ${basket.length} productos, más baratos aquí`, `${here} of ${basket.length} items cheapest here`));
  if (winner.shipping === 0) r.push(L(lang, 'envío gratis', 'free delivery'));
  const wl = basket.filter(b => subs.includes(b.id)).length;
  if (wl) r.push(L(lang, `${wl} en marca blanca`, `${wl} on store brand`));
  const offers = basket.filter(b => CATALOG[b.id].offer && b.qty >= 3).length;
  if (offers) r.push(L(lang, `${offers} en oferta`, `${offers} on deal`));
  if (!winner.missing.length) r.push(L(lang, 'lo tiene todo', 'has everything'));
  return r;
}

function priceSignal(id, alerts) {
  const p = CATALOG[id]; const h = p.history || [];
  const cur = Math.min(...Object.values(p.prices));
  const a = (alerts || []).find(x => x.id === id && x.on);
  if (a && cur <= a.threshold) return { kind:'alert', es:`Bajo tu alerta de ${eur(a.threshold)}`, en:`Under your ${eur(a.threshold)} alert` };
  if (h.length > 1) { const pct = Math.round((h[h.length - 1] - h[0]) / h[0] * 100); if (pct <= -4) return { kind:'drop', pct: -pct, es:`Ha bajado ${-pct}%`, en:`Down ${-pct}%` }; }
  return null;
}

// ─── 1 + 5 · One clear recommendation, with reasons ───
function HeroCard({ winner, storeTotals, basket, appliedSubs, variant, onCheckout }) {
  const ctx = React.useContext(AppCtx); const lang = ctx.lang;
  const mobile = variant === 'mobile';
  const store = STORES.find(s => s.id === winner.id);
  const next = storeTotals[1]; const nextStore = next && STORES.find(s => s.id === next.id);
  const gap = next ? next.total - winner.total : 0;
  const avg = storeTotals.reduce((s, x) => s + x.total, 0) / storeTotals.length;
  const reasons = storeReasons(winner, basket, appliedSubs, lang);
  const busy = ctx.state && ctx.state.calculating;
  useEffect(() => { if (!(ctx.profile.asked || {}).pick) ctx.markAsked('pick'); }, []);
  return (
    <div style={{ position:'relative', overflow:'hidden', border:'1px solid var(--line)', borderRadius: mobile ? 16 : 14, background:'linear-gradient(180deg, var(--bg-panel) 0%, var(--bg-sunk) 100%)', padding: mobile ? 16 : '18px 20px', display:'flex', flexDirection:'column', gap: 12 }}>
      <div style={{ position:'absolute', inset: 0, pointerEvents:'none', background:`radial-gradient(500px 160px at 90% 0%, oklch(0.96 0.04 ${store.hue} / var(--glow, 0.6)), transparent 70%)` }}></div>
      <div style={{ position:'relative', display:'flex', alignItems:'center', gap: 12 }}>
        <StoreMark store={store} size={mobile ? 38 : 44}/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ ...fxKicker, color:'var(--sage-ink)', fontWeight: 600 }}>{L(lang, 'Mi recomendación', 'My pick')}</div>
          <div className="serif" style={{ fontSize: mobile ? 26 : 32, lineHeight: 1.08, letterSpacing:'-0.02em', marginTop: 2, opacity: busy ? 0.4 : 1, transition:'opacity 200ms' }}>
            {store.name} · <AnimatedNumber value={winner.total} decimals={2} suffix=" €"/>
          </div>
          {(() => { const uId = usualStoreId(ctx.profile); const d = uId !== winner.id ? basketAt(basket, uId) - winner.total : 0;
            if (mobile && d > 0.05) return <div style={{ fontSize: 13, color:'var(--sage-ink)', fontWeight: 500, marginTop: 3 }}>{L(lang, `${eur(d)} menos que en ${STORES.find(s => s.id === uId).name}, tu súper`, `${eur(d)} less than ${STORES.find(s => s.id === uId).name}, your usual`)}</div>;
            return gap > 0.004 && nextStore ? (
            <div style={{ fontSize: 13, color:'var(--sage-ink)', fontWeight: 500, marginTop: 3 }}>
              {L(lang, `${eur(gap)} más barato que ${nextStore.name}`, `${eur(gap)} cheaper than ${nextStore.name}`)}
            </div>) : null; })()}
        </div>
      </div>
      {!mobile && <div style={{ position:'relative' }}>
        <div style={{ fontSize: 12, color:'var(--ink-3)', marginBottom: 6 }}>{L(lang, 'Por qué', 'Why')}</div>
        <div role="list" style={{ display:'flex', flexWrap:'wrap', gap:'4px 14px' }}>
          {reasons.map(r => <span role="listitem" key={r} style={uxInfo}><span style={{ color:'var(--sage)' }}><Icon name="check" size={10}/></span>{r}</span>)}
        </div>
      </div>}
      <HeroSlotLine winner={winner} storeTotals={storeTotals}/>
      {busy ? <div style={{ position:'relative', display:'flex', alignItems:'center', gap: 8, fontSize: 12, color:'var(--ink-3)' }}><DotsLoader/>{L(lang, 'Actualizando precios…', 'Refreshing prices…')}</div> : <PriceFresh/>}
      {!mobile && <div style={{ position:'relative', display:'flex', flexWrap:'wrap', gap:'4px 14px', fontSize: 12, color:'var(--ink-3)' }}>
        {winner.shipping > 0 && <span>{eur(winner.shipping)} {tr('shipping', lang)}</span>}
        {(() => { const uId = usualStoreId(ctx.profile); if (uId === winner.id) return null; const d = basketAt(basket, uId) - winner.total; return d > 0.05 ? <span style={{ color:'var(--sage-ink)', fontWeight: 500 }}>{L(lang, `${eur(d)} menos que en ${STORES.find(s => s.id === uId).name}, tu súper`, `${eur(d)} less than ${STORES.find(s => s.id === uId).name}, your usual`)}</span> : null; })()}
        {window.LoyaltyNote && <LoyaltyNote storeId={store.id}/>}
      </div>}
      <span className="sr-only" aria-live="polite">{L(lang, `Recomendación: ${store.name}, ${eur(winner.total)}`, `Pick: ${store.name}, ${eur(winner.total)}`)}</span>
      {onCheckout && (
        <button onClick={onCheckout} style={{ ...fxBtnPrimary, position:'relative', width:'100%' }}>
          {L(lang, 'Pedir', 'Order')} · {eur(winner.total)} <Icon name="arrow" size={13}/>
        </button>
      )}
    </div>
  );
}

function OthersToggle({ open, onToggle, count }) {
  const lang = React.useContext(AppCtx).lang;
  return (
    <button onClick={onToggle} aria-expanded={open} style={{ ...fxBtnGhost, alignSelf:'flex-start', background:'transparent' }}>
      <span style={{ display:'inline-flex', transform: open ? 'rotate(180deg)' : 'none', transition:'transform 160ms' }}><Icon name="down" size={12}/></span>
      {open ? L(lang, 'Ocultar comparación', 'Hide comparison') : L(lang, `Ver los otros ${count} supers`, `See the other ${count} stores`)}
    </button>
  );
}

// ─── 2 · Edit an item where it lives ───
function ItemEditor({ b, substituted }) {
  const ctx = React.useContext(AppCtx); const lang = ctx.lang; const A = ctx.actions;
  const p = CATALOG[b.id];
  const first = deaccent(p.name.es.split(' ')[0]);
  const locked = (ctx.profile.lockBrand || []).includes(b.id);
  const alts = Object.values(CATALOG)
    .filter(x => x.category === p.category && x.id !== b.id && !ctx.basket.some(y => y.id === x.id))
    .map(x => ({ x, c: Math.min(...Object.values(x.prices)), same: deaccent(x.name.es).startsWith(first) ? 0 : 1 }))
    .sort((a, z) => a.same - z.same || Math.abs(a.c - avgPrice(b.id)) - Math.abs(z.c - avgPrice(b.id)))
    .slice(0, 4);
  const seg = (on) => ({ flex: 1, minHeight: 38, padding:'4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 500, textAlign:'left', background: on ? 'var(--ink)' : 'var(--bg-panel)', color: on ? 'var(--bg)' : 'var(--ink)', border:`1px solid ${on ? 'var(--ink)' : 'var(--line)'}`, lineHeight: 1.25 });
  return (
    <div style={{ padding:'4px 2px 12px 44px', display:'flex', flexDirection:'column', gap: 10, animation:'fadeIn 160ms' }}>
      {p.whiteLabel && !locked && (
        <div>
          <div style={{ fontSize: 12, color:'var(--ink-3)', marginBottom: 5 }}>{L(lang, 'Marca', 'Brand')}</div>
          <div style={{ display:'flex', gap: 6 }}>
            <button aria-pressed={!substituted} onClick={() => substituted && A.toggleSub(b.id, false)} style={seg(!substituted)}>{p.name[lang]}</button>
            <button aria-pressed={substituted} onClick={() => !substituted && A.toggleSub(b.id, true)} style={seg(substituted)}>
              {p.whiteLabel.name[lang]}<span style={{ display:'block', fontSize: 12, opacity: 0.8 }}>−{eur(p.whiteLabel.save * b.qty)}</span>
            </button>
          </div>
        </div>
      )}
      {alts.length > 0 && (
        <div>
          <div style={{ fontSize: 12, color:'var(--ink-3)', marginBottom: 5 }}>{L(lang, 'Cambiar por', 'Swap for')}</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap: 6 }}>
            {alts.map(({ x, c }) => (
              <button key={x.id} onClick={() => A.swapItem(b.id, x.id)} style={{ ...uxChip, minHeight: 34, padding:'0 10px', color:'var(--ink)' }}>
                <span aria-hidden="true">{x.emoji}</span>{x.name[lang]}<span className="mono" style={{ color:'var(--ink-3)', fontWeight: 400 }}>{eur(c)}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      <OosItemRow id={b.id}/>
      <label style={{ display:'flex', alignItems:'center', gap: 8, fontSize: 13, minHeight: 32, cursor:'pointer' }}>
        <input type="checkbox" checked={locked} onChange={() => ctx.toggleLock(b.id)} style={{ width: 16, height: 16, accentColor:'var(--ink)' }}/>
        {L(lang, 'Siempre esta marca (no proponer marca blanca)', 'Always this brand (no store-brand suggestions)')}
      </label>
      <div style={{ display:'flex', gap: 14 }}>
        <button onClick={() => ctx.openHistory(b.id)} style={{ fontSize: 12, color:'var(--accent)', fontWeight: 500, minHeight: 32 }}>{L(lang, 'Historial de precio', 'Price history')}</button>
        <button onClick={() => A.removeFromBasket(b.id)} style={{ fontSize: 12, color:'var(--danger-ink)', fontWeight: 500, minHeight: 32 }}>{tr('remove', lang)}</button>
      </div>
    </div>
  );
}

// ─── 11 · Price drops inside the basket ───
function PriceDropNote() {
  const ctx = React.useContext(AppCtx); const lang = ctx.lang;
  const hits = ctx.basket.map(b => ({ b, s: priceSignal(b.id, ctx.alerts) })).filter(x => x.s);
  if (!hits.length) return null;
  return (
    <div style={{ display:'flex', alignItems:'flex-start', gap: 8, padding:'10px 12px', borderRadius: 12, background:'var(--sage-soft)', border:'1px solid var(--sage-line)', fontSize: 12, color:'var(--sage-ink)' }}>
      <Icon name="down" size={13}/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <b style={{ fontWeight: 600 }}>{L(lang, `${hits.length} de tus productos ${hits.length > 1 ? 'han' : 'ha'} bajado`, `${hits.length} of your items ${hits.length > 1 ? 'have' : 'has'} dropped`)}</b>
        <div style={{ marginTop: 2, color:'var(--ink)' }}>{hits.slice(0, 3).map(h => `${CATALOG[h.b.id].name[lang]} (${h.s.kind === 'alert' ? L(lang, 'alerta', 'alert') : '−' + h.s.pct + '%'})`).join(' · ')}</div>
      </div>
    </div>
  );
}

// ─── 4 · What I understood ───
function IntentLine({ recipe, servings, src, items, skip }) {
  const ctx = React.useContext(AppCtx); const lang = ctx.lang;
  const home = items.filter(i => skip.includes(i.id)).map(i => CATALOG[i.id].name[lang].toLowerCase());
  return (
    <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', gap: 6, marginBottom: 8 }}>
      <span style={{ fontSize: 12, color:'var(--ink-3)' }}>{L(lang, 'He entendido:', 'I understood:')}</span>
      <span style={{ ...uxInfo, color:'var(--ink)', fontWeight: 500 }}><span aria-hidden="true">{recipe.emoji}</span>{recipe.name[lang]}</span>
      <span aria-hidden="true" style={{ color:'var(--ink-4)' }}>·</span>
      <span style={uxInfo}>{servings} {L(lang, 'personas', 'people')}{src === 'household' ? L(lang, ' · tu hogar', ' · your household') : ''}</span>
      {(ctx.diet || []).map(d => (
        <button key={d} onClick={() => ctx.toggleDiet(d)} aria-label={L(lang, `Quitar ${DIETS[d].es}`, `Remove ${DIETS[d].en}`)} style={{ ...uxChip, minHeight: 28, background:'var(--accent-soft)', borderColor:'var(--accent-line)', color:'var(--accent-ink)' }}>
          {DIETS[d][lang]}<Icon name="x" size={9}/>
        </button>
      ))}
      <DietChip/>
      {home.length > 0 && <span style={{ ...uxInfo, color:'var(--sage-ink)', whiteSpace:'normal' }}><Icon name="home" size={10}/>{L(lang, 'tienes', 'you have')} {home.join(', ')}</span>}
    </div>
  );
}

// ─── 7 · Ask for diet the first time a recipe needs it ───
function DietAsk() {
  const ctx = React.useContext(AppCtx); const lang = ctx.lang;
  if ((ctx.profile.asked || {}).diet || (ctx.diet || []).length || !(ctx.profile.asked || {}).pick) return null;
  const pick = (k) => { if (k) ctx.toggleDiet(k); ctx.markAsked('diet'); };
  return (
    <div style={{ padding:'10px 14px', borderBottom:'1px solid var(--line-2)', background:'var(--accent-soft)', display:'flex', flexDirection:'column', gap: 7 }}>
      <div style={{ fontSize: 13, color:'var(--accent-ink)', fontWeight: 500 }}>{L(lang, '¿Sigues alguna dieta? Adapto los ingredientes.', 'Any diet? I’ll adapt the ingredients.')}</div>
      <div style={{ display:'flex', flexWrap:'wrap', gap: 6 }}>
        {Object.entries(DIETS).map(([k, d]) => <button key={k} onClick={() => pick(k)} style={{ ...uxChip, minHeight: 32, padding:'0 11px', color:'var(--ink)' }}>{d[lang]}</button>)}
        <button onClick={() => pick(null)} style={{ ...uxChip, minHeight: 32, padding:'0 11px', background:'transparent', border:'none' }}>{L(lang, 'Ninguna', 'None')}</button>
      </div>
    </div>
  );
}

// ─── 7 · Ask for stores + cards the first time the comparison matters ───
function StoresAsk() {
  const ctx = React.useContext(AppCtx); const lang = ctx.lang;
  const p = ctx.profile;
  if ((p.asked || {}).stores || !(ctx.orders || []).some(o => o.placedAt)) return null;
  const tg = (arr, v) => arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v];
  const chip = (on) => ({ ...uxChip, minHeight: 34, padding:'0 11px', background: on ? 'var(--ink)' : 'var(--bg-panel)', color: on ? 'var(--bg)' : 'var(--ink)', borderColor: on ? 'var(--ink)' : 'var(--line)' });
  return (
    <div style={{ ...fxCard, padding:'12px 14px', display:'flex', flexDirection:'column', gap: 8 }}>
      <div style={{ display:'flex', alignItems:'flex-start', gap: 8 }}>
        <div style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{L(lang, '¿Dónde compras normalmente?', 'Where do you usually shop?')}<div style={{ fontSize: 12, color:'var(--ink-3)', fontWeight: 400, marginTop: 1 }}>{L(lang, 'Los marco en la comparación y aplico tus tarjetas.', 'I’ll flag them and apply your loyalty cards.')}</div></div>
        <button onClick={() => ctx.markAsked('stores')} aria-label={L(lang, 'Ahora no', 'Not now')} style={{ width: 32, height: 32, display:'inline-flex', alignItems:'center', justifyContent:'center', color:'var(--ink-3)', borderRadius: 8 }}><Icon name="x" size={12}/></button>
      </div>
      <div style={{ display:'flex', flexWrap:'wrap', gap: 6 }}>
        {STORES.map(s => { const on = (p.fav || []).includes(s.id); return <button key={s.id} aria-pressed={on} onClick={() => ctx.updateProfile({ fav: tg(p.fav || [], s.id) })} style={chip(on)}>{s.name}</button>; })}
      </div>
      <div style={{ display:'flex', flexWrap:'wrap', gap: 6, alignItems:'center' }}>
        <span style={{ fontSize: 12, color:'var(--ink-3)' }}>{L(lang, 'Tarjetas:', 'Cards:')}</span>
        {LOYALTY.map(c => { const on = (p.cards || []).includes(c.id); return <button key={c.id} aria-pressed={on} onClick={() => ctx.updateProfile({ cards: tg(p.cards || [], c.id) })} style={chip(on)}>{c.name}</button>; })}
        <button onClick={() => ctx.markAsked('stores')} style={{ ...fxBtnGhost, minHeight: 34, marginLeft:'auto' }}>{L(lang, 'Listo', 'Done')}</button>
      </div>
    </div>
  );
}

// ─── 6 · Confirm fuzzy matches ───
function GuessPicker({ id, resolved, onPick }) {
  const ctx = React.useContext(AppCtx); const lang = ctx.lang;
  const alts = ambigAlts(id);
  if (resolved) return null;
  return (
    <div style={{ marginTop: 8, padding:'8px 10px', borderRadius: 12, background:'var(--warn-soft)', border:'1px dashed var(--warn-line)' }}>
      <div style={{ fontSize: 12, color:'var(--warn-ink)', fontWeight: 500, marginBottom: 6 }}>
        {L(lang, `He supuesto ${CATALOG[id].name.es.toLowerCase()}. ¿Cuál quieres?`, `I guessed ${CATALOG[id].name.en.toLowerCase()}. Which one?`)}
      </div>
      <div style={{ display:'flex', flexWrap:'wrap', gap: 6 }}>
        {alts.map(a => (
          <button key={a} onClick={() => onPick(a)} style={{ ...uxChip, minHeight: 32, padding:'0 10px', color:'var(--ink)', borderColor: a === id ? 'var(--ink)' : 'var(--line)' }}>
            <span aria-hidden="true">{CATALOG[a].emoji}</span>{CATALOG[a].name[lang]}{a === id && <Icon name="check" size={10}/>}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── 8 · Where am I, what's next ───
function StageSteps({ stage }) {
  const lang = React.useContext(AppCtx).lang;
  const steps = [L(lang, 'Pide', 'Ask'), L(lang, 'Revisa', 'Review'), L(lang, 'Franja', 'Slot'), L(lang, 'Confirma', 'Confirm')];
  return (
    <ol aria-label={L(lang, 'Progreso', 'Progress')} style={{ listStyle:'none', margin: 0, padding: 0, display:'flex', alignItems:'center', gap: 8 }}>
      {steps.map((s, i) => {
        const done = i < stage, cur = i === stage;
        return (
          <React.Fragment key={s}>
            <li aria-current={cur ? 'step' : undefined} style={{ display:'flex', alignItems:'center', gap: 6, fontSize: 12, whiteSpace:'nowrap', color: cur ? 'var(--ink)' : done ? 'var(--ink-2)' : 'var(--ink-3)', fontWeight: cur ? 600 : 400 }}>
              <span style={{ width: 20, height: 20, borderRadius: 12, display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize: 12, fontWeight: 600, background: done ? 'var(--sage-soft)' : cur ? 'var(--ink)' : 'var(--bg-sunk)', color: done ? 'var(--sage-ink)' : cur ? 'var(--bg)' : 'var(--ink-3)', border:`1px solid ${done ? 'var(--sage-line)' : cur ? 'var(--ink)' : 'var(--line)'}`, boxShadow: cur ? '0 0 0 3px var(--accent-soft)' : 'none' }}>
                {done ? <Icon name="check" size={10}/> : i + 1}
              </span>{s}
            </li>
            {i < steps.length - 1 && <li aria-hidden="true" style={{ width: 20, height: 1, background: done ? 'var(--sage-line)' : 'var(--line)' }}></li>}
          </React.Fragment>
        );
      })}
    </ol>
  );
}

// ─── 9 · Empty states that teach by doing ───
function TeachEmpty({ title, sub }) {
  const ctx = React.useContext(AppCtx); const lang = ctx.lang;
  const ex = [
    { e:'🥘', t: L(lang, 'Paella para 4', 'Paella for 4'), run: () => ctx.actions.handleUserSend(L(lang, 'Paella para 4', 'Paella for 4')) },
    { e:'🥛', t: L(lang, '3 l de leche, pan y huevos', '3 L milk, bread and eggs'), run: () => ctx.actions.handleUserSend(L(lang, '3 l de leche, pan y huevos', '3 L milk, bread and eggs')) },
    { e:'↻', t: L(lang, 'Repite mi última compra', 'Repeat my last order'), run: () => ctx.repeatLast() },
  ];
  return (
    <div style={{ display:'flex', flexDirection:'column', gap: 12, padding: title ? '28px 4px' : '0', maxWidth: 360, margin:'0 auto', width:'100%' }}>
      <div>
        {title && <div className="serif" style={{ fontSize: 24, letterSpacing:'-0.01em', lineHeight: 1.15 }}>{title}</div>}
        {sub && <div style={{ fontSize: 13, color:'var(--ink-3)', marginTop: 4 }}>{sub}</div>}
      </div>
      <div style={{ fontSize: 11, color:'var(--ink-3)', textTransform:'uppercase', letterSpacing:'0.07em' }}>{L(lang, 'Prueba una', 'Try one')}</div>
      <div style={{ display:'flex', flexDirection:'column', gap: 6 }}>
        {ex.map(x => (
          <button key={x.t} onClick={() => { x.run(); window.dispatchEvent(new Event('ai-go-chat')); }} style={{ display:'flex', alignItems:'center', gap: 10, minHeight: 46, padding:'0 12px', borderRadius: 12, background:'var(--bg-panel)', border:'1px solid var(--line)', fontSize: 13, fontWeight: 500, textAlign:'left' }}>
            <span aria-hidden="true" style={{ fontSize: 16, width: 22, textAlign:'center' }}>{x.e}</span>
            <span style={{ flex: 1 }}>{x.t}</span>
            <span style={{ color:'var(--ink-3)' }}><Icon name="arrow" size={12}/></span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── 10 · Weekly rhythm ───
function WeeklyCard() {
  const ctx = React.useContext(AppCtx); const lang = ctx.lang;
  const o = (ctx.orders || []).find(x => x.date && x.date.es !== 'Hoy' && x.items);
  if (!o || ctx.basket.length) return null;
  const totals = STORES.map(s => { const it = o.items.reduce((t, b) => t + itemCost(b, s.id, []), 0); return { s, t: it + (it >= s.minFree ? 0 : s.delivery) }; }).sort((a, z) => a.t - z.t);
  const best = totals[0]; const diff = o.total - best.t;
  const n = o.items.length;
  return (
    <div style={{ ...fxCard, padding:'14px', display:'flex', flexDirection:'column', gap: 10, background:'var(--bg-panel)', border:'1px solid var(--line)' }}>
      <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
        <StoreMark store={best.s} size={32}/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={fxKicker}>{L(lang, 'Tu compra habitual', 'Your usual shop')}</div>
          <div style={{ fontSize: 14, fontWeight: 600, marginTop: 1 }}>{L(lang, `Lo del ${o.date.es.toLowerCase()}, listo otra vez`, `${o.date.en}'s shop, ready again`)}</div>
          <div style={{ fontSize: 12, color:'var(--ink-3)', marginTop: 1 }}>
            {n} {tr('items', lang)} · {eur(best.t)} {L(lang, 'en', 'at')} {best.s.name}
            {Math.abs(diff) > 0.05 && <> · <b style={{ fontWeight: 600, color: diff > 0 ? 'var(--sage-ink)' : 'var(--danger-ink)' }}>{diff > 0 ? L(lang, `${eur(diff)} menos`, `${eur(diff)} less`) : L(lang, `${eur(-diff)} más`, `${eur(-diff)} more`)}</b> {L(lang, 'que la última vez', 'than last time')}</>}
          </div>
        </div>
      </div>
      <button onClick={() => ctx.repeatOrder(o)} style={{ ...fxBtnPrimary, minHeight: 40 }}><Icon name="repeat" size={13}/>{L(lang, 'Cargar en la cesta', 'Load into basket')}</button>
    </div>
  );
}

// ─── 12 · Mobile: basket peek + bottom sheet over the chat ───
function MobileBasketPeek({ onOpen }) {
  const ctx = React.useContext(AppCtx); const lang = ctx.lang;
  const start = useRef(null);
  if (!ctx.basket.length || !ctx.winner) return null;
  const st = STORES.find(s => s.id === ctx.winner.id);
  const n = ctx.basket.length;
  return (
    <button data-fly-target="1" onClick={onOpen} onPointerDown={e => { start.current = e.clientY; }} onPointerMove={e => { if (start.current !== null && start.current - e.clientY > 24) { start.current = null; onOpen(); } }} onPointerUp={() => { start.current = null; }}
      aria-label={L(lang, `Abrir cesta: ${n} productos, ${eur(ctx.winner.total)} en ${st.name}`, `Open basket: ${n} items, ${eur(ctx.winner.total)} at ${st.name}`)}
      style={{ width:'100%', marginBottom: 8, padding:'6px 12px 8px', borderRadius: 12, background:'var(--bg-panel)', border:'1px solid var(--line)', boxShadow:'0 -4px 16px oklch(0.2 0.01 60 / 0.06)', display:'flex', flexDirection:'column', alignItems:'stretch', gap: 4, touchAction:'none' }}>
      <span aria-hidden="true" style={{ alignSelf:'center', width: 32, height: 4, borderRadius: 2, background:'var(--line)' }}></span>
      <span style={{ display:'flex', alignItems:'center', gap: 10 }}>
        <StoreMark store={st} size={26}/>
        <span style={{ flex: 1, minWidth: 0, textAlign:'left' }}>
          <span style={{ display:'block', fontSize: 13, fontWeight: 600 }}>{n} {tr('items', lang)} · {st.name}</span>
          <span style={{ display:'block', fontSize: 12, color:'var(--ink-3)' }}>{L(lang, 'Desliza para ver la cesta', 'Swipe up for basket')}</span>
        </span>
        <span className="serif" style={{ fontSize: 20, whiteSpace:'nowrap' }}>{eur(ctx.winner.total)}</span>
        <span style={{ color:'var(--ink-3)' }}><Icon name="up" size={14}/></span>
      </span>
    </button>
  );
}

function MobileBasketSheet({ onClose, onCheckout, onCompare }) {
  const ctx = React.useContext(AppCtx); const lang = ctx.lang;
  const [dy, setDy] = useState(0);
  const start = useRef(null);
  const trapRef = useRef(null); useFocusTrap(trapRef);
  useEffect(() => { const k = e => { if (e.key === 'Escape') onClose(); }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, []);
  useEffect(() => { if (!ctx.basket.length) onClose(); }, [ctx.basket.length]);
  const w = ctx.winner;
  const n = ctx.basket.length;
  const st = w && STORES.find(s => s.id === w.id);
  const up = () => { if (start.current === null) return; start.current = null; if (dy > 90) onClose(); else setDy(0); };
  return (
    <div role="dialog" aria-modal="true" aria-label={tr('basket', lang)} onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position:'absolute', inset: 0, zIndex: 180, background:'oklch(0.20 0.01 60 / 0.18)', display:'flex', alignItems:'flex-end', animation:'fadeIn 160ms' }}>
      <div ref={trapRef} style={{ outline:'none', width:'100%', height:'84%', background:'var(--bg-panel)', borderRadius:'20px 20px 0 0', boxShadow:'0 -10px 40px oklch(0.2 0.01 60 / 0.18)', display:'flex', flexDirection:'column', transform:`translateY(${dy}px)`, transition: start.current !== null ? 'none' : 'transform 220ms cubic-bezier(.2,.7,.3,1)', animation:'sheetUp 300ms cubic-bezier(.2,.7,.3,1)' }}>
        <div onPointerDown={e => { start.current = e.clientY; e.currentTarget.setPointerCapture(e.pointerId); }} onPointerMove={e => { if (start.current !== null) setDy(Math.max(0, e.clientY - start.current)); }} onPointerUp={up} onPointerCancel={up}
          style={{ padding:'8px 16px 10px', borderBottom:'1px solid var(--line-2)', touchAction:'none', cursor:'grab' }}>
          <div style={{ display:'flex', justifyContent:'center', marginBottom: 8 }}><div style={{ width: 38, height: 4, borderRadius: 2, background:'var(--line)' }}></div></div>
          <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={fxKicker}>{tr('basket', lang)} · {n} {tr('items', lang)}</div>
              {w && <div className="serif" style={{ fontSize: 22, lineHeight: 1.1, marginTop: 2 }}>{eur(w.total)} <span style={{ fontSize: 14, color:'var(--ink-3)', fontStyle:'italic' }}>{L(lang, 'en', 'at')} {st.name}</span></div>}
            </div>
            <button onClick={onClose} aria-label="Cerrar / Close" style={{ width: 44, height: 44, display:'inline-flex', alignItems:'center', justifyContent:'center', color:'var(--ink-3)' }}><Icon name="down" size={16}/></button>
          </div>
        </div>
        <div style={{ flex: 1, overflowY:'auto', padding:'12px 16px', display:'flex', flexDirection:'column', gap: 12 }}>
          <BasketPane lang={lang} basket={ctx.basket} appliedSubs={ctx.appliedSubs} onRemove={ctx.actions.removeFromBasket} onQtyChange={ctx.actions.changeQty}/>
          <OptimizerPane lang={lang} basket={ctx.basket} appliedSubs={ctx.appliedSubs} onApply={ctx.actions.applySub} onApplyAll={ctx.actions.applyAllSubs}/>
        </div>
        {w && (
          <div style={{ padding:'10px 16px 16px', borderTop:'1px solid var(--line-2)', display:'flex', gap: 8 }}>
            <button onClick={onCompare} style={{ ...fxBtnGhost, minHeight: 48 }}>{L(lang, 'Comparar', 'Compare')}</button>
            <button onClick={onCheckout} style={{ ...fxBtnPrimary, flex: 1, minHeight: 48 }}>{L(lang, 'Pedir', 'Order')} · {eur(w.total)} <Icon name="arrow" size={13}/></button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 13 · Mobile: voice first ───
function MobileVoiceInput({ onSend, draft, setDraft }) {
  const ctx = React.useContext(AppCtx); const lang = ctx.lang;
  const [mode, setMode] = useState('voice');
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState('');
  const [miss, setMiss] = useState(false);
  const failRef = useRef(false);
  const timer = useRef(null), downAt = useRef(0), tapMode = useRef(false), phraseRef = useRef(''), idx = useRef(0), doneRef = useRef(false);
  useEffect(() => () => clearInterval(timer.current), []);
  const phrases = lang === 'es' ? ['Paella para cuatro', 'Tortilla de patatas', '2 litros de leche y pan'] : ['Paella for four', 'Spanish omelette', '2 liters of milk and bread'];
  const finish = () => { clearInterval(timer.current); const t = phraseRef.current; setListening(false); setHeard(''); if (t) onSend(t); else if (failRef.current) { failRef.current = false; setMiss(true); feedback('undo'); setTimeout(() => setMiss(false), 4000); } phraseRef.current = ''; };
  const begin = () => {
    const n = idx.current++; const fail = n % 4 === 3; failRef.current = fail; setMiss(false);
    const ph = fail ? '' : phrases[n % phrases.length];
    phraseRef.current = ph; doneRef.current = false; setListening(true); setHeard('');
    let i = 0; clearInterval(timer.current);
    timer.current = setInterval(() => {
      i++; setHeard(ph.slice(0, i));
      if (i >= ph.length) { clearInterval(timer.current); doneRef.current = true; if (tapMode.current) setTimeout(finish, 500); }
    }, 60);
  };
  const onDown = (e) => {
    if (listening) { feedback('micOff'); finish(); return; }
    if (needMicPrime(ctx)) return;
    feedback('micOn');
    e.currentTarget.setPointerCapture && e.currentTarget.setPointerCapture(e.pointerId);
    downAt.current = Date.now(); tapMode.current = false; begin();
  };
  const onUp = () => {
    if (!listening && !phraseRef.current) return;
    if (Date.now() - downAt.current < 300) { tapMode.current = true; if (doneRef.current) setTimeout(finish, 300); return; }
    if (!tapMode.current) { feedback('micOff'); finish(); }
  };
  const kb = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><rect x="2.5" y="6" width="19" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10"/></svg>;
  const side = { width: 46, height: 46, borderRadius: 23, background:'var(--bg-sunk)', border:'1px solid var(--line-2)', color:'var(--ink-2)', display:'inline-flex', alignItems:'center', justifyContent:'center', flexShrink: 0 };
  if (mode === 'type') {
    return (
      <div style={{ display:'flex', alignItems:'center', gap: 8 }}>
        <button onClick={() => setMode('voice')} aria-label={L(lang, 'Volver a voz', 'Back to voice')} style={{ ...side, width: 40, height: 40 }}><Icon name="mic" size={16}/></button>
        <div style={{ flex: 1, minWidth: 0 }}><ChatInput lang={lang} draft={draft} setDraft={setDraft} onSend={(t) => { onSend(t); setDraft(''); }}/></div>
      </div>
    );
  }
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap: 8 }}>
      <div aria-live="polite" style={{ minHeight: 34, maxWidth:'100%', display:'flex', alignItems:'center', gap: 8, padding: listening ? '7px 14px' : 0, borderRadius: 999, background: listening ? 'var(--accent-soft)' : 'transparent', border: listening ? '1px solid var(--accent-line)' : '1px solid transparent', fontSize: 13 }}>
        {listening ? (
          <>
            <span style={{ display:'flex', alignItems:'center', gap: 2, height: 16 }}>{[0,1,2,3,4].map(k => <span key={k} style={{ width: 3, height: 16, borderRadius: 2, background:'oklch(0.50 0.15 255)', animation:`wave 700ms ${k*110}ms ease-in-out infinite` }}></span>)}</span>
            <span style={{ color: heard ? 'var(--ink)' : 'var(--ink-3)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{heard || L(lang, 'Escuchando…', 'Listening…')}</span>
          </>
        ) : <span style={{ fontSize: 12, color:'var(--ink-3)' }}>{miss ? <span style={{ color:'var(--warn-ink)', fontWeight: 500 }}>{L(lang, 'No te he entendido. Prueba otra vez o escribe.', 'I didn’t catch that. Try again or type it.')}</span> : L(lang, 'Mantén pulsado y habla', 'Hold and talk')}</span>}
      </div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap: 28, width:'100%' }}>
        <button onClick={() => setMode('type')} aria-label={L(lang, 'Escribir', 'Type instead')} style={side}>{kb}</button>
        <button onPointerDown={onDown} onPointerUp={onUp} onPointerCancel={onUp} onContextMenu={e => e.preventDefault()}
          aria-label={listening ? L(lang, 'Enviar', 'Send') : L(lang, 'Hablar', 'Talk')} aria-pressed={listening}
          style={{ width: 68, height: 68, borderRadius: 34, flexShrink: 0, background: listening ? 'oklch(0.50 0.15 255)' : 'var(--ink)', color:'#fff', display:'inline-flex', alignItems:'center', justifyContent:'center', boxShadow:'0 8px 24px oklch(0.2 0.01 60 / 0.22)', animation: listening ? 'micPulse 1.2s ease-out infinite' : 'none', transform: listening ? 'scale(1.06)' : 'none', transition:'transform 160ms, background 160ms', touchAction:'none', userSelect:'none', WebkitUserSelect:'none' }}>
          {listening ? <span style={{ width: 18, height: 18, borderRadius: 4, background:'#fff' }}></span> : <Icon name="mic" size={26}/>}
        </button>
        <button onClick={() => ctx.openOverlay('photo')} aria-label={L(lang, 'Foto de lista', 'Photo of list')} style={side}><Icon name="camera" size={18}/></button>
      </div>
    </div>
  );
}

Object.assign(window, { AMBIG, ambigAlts, whyItem, priceSignal, HeroCard, OthersToggle, ItemEditor, PriceDropNote, IntentLine, DietAsk, StoresAsk, GuessPicker, StageSteps, TeachEmpty, WeeklyCard, MobileBasketPeek, MobileBasketSheet, MobileVoiceInput });
