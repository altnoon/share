// "You" tab extras: active order, profile (postcode, diet, pantry, cards), order history, household. Plus web drawer.
function ActiveOrderCard() {
  const ctx = React.useContext(AppCtx);
  const lang = ctx.lang;
  const o = ctx.activeOrder;
  if (!o) return null;
  const step = orderStep(o, ctx.now);
  return (
    <button onClick={() => ctx.openOverlay('tracking')} style={{ ...fxCard, textAlign:'left', display:'flex', alignItems:'center', gap: 12, background:'var(--sage-soft)', borderColor:'var(--sage-line)' }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background:'var(--bg-panel)', color:'var(--sage-ink)', display:'inline-flex', alignItems:'center', justifyContent:'center', flexShrink: 0 }}><Icon name="truck" size={18}/></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color:'var(--sage-ink)' }}>{ORDER_STEPS[step][lang]}</div>
        <div style={{ fontSize: 12, color:'var(--sage-ink)', marginTop: 2 }}>{o.stores.map(id => STORES.find(s => s.id === id).name).join(' + ')} · {slotLabel(o.slot, lang)}</div>
        <div style={{ display:'flex', gap: 3, marginTop: 8 }} aria-hidden="true">
          {ORDER_STEPS.map((_, i) => <span key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= step ? 'var(--sage)' : 'oklch(1 0 0 / 0.7)' }}></span>)}
        </div>
      </div>
      <Icon name="arrow" size={13}/>
    </button>
  );
}

function ProfileCard() {
  const ctx = React.useContext(AppCtx);
  const lang = ctx.lang;
  const p = ctx.profile;
  const row = (label, value) => (
    <div style={{ display:'flex', alignItems:'flex-start', gap: 10, padding:'8px 0', borderTop:'1px solid var(--line-2)' }}>
      <span style={{ width: 92, flexShrink: 0, fontSize: 12, color:'var(--ink-3)' }}>{label}</span>
      <span style={{ flex: 1, minWidth: 0, fontSize: 13, display:'flex', flexWrap:'wrap', gap: 4 }}>{value}</span>
    </div>
  );
  const none = <span style={{ color:'var(--ink-3)' }}>—</span>;
  return (
    <div style={fxCard}>
      <div style={{ display:'flex', alignItems:'center', gap: 10, marginBottom: 6 }}>
        <span style={{ color:'var(--ink-3)' }}><Icon name="user" size={14}/></span>
        <span style={{ ...fxKicker, flex: 1 }}>{L(lang,'Tu perfil','Your profile')}</span>
        <button onClick={() => ctx.openOverlay('onboarding')} style={{ ...fxBtnGhost, minHeight: 36, fontSize: 12 }}>{L(lang,'Editar','Edit')}</button>
      </div>
      {row(L(lang,'Entrega','Delivery'), <><span className="mono">{p.cp}</span><span style={{ color:'var(--ink-3)' }}>· {p.household || 2} {L(lang,'personas','people')}</span></>)}
      {row(L(lang,'Dieta','Diet'), Object.entries(DIETS).map(([k, d]) => {
        const on = ctx.diet.includes(k);
        return <button key={k} aria-pressed={on} onClick={() => ctx.toggleDiet(k)} style={{ minHeight: 32, padding:'0 10px', borderRadius: 999, fontSize: 12, fontWeight: 500, background: on ? 'var(--ink)' : 'var(--bg-sunk)', color: on ? 'var(--bg)' : 'var(--ink-2)', border:`1px solid ${on ? 'var(--ink)' : 'var(--line-2)'}` }}>{d[lang]}</button>;
      }))}
      {row(L(lang,'En casa','At home'), ctx.pantry.length ? ctx.pantry.map(id => (
        <button key={id} onClick={() => ctx.togglePantry(id)} aria-label={`${L(lang,'Quitar','Remove')} ${CATALOG[id].name[lang]}`} style={{ minHeight: 32, padding:'0 8px 0 10px', borderRadius: 999, fontSize: 12, background:'var(--bg-sunk)', border:'1px solid var(--line-2)', display:'inline-flex', alignItems:'center', gap: 4 }}>
          <span aria-hidden="true">{CATALOG[id].emoji}</span>{CATALOG[id].name[lang]}<span style={{ color:'var(--ink-3)' }}><Icon name="x" size={9}/></span>
        </button>
      )) : none)}
      {row(L(lang,'Tarjetas','Cards'), (p.cards || []).length ? p.cards.map(c => <Pill key={c} size="md">{LOYALTY.find(x => x.id === c).name}</Pill>) : none)}
    </div>
  );
}

