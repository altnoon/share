// Feature sheets: price history, weekly menu, photo list, share, onboarding, split checkout, tracking.
function PriceHistorySheet({ variant, id, onClose }) {
  const ctx = React.useContext(AppCtx);
  const lang = ctx.lang;
  const p = CATALOG[id];
  const h = p.history;
  const now = h[h.length - 1], min = Math.min(...h), max = Math.max(...h);
  const pct = Math.round((now - h[0]) / h[0] * 100);
  const good = now <= min * 1.02;
  const months = L(lang, ['abr','may','jun','jul','ago','sep'], ['Apr','May','Jun','Jul','Aug','Sep']);
  const W = 460, H = 130, pad = 8;
  const rng = (max - min) || 1;
  const pts = h.map((v, i) => [pad + i * (W - 2 * pad) / (h.length - 1), pad + (1 - (v - min) / rng) * (H - 2 * pad)]);
  const ranked = STORES.map(s => ({ s, price: p.prices[s.id], out: (MISSING[s.id] || []).includes(id) })).sort((a, b) => a.price - b.price);
  const [thr, setThr] = useState(Math.floor(now * 0.95 * 10) / 10);
  const has = (ctx.alerts || []).some(a => a.id === id);
  return (
    <Sheet variant={variant} onClose={onClose} kicker={L(lang,'Historial de precio · 6 meses','Price history · 6 months')}
      title={<span style={{ display:'inline-flex', alignItems:'center', gap: 10 }}><PThumb id={p.id} size={34} radius={8}/>{p.name[lang]}</span>}
      footer={
        <div style={{ display:'flex', alignItems:'center', gap: 10, flexWrap:'wrap' }}>
          <span style={{ fontSize: 13, color:'var(--ink-2)', flex: '1 1 auto' }}>{L(lang,'Avisarme por debajo de','Alert me under')}</span>
          <div style={{ display:'inline-flex', alignItems:'center', border:'1px solid var(--line)', borderRadius: 12 }}>
            <button aria-label="−" onClick={() => setThr(t => Math.max(0.1, +(t - 0.1).toFixed(2)))} style={{ width: 40, height: 40, fontSize: 16 }}>−</button>
            <span className="mono" style={{ minWidth: 64, textAlign:'center', fontSize: 13, fontWeight: 500 }}>{eur(thr)}</span>
            <button aria-label="+" onClick={() => setThr(t => +(t + 0.1).toFixed(2))} style={{ width: 40, height: 40, fontSize: 16 }}>+</button>
          </div>
          <button onClick={() => { ctx.addAlert(id, thr); onClose(); }} style={fxBtnPrimary}><Icon name="bell" size={13}/>{has ? L(lang,'Actualizar alerta','Update alert') : L(lang,'Crear alerta','Create alert')}</button>
        </div>
      }>
      <div style={{ display:'flex', alignItems:'flex-end', gap: 16, flexWrap:'wrap', marginBottom: 12 }}>
        <div>
          <div style={fxKicker}>{L(lang,'Hoy, más barato en','Cheapest today at')} {ranked[0].s.name}</div>
          <div className="serif" style={{ fontSize: 40, lineHeight: 1 }}>{eur(ranked[0].price)}</div>
          <div className="mono" style={{ fontSize: 12, color:'var(--ink-3)', marginTop: 4 }}>{unitPrice(id, ranked[0].s.id, lang)} · {p.unit[lang]}</div>
        </div>
        <Pill tone={good ? 'sage' : pct > 0 ? 'warn' : 'default'} size="md">
          {good ? L(lang,'Buen momento: mínimo de 6 meses','Good time: 6-month low') : pct > 0 ? L(lang,`Ha subido un ${pct}%`,`Up ${pct}%`) : L(lang,`${pct}% en 6 meses`,`${pct}% in 6 months`)}
        </Pill>
      </div>
      <div style={{ ...fxKicker, marginBottom: 6 }}>{L(lang,'Precio de referencia del mercado','Market reference price')}</div>
      <svg viewBox={`0 0 ${W} ${H + 18}`} width="100%" role="img" aria-label={L(lang,'Gráfico de precio','Price chart')} style={{ display:'block', overflow:'visible' }}>
        {[0, 0.5, 1].map(f => <line key={f} x1={pad} x2={W - pad} y1={pad + f * (H - 2 * pad)} y2={pad + f * (H - 2 * pad)} stroke="var(--line-2)"/>)}
        <polyline points={pts.map(q => q.join(',')).join(' ')} fill="none" stroke={pct > 0 ? 'oklch(0.58 0.14 30)' : 'oklch(0.55 0.12 150)'} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
        {pts.map((q, i) => <circle key={i} cx={q[0]} cy={q[1]} r={i === pts.length - 1 ? 4 : 2.5} fill={i === pts.length - 1 ? 'var(--ink)' : 'var(--bg-panel)'} stroke="var(--ink-2)" strokeWidth="1.2"/>)}
        {pts.map((q, i) => <text key={'t' + i} x={q[0]} y={H + 14} textAnchor="middle" fontSize="11" fill="var(--ink-3)" fontFamily="Inter, system-ui">{months[i]}</text>)}
      </svg>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap: 8, margin:'12px 0 16px' }}>
        {[[L(lang,'Mínimo','Low'), min], [L(lang,'Media','Average'), h.reduce((a, b) => a + b, 0) / h.length], [L(lang,'Máximo','High'), max]].map(([k, v]) => (
          <div key={k} style={{ padding:'8px 10px', borderRadius: 12, background:'var(--bg-sunk)' }}>
            <div style={fxKicker}>{k}</div><div className="mono" style={{ fontSize: 13, marginTop: 2 }}>{eur(v)}</div>
          </div>
        ))}
      </div>
      <div style={{ ...fxKicker, marginBottom: 6 }}>{L(lang,'Hoy en cada súper','Today in each store')}</div>
      {ranked.map((r, i) => (
        <div key={r.s.id} style={{ display:'flex', alignItems:'center', gap: 10, padding:'7px 0', borderTop: i ? '1px solid var(--line-2)' : 'none', opacity: r.out ? 0.6 : 1 }}>
          <StoreMark store={r.s} size={22}/>
          <span style={{ flex: 1, fontSize: 13 }}>{r.s.name}{r.out && <span style={{ color:'var(--warn-ink)', marginLeft: 6, fontSize: 12 }}>{L(lang,'sin stock','out of stock')}</span>}</span>
          <span className="mono" style={{ fontSize: 12, color:'var(--ink-3)' }}>{unitPrice(id, r.s.id, lang)}</span>
          <span className="mono" style={{ fontSize: 13, minWidth: 60, textAlign:'right', fontWeight: i === 0 ? 600 : 400 }}>{eur(r.price)}</span>
        </div>
      ))}
    </Sheet>
  );
}

