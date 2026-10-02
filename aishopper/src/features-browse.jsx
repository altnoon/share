// Catalog browser: every product with per-store prices and stock, plus the full recipe book.
function BrowseSheet({ variant, data, onClose }) {
  const ctx = React.useContext(AppCtx);
  const lang = ctx.lang;
  const mobile = variant === 'mobile';
  const [tab, setTab] = useState((data && data.tab) || 'products');
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const [store, setStore] = useState('all');
  const [region, setRegion] = useState('all');
  const qn = deaccent(q.trim());
  const products = useMemo(() => Object.values(CATALOG).filter(p => {
    if (cat !== 'all' && p.category !== cat) return false;
    if (store !== 'all' && (MISSING[store] || []).includes(p.id)) return false;
    if (!qn) return true;
    return deaccent(p.name.es + ' ' + p.name.en + ' ' + (PRODUCT_KW[p.id] || []).join(' ')).includes(qn);
  }).sort((a, b) => a.category.localeCompare(b.category) || a.name[lang].localeCompare(b.name[lang])), [qn, cat, store, lang]);
  const recipes = useMemo(() => Object.values(RECIPES).filter(r => {
    if (region !== 'all' && (r.region || '') !== region) return false;
    if (!qn) return true;
    return deaccent(r.name.es + ' ' + r.name.en + ' ' + r.keywords.join(' ') + ' ' + (r.region || '')).includes(qn);
  }), [qn, region]);
  const regions = [...new Set(Object.values(RECIPES).map(r => r.region).filter(Boolean))].sort();
  const inBasket = (id) => (ctx.basket.find(b => b.id === id) || {}).qty || 0;
  const chip = (on, label, onClick, key) => (
    <button key={key} aria-pressed={on} onClick={onClick} style={{ flexShrink: 0, height: 34, padding:'0 12px', borderRadius: 999, fontSize: 12, fontWeight: 500, whiteSpace:'nowrap', display:'inline-flex', alignItems:'center', gap: 6, background: on ? 'var(--ink)' : 'var(--bg-panel)', color: on ? 'var(--bg)' : 'var(--ink-2)', border:`1px solid ${on ? 'var(--ink)' : 'var(--line)'}` }}>{label}</button>
  );
  const total = Object.keys(CATALOG).length;
  return (
    <Sheet variant={variant} onClose={onClose} width={720} kicker={L(lang, `${total} productos · ${Object.keys(RECIPES).length} recetas · 7 supers`, `${total} products · ${Object.keys(RECIPES).length} recipes · 7 stores`)} title={tab === 'products' ? L(lang,'Catálogo','Catalogue') : L(lang,'Recetario','Recipe book')}>
      <div style={{ position:'sticky', top: mobile ? -14 : -16, zIndex: 2, background:'var(--bg-panel)', margin: mobile ? '-14px -18px 0' : '-16px -22px 0', padding: mobile ? '12px 18px 10px' : '14px 22px 10px', borderBottom:'1px solid var(--line-2)' }}>
        <div style={{ display:'flex', gap: 8, alignItems:'center' }}>
          <Segment value={tab} onChange={(v) => { setTab(v); setQ(''); }} options={[{ value:'products', label: L(lang,'Productos','Products') }, { value:'recipes', label: L(lang,'Recetas','Recipes') }]}/>
          <label style={{ flex: 1, minWidth: 0, display:'flex', alignItems:'center', gap: 8, height: 40, padding:'0 12px', borderRadius: 12, border:'1px solid var(--line)', background:'var(--bg)' }}>
            <span style={{ color:'var(--ink-3)' }}><Icon name="search" size={14}/></span>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder={tab === 'products' ? L(lang,'Buscar: aceite, merluza, lejía…','Search: olive oil, hake, bleach…') : L(lang,'Buscar: lentejas, Galicia…','Search: lentils, Galicia…')}
              aria-label={L(lang,'Buscar','Search')} style={{ flex: 1, minWidth: 0, border: 0, outline: 0, background:'transparent', fontSize: 13 }}/>
            {q && <button onClick={() => setQ('')} aria-label={L(lang,'Borrar','Clear')} style={{ width: 28, height: 28, color:'var(--ink-3)', display:'inline-flex', alignItems:'center', justifyContent:'center' }}><Icon name="x" size={11}/></button>}
          </label>
        </div>
        {tab === 'products' ? (
          <>
            <div className="fx-noscroll" style={{ display:'flex', gap: 6, overflowX:'auto', marginTop: 10 }}>
              {chip(store === 'all', L(lang,'Todos los supers','All stores'), () => setStore('all'), 'all')}
              {STORES.map(s => chip(store === s.id, <><StoreMark store={s} size={18}/>{s.name}<span style={{ opacity: 0.7, fontWeight: 400 }}>{s.carries}</span></>, () => setStore(s.id), s.id))}
            </div>
            <div className="fx-noscroll" style={{ display:'flex', gap: 6, overflowX:'auto', marginTop: 6 }}>
              {chip(cat === 'all', L(lang,'Todo','All'), () => setCat('all'), 'all')}
              {Object.entries(CATEGORY_META).map(([k, m]) => chip(cat === k, <><span style={{ width: 7, height: 7, borderRadius: 4, background: m.dot }}></span>{m[lang]}</>, () => setCat(k), k))}
            </div>
          </>
        ) : (
          <div className="fx-noscroll" style={{ display:'flex', gap: 6, overflowX:'auto', marginTop: 10 }}>
            {chip(region === 'all', L(lang,'Toda España','All of Spain'), () => setRegion('all'), 'all')}
            {regions.map(r => chip(region === r, r, () => setRegion(r), r))}
          </div>
        )}
      </div>
      {tab === 'products' && (
        <div style={{ paddingTop: 6 }}>
          <div style={{ fontSize: 12, color:'var(--ink-3)', padding:'6px 0' }}>
            {products.length} {L(lang,'productos','products')}{store !== 'all' ? ` ${L(lang,'en','at')} ${STORES.find(s => s.id === store).name}` : ''}
          </div>
          {products.length === 0 && <div style={{ padding:'30px 0', textAlign:'center', color:'var(--ink-3)', fontSize: 13 }}>{L(lang,'Nada con ese nombre. Prueba otra palabra.','Nothing by that name. Try another word.')}</div>}
          {products.map(p => {
            const avail = STORES.filter(s => !(MISSING[s.id] || []).includes(p.id));
            const best = (store !== 'all' ? [STORES.find(s => s.id === store)] : avail).map(s => ({ s, v: p.prices[s.id] })).sort((a, b) => a.v - b.v)[0];
            const n = inBasket(p.id);
            return (
              <div key={p.id} style={{ display:'flex', alignItems:'center', gap: 10, minHeight: 58, padding:'6px 0', borderTop:'1px solid var(--line-2)' }}>
                <button onClick={() => ctx.openOverlay('history', { id: p.id })} aria-label={`${p.name[lang]} · ${L(lang,'historial de precio','price history')}`} style={{ width: 38, height: 38, borderRadius: 8, background:'var(--bg-sunk)', border:'1px solid var(--line-2)', fontSize: 19, flexShrink: 0, display:'inline-flex', alignItems:'center', justifyContent:'center' }}>{p.emoji}</button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, display:'flex', alignItems:'center', gap: 6, flexWrap:'wrap' }}>
                    {p.name[lang]}
                    {p.seasonal && <Pill tone="sage" size="sm"><Icon name="leaf" size={9}/>{L(lang,'temporada','season')}</Pill>}
                    {p.trend === 'down' && p.tag && <Pill tone="sage" size="sm">{p.tag[lang]}</Pill>}
                    {p.trend === 'up' && p.tag && <Pill tone="warn" size="sm">{p.tag[lang]}</Pill>}
                  </div>
                  <div style={{ fontSize: 12, color:'var(--ink-3)', marginTop: 2, display:'flex', gap: 6, flexWrap:'wrap' }}>
                    <span className="mono">{p.unit[lang]}</span>
                    {unitPrice(p.id, best.s.id, lang) && <span className="mono">· {unitPrice(p.id, best.s.id, lang)}</span>}
                    <span>· {L(lang, `en ${avail.length}/7 supers`, `at ${avail.length}/7 stores`)}</span>
                  </div>
                </div>
                <div style={{ textAlign:'right', flexShrink: 0 }}>
                  <div className="serif" style={{ fontSize: 18, lineHeight: 1 }}>{eur(best.v)}</div>
                  <div style={{ fontSize: 12, color:'var(--ink-3)', marginTop: 3, display:'flex', alignItems:'center', gap: 4, justifyContent:'flex-end' }}>{store === 'all' && L(lang,'desde','from')} {best.s.name}</div>
                </div>
                <button onClick={() => { ctx.addItems([{ id: p.id, qty: 1 }]); ctx.notify(L(lang, `${p.name.es} en la cesta`, `${p.name.en} added`)); }} aria-label={`${L(lang,'Añadir','Add')} ${p.name[lang]}`}
                  style={{ height: 40, minWidth: 44, padding:'0 10px', borderRadius: 12, flexShrink: 0, background: n ? 'var(--sage-soft)' : 'var(--ink)', color: n ? 'var(--sage-ink)' : 'var(--bg)', border: n ? '1px solid var(--sage-line)' : 'none', fontSize: 12, fontWeight: 600, display:'inline-flex', alignItems:'center', justifyContent:'center', gap: 4 }}>
                  <Icon name="plus" size={12}/>{n > 0 && <span className="mono">{n}</span>}
                </button>
              </div>
            );
          })}
        </div>
      )}
      {tab === 'recipes' && (
        <div style={{ display:'grid', gridTemplateColumns: mobile ? '1fr' : 'repeat(auto-fill, minmax(210px, 1fr))', gap: 8, paddingTop: 12 }}>
          {recipes.length === 0 && <div style={{ gridColumn:'1 / -1', padding:'30px 0', textAlign:'center', color:'var(--ink-3)', fontSize: 13 }}>{L(lang,'Sin recetas con ese nombre.','No recipes by that name.')}</div>}
          {recipes.map(r => {
            const est = r.ingredients.reduce((s, ing) => { const id = applyDiet(ing.id, ctx.diet); return s + Math.min(...Object.values(CATALOG[id].prices)) * Math.max(1, Math.ceil(ing.per * r.serves)); }, 0);
            return (
              <button key={r.id} onClick={() => { onClose(); ctx.actions.handleUserSend(r.name[lang]); }} style={{ textAlign:'left', padding: 12, borderRadius: 12, background:'var(--bg-sunk)', border:'1px solid var(--line-2)', display:'flex', gap: 10, alignItems:'flex-start' }}>
                <span aria-hidden="true" style={{ width: 40, height: 40, borderRadius: 12, background:'var(--bg-panel)', border:'1px solid var(--line-2)', fontSize: 21, flexShrink: 0, display:'inline-flex', alignItems:'center', justifyContent:'center' }}>{r.emoji}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display:'block', fontSize: 13, fontWeight: 600 }}>{r.name[lang]}</span>
                  <span style={{ display:'block', fontSize: 12, color:'var(--ink-2)', marginTop: 2, lineHeight: 1.35 }}>{r.desc[lang]}</span>
                  <span style={{ display:'block', fontSize: 12, color:'var(--ink-3)', marginTop: 6 }}>{r.time[lang]} · {r.serves} {L(lang,'pers.','ppl')} · ~{eur(est)}{r.region ? ` · ${r.region}` : ''}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </Sheet>
  );
}

function AllRecipesLink() {
  const ctx = React.useContext(AppCtx);
  const n = Object.keys(RECIPES).length;
  return (
    <button onClick={() => ctx.openOverlay('browse', { tab: 'recipes' })} style={{ alignSelf:'flex-start', minHeight: 36, padding:'0 12px 0 10px', borderRadius: 999, fontSize: 13, fontWeight: 500, color:'var(--ink)', background:'transparent', border:'1px dashed var(--line)', display:'inline-flex', alignItems:'center', gap: 6 }}>
      <Icon name="search" size={12}/>{L(ctx.lang, `Ver las ${n} recetas`, `See all ${n} recipes`)}
    </button>
  );
}

Object.assign(window, { BrowseSheet, AllRecipesLink });
