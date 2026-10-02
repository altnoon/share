// Data + helpers for: diets, pantry, unit prices, stock gaps, split basket, orders, delivery slots, onboarding.
const L = (lang, es, en) => lang === 'es' ? es : en;
const AppCtx = React.createContext({});

Object.assign(CATALOG, {
  pan_sg:   { id:'pan_sg', category:'frescos', name:{es:'Pan sin gluten',en:'Gluten-free bread'}, unit:{es:'400 g',en:'400 g'}, emoji:'🍞', prices:{merc:2.60,carr:2.85,lidl:2.40,dia:2.70,eci:3.40,amz:2.95,sco:3.10}, history:[2.70,2.68,2.66,2.64,2.62,2.60] },
  pasta_sg: { id:'pasta_sg', category:'despensa', name:{es:'Espaguetis sin gluten',en:'Gluten-free spaghetti'}, unit:{es:'500 g',en:'500 g'}, emoji:'🍝', prices:{merc:1.75,carr:1.95,lidl:1.60,dia:1.85,eci:2.40,amz:2.10,sco:2.05}, history:[1.85,1.82,1.80,1.78,1.76,1.75] },
  leche_sl: { id:'leche_sl', category:'frescos', name:{es:'Leche sin lactosa',en:'Lactose-free milk'}, unit:{es:'6 × 1 L',en:'6 × 1 L'}, emoji:'🥛', prices:{merc:7.80,carr:8.10,lidl:7.50,dia:7.90,eci:9.20,amz:8.40,sco:8.60}, history:[8.10,8.00,7.95,7.90,7.85,7.80] },
  yogur_sl: { id:'yogur_sl', category:'frescos', name:{es:'Yogur sin lactosa',en:'Lactose-free yogurt'}, unit:{es:'4 × 125 g',en:'4 × 125 g'}, emoji:'🥣', prices:{merc:1.60,carr:1.80,lidl:1.45,dia:1.70,eci:2.20,amz:1.90,sco:1.95}, history:[1.65,1.64,1.62,1.61,1.60,1.60] },
  queso_sl: { id:'queso_sl', category:'frescos', name:{es:'Queso sin lactosa',en:'Lactose-free cheese'}, unit:{es:'250 g',en:'250 g'}, emoji:'🧀', prices:{merc:3.90,carr:4.30,lidl:3.70,dia:4.10,eci:5.20,amz:4.60,sco:4.45}, history:[3.80,3.82,3.85,3.87,3.88,3.90] },
  nata_veg: { id:'nata_veg', category:'frescos', name:{es:'Nata vegetal',en:'Plant-based cream'}, unit:{es:'200 ml',en:'200 ml'}, emoji:'🥛', prices:{merc:1.35,carr:1.50,lidl:1.25,dia:1.40,eci:1.85,amz:1.60,sco:1.55}, history:[1.35,1.35,1.35,1.35,1.35,1.35] },
  garbanzos:{ id:'garbanzos', category:'despensa', name:{es:'Garbanzos cocidos',en:'Cooked chickpeas'}, unit:{es:'400 g',en:'400 g'}, emoji:'🫘', prices:{merc:0.85,carr:0.95,lidl:0.79,dia:0.89,eci:1.30,amz:1.05,sco:1.00}, history:[0.85,0.85,0.85,0.85,0.85,0.85] },
  champis:  { id:'champis', category:'frescos', name:{es:'Champiñones',en:'Mushrooms'}, unit:{es:'250 g',en:'250 g'}, emoji:'🍄', prices:{merc:1.29,carr:1.45,lidl:1.19,dia:1.35,eci:1.90,amz:1.60,sco:1.55}, history:[1.39,1.36,1.34,1.32,1.30,1.29] },
});