function WeeklyMenuSheet({ variant, data, onClose }) {
  const ctx = React.useContext(AppCtx);
  const lang = ctx.lang;
  const [picks, setPicks] = useState(data && data.picks || ['paella', 'tortilla', 'pastatomate', 'ensalada']);
  const [servings, setServings] = useState(data && data.servings || ctx.profile.household || 4);
  const [budget, setBudget] = useState(data && data.budget || 60);
  const days = L(lang, ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'], ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']);
  const merged = useMemo(() => {
    const acc = {}, uses = {}; let naive = 0;
    picks.forEach(rid => RECIPES[rid].ingredients.forEach(ing => {
      const id = applyDiet(ing.id, ctx.diet);
      acc[id] = (acc[id] || 0) + ing.per * servings;
      (uses[id] = uses[id] || []).includes(rid) || uses[id].push(rid);
      naive += Math.max(1, Math.ceil(ing.per * servings));
    }));
    const items = Object.entries(acc).map(([id, q]) => ({ id, qty: Math.max(1, Math.ceil(q)), home: ctx.pantry.includes(id), shared: uses[id].length > 1 ? uses[id] : null }));
    const buy = items.filter(i => !i.home);
    const cost = buy.reduce((s, i) => s + Math.min(...Object.values(CATALOG[i.id].prices)) * i.qty, 0);
    const units = items.reduce((s, i) => s + i.qty, 0);
    return { items, buy, cost, saved: Math.max(0, naive - units), shared: items.filter(i => i.shared).length };
  }, [picks, servings, ctx.diet, ctx.pantry]);
  const over = merged.cost > budget;
  const fill = Math.min(1, merged.cost / budget);
  const toggle = (rid) => setPicks(p => p.includes(rid) ? p.filter(x => x !== rid) : [...p, rid].slice(0, 7));
  const fit = () => {
    let cur = [...picks];
    const costOf = (list) => list.reduce((s, rid) => s + RECIPES[rid].ingredients.reduce((t, ing) => t + Math.min(...Object.values(CATALOG[applyDiet(ing.id, ctx.diet)].prices)) * Math.ceil(ing.per * servings), 0), 0);
    while (cur.length > 1 && costOf(cur) > budget) {
      const priciest = cur.map(r => [r, costOf([r])]).sort((a, b) => b[1] - a[1])[0][0];
      cur = cur.filter(r => r !== priciest);
    }
    setPicks(cur);
  };
  return (
    <Sheet variant={variant} onClose={onClose} width={640} kicker={L(lang,'Planificador','Planner')} title={L(lang,'Menú de la semana','This week’s menu')}
      footer={
        <button disabled={!merged.buy.length} onClick={() => { ctx.addItems(merged.buy.map(i => ({ id: i.id, qty: i.qty }))); ctx.notify(L(lang, `Menú añadido · ${merged.buy.length} productos`, `Menu added · ${merged.buy.length} items`)); onClose(); }} style={{ ...fxBtnPrimary, width:'100%', opacity: merged.buy.length ? 1 : 0.5 }}>
          <Icon name="plus" size={12}/>{L(lang, `Añadir ${merged.buy.length} productos`, `Add ${merged.buy.length} items`)} · ~{eur(merged.cost)}
        </button>
      }>
      <div style={{ ...fxKicker, marginBottom: 8 }}>{L(lang,'Platos (hasta 7)','Dishes (up to 7)')}</div>
      <div style={{ display:'flex', flexWrap:'wrap', gap: 6, marginBottom: 14 }}>
        {Object.values(RECIPES).map(r => {
          const on = picks.includes(r.id);
          return (
            <button key={r.id} aria-pressed={on} onClick={() => toggle(r.id)} style={{ minHeight: 40, padding:'0 12px 0 9px', borderRadius: 999, fontSize: 13, fontWeight: 500, display:'inline-flex', alignItems:'center', gap: 6, background: on ? 'var(--ink)' : 'var(--bg-panel)', color: on ? 'var(--bg)' : 'var(--ink)', border:`1px solid ${on ? 'var(--ink)' : 'var(--line)'}` }}>
              <span aria-hidden="true">{r.emoji}</span>{r.name[lang]}{on && <Icon name="check" size={11}/>}
            </button>
          );
        })}
      </div>
      {picks.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(118px, 1fr))', gap: 6, marginBottom: 16 }}>
          {picks.map((rid, i) => (
            <div key={rid} style={{ padding:'8px 10px', borderRadius: 12, background:'var(--bg-sunk)', border:'1px solid var(--line-2)' }}>
              <div className="mono" style={{ fontSize: 12, color:'var(--ink-3)' }}>{days[i]}</div>
              <div style={{ fontSize: 13, fontWeight: 500, marginTop: 2 }}>{RECIPES[rid].emoji} {RECIPES[rid].name[lang]}</div>
            </div>
          ))}
        </div>
      )}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 16 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap: 10, padding:'10px 12px', borderRadius: 12, border:'1px solid var(--line-2)' }}>
          <span style={{ fontSize: 13, color:'var(--ink-2)' }}>{L(lang,'Comensales','Servings')}</span>
          <div style={{ display:'inline-flex', alignItems:'center', border:'1px solid var(--line)', borderRadius: 12 }}>
            <button aria-label="−" onClick={() => setServings(s => Math.max(1, s - 1))} style={{ width: 40, height: 40, fontSize: 16 }}>−</button>
            <span className="mono" style={{ minWidth: 26, textAlign:'center', fontWeight: 500 }}>{servings}</span>
            <button aria-label="+" onClick={() => setServings(s => Math.min(12, s + 1))} style={{ width: 40, height: 40, fontSize: 16 }}>+</button>
          </div>
        </div>
        <label style={{ display:'flex', flexDirection:'column', gap: 4, padding:'10px 12px', borderRadius: 12, border:'1px solid var(--line-2)' }}>
          <span style={{ display:'flex', justifyContent:'space-between', fontSize: 13, color:'var(--ink-2)' }}>{L(lang,'Presupuesto','Budget')}<b className="mono" style={{ fontWeight: 500, color:'var(--ink)' }}>{eur(budget)}</b></span>
          <input type="range" min="20" max="150" step="5" value={budget} onChange={e => setBudget(+e.target.value)} style={{ width:'100%', accentColor:'var(--ink)' }}/>
        </label>
      </div>
      <div style={{ padding:'12px 14px', borderRadius: 12, background: over ? 'var(--warn-soft)' : 'var(--sage-soft)', marginBottom: 14 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', gap: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: over ? 'var(--warn-ink)' : 'var(--sage-ink)' }}>
            {over ? L(lang, `Te pasas ${eur(merged.cost - budget)}`, `${eur(merged.cost - budget)} over budget`) : L(lang, `Te sobran ${eur(budget - merged.cost)}`, `${eur(budget - merged.cost)} under budget`)}
          </span>
          <span className="serif" style={{ fontSize: 22 }}>~{eur(merged.cost)}</span>
        </div>
        <div style={{ height: 6, borderRadius: 3, background:'oklch(1 0 0 / 0.6)', marginTop: 8, overflow:'hidden' }}>
          <div style={{ height:'100%', width: `${fill * 100}%`, background: over ? 'oklch(0.62 0.14 45)' : 'var(--sage)', transition:'width 300ms' }}></div>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap: 10, marginTop: 8, fontSize: 12, color:'var(--ink-2)', flexWrap:'wrap' }}>
          <span>{L(lang, `${merged.shared} ingredientes compartidos · ${merged.saved} unidades menos que comprando por plato`, `${merged.shared} shared ingredients · ${merged.saved} fewer units than buying per dish`)}</span>
          {over && picks.length > 1 && <button onClick={fit} style={{ ...fxBtnGhost, minHeight: 34, fontSize: 12 }}>{L(lang,'Ajustar al presupuesto','Fit to budget')}</button>}
        </div>
      </div>
      <div style={{ ...fxKicker, marginBottom: 6 }}>{L(lang,'Lista combinada','Combined list')}</div>
      {merged.items.map(i => (
        <div key={i.id} style={{ display:'flex', alignItems:'center', gap: 10, padding:'6px 0', fontSize: 13, borderTop:'1px solid var(--line-2)', color: i.home ? 'var(--ink-3)' : 'var(--ink)' }}>
          <PThumb id={i.id} size={26} radius={6}/>
          <span style={{ flex: 1, textDecoration: i.home ? 'line-through' : 'none' }}>{CATALOG[i.id].name[lang]}</span>
          {i.shared && !i.home && <Pill size="sm" title={i.shared.map(r => RECIPES[r].name[lang]).join(' + ')}>{L(lang,'para','for')} {i.shared.map(r => RECIPES[r].emoji).join(' ')}</Pill>}
          {i.home && <Pill tone="sage" size="sm"><Icon name="home" size={9}/>{L(lang,'en casa','at home')}</Pill>}
          <span className="mono" style={{ fontSize: 12, color:'var(--ink-3)' }}>×{i.qty}</span>
        </div>
      ))}
    </Sheet>
  );
}

