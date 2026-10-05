// Per-store fulfilment options. We never deliver: each store handles its own slots and payment.
const dT = (es, en) => ({ es, en });
const FULFIL = {
  merc: [{ k:'home', when:dT('Mañana','Tomorrow'), win:'07:00–22:00' }],
  carr: [{ k:'home', when:dT('Hoy','Today'), win:'18:00–22:00' }, { k:'pick', when:dT('Hoy','Today'), win:dT('desde 17:00','from 17:00') }],
  lidl: [{ k:'home', when:dT('Mañana','Tomorrow'), win:'10:00–22:00' }],
  dia:  [{ k:'home', when:dT('Hoy','Today'), win:'20:00–22:00' }, { k:'pick', when:dT('Hoy','Today'), win:dT('en 2 h','in 2 h') }],
  eci:  [{ k:'home', when:dT('Hoy','Today'), win:dT('en 1 h','in 1 h') }, { k:'pick', name:'Click & Car', when:dT('Hoy','Today'), win:dT('desde 18:00','from 18:00') }],
  amz:  [{ k:'home', when:dT('Hoy','Today'), win:dT('en 2 h','in 2 h'), note:dT('con Prime','with Prime') }],
  sco:  [{ k:'home', when:dT('Mañana','Tomorrow'), win:'10:00–14:00' }, { k:'pick', when:dT('Hoy','Today'), win:dT('desde 19:00','from 19:00') }],
};
const dtx = (v, lang) => (v && typeof v === 'object') ? v[lang] : v;

function fulfilOptions(storeTotals) {
  const out = [];
  storeTotals.forEach(st => (FULFIL[st.id] || []).forEach((o, i) => {
    const fee = o.k === 'pick' ? 0 : st.shipping;
    out.push({ store: st.id, i, k: o.k, fee, items: st.items, total: st.items + fee, o });
  }));
  return out;
}
function defaultFulfil(storeTotals, winnerId) {
  const opts = fulfilOptions(storeTotals).filter(x => x.store === winnerId).sort((a, b) => a.total - b.total);
  return opts[0] || null;
}

function DeliveryChooser({ storeTotals, value, onChange }) {
  const ctx = React.useContext(AppCtx); const lang = ctx.lang;
  const [all, setAll] = useState(false);
  const opts = fulfilOptions(storeTotals);
  const best = {}; opts.forEach(x => { if (!best[x.store] || x.total < best[x.store]) best[x.store] = x.total; });
  const order = Object.keys(best).sort((a, b) => best[a] - best[b]);
  const shown = all ? order : order.slice(0, 3).concat(value && !order.slice(0, 3).includes(value.store) ? [value.store] : []);
  const cheapest = Math.min(...opts.map(x => x.total));
  return (
    <div>
      <div style={{ ...fxKicker, marginBottom: 4 }}>{L(lang,'Cómo te llega','How it reaches you')}</div>
      <div style={{ fontSize: 12, color:'var(--ink-3)', marginBottom: 10 }}>{L(lang,'Lo gestiona cada súper. Elige y te abrimos la cesta allí.','Each store handles it. Pick one and we open the basket there.')}</div>
      <div style={{ display:'flex', flexDirection:'column', gap: 8 }}>
        {shown.map(sid => {
          const s = STORES.find(x => x.id === sid);
          const mine = opts.filter(x => x.store === sid);
          return (
            <div key={sid} style={{ border:'1px solid var(--line)', borderRadius: 14, background:'var(--bg-panel)', overflow:'hidden' }}>
              <div style={{ display:'flex', alignItems:'center', gap: 10, padding:'9px 12px', borderBottom:'1px solid var(--line-2)' }}>
                <StoreMark store={s} size={22}/>
                <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 500 }}>{s.name}</span>
                <span style={{ fontSize: 12, color:'var(--ink-3)' }}>{L(lang,'cesta','basket')} <span className="mono">{eur(mine[0].items)}</span></span>
              </div>
              {mine.map(x => {
                const sel = value && value.store === x.store && value.i === x.i;
                const label = x.k === 'pick' ? (x.o.name || L(lang,'Recoger en tienda','Store pickup')) : L(lang,'A domicilio','Home delivery');
                return (
                  <button key={x.i} role="radio" aria-checked={!!sel} onClick={() => onChange(x)} style={{ width:'100%', display:'grid', gridTemplateColumns:'18px minmax(0,1fr) auto', gap: 10, alignItems:'center', padding:'10px 12px', minHeight: 52, textAlign:'left', background: sel ? 'var(--bg-sunk)' : 'transparent', borderTop: x.i ? '1px solid var(--line-2)' : 0 }}>
                    <span aria-hidden="true" style={{ width: 16, height: 16, borderRadius:'50%', border:`1.5px solid ${sel ? 'var(--ink)' : 'var(--line)'}`, display:'flex', alignItems:'center', justifyContent:'center' }}>{sel && <span style={{ width: 8, height: 8, borderRadius:'50%', background:'var(--ink)' }}></span>}</span>
                    <span style={{ minWidth: 0, display:'flex', flexDirection:'column', gap: 1 }}>
                      <span style={{ fontSize: 13, fontWeight: 500, display:'flex', alignItems:'center', gap: 6 }}><Icon name={x.k === 'pick' ? 'cart' : 'truck'} size={12}/>{label}</span>
                      <span style={{ fontSize: 12, color:'var(--ink-2)' }}>{dtx(x.o.when, lang)} · {dtx(x.o.win, lang)} · <span style={{ color: x.fee === 0 ? 'var(--sage-ink)' : 'var(--ink-2)' }}>{x.fee === 0 ? (x.k === 'pick' ? L(lang,'gratis','free') : L(lang,'envío gratis','free delivery')) : `${L(lang,'envío','delivery')} ${eur(x.fee)}`}</span>{x.o.note && <> · {dtx(x.o.note, lang)}</>}</span>
                    </span>
                    <span style={{ textAlign:'right', display:'flex', flexDirection:'column', alignItems:'flex-end' }}>
                      <span className="serif" style={{ fontSize: 19, lineHeight: 1.05 }}>{eur(x.total)}</span>
                      {x.total === cheapest && <span style={{ fontSize: 11, color:'var(--sage-ink)', fontWeight: 600 }}>{L(lang,'más barato','cheapest')}</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
      {order.length > 3 && <button onClick={() => setAll(a => !a)} aria-expanded={all} style={{ marginTop: 8, minHeight: 40, fontSize: 13, color:'var(--ink-2)', display:'inline-flex', alignItems:'center', gap: 6 }}>{all ? L(lang,'Ver menos','Show fewer') : L(lang,`Ver los ${order.length} supers`,`See all ${order.length} stores`)}<span style={{ display:'inline-block', transform: all ? 'rotate(180deg)' : 'none' }}><Icon name="down" size={12}/></span></button>}
      <div style={{ fontSize: 12, color:'var(--ink-3)', marginTop: 6, lineHeight: 1.45 }}>{L(lang,'Eliges la franja exacta y pagas en la web del súper. Horarios orientativos.','You pick the exact slot and pay on the store’s site. Times are indicative.')}</div>
    </div>
  );
}

Object.assign(window, { DeliveryChooser, defaultFulfil, fulfilOptions, FULFIL });