const UNIT_SIZE = { leche:[6,'L'], naranjas:[2,'kg'], manzanas:[1,'kg'], aceite:[1,'L'], pan:[0.5,'kg'], detergente:[40,'lav'], huevos:[12,'u'], yogur:[1,'kg'], papel:[12,'rollo'], pasta:[0.5,'kg'], cafe:[1,'kg'], tomate:[1,'kg'], patatas:[2,'kg'], cebolla:[1,'kg'], ajo:[3,'u'], arroz:[1,'kg'], pollo:[1,'kg'], pimiento:[0.5,'kg'], guisantes:[0.4,'kg'], queso:[0.3,'kg'], bacon:[0.2,'kg'], nata:[0.2,'L'], pan_sg:[0.4,'kg'], pasta_sg:[0.5,'kg'], leche_sl:[6,'L'], yogur_sl:[0.5,'kg'], queso_sl:[0.25,'kg'], nata_veg:[0.2,'L'], garbanzos:[0.4,'kg'], champis:[0.25,'kg'] };
const UNIT_LBL = { L:{es:'L',en:'L'}, kg:{es:'kg',en:'kg'}, g:{es:'g',en:'g'}, lav:{es:'lavado',en:'wash'}, u:{es:'ud',en:'ea'}, rollo:{es:'rollo',en:'roll'} };
function unitPrice(id, storeId, lang) {
  const s = UNIT_SIZE[id]; if (!s || !UNIT_LBL[s[1]]) return null;
  return `${eur(CATALOG[id].prices[storeId] / s[0])}/${UNIT_LBL[s[1]][lang]}`;
}

// Out of stock today, per store (drives coverage gaps + split basket).
const MISSING = { merc:[], carr:['guisantes'], lidl:['cafe','nata','bacon','pan_sg'], dia:['queso','pimiento','queso_sl'], eci:[], amz:['pan','pollo','tomate','naranjas','manzanas','pimiento'], sco:['arroz','yogur_sl'] };
const missingAt = (sid, basket) => basket.filter(b => (MISSING[sid] || []).includes(b.id));

function itemCost(b, sid, subs) {
  const p = CATALOG[b.id];
  const base = p.prices[sid] * b.qty;
  const d = subs.includes(b.id) ? 0.12 * base : 0;
  const o = (p.offer && b.qty >= 3) ? base / 3 : 0;
  return base - d - o;
}

// Best two-store split: each item goes to the cheaper store that has it; each store pays its own shipping.
function bestSplit(basket, subs) {
  let best = null;
  for (let i = 0; i < STORES.length; i++) for (let j = i + 1; j < STORES.length; j++) {
    const pair = [STORES[i], STORES[j]];
    const asg = { [pair[0].id]: [], [pair[1].id]: [] };
    let ok = true;
    basket.forEach(b => {
      const c = pair.map(s => (MISSING[s.id] || []).includes(b.id) ? Infinity : itemCost(b, s.id, subs));
      if (c[0] === Infinity && c[1] === Infinity) { ok = false; return; }
      asg[c[0] <= c[1] ? pair[0].id : pair[1].id].push(b);
    });
    if (!ok || !asg[pair[0].id].length || !asg[pair[1].id].length) continue;
    const parts = pair.map(s => {
      const items = asg[s.id].reduce((t, b) => t + itemCost(b, s.id, subs), 0);
      const shipping = items >= s.minFree ? 0 : s.delivery;
      return { id: s.id, lines: asg[s.id], items, shipping, total: items + shipping };
    });
    const total = parts[0].total + parts[1].total;
    if (!best || total < best.total) best = { parts, total };
  }
  return best;
}

const DIETS = {
  gluten:  { es:'Sin gluten',  en:'Gluten-free',   swap:{ pan:'pan_sg', pasta:'pasta_sg' } },
  lactose: { es:'Sin lactosa', en:'Lactose-free',  swap:{ leche:'leche_sl', yogur:'yogur_sl', queso:'queso_sl', nata:'nata_veg' } },
  veg:     { es:'Vegetariano', en:'Vegetarian',    swap:{ pollo:'garbanzos', bacon:'champis' } },
};
const applyDiet = (id, diet) => diet.reduce((cur, d) => (DIETS[d] && DIETS[d].swap[cur]) || cur, id);

const PANTRY_STAPLES = ['aceite', 'ajo', 'cebolla', 'arroz', 'pasta', 'cafe', 'huevos', 'patatas'];