const PHOTO_LINES = [
  { raw:'leche', id:'leche', qty:1, conf:0.98 }, { raw:'2 barras pan', id:'pan', qty:2, conf:0.95 },
  { raw:'huevos', id:'huevos', qty:1, conf:0.97 }, { raw:'tomat', id:'tomate', qty:1, conf:0.61 },
  { raw:'yogures x2', id:'yogur', qty:2, conf:0.92 }, { raw:'papel wc', id:'papel', qty:1, conf:0.88 },
  { raw:'detergente', id:'detergente', qty:1, conf:0.96 },
];
function PhotoListSheet({ variant, onClose }) {
  const ctx = React.useContext(AppCtx);
  const lang = ctx.lang;
  const [stage, setStage] = useState('pick');
  const [img, setImg] = useState(null);
  const [sel, setSel] = useState(PHOTO_LINES.map(l => l.id));
  const fileRef = useRef(null);
  const scan = () => { setStage('scan'); setTimeout(() => setStage('result'), 1700); };
  const onFile = (e) => { const f = e.target.files && e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { setImg(r.result); scan(); }; r.readAsDataURL(f); };
  const paper = (
    <div style={{ position:'relative', borderRadius: 12, overflow:'hidden', border:'1px solid var(--line)', background: img ? '#000' : 'oklch(0.97 0.02 90)', minHeight: 220, display:'flex', alignItems:'center', justifyContent:'center' }}>
      {img ? <img src={img} alt={L(lang,'Tu foto','Your photo')} style={{ maxWidth:'100%', maxHeight: 280, display:'block' }}/> : (
        <div style={{ padding:'18px 26px', fontFamily:"'Caveat', 'Segoe Print', cursive", fontSize: 24, lineHeight: 1.35, color:'oklch(0.32 0.04 260)', transform:'rotate(-1.5deg)', backgroundImage:'repeating-linear-gradient(transparent 0 31px, oklch(0.88 0.03 240) 31px 32px)', width:'100%' }}>
          {PHOTO_LINES.map(l => <div key={l.raw}>– {l.raw}</div>)}
        </div>
      )}
      {stage === 'scan' && <div className="fx-scan" aria-hidden="true"></div>}
    </div>
  );
  if (stage !== 'result') {
    return (
      <Sheet variant={variant} onClose={onClose} kicker={L(lang,'Foto de lista','Photo of list')} title={stage === 'scan' ? L(lang,'Leyendo tu lista…','Reading your list…') : L(lang,'Fotografía tu lista','Snap your list')}
        footer={stage === 'pick' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 8 }}>
            <button onClick={() => fileRef.current && fileRef.current.click()} style={fxBtnGhost}><Icon name="camera" size={13}/>{L(lang,'Hacer o subir foto','Take or upload')}</button>
            <button onClick={scan} style={fxBtnPrimary}>{L(lang,'Usar ejemplo','Use sample')}</button>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={onFile} style={{ display:'none' }}/>
          </div>
        )}>
        {paper}
        <div style={{ fontSize: 12, color:'var(--ink-3)', marginTop: 10, lineHeight: 1.5 }}>
          {L(lang,'Funciona con listas a mano, notas del móvil y tiques. Te enseño lo que he leído antes de añadir nada.','Works with handwritten lists, phone notes and receipts. I show you what I read before adding anything.')}
        </div>
      </Sheet>
    );
  }
  return (
    <Sheet variant={variant} onClose={onClose} kicker={L(lang,'Foto de lista','Photo of list')} title={L(lang, `He leído ${PHOTO_LINES.length} productos`, `I read ${PHOTO_LINES.length} items`)}
      footer={<button disabled={!sel.length} onClick={() => { ctx.addItems(PHOTO_LINES.filter(l => sel.includes(l.id)).map(l => ({ id: l.id, qty: l.qty }))); ctx.notify(L(lang, `${sel.length} productos añadidos desde la foto`, `${sel.length} items added from photo`)); onClose(); }} style={{ ...fxBtnPrimary, width:'100%', opacity: sel.length ? 1 : 0.5 }}><Icon name="plus" size={12}/>{L(lang, `Añadir ${sel.length}`, `Add ${sel.length}`)}</button>}>
      {PHOTO_LINES.map(l => {
        const on = sel.includes(l.id);
        const low = l.conf < 0.75;
        return (
          <label key={l.id} style={{ display:'flex', alignItems:'center', gap: 10, minHeight: 48, padding:'4px 0', borderTop:'1px solid var(--line-2)', cursor:'pointer' }}>
            <input type="checkbox" checked={on} onChange={() => setSel(s => on ? s.filter(x => x !== l.id) : [...s, l.id])} style={{ width: 18, height: 18, accentColor:'var(--ink)' }}/>
            <PThumb id={l.id} size={30}/>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{CATALOG[l.id].name[lang]} <span className="mono" style={{ color:'var(--ink-3)', fontWeight: 400 }}>×{l.qty}</span></span>
              <span style={{ display:'block', fontSize: 12, color: low ? 'var(--warn-ink)' : 'var(--ink-3)' }}>“{l.raw}” {low ? L(lang,'· ¿seguro? revisa','· not sure, check') : ''}</span>
            </span>
            {low && <Pill tone="warn" size="sm">{Math.round(l.conf * 100)}%</Pill>}
          </label>
        );
      })}
    </Sheet>
  );
}