function OrdersCard() {
  const ctx = React.useContext(AppCtx);
  const lang = ctx.lang;
  return (
    <div style={fxCard}>
      <div style={{ display:'flex', alignItems:'center', gap: 10, marginBottom: 10 }}>
        <span style={{ color:'var(--ink-3)' }}><Icon name="repeat" size={14}/></span>
        <span style={fxKicker}>{L(lang,'Pedidos anteriores','Past orders')}</span>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap: 6 }}>
        {ctx.orders.slice(0, 4).map(o => {
          const st = STORES.find(s => s.id === o.stores[0]);
          return (
            <div key={o.id} style={{ display:'flex', alignItems:'center', gap: 10, padding:'8px 8px 8px 10px', borderRadius: 12, background:'var(--bg-sunk)', border:'1px solid var(--line-2)' }}>
              <StoreMark store={st} size={28}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{o.date[lang]}</div>
                <div style={{ fontSize: 12, color:'var(--ink-3)' }}>{o.stores.map(id => STORES.find(s => s.id === id).name).join(' + ')} · {o.items.length} {tr('items', lang)} · {eur(o.total)}</div>
              </div>
              <button onClick={() => ctx.repeatOrder(o)} style={{ height: 40, padding:'0 12px', borderRadius: 12, background:'var(--ink)', color:'var(--bg)', fontSize: 12, fontWeight: 500, display:'inline-flex', alignItems:'center', gap: 5 }}>
                <Icon name="repeat" size={11}/>{L(lang,'Repetir','Repeat')}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HouseholdCard() {
  const ctx = React.useContext(AppCtx);
  const lang = ctx.lang;
  const sh = ctx.shared;
  return (
    <button onClick={() => ctx.openOverlay('share')} style={{ ...fxCard, textAlign:'left', display:'flex', alignItems:'center', gap: 12 }}>
      <div style={{ display:'flex' }}>
        {(sh.on ? sh.members : [{ name: L(lang,'Tú','You'), hue: 255 }]).map((m, i) => (
          <span key={m.name} style={{ marginLeft: i ? -8 : 0, width: 32, height: 32, borderRadius: 20, border:'2px solid var(--bg-panel)', background:`oklch(0.92 0.05 ${m.hue})`, color:`oklch(0.35 0.09 ${m.hue})`, display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize: 13, fontWeight: 600 }}>{m.name[0]}</span>
        ))}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{L(lang,'Cesta familiar','Household basket')}</div>
        <div style={{ fontSize: 12, color:'var(--ink-3)', marginTop: 1 }}>{sh.on ? L(lang, `Compartida con ${sh.members.length - 1}`, `Shared with ${sh.members.length - 1}`) : L(lang,'Invita a casa para añadir juntos','Invite your household to add together')}</div>
      </div>
      <Icon name="arrow" size={13}/>
    </button>
  );
}

function WebYouDrawer({ onClose }) {
  const ctx = React.useContext(AppCtx);
  useEffect(() => { const k = e => { if (e.key === 'Escape') onClose(); }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, []);
  return (
    <div role="dialog" aria-modal="true" aria-label={L(ctx.lang,'Tú','You')} onClick={e => { if (e.target === e.currentTarget) onClose(); }} style={{ position:'fixed', inset: 0, zIndex: 210, background:'oklch(0.20 0.01 60 / 0.3)', animation:'fadeIn 200ms', display:'flex', justifyContent:'flex-end' }}>
      <div style={{ width:'min(420px, 100%)', height:'100%', background:'var(--bg)', borderLeft:'1px solid var(--line)', display:'flex', flexDirection:'column', animation:'drawerIn 280ms cubic-bezier(.2,.7,.3,1)' }}>
        <div style={{ padding:'14px 14px 12px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid var(--line-2)', background:'var(--bg-panel)' }}>
          <div className="serif" style={{ fontSize: 26 }}>{L(ctx.lang,'Tú','You')}</div>
          <button onClick={onClose} aria-label="Cerrar / Close" style={{ width: 44, height: 44, borderRadius: 12, display:'inline-flex', alignItems:'center', justifyContent:'center', color:'var(--ink-2)' }}><Icon name="x" size={16}/></button>
        </div>
        <div style={{ flex: 1, overflowY:'auto' }}>
          <MobileYouView lang={ctx.lang} memory={ctx.state.memory} pref={ctx.state.pref} basket={ctx.basket}
            onLoadList={(items) => { ctx.addItems(items); ctx.notify(L(ctx.lang,'Lista añadida a la cesta','List added to basket')); onClose(); }}/>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ActiveOrderCard, ProfileCard, OrdersCard, HouseholdCard, WebYouDrawer });