const LOYALTY = [
  { id:'lidl', name:'Lidl Plus' }, { id:'dia', name:'Club Dia' },
  { id:'carr', name:'Club Carrefour' }, { id:'eci', name:'El Corte Inglés' },
];

const ORDERS_SEED = [
  { id:'o-0926', date:{ es:'Sáb 26 sep', en:'Sat 26 Sep' }, store:'dia', total:46.30,
    items:[{id:'leche',qty:3},{id:'pan',qty:2},{id:'huevos',qty:1},{id:'yogur',qty:2},{id:'naranjas',qty:2},{id:'tomate',qty:1},{id:'papel',qty:1},{id:'cafe',qty:1}] },
  { id:'o-0919', date:{ es:'Sáb 19 sep', en:'Sat 19 Sep' }, store:'merc', total:38.75,
    items:[{id:'leche',qty:2},{id:'pan',qty:2},{id:'pasta',qty:2},{id:'tomate',qty:2},{id:'pollo',qty:1},{id:'arroz',qty:1}] },
];

const SLOT_DAYS = [ { id:'d0', es:'Hoy', en:'Today', sub:{es:'jue 1',en:'Thu 1'} }, { id:'d1', es:'Mañana', en:'Tomorrow', sub:{es:'vie 2',en:'Fri 2'} }, { id:'d2', es:'Sábado', en:'Saturday', sub:{es:'sáb 3',en:'Sat 3'} } ];
const SLOT_TIMES = ['10:00–12:00', '12:00–14:00', '18:00–20:00', '20:00–22:00'];
// [dayIdx][timeIdx] → null = full, number = extra fee
const SLOT_GRID = [ [null, null, 1.5, 0], [0, 0, 1.5, 0.9], [0, 0, 0, null] ];

const ORDER_STEPS = [
  { es:'Pedido confirmado', en:'Order confirmed' },
  { es:'Preparando tu cesta', en:'Picking your basket' },
  { es:'En reparto', en:'Out for delivery' },
  { es:'Entregado', en:'Delivered' },
];

// Words the chat matcher recognises per product (catalog-xl adds the rest).
const PRODUCT_KW = {
  leche:['leche','leche entera','milk','whole milk'], naranjas:['naranja','orange'], manzanas:['manzana','apple'],
  aceite:['aceite','aceite de oliva','olive oil'], pan:['pan','barra de pan','barra','bread','loaf'], detergente:['detergente','detergent'],
  huevos:['huevo','huevos','egg','eggs'], yogur:['yogur','yogures','yogurt'], papel:['papel higienico','papel higiénico','papel','toilet paper'],
  pasta:['espagueti','espaguetis','spaghetti','pasta'], cafe:['café','cafe','coffee'], tomate:['tomate','tomato','tomatoes'],
  patatas:['patata','patatas','potato','potatoes'], cebolla:['cebolla','cebollas','onion','onions'], ajo:['ajo','ajos','garlic'],
  arroz:['arroz','rice'], pollo:['pollo','pechuga','pechugas','chicken','chicken breast'], pimiento:['pimiento rojo','pimientos rojos','pimiento','pimientos','red pepper','peppers'],
  guisantes:['guisante','guisantes','peas'], queso:['queso','queso curado','cheese'], bacon:['bacon','beicon','panceta'], nata:['nata','cream'],
  pan_sg:['pan sin gluten','gluten-free bread'], pasta_sg:['pasta sin gluten','gluten-free pasta'], leche_sl:['leche sin lactosa','lactose-free milk'],
  yogur_sl:['yogur sin lactosa'], queso_sl:['queso sin lactosa'], nata_veg:['nata vegetal'], garbanzos:['garbanzos','garbanzos cocidos','chickpeas'], champis:['champiñon','champiñones','champinones','setas','mushrooms'],
};

Object.assign(window, { PRODUCT_KW, L, AppCtx, UNIT_SIZE, unitPrice, MISSING, missingAt, itemCost, bestSplit, DIETS, applyDiet, PANTRY_STAPLES, LOYALTY, ORDERS_SEED, SLOT_DAYS, SLOT_TIMES, SLOT_GRID, ORDER_STEPS });