function ShareSheet({ variant, onClose }) {
  const ctx = React.useContext(AppCtx);
  const lang = ctx.lang;
  const [copied, setCopied] = useState(false);
  const link = 'aishopper.es/c/fam-7k2q';
  const msg = (ctx.basket.length ? ctx.basket.map(b => `• ${CATALOG[b.id].name[lang]} ×${b.qty}`).join('\n') : L(lang,'(cesta vacía)','(empty basket)'));
  const copy = () => { try { navigator.clipboard.writeText('https://' + link); } catch (e) {} setCopied(true); setTimeout(() => setCopied(false), 1800); };
  const sh = ctx.shared;
  const [who, setWho] = useState('');
  const invite = () => { const n = who.trim(); if (!n) return; ctx.inviteMember(n); setWho(''); };
  return (
    <Sheet variant={variant} onClose={onClose} kicker={L(lang,'Compartir','Share')} title={L(lang,'Cesta familiar','Household basket')}>
      <div style={{ display:'flex', alignItems:'center', gap: 12, padding:'12px 14px', borderRadius: 12, border:'1px solid var(--line-2)', marginBottom: 14 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 500 }}>{L(lang,'Que otros puedan añadir','Let others add items')}</div>
          <div style={{ fontSize: 12, color:'var(--ink-3)', marginTop: 2 }}>{L(lang,'Todos ven la misma cesta y el mismo súper ganador.','Everyone sees the same basket and the same winning store.')}</div>
        </div>
        <button role="switch" aria-checked={sh.on} aria-label={L(lang,'Cesta compartida','Shared basket')} onClick={() => ctx.setSharedOn(!sh.on)} style={{ width: 50, height: 30, borderRadius: 15, padding: 3, flexShrink: 0, background: sh.on ? 'var(--sage)' : 'var(--ink-4)', display:'flex', justifyContent: sh.on ? 'flex-end' : 'flex-start', transition:'background 160ms' }}>
          <span style={{ width: 24, height: 24, borderRadius: 12, background:'#fff', boxShadow:'0 1px 3px oklch(0.2 0 0 / .2)' }}></span>
        </button>
      </div>
      {sh.on && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom: 6 }}><div style={fxKicker}>{L(lang,'Miembros','Members')}</div><WhoAdded/></div>
          {sh.members.map(m => (
            <div key={m.name} style={{ display:'flex', alignItems:'center', gap: 10, padding:'7px 0' }}>
              <span style={{ width: 30, height: 30, borderRadius: 15, background:`oklch(0.92 0.05 ${m.hue})`, color:`oklch(0.35 0.09 ${m.hue})`, display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize: 13, fontWeight: 600 }}>{m.name[0]}</span>
              <span style={{ flex: 1, minWidth: 0, fontSize: 13 }}>{m.name}{m.me && <span style={{ color:'var(--ink-3)' }}> · {L(lang,'tú','you')}</span>}<span style={{ display:'block', fontSize: 12, color: m.joined ? 'var(--sage-ink)' : 'var(--ink-3)' }}>{m.joined ? L(lang,'Dentro','Joined') : L(lang,'Invitación enviada','Invite sent')}</span></span>
              <MemberRole m={m}/>
            </div>
          ))}
          <form onSubmit={e => { e.preventDefault(); invite(); }} style={{ display:'flex', gap: 8, marginTop: 8 }}>
            <input value={who} onChange={e => setWho(e.target.value)} placeholder={L(lang,'Nombre o móvil','Name or phone')} aria-label={L(lang,'Invitar a alguien','Invite someone')} style={{ flex: 1, minHeight: 40, padding:'0 12px', borderRadius: 10, border:'1px solid var(--line)', background:'var(--bg-sunk)', fontSize: 13, outline:'none' }}/>
            <button type="submit" disabled={!who.trim()} style={{ ...fxBtnGhost, minHeight: 40, opacity: who.trim() ? 1 : 0.5 }}>{L(lang,'Invitar','Invite')}</button>
          </form>
        </div>
      )}
      <div style={{ ...fxKicker, marginBottom: 6 }}>{L(lang,'Vista previa en WhatsApp','WhatsApp preview')}</div>
      <div style={{ padding: 12, borderRadius: 12, background:'var(--sage-soft)', marginBottom: 12 }}>
        <div style={{ background:'oklch(0.90 0.08 145)', borderRadius:'12px 12px 2px 12px', padding:'10px 12px', fontSize: 13, lineHeight: 1.5, whiteSpace:'pre-wrap', marginLeft: 24, color:'oklch(0.22 0.02 150)' }}>
          {L(lang,'Lista de la compra 🛒','Shopping list 🛒')}{'\n'}{msg}{'\n'}{ctx.winner ? `${L(lang,'Mejor en','Best at')} ${STORES.find(s => s.id === ctx.winner.id).name}: ${eur(ctx.winner.total)}\n` : ''}{L(lang,'Añade lo que falte:','Add anything missing:')} {link}
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 8 }}>
        <button onClick={copy} style={fxBtnGhost}><Icon name={copied ? 'check' : 'share'} size={13}/>{copied ? L(lang,'Copiado','Copied') : L(lang,'Copiar enlace','Copy link')}</button>
        <button onClick={() => { ctx.setSharedOn(true); ctx.notify(L(lang,'Enviado a «Casa» en WhatsApp','Sent to “Home” on WhatsApp')); onClose(); }} style={fxBtnPrimary}><Icon name="wa" size={13}/>WhatsApp</button>
      </div>
    </Sheet>
  );
}

