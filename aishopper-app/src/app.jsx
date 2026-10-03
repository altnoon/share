// Main app — wraps mobile layout in iOS frame on wider viewports.
function App() {
  const [tweaks, setTweaks] = useState(window.__TWEAKS);
  const [tweaksOpen, setTweaksOpen] = useState(false);

  const [messages, setMessages] = useState([]);
  const [basket, setBasket] = useState([]);
  const [appliedSubs, setAppliedSubs] = useState([]);
  const [pref, setPref] = useState(null);
  const [memory, setMemory] = useState([]);
  const [calculating, setCalculating] = useState(false);
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [running, setRunning] = useState(false);

  const [pantry, setPantry] = useState(['aceite', 'ajo']);
  const [diet, setDiet] = useState([]);
  const [profile, setProfile] = useState({ cp: '28004', household: 2, fav: [], cards: [], onboarded: false });
  const [overlay, setOverlay] = useState(null);
  const [orders, setOrders] = useState(ORDERS_SEED.map(o => ({ ...o, stores: [o.store] })));
  const [activeOrder, setActiveOrder] = useState(null);
  const [shared, setShared] = useState({ on: false, members: [] });
  const [alerts, setAlerts] = useState([{ id: 'cafe', threshold: 12, on: true }, { id: 'aceite', threshold: 8, on: true }]);
  const [storeStatus, setStoreStatus] = useState({ sco: 'stale' });
  const [notice, setNotice] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [pricesAt, setPricesAt] = useState(Date.now() - 2 * 3600e3 - 6 * 60e3);

  const lang = tweaks.language;
  const [netOff, setNetOff] = useState(typeof navigator !== 'undefined' && navigator.onLine === false);
  useEffect(() => { const a = () => setNetOff(false), b = () => setNetOff(true); window.addEventListener('online', a); window.addEventListener('offline', b); return () => { window.removeEventListener('online', a); window.removeEventListener('offline', b); }; }, []);
  const offline = netOff || !!tweaks.simOffline;
  window.__storeLogos = tweaks.storeLogos || 'letters';

  // Edit-mode host protocol
  useEffect(() => {
    const onMsg = (e) => {
      const d = e.data || {};
      if (d.type === '__activate_edit_mode') setTweaksOpen(true);
      if (d.type === '__deactivate_edit_mode') setTweaksOpen(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({ type:'__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);

  // Persist
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('ai-shopper-v2') || 'null');
      if (saved) {
        if (saved.basket) setBasket(saved.basket);
        if (saved.messages) setMessages(saved.messages);
        if (saved.appliedSubs) setAppliedSubs(saved.appliedSubs);
        if (saved.pref) setPref(saved.pref);
        if (saved.memory) setMemory(saved.memory);
        if (saved.scenarioIdx) setScenarioIdx(saved.scenarioIdx);
        if (saved.pantry) setPantry(saved.pantry);
        if (saved.diet) setDiet(saved.diet);
        if (saved.profile) setProfile(saved.profile);
        if (saved.orders) setOrders(saved.orders);
        if (saved.activeOrder !== undefined) setActiveOrder(saved.activeOrder);
        if (saved.shared) setShared(saved.shared);
        if (saved.alerts) setAlerts(saved.alerts);
      }
      if (!(saved && saved.profile && saved.profile.onboarded)) setOverlay({ type: 'onboarding', data: { quick: true } });
    } catch(e){}
  }, []);
  useEffect(() => {
    try { localStorage.setItem('ai-shopper-v2', JSON.stringify({ basket, messages, appliedSubs, pref, memory, scenarioIdx, pantry, diet, profile, orders, activeOrder, shared, alerts })); } catch(e){}
  }, [basket, messages, appliedSubs, pref, memory, scenarioIdx, pantry, diet, profile, orders, activeOrder, shared, alerts]);
  useEffect(() => {
    if (!activeOrder) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [activeOrder]);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(t);
  }, [notice]);
  useEffect(() => { window.__aiSound = profile.sound !== false; }, [profile.sound]);
  useEffect(() => { document.documentElement.dataset.theme = profile.theme === 'dark' ? 'dark' : 'light'; }, [profile.theme]);

  const storeTotals = useMemo(() => {
    return STORES.map(s => {
      const items = basket.reduce((sum, b) => sum + itemCost(b, s.id, appliedSubs), 0);
      const shipping = items >= s.minFree ? 0 : s.delivery;
      return { id: s.id, items, shipping, total: items + shipping, missing: missingAt(s.id, basket).map(b => b.id) };
    }).sort((a, b) => a.total - b.total);
  }, [basket, appliedSubs]);
  const winner = basket.length > 0 ? storeTotals[0] : null;

  const pushMemory = (step) => {
    if (step.pref === 'price') setMemory(m => [...m, {
      es: 'Prefieres precio sobre marca · aplicado al resto de la sesión',
      en: 'You prefer price over brand · applied for the rest of the session',
    }]);
  };

  const addToBasket = (id, qty = 1, by, meal) => {
    if (CATALOG[id]) flyToBasket(CATALOG[id].emoji);
    setBasket(prev => {
      const existing = prev.find(b => b.id === id);
      if (existing) return prev.map(b => b.id === id ? { ...b, qty: b.qty + qty, meals: meal ? [...new Set([...(b.meals || []), meal])] : b.meals } : b);
      const it = { id, qty };
      if (by) it.by = by;
      if (meal) it.meals = [meal];
      return [...prev, it];
    });
  };
  const notify = (text, undo) => setNotice(text ? { text, undo, k: Date.now() } : null);
  // Undo instead of confirm: snapshot → apply → toast with Deshacer.
  const snapB = () => ({ basket, appliedSubs });
  const undoTo = (s) => () => { window.__aiSkipToast = true; setBasket(s.basket); setAppliedSubs(s.appliedSubs); };
  const pname = (id) => CATALOG[id].name[lang];
  const addItems = (items) => items.forEach(it => addToBasket(it.id, it.qty));
  const repeatOrder = (o) => {
    const snap = { basket, appliedSubs };
    addItems(o.items);
    setTimeout(() => setMessages(m => [...m, { type:'ai-next', k: Date.now() }]), 700);
    aiNote(o.items[0].id, `He puesto tu pedido del ${o.date.es.toLowerCase()} (${o.items.length} productos). Quita lo que no necesites o pídeme cambios.`, `I added your ${o.date.en} order (${o.items.length} items). Remove anything you don’t need, or ask me for changes.`);
    notify(lang === 'es' ? `Pedido del ${o.date.es.toLowerCase()} en la cesta` : `${o.date.en} order added to basket`, () => { setBasket(snap.basket); setAppliedSubs(snap.appliedSubs); });
  };
  const aiNote = (productId, es, en) => setMessages(m => [...m, { type: 'ai-context', productId, text: { es, en } }]);

  useEffect(() => {
    if (!running) return;
    if (scenarioIdx >= SCENARIO_SCRIPT.length) { setRunning(false); return; }
    const step = SCENARIO_SCRIPT[scenarioIdx];
    if ((step.type === 'ai-qualify' || step.type === 'ai-preference') && scenarioIdx > 0) {
      setMessages(m => [...m, step]);
      setScenarioIdx(i => i + 1);
      setRunning(false);
      return;
    }
    const delay = step.type === 'parsing' ? 700
      : step.type === 'ai-parsed' ? 550
      : step.type === 'ai-context' ? 1100
      : step.type === 'user' ? 600
      : step.type === 'ai-subs' ? 700
      : step.type === 'ai-summary' ? 600 : 500;
    const t = setTimeout(() => {
      const s = SCENARIO_SCRIPT[scenarioIdx];
      if (s.type === 'parsing') { setCalculating(true); setMessages(m => [...m, s]); }
      else if (s.type === 'ai-parsed') {
        setMessages(m => [...m.filter(x => x.type !== 'parsing'), s]);
        setCalculating(false);
        s.items.forEach(id => addToBasket(id, id === 'leche' ? 3 : id === 'naranjas' ? 2 : 1));
      } else if (s.type === 'user' && s.auto) {
        setMessages(m => [...m, { type:'user', text: s.text }]);
        if (s.pref) { setPref(s.pref); pushMemory(s); }
      } else {
        setMessages(m => [...m, s]);
      }
      setScenarioIdx(i => i + 1);
    }, delay);
    return () => clearTimeout(t);
  }, [running, scenarioIdx]);

  // Scale a recipe's ingredients to a serving count → [{ id, qty }] with whole purchasable units.
  const recipeItems = (recipe, servings) =>
    recipe.ingredients.map(ing => ({ id: ing.id, qty: Math.max(1, Math.ceil(ing.per * servings)) }));

  const matchDish = (text) => {
    const t = ' ' + text.toLowerCase().replace(/[.,!¡¿?]/g, ' ') + ' ';
    // Longest keyword first so "pasta con tomate" beats "pasta".
    let best = null, bestLen = 0;
    Object.values(RECIPES).forEach(r => {
      r.keywords.forEach(k => {
        if (t.includes(' ' + k + ' ') || t.includes(k)) {
          if (k.length > bestLen) { best = r; bestLen = k.length; }
        }
      });
    });
    return best;
  };

  const matchProducts = (text) => matchCatalogProducts(text);

  const actions = {
    startScenario: () => {
      setMessages([]); setBasket([]); setAppliedSubs([]); setPref(null); setMemory([]); setScenarioIdx(0); setRunning(true);
    },
    handleUserSend: (text, fromQueue) => {
      if (offline && !fromQueue) { setMessages(m => [...m, { type:'user', text:{ es:text, en:text }, queued: true }]); return; }
      setMessages(m => [...(fromQueue ? m.map(x => x.queued && x.text.es === text ? { ...x, queued: false } : x) : [...m, { type:'user', text:{ es:text, en:text } }]), { type:'parsing' }]);
      setTimeout(() => {
        setMessages(m => m.filter(x => x.type !== 'parsing'));
        const t = text.toLowerCase();
        if (/\bmen[uú](\s|$|[.,!?])|semana|week|meal plan/.test(t)) {
          const bud = t.match(/(\d{2,3})\s*(€|eur|euros)/);
          const sv = t.match(/(?:para|for)\s*(\d{1,2})/);
          aiNote('arroz', 'Te he preparado un menú de semana. Ajusta platos, comensales y presupuesto.', 'I drafted a weekly menu. Tweak dishes, servings and budget.');
          setOverlay({ type: 'menu', data: { budget: bud ? +bud[1] : undefined, servings: sv ? +sv[1] : undefined } });
          return;
        }
        if (/\bfoto|photo|imagen|picture/.test(t)) { setOverlay({ type: 'photo' }); return; }
        if (/repite|repetir|repeat|lo de siempre|the usual|same as last/.test(t)) {
          const o = orders[0];
          aiNote('leche', `He puesto tu pedido del ${o.date.es.toLowerCase()} (${o.items.length} productos). Quita lo que no necesites.`, `I added your ${o.date.en} order (${o.items.length} items). Remove anything you don’t need.`);
          addItems(o.items); return;
        }
        const dmap = [[/sin gluten|gluten.?free|cel[ií]ac/, 'gluten'], [/sin lactosa|lactose/, 'lactose'], [/vegetarian|vegetariano|sin carne|no meat/, 'veg']];
        const hit = dmap.find(([re]) => re.test(t));
        if (hit && !matchDish(text)) {
          setDiet(d => d.includes(hit[1]) ? d : [...d, hit[1]]);
          aiNote('pan', `Hecho: a partir de ahora, ${DIETS[hit[1]].es.toLowerCase()}. Cambiaré los ingredientes de las recetas.`, `Done: ${DIETS[hit[1]].en.toLowerCase()} from now on. I’ll swap recipe ingredients.`);
          return;
        }
        const dish = matchDish(text);
        if (dish) {
          // Pull an explicit serving count if the user mentioned one ("paella para 6").
          const sv = text.toLowerCase().match(/(?:para|for|x)\s*(\d{1,2})\s*(?:personas|people|comensales|pax)?/);
          const servings = sv ? Math.min(Math.max(+sv[1], 1), 12) : (profile.household || dish.serves);
          setMessages(m => [...m, { type:'ai-recipe', recipeId: dish.id, servings, src: sv ? 'explicit' : 'household' }]);
          return;
        }
        const f = matchProducts(text);
        if (f.length > 0) {
          const dt = deaccent(text);
          const guess = f.filter(x => ambigAlts(x.id).length > 1 && !dt.includes(deaccent(CATALOG[x.id].name.es)) && !dt.includes(deaccent(CATALOG[x.id].name.en))).map(x => x.id);
          setMessages(m => [...m, { type:'ai-parsed', items: f.map(x => x.id), guess }]);
          f.forEach(x => addToBasket(x.id, x.qty));
        }
        else setMessages(m => [...m, { type:'ai-context', productId: Object.keys(CATALOG)[0],
          text:{ es:'No lo he reconocido. Prueba un plato ("paella para 4") o productos ("3 l de leche").',
                 en:'I didn\'t recognize that. Try a dish ("paella for 4") or products ("3 L milk").' } }]);
      }, 1150);
    },
    handleQuickReply: (reply) => {
      if (reply.kind === 'qualify' && reply.choice === 'yes') {
        setMessages(m => [...m, { type:'user', text:{ es:'Sí, añádelo', en:'Yes, add it' } }]);
        setBasket(prev => prev.map(b => b.id === reply.productId ? { ...b, qty: 3 } : b));
      } else if (reply.kind === 'qualify' && reply.choice === 'no') {
        setMessages(m => [...m, { type:'user', text:{ es:'Solo uno', en:'Just one' } }]);
      } else if (reply.kind === 'pref') {
        setPref(reply.value);
        setMessages(m => [...m, { type:'user', text:{ es:reply.label, en:reply.label } }]);
        pushMemory({ pref: reply.value });
        setTimeout(() => setRunning(true), 300);
      } else if (reply.kind === 'recipe') {
        const items = reply.items || recipeItems(RECIPES[reply.recipeId], reply.servings);
        items.forEach(it => addToBasket(it.id, it.qty, undefined, reply.recipeId));
        setTimeout(() => setMessages(m => [...m, { type:'ai-next', k: Date.now() }]), 700);
      }
    },
    addRecipe: (recipeId, servings) => {
      const items = recipeItems(RECIPES[recipeId], servings);
      items.forEach(it => addToBasket(it.id, it.qty, undefined, recipeId));
    },
    removeMeal: (rid) => {
      const s = snapB();
      const gone = basket.filter(b => (b.meals || []).length === 1 && b.meals[0] === rid).map(b => b.id);
      setBasket(prev => prev.filter(b => !gone.includes(b.id)).map(b => (b.meals || []).includes(rid) ? { ...b, meals: b.meals.filter(m => m !== rid) } : b));
      setAppliedSubs(prev => prev.filter(x => !gone.includes(x)));
      notify(L(lang, `${RECIPES[rid].name.es} quitado (${gone.length} productos)`, `${RECIPES[rid].name.en} removed (${gone.length} items)`), undoTo(s));
    },
    setQtySmart: (id, qty) => {
      const s = snapB();
      setBasket(prev => prev.map(b => b.id === id ? { ...b, qty } : b));
      notify(L(lang, `${pname(id)}: bajado a ${qty}`, `${pname(id)}: cut to ${qty}`), undoTo(s));
    },
    handleAddFromForm: (id, qty) => {
      addToBasket(id, qty);
      setMessages(m => [...m, { type:'ai-parsed', items:[id] }]);
    },
    removeFromBasket: (id) => {
      const s = snapB();
      setBasket(prev => prev.filter(b => b.id !== id));
      setAppliedSubs(prev => prev.filter(x => x !== id));
      notify(L(lang, `${pname(id)} quitado`, `${pname(id)} removed`), undoTo(s));
    },
    toggleSub: (id, on) => {
      const s = snapB();
      setAppliedSubs(prev => on ? (prev.includes(id) ? prev : [...prev, id]) : prev.filter(x => x !== id));
      notify(on ? L(lang, `Cambiado a ${CATALOG[id].whiteLabel.name.es}`, `Switched to ${CATALOG[id].whiteLabel.name.en}`) : L(lang, `Vuelta a ${pname(id)}`, `Back to ${pname(id)}`), undoTo(s));
    },
    swapItem: (from, to, quiet) => {
      if (from === to) return;
      const s = snapB();
      setBasket(prev => {
        const a = prev.find(b => b.id === from); if (!a) return prev;
        const ex = prev.find(b => b.id === to);
        return ex ? prev.filter(b => b.id !== from).map(b => b.id === to ? { ...b, qty: b.qty + a.qty } : b) : prev.map(b => b.id === from ? { ...b, id: to } : b);
      });
      setAppliedSubs(prev => prev.filter(x => x !== from));
      if (!quiet) notify(L(lang, `${pname(from)} → ${pname(to)}`, `${pname(from)} → ${pname(to)}`), undoTo(s));
    },
    restoreBasket: (snap) => { setBasket(snap.basket); setAppliedSubs(snap.appliedSubs); },
    loadList: (items) => { items.forEach(it => addToBasket(it.id, it.qty)); aiNote(items[0].id, `He cargado tu lista (${items.length} productos). Pídeme cambios si quieres.`, `I loaded your list (${items.length} items). Ask me for changes anytime.`); },
    changeQty: (id, qty) => setBasket(prev => prev.map(b => b.id === id ? { ...b, qty } : b)),
    applySub: (id) => {
      const s = snapB();
      setAppliedSubs(prev => prev.includes(id) ? prev : [...prev, id]);
      notify(L(lang, `Cambiado a ${CATALOG[id].whiteLabel.name.es}`, `Switched to ${CATALOG[id].whiteLabel.name.en}`), undoTo(s));
    },
    applyAllSubs: () => {
      const s = snapB();
      const ids = basket.filter(b => CATALOG[b.id].whiteLabel && !(profile.lockBrand || []).includes(b.id)).map(b => b.id);
      setAppliedSubs(ids);
      notify(L(lang, `${ids.length} productos en marca blanca`, `${ids.length} items on store brand`), undoTo(s));
    },
    reset: () => {
      const s = { messages, basket, appliedSubs, pref, memory, scenarioIdx };
      setMessages([]); setBasket([]); setAppliedSubs([]); setPref(null); setMemory([]); setScenarioIdx(0);
      if (s.messages.length || s.basket.length) notify(L(lang, 'Empezamos de cero', 'Started over'), () => {
        window.__aiSkipToast = true;
        setMessages(s.messages); setBasket(s.basket); setAppliedSubs(s.appliedSubs); setPref(s.pref); setMemory(s.memory); setScenarioIdx(s.scenarioIdx);
      });
    },
  };

  const started = messages.length > 0 || basket.length > 0;
  useEffect(() => {
    if (offline) return;
    const q = messages.filter(m => m.type === 'user' && m.queued).map(m => m.text.es);
    q.forEach((t, i) => setTimeout(() => actions.handleUserSend(t, true), 400 + i * 1400));
  }, [offline]);

  const state = { messages, basket, appliedSubs, pref, memory, calculating, storeTotals, winner, started };
  window.__aiSend = actions.handleUserSend;

  const tg = (arr, v) => arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v];
  const ctx = {
    lang, state, actions, basket, winner, storeTotals, appliedSubs,
    pantry, diet, profile, orders, activeOrder, shared, alerts, storeStatus, notice, now,
    offline, pricesAt, refreshPrices: () => { setCalculating(true); setTimeout(() => { setCalculating(false); setPricesAt(Date.now()); setNotice({ text: L(lang, 'Precios actualizados en los 7 supers', 'Prices refreshed across all 7 stores'), k: Date.now() }); }, 900); },
    overlay, openOverlay: (type, data) => setOverlay({ type, data }), closeOverlay: () => setOverlay(null),
    notify, addItems, repeatOrder,
    repeatLast: () => repeatOrder(orders[0]),
    togglePantry: (id) => setPantry(p => tg(p, id)),
    toggleDiet: (k) => setDiet(d => tg(d, k)),
    saveSetup: (p, d, pa) => { setProfile(p); setDiet(d); setPantry(pa); },
    updateProfile: (patch) => setProfile(p => ({ ...p, ...patch })),
    toggleLock: (id) => {
      const on = !(profile.lockBrand || []).includes(id);
      setProfile(p => ({ ...p, lockBrand: on ? [...(p.lockBrand || []), id] : (p.lockBrand || []).filter(x => x !== id) }));
      if (on) setAppliedSubs(prev => prev.filter(x => x !== id));
      notify(on ? L(lang, `Siempre ${pname(id)} · no te propondré marca blanca`, `Always ${pname(id)} · no store-brand suggestions`) : L(lang, `${pname(id)} ya no está fijado`, `${pname(id)} unlocked`));
    },
    approvePending: (id) => {
      const r = (shared.pending || []).find(x => x.id === id); if (!r) return;
      addToBasket(r.id, r.qty, r.by);
      setShared(s => ({ ...s, pending: (s.pending || []).filter(x => x.id !== id) }));
    },
    rejectPending: (id) => {
      const r = (shared.pending || []).find(x => x.id === id);
      setShared(s => ({ ...s, pending: (s.pending || []).filter(x => x.id !== id) }));
      if (r) notify(L(lang, `Le digo a ${r.by} que esta vez no`, `I’ll tell ${r.by} not this time`), () => setShared(s => ({ ...s, pending: [...(s.pending || []), r] })));
    },
    setMemberRole: (name, role) => setShared(s => ({ ...s, members: (s.members || []).map(m => m.name === name ? { ...m, role } : m) })),
    inviteMember: (name) => {
      const hue = (name.length * 47) % 360;
      setShared(s => ({ ...s, on: true, members: [...(s.members || []), { name, joined: false, hue }] }));
      notify(L(lang, `Invitación enviada a ${name}`, `Invite sent to ${name}`), () => setShared(s => ({ ...s, members: (s.members || []).filter(m => m.name !== name) })));
      setTimeout(() => setShared(s => ({ ...s, members: (s.members || []).map(m => m.name === name ? { ...m, joined: true } : m) })), 3000);
    },
    markAsked: (k) => setProfile(p => ({ ...p, asked: { ...(p.asked || {}), [k]: true } })),
    openHistory: (id) => setOverlay({ type: 'history', data: { id } }),
    addAlert: (id, threshold) => {
      setAlerts(a => a.some(x => x.id === id) ? a.map(x => x.id === id ? { ...x, threshold, on: true } : x) : [...a, { id, threshold, on: true }]);
      notify(lang === 'es' ? `Te aviso si ${CATALOG[id].name.es.toLowerCase()} baja de ${eur(threshold)}` : `I’ll alert you if ${CATALOG[id].name.en.toLowerCase()} drops under ${eur(threshold)}`);
    },
    updateAlert: (id, patch) => setAlerts(a => a.map(x => x.id === id ? { ...x, ...patch } : x)),
    retryStore: (id) => { setStoreStatus(s => ({ ...s, [id]: 'loading' })); setTimeout(() => setStoreStatus(s => ({ ...s, [id]: 'ok' })), 1400); },
    setSharedOn: (on) => {
      if (!on) { setShared({ on: false, members: [] }); return; }
      if (shared.on) return;
      setShared({ on: true, pending: [], members: [{ name: lang === 'es' ? 'Tú' : 'You', me: true, joined: true, hue: 255 }, { name: 'Ana', joined: false, hue: 20 }] });
      setTimeout(() => setShared(s => s.on ? { ...s, editing: 'Ana', members: s.members.map(m => m.name === 'Ana' ? { ...m, joined: true } : m) } : s), 1500);
      setTimeout(() => {
        setShared(s => s.on ? { ...s, editing: null, pending: [...(s.pending || []).filter(x => x.id !== 'yogur'), { id: 'yogur', qty: 1, by: 'Ana' }] } : s);
        notify(lang === 'es' ? 'Ana quiere añadir Yogur natural · apórbalo en la cesta' : 'Ana wants to add Plain yogurt · approve it in the basket');
      }, 4500);
    },
    placeOrder: ({ stores, total, slot, items }) => {
      const usual = usualStoreId(profile);
      const saved = Math.round((basketAt(items, usual) - (total - slot.fee)) * 100) / 100;
      const rules = Object.fromEntries(items.map(b => [b.id, oosRuleOf(profile, b.id)]));
      const o = { id: 'o-' + Math.random().toString(36).slice(2, 6), date: { es: 'Hoy', en: 'Today' }, stores, total, slot, items, placedAt: Date.now(), usual, saved, rules };
      setActiveOrder(o); setNow(Date.now());
      setOrders(os => [o, ...os]);
      setBasket([]); setAppliedSubs([]);
      setOverlay({ type: 'tracking' });
    },
    finishOrder: () => setActiveOrder(null),
  };

  // Viewport: track width to decide if we show device frame chrome
  const [vw, setVw] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const on = () => setVw(window.innerWidth);
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  const viewMode = tweaks.viewMode || 'auto';
  const useMobile = viewMode === 'mobile' || (viewMode === 'auto' && vw < 768);
  const useWeb = viewMode === 'web' || (viewMode === 'auto' && vw >= 768);
  const showDeviceFrame = useMobile && vw >= 720;
  const showSidebar = useMobile && vw >= 1100;
  const [vh, setVh] = useState(typeof window !== 'undefined' ? window.innerHeight : 900);
  useEffect(() => {
    const on = () => setVh(window.innerHeight);
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  const frameScale = Math.min(1, (vh - 48) / 820);

  const content = (
    <AppCtx.Provider value={ctx}>
      <FlyLayer/>
      <div style={profile.textScale === 'lg' ? { zoom: 1.15, width:'calc(100% / 1.15)', height:'calc(100% / 1.15)' } : { width:'100%', height:'100%' }}>
      {useMobile
        ? <MobileApp tweaks={tweaks} setTweaks={setTweaks} state={state} actions={actions}/>
        : <WebApp tweaks={tweaks} setTweaks={setTweaks} state={state} actions={actions}/>}
      </div>
    </AppCtx.Provider>
  );

  return (
    <>
      {useWeb ? (
        <div style={{ position:'fixed', inset: 0, width:'100%', height:'100%' }}>
          {content}
        </div>
      ) : showDeviceFrame ? (
        <div style={{
          position:'fixed', inset: 0,
          background: 'oklch(0.94 0.006 85)',
          display:'flex', alignItems:'center', justifyContent:'center',
          overflow:'hidden', padding: 24,
          backgroundImage: 'radial-gradient(600px 400px at 70% 30%, oklch(0.98 0.01 85) 0%, transparent 70%), radial-gradient(500px 300px at 20% 80%, oklch(0.96 0.02 255 / 0.4) 0%, transparent 70%)',
        }}>
          {showSidebar && <PromoSidebar lang={lang} onStart={actions.startScenario} started={started}/>}
          <div style={{ transform: `scale(${frameScale})`, transformOrigin: 'center center' }}>
            <DeviceFrame>
              {content}
            </DeviceFrame>
          </div>
        </div>
      ) : (
        <div style={{ position:'fixed', inset: 0, width:'100%', height:'100%' }}>
          {content}
        </div>
      )}
      {!useWeb && vw >= 720 && <ViewToggle tweaks={tweaks} setTweaks={setTweaks}/>}
      <TweaksPanel open={tweaksOpen} tweaks={tweaks} setTweaks={setTweaks}/>
    </>
  );
}

function ViewToggle({ tweaks, setTweaks }) {
  const set = (v) => {
    setTweaks(prev => ({ ...prev, viewMode: v }));
    try { window.parent.postMessage({ type:'__edit_mode_set_keys', edits: { viewMode: v } }, '*'); } catch(e){}
  };
  const vm = tweaks.viewMode || 'auto';
  const opts = [
    { v:'web',    label: tweaks.language === 'es' ? 'Web' : 'Web',
      icon: <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="12" height="9" rx="1"/><path d="M2 6h12M6 12v2M10 12v2M5 14h6"/></svg> },
    { v:'mobile', label: tweaks.language === 'es' ? 'Móvil' : 'Mobile',
      icon: <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="4" y="2" width="8" height="12" rx="1.5"/><circle cx="8" cy="12" r="0.5" fill="currentColor"/></svg> },
  ];
  return (
    <div style={{
      position:'fixed', top: 14, left: 14, zIndex: 95,
      background:'var(--bg-panel)', border:'1px solid var(--line)',
      borderRadius: 999, padding: 3,
      display:'inline-flex', gap: 2,
      boxShadow:'0 4px 16px oklch(0.2 0.01 60 / 0.08)',
    }}>
      {opts.map(o => {
        const active = vm === o.v || (vm === 'auto' && ((o.v === 'web' && window.innerWidth >= 900) || (o.v === 'mobile' && window.innerWidth < 900)));
        return (
          <button key={o.v} onClick={() => set(o.v)} style={{
            padding: '5px 11px', borderRadius: 999,
            background: active ? 'var(--ink)' : 'transparent',
            color: active ? 'var(--bg)' : 'var(--ink-2)',
            fontSize: 11, fontWeight: 500,
            display:'inline-flex', alignItems:'center', gap: 5,
          }}>
            {o.icon}{o.label}
          </button>
        );
      })}
    </div>
  );
}

function DeviceFrame({ children }) {
  const W = 390, H = 820;
  return (
    <div style={{
      width: W, height: H,
      borderRadius: 54, overflow: 'hidden',
      background: '#000', padding: 8,
      boxShadow: '0 40px 100px oklch(0.2 0.01 60 / 0.25), 0 0 0 1px oklch(0.2 0.01 60 / 0.08)',
      position:'relative', flexShrink: 0,
    }}>
      <div style={{
        width: '100%', height: '100%', borderRadius: 46,
        overflow: 'hidden', background: 'var(--bg)',
        position:'relative',
      }}>
        {/* Dynamic island */}
        <div style={{
          position:'absolute', top: 12, left:'50%', transform:'translateX(-50%)',
          width: 108, height: 30, borderRadius: 20, background:'#000', zIndex: 100,
        }}/>
        {/* Status bar */}
        <div style={{
          position:'absolute', top: 0, left: 0, right: 0, height: 54, zIndex: 50,
          padding: '18px 30px 0',
          display:'flex', alignItems:'center', justifyContent:'space-between',
          color: 'var(--ink)', fontSize: 14, fontWeight: 600,
          pointerEvents:'none',
        }}>
          <span style={{ fontFamily:'-apple-system, system-ui', fontVariantNumeric:'tabular-nums' }}>9:41</span>
          <div style={{ display:'flex', gap: 5, alignItems:'center' }}>
            <svg width="17" height="11" viewBox="0 0 17 11"><rect x="0" y="7" width="3" height="4" rx="0.5" fill="currentColor"/><rect x="4.5" y="5" width="3" height="6" rx="0.5" fill="currentColor"/><rect x="9" y="2.5" width="3" height="8.5" rx="0.5" fill="currentColor"/><rect x="13.5" y="0" width="3" height="11" rx="0.5" fill="currentColor"/></svg>
            <svg width="15" height="11" viewBox="0 0 15 11"><path d="M7.5 3c2 0 3.8.8 5.2 2.1l1-1c-1.6-1.6-3.8-2.6-6.2-2.6S2.9 2.5 1.3 4.1l1 1C3.7 3.8 5.5 3 7.5 3zm0 3.5c1.2 0 2.3.4 3.1 1.2l1-1c-1.1-1-2.5-1.7-4.1-1.7-1.6 0-3 .7-4.1 1.7l1 1c.8-.8 1.9-1.2 3.1-1.2zm0 3a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" fill="currentColor"/></svg>
            <div style={{ width: 24, height: 11, borderRadius: 3, border:'1px solid currentColor', position:'relative', padding: 1 }}>
              <div style={{ width:'75%', height:'100%', borderRadius: 1.5, background:'currentColor' }}/>
            </div>
          </div>
        </div>
        <div style={{ paddingTop: 54, height: '100%', width: '100%' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function PromoSidebar({ lang, onStart, started }) {
  return (
    <div style={{
      position:'relative', maxWidth: 340, marginRight: 48,
      display:'flex', flexDirection:'column', gap: 18,
    }}>
      <div style={{ pointerEvents:'auto' }}>
        <div style={{ fontSize: 11, color:'var(--ink-3)', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom: 10 }}>
          {tr('appName', lang)} · {lang === 'es' ? 'Prototipo móvil' : 'Mobile prototype'}
        </div>
        <div className="serif" style={{ fontSize: 44, lineHeight: 1.05, letterSpacing:'-0.02em' }}>
          {lang === 'es' ? <>El concierge<br/><span style={{ fontStyle:'italic', color:'var(--ink-3)' }}>de tu cesta.</span></>
                         : <>The concierge<br/><span style={{ fontStyle:'italic', color:'var(--ink-3)' }}>for your basket.</span></>}
        </div>
        <div style={{ fontSize: 14, color:'var(--ink-2)', marginTop: 14, lineHeight: 1.5, maxWidth: 320 }}>
          {lang === 'es'
            ? 'Dicta, compara 7 supers en tu CP, sustituye por marca blanca y abre el carrito listo — todo en un pulgar.'
            : 'Dictate, compare 7 stores in your ZIP, swap to store brand, and open the ready cart — all one-thumb.'}
        </div>
        {!started && (
          <button onClick={onStart} style={{
            marginTop: 20, padding: '10px 14px', borderRadius: 10,
            background: 'var(--ink)', color: 'var(--bg)',
            fontSize: 12.5, fontWeight: 500,
            display:'inline-flex', alignItems:'center', gap: 8,
          }}>
            <Icon name="sparkle" size={11}/>
            {lang === 'es' ? 'Probar demo guiada →' : 'Try guided demo →'}
          </button>
        )}
      </div>

      <div style={{
        pointerEvents:'auto',
        padding: '14px 16px', borderRadius: 12,
        background: 'var(--bg-panel)', border:'1px solid var(--line)',
        display:'flex', flexDirection:'column', gap: 8, maxWidth: 340,
      }}>
        <div style={{ fontSize: 10.5, color:'var(--ink-3)', textTransform:'uppercase', letterSpacing:'0.08em' }}>
          {lang === 'es' ? 'Flujo' : 'Flow'}
        </div>
        {[
          { es:'Conversación — NLP + contexto + memoria', en:'Chat — NLP + context + memory' },
          { es:'Comparar 7 supers — envío incluido', en:'Compare 7 stores — shipping included' },
          { es:'Optimizar — sustituciones marca blanca', en:'Optimize — store-brand swaps' },
          { es:'Cerrar — deeplink · PDF · WhatsApp', en:'Close — deeplink · PDF · WhatsApp' },
        ].map((s, i) => (
          <div key={i} style={{ display:'flex', gap: 10, alignItems:'flex-start', fontSize: 12, color:'var(--ink-2)' }}>
            <span className="mono" style={{ color:'var(--ink-3)', fontSize: 11 }}>0{i+1}</span>
            <span>{s[lang]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