function OnboardingSheet({ variant, onClose, data }) {
  const ctx = React.useContext(AppCtx);
  const lang = ctx.lang;
  const quick = !!(data && data.quick);
  const last = quick ? 0 : 2;
  const [step, setStep] = useState(0);
  const [p, setP] = useState({ ...ctx.profile });
  const [diet, setDiet] = useState(ctx.diet);
  const [pantry, setPantry] = useState(ctx.pantry);
  const cpOk = /^(0[1-9]|[1-4]\d|5[0-2])\d{3}$/.test(p.cp || '');
  const cpCovered = COVERED_CP.test(p.cp || '');
  const tg = (arr, v) => arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v];
  const finish = () => { ctx.saveSetup({ ...p, onboarded: true, asked: quick ? p.asked : { ...(p.asked || {}), stores: true, diet: true } }, diet, pantry); onClose(); };
  const chip = (on, label, onClick, key) => (
    <button key={key} aria-pressed={on} onClick={onClick} style={{ minHeight: 40, padding:'0 12px', borderRadius: 999, fontSize: 13, fontWeight: 500, display:'inline-flex', alignItems:'center', gap: 6, background: on ? 'var(--ink)' : 'var(--bg-panel)', color: on ? 'var(--bg)' : 'var(--ink)', border:`1px solid ${on ? 'var(--ink)' : 'var(--line)'}` }}>{label}{on && <Icon name="check" size={11}/>}</button>
  );
  const titles = [quick ? L(lang,'Hola. ¿Dónde te lo llevamos?','Hi. Where do we deliver?') : L(lang,'¿Dónde te lo llevamos?','Where do we deliver?'), L(lang,'Tus supers','Your stores'), L(lang,'Cómo comes','How you eat')];
  return (
    <Sheet variant={variant} onClose={() => { ctx.saveSetup({ ...ctx.profile, onboarded: true }, ctx.diet, ctx.pantry); onClose(); }} width={520} kicker={quick ? L(lang,'Antes de empezar','Before we start') : `${L(lang,'Configuración','Setup')} · ${step + 1}/3`} title={titles[step]}
      footer={
        <div style={{ display:'flex', gap: 8 }}>
          {step > 0 ? <button onClick={() => setStep(s => s - 1)} style={fxBtnGhost}>{L(lang,'Atrás','Back')}</button>
                    : <button onClick={() => { ctx.saveSetup({ ...ctx.profile, onboarded: true }, ctx.diet, ctx.pantry); onClose(); }} style={{ ...fxBtnGhost, border:'none' }}>{L(lang,'Saltar','Skip')}</button>}
          <button disabled={step === 0 && !cpOk} onClick={() => step < last ? setStep(s => s + 1) : finish()} style={{ ...fxBtnPrimary, flex: 1, opacity: step === 0 && !cpOk ? 0.5 : 1 }}>
            {step < last ? L(lang,'Siguiente','Next') : L(lang,'Empezar a comprar','Start shopping')} <Icon name="arrow" size={12}/>
          </button>
        </div>
      }>
      {!quick && <div style={{ display:'flex', gap: 4, marginBottom: 16 }} aria-hidden="true">
        {[0,1,2].map(i => <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= step ? 'var(--ink)' : 'var(--line)' }}></div>)}
      </div>}
      {step === 0 && (
        <div>
          <label style={{ display:'block' }}>
            <span style={{ fontSize: 13, color:'var(--ink-2)' }}>{L(lang,'Código postal','Postcode')}</span>
            <input inputMode="numeric" autoComplete="postal-code" maxLength={5} value={p.cp || ''} onChange={e => setP({ ...p, cp: e.target.value.replace(/\D/g, '') })}
              style={{ display:'block', width:'100%', marginTop: 6, height: 52, padding:'0 14px', borderRadius: 12, border:`1px solid ${p.cp && p.cp.length === 5 && !cpOk ? 'oklch(0.6 0.15 30)' : 'var(--line)'}`, background:'var(--bg-panel)', fontSize: 20, letterSpacing:'0.12em', fontFamily:"'JetBrains Mono', monospace" }}/>
          </label>
          <div style={{ fontSize: 13, marginTop: 10, minHeight: 20, color: cpOk ? 'var(--sage-ink)' : 'var(--ink-3)', display:'flex', alignItems:'center', gap: 6 }}>
            {cpOk && !cpCovered ? <span style={{ color:'var(--warn-ink)', display:'flex', flexDirection:'column', gap: 6 }}><span>{L(lang, `Aún no llegamos a ${p.cp}. Hoy: ${COVERED_CITIES.es}.`, `We don’t reach ${p.cp} yet. Today: ${COVERED_CITIES.en}.`)}</span><button onClick={() => ctx.notify(L(lang, `Te avisaremos cuando lleguemos a ${p.cp}`, `We’ll tell you when we reach ${p.cp}`))} style={{ ...fxBtnGhost, minHeight: 36, fontSize: 12, alignSelf:'flex-start' }}><Icon name="bell" size={11}/>{L(lang, 'Avísame', 'Notify me')}</button></span>
                  : cpOk ? <><Icon name="check" size={12}/>{L(lang, `7 supers entregan en ${p.cp}`, `7 stores deliver to ${p.cp}`)}</>
                  : p.cp && p.cp.length === 5 ? L(lang,'Ese código postal no existe en España','That isn’t a valid Spanish postcode') : L(lang,'Lo usamos para ver quién entrega y a qué precio.','We use it to see who delivers, and at what price.')}
          </div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap: 10, marginTop: 18, padding:'10px 12px', borderRadius: 12, border:'1px solid var(--line-2)' }}>
            <span style={{ fontSize: 13, color:'var(--ink-2)' }}>{L(lang,'Personas en casa','People at home')}</span>
            <div style={{ display:'inline-flex', alignItems:'center', border:'1px solid var(--line)', borderRadius: 12 }}>
              <button aria-label="−" onClick={() => setP({ ...p, household: Math.max(1, (p.household || 2) - 1) })} style={{ width: 40, height: 40, fontSize: 16 }}>−</button>
              <span className="mono" style={{ minWidth: 26, textAlign:'center', fontWeight: 500 }}>{p.household || 2}</span>
              <button aria-label="+" onClick={() => setP({ ...p, household: Math.min(10, (p.household || 2) + 1) })} style={{ width: 40, height: 40, fontSize: 16 }}>+</button>
            </div>
          </div>
          {quick && <div style={{ fontSize: 12, color:'var(--ink-3)', marginTop: 14, lineHeight: 1.5 }}>{L(lang,'Eso es todo. Tus supers, tarjetas y dieta te los pregunto cuando hagan falta.','That’s it. I’ll ask about your stores, cards and diet when they matter.')}</div>}
        </div>
      )}
      {step === 1 && (
        <div>
          <div style={{ fontSize: 13, color:'var(--ink-2)', marginBottom: 8 }}>{L(lang,'¿Dónde compras normalmente? Los marcamos en la comparación.','Where do you usually shop? We’ll flag them in comparisons.')}</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(140px, 1fr))', gap: 6, marginBottom: 18 }}>
            {STORES.map(s => {
              const on = (p.fav || []).includes(s.id);
              return (
                <button key={s.id} aria-pressed={on} onClick={() => setP({ ...p, fav: tg(p.fav || [], s.id) })} style={{ minHeight: 48, padding:'0 10px', borderRadius: 12, display:'flex', alignItems:'center', gap: 8, border:`1px solid ${on ? 'var(--ink)' : 'var(--line)'}`, boxShadow: on ? 'inset 0 0 0 1px var(--ink)' : 'none', background:'var(--bg-panel)', fontSize: 13, fontWeight: 500, textAlign:'left' }}>
                  <StoreMark store={s} size={24}/><span style={{ flex: 1, minWidth: 0 }}>{s.name}</span>{on && <Icon name="check" size={12}/>}
                </button>
              );
            })}
          </div>
          <div style={{ ...fxKicker, marginBottom: 8 }}>{L(lang,'Tarjetas de fidelidad','Loyalty cards')}</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap: 6 }}>
            {LOYALTY.map(c => chip((p.cards || []).includes(c.id), c.name, () => setP({ ...p, cards: tg(p.cards || [], c.id) }), c.id))}
          </div>
        </div>
      )}
      {step === 2 && (
        <div>
          <div style={{ ...fxKicker, marginBottom: 8 }}>{L(lang,'Dieta','Diet')}</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap: 6, marginBottom: 6 }}>
            {Object.entries(DIETS).map(([k, d]) => chip(diet.includes(k), d[lang], () => setDiet(tg(diet, k)), k))}
          </div>
          <div style={{ fontSize: 12, color:'var(--ink-3)', marginBottom: 18 }}>{L(lang,'Cambio los ingredientes de las recetas por versiones aptas.','I swap recipe ingredients for suitable versions.')}</div>
          <div style={{ ...fxKicker, marginBottom: 8 }}>{L(lang,'Siempre tienes en casa','Always in your pantry')}</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap: 6 }}>
            {PANTRY_STAPLES.map(id => chip(pantry.includes(id), <><span aria-hidden="true">{CATALOG[id].emoji}</span>{CATALOG[id].name[lang]}</>, () => setPantry(tg(pantry, id)), id))}
          </div>
          <div style={{ fontSize: 12, color:'var(--ink-3)', marginTop: 6 }}>{L(lang,'No los añado al pedir un plato (puedes cambiarlo en cada receta).','I skip these when you ask for a dish (you can override per recipe).')}</div>
        </div>
      )}
    </Sheet>
  );
}

// Checkout for the two-store split: one slot, two carts.
function SplitCheckoutSheet({ variant, data, onClose }) {
  const ctx = React.useContext(AppCtx);
  const lang = ctx.lang;
  const [slot, setSlot] = useState(null);
  const split = data.split;
  return (
    <Sheet variant={variant} onClose={onClose} width={620} kicker={L(lang,'Cesta dividida','Split basket')} title={L(lang,'Dos carritos, una franja','Two carts, one slot')}
      footer={<button disabled={!slot} onClick={() => { ctx.placeOrder({ stores: split.parts.map(p => p.id), total: split.total + (slot ? slot.fee : 0), slot, items: ctx.basket }); onClose(); }} style={{ ...fxBtnPrimary, width:'100%', opacity: slot ? 1 : 0.5 }}>
        {slot ? <>{L(lang,'Confirmar','Confirm')} · {slotLabel(slot, lang)} · {eur(split.total + slot.fee)}</> : L(lang,'Elige una franja','Pick a slot')}
      </button>}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap: 8, marginBottom: 16 }}>
        {split.parts.map(part => {
          const st = STORES.find(s => s.id === part.id);
          return (
            <div key={part.id} style={{ padding:'12px', borderRadius: 12, border:'1px solid var(--line-2)', background:'var(--bg-sunk)' }}>
              <div style={{ display:'flex', alignItems:'center', gap: 8 }}><StoreMark store={st} size={26}/><b style={{ flex: 1, fontSize: 13 }}>{st.name}</b><span className="serif" style={{ fontSize: 18 }}>{eur(part.total)}</span></div>
              <div style={{ fontSize: 12, color:'var(--ink-3)', marginTop: 4 }}>{part.lines.length} {tr('items', lang)} · {part.shipping === 0 ? tr('freeShipping', lang) : `${eur(part.shipping)} ${tr('shipping', lang)}`}</div>
            </div>
          );
        })}
      </div>
      <SlotPicker value={slot} onChange={setSlot}/>
    </Sheet>
  );
}

function TrackingSheet({ variant, onClose }) {
  const ctx = React.useContext(AppCtx);
  const lang = ctx.lang;
  const o = ctx.activeOrder;
  if (!o) return null;
  const step = orderStep(o, ctx.now);
  const done = step === ORDER_STEPS.length - 1;
  const stores = o.stores.map(id => STORES.find(s => s.id === id));
  return (
    <Sheet variant={variant} onClose={onClose} width={520} kicker={`${L(lang,'Pedido','Order')} ${o.id.toUpperCase()}`} title={ORDER_STEPS[step][lang]}
      footer={done ? (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 8 }}>
          <button onClick={() => { ctx.finishOrder(); onClose(); }} style={fxBtnGhost}>{L(lang,'Cerrar pedido','Close order')}</button>
          <button onClick={() => { ctx.finishOrder(); ctx.addItems(o.items); ctx.notify(L(lang,'Pedido repetido en la cesta','Order repeated in basket')); onClose(); }} style={fxBtnPrimary}><Icon name="repeat" size={13}/>{L(lang,'Repetir','Repeat')}</button>
        </div>
      ) : null}>
      <div style={{ display:'flex', alignItems:'center', gap: 10, padding:'12px 14px', borderRadius: 12, background:'var(--bg-sunk)', marginBottom: 18 }}>
        <div style={{ display:'flex' }}>{stores.map((s, i) => <div key={s.id} style={{ marginLeft: i ? -8 : 0 }}><StoreMark store={s} size={32}/></div>)}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500 }}>{stores.map(s => s.name).join(' + ')}</div>
          <div style={{ fontSize: 12, color:'var(--ink-3)' }}>{slotLabel(o.slot, lang)} · {o.items.length} {tr('items', lang)}</div>
        </div>
        <span className="serif" style={{ fontSize: 22 }}>{eur(o.total)}</span>
      </div>
      {done && <DeliveredSavings order={o}/>}
      {done && <DeliveryCheck order={o}/>}
      {step >= 1 && !done && <NotifPrime/>}
      {step >= 1 && <HouseholdInvite/>}
      <ol style={{ listStyle:'none', margin: 0, padding: 0 }}>
        {ORDER_STEPS.map((s, i) => {
          const state = i < step ? 'done' : i === step ? 'now' : 'next';
          return (
            <li key={i} style={{ display:'flex', gap: 12, minHeight: 52 }}>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
                <span style={{ width: 22, height: 22, borderRadius: 11, flexShrink: 0, display:'inline-flex', alignItems:'center', justifyContent:'center', background: state === 'next' ? 'var(--bg-panel)' : state === 'now' ? 'var(--ink)' : 'var(--sage)', border:`1.5px solid ${state === 'next' ? 'var(--line)' : 'transparent'}`, color:'#fff', animation: state === 'now' && !done ? 'micPulse 1.4s ease-out infinite' : 'none' }}>
                  {state === 'done' && <Icon name="check" size={11}/>}{state === 'now' && <span style={{ width: 6, height: 6, borderRadius: 3, background:'var(--bg)' }}></span>}
                </span>
                {i < ORDER_STEPS.length - 1 && <span style={{ flex: 1, width: 2, background: i < step ? 'var(--sage)' : 'var(--line)', margin:'2px 0' }}></span>}
              </div>
              <div style={{ paddingBottom: 14 }}>
                <div style={{ fontSize: 13, fontWeight: state === 'now' ? 600 : 500, color: state === 'next' ? 'var(--ink-3)' : 'var(--ink)' }}>{s[lang]}</div>
                {state === 'now' && i === 1 && <div style={{ fontSize: 12, color:'var(--ink-3)', marginTop: 2 }}>{L(lang,'Te aviso si algo no está y te propongo un cambio antes de cobrar.','I’ll ping you if anything’s missing and suggest a swap before you’re charged.')}</div>}
                {state === 'now' && i === 2 && <div style={{ fontSize: 12, color:'var(--ink-3)', marginTop: 2 }}>{L(lang,'Luis llega en unos 12 min','Luis arrives in about 12 min')}</div>}
              </div>
            </li>
          );
        })}
      </ol>
      {!done && <div style={{ fontSize: 12, color:'var(--ink-3)' }}>{L(lang,'Demo: el estado avanza cada pocos segundos.','Demo: status advances every few seconds.')}</div>}
    </Sheet>
  );
}

function FeatureOverlays({ variant }) {
  const ctx = React.useContext(AppCtx);
  const o = ctx.overlay;
  const close = ctx.closeOverlay;
  let el = null;
  if (o) {
    const props = { variant, onClose: close, data: o.data };
    if (o.type === 'history') el = <PriceHistorySheet {...props} id={o.data.id}/>;
    if (o.type === 'menu') el = <WeeklyMenuSheet {...props}/>;
    if (o.type === 'photo') el = <PhotoListSheet {...props}/>;
    if (o.type === 'share') el = <ShareSheet {...props}/>;
    if (o.type === 'onboarding') el = <OnboardingSheet {...props}/>;
    if (o.type === 'split') el = <SplitCheckoutSheet {...props}/>;
    if (o.type === 'tracking') el = <TrackingSheet {...props}/>;
    if (o.type === 'browse') el = <BrowseSheet {...props}/>;
    if (o.type === 'instore') el = <InStoreSheet {...props}/>;
    if (o.type === 'notifs') el = <NotificationsSheet {...props}/>;
    if (o.type === 'micprime') el = <MicPrimeSheet {...props}/>;
    if (o.type === 'shortcuts') el = <ShortcutsSheet {...props}/>;
    if (o.type === 'handoff') el = <HandoffSheet {...props}/>;
    if (o.type === 'feedback') el = <FeedbackSheet {...props}/>;
    if (o.type === 'missing') el = <MissingSheet {...props}/>;
    if (o.type === 'you' && variant === 'web') el = <WebYouDrawer onClose={close}/>;
  }
  return <>{el}<OfflineBanner variant={variant}/><FxToast variant={variant}/></>;
}

Object.assign(window, { FeatureOverlays });
