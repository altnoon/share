// Extended simulated catalog: ~100 products across 7 stores (each carries 70–98), plus typical Spanish home recipes.
// Prices are generated deterministically from a base price × store price level × small per-item jitter.
(function () {
  const LEVEL = { merc: 1.00, carr: 1.06, lidl: 0.95, dia: 1.02, eci: 1.24, amz: 1.11, sco: 1.15 };
  const GAP = { merc: 0.03, carr: 0.05, lidl: 0.16, dia: 0.12, eci: 0.02, amz: 0.30, sco: 0.12 };
  const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return ((h >>> 0) % 10000) / 10000; };
  const price = (base, id, s) => Math.max(0.29, Math.round(base * LEVEL[s] * (0.95 + 0.1 * hash(id + s)) * 20) / 20 - 0.01);

  Object.assign(CATEGORY_META, {
    carne:    { es: 'Carne y charcutería', en: 'Meat & deli',      dot: 'oklch(0.62 0.15 25)' },
    pescado:  { es: 'Pescado y marisco',   en: 'Fish & seafood',   dot: 'oklch(0.66 0.10 220)' },
    lacteos:  { es: 'Lácteos',             en: 'Dairy',            dot: 'oklch(0.80 0.06 90)' },
    bebidas:  { es: 'Bebidas',             en: 'Drinks',           dot: 'oklch(0.64 0.12 300)' },
    higiene:  { es: 'Higiene',             en: 'Personal care',    dot: 'oklch(0.70 0.08 190)' },
  });
  CATEGORY_META.frescos.es = 'Frescos'; CATEGORY_META.despensa.es = 'Despensa';

  // [id, category, es, en, unit (es|en), emoji, base €, size, sizeUnit, keywords "es…|en…", opts]
  // opts: w = store-brand saving share, t = 6-month change (−0.2 = fell 20%), s = in season
  const ROWS = [
    ['lechuga','frescos','Lechuga romana','Romaine lettuce','2 u|2 ct','🥬',1.19,2,'u','lechuga,lechugas|lettuce'],
    ['pepino','frescos','Pepino','Cucumber','1 u|1 ct','🥒',0.55,1,'u','pepino,pepinos|cucumber'],
    ['zanahoria','frescos','Zanahorias','Carrots','1 kg','🥕',0.99,1,'kg','zanahoria,zanahorias|carrot,carrots'],
    ['calabacin','frescos','Calabacín','Courgette','1 kg','🥒',1.69,1,'kg','calabacin,calabacín,calabacines|courgette,zucchini'],
    ['berenjena','frescos','Berenjena','Aubergine','1 kg','🍆',1.89,1,'kg','berenjena,berenjenas|aubergine,eggplant'],
    ['puerro','frescos','Puerros','Leeks','3 u|3 ct','🥬',1.35,3,'u','puerro,puerros|leek,leeks'],
    ['limon','frescos','Limones','Lemons','1 kg','🍋',1.79,1,'kg','limon,limón,limones|lemon,lemons'],
    ['platano','frescos','Plátano de Canarias','Canary bananas','1 kg','🍌',2.19,1,'kg','platano,plátano,platanos,plátanos|banana,bananas',{t:0.06}],
    ['uvas','frescos','Uvas blancas','White grapes','500 g','🍇',1.95,0.5,'kg','uva,uvas|grape,grapes',{s:{es:'En temporada — vendimia',en:'In season — harvest time'}}],
    ['mandarinas','frescos','Mandarinas','Mandarins','1 kg','🍊',1.89,1,'kg','mandarina,mandarinas|mandarin,mandarins,tangerine',{s:{es:'Empieza la temporada',en:'Season just started'},t:-0.12}],
    ['espinacas','frescos','Espinacas frescas','Fresh spinach','300 g','🥬',1.39,0.3,'kg','espinaca,espinacas|spinach'],
    ['judias','frescos','Judías verdes','Green beans','500 g','🫛',1.75,0.5,'kg','judias verdes,judías verdes,judias,judías|green beans'],
    ['perejil','frescos','Perejil','Parsley','1 manojo|1 bunch','🌿',0.69,1,'u','perejil|parsley'],
    ['aguacate','frescos','Aguacates','Avocados','2 u|2 ct','🥑',2.29,2,'u','aguacate,aguacates|avocado,avocados',{t:0.1}],
    ['pimiento_verde','frescos','Pimientos verdes','Green peppers','500 g','🫑',1.49,0.5,'kg','pimiento verde,pimientos verdes|green pepper,green peppers'],
    ['granada','frescos','Granadas','Pomegranates','1 kg','🍎',2.49,1,'kg','granada,granadas|pomegranate',{s:{es:'Temporada de otoño',en:'Autumn season'}}],
    ['ternera','carne','Carne picada de ternera','Minced beef','500 g','🥩',4.49,0.5,'kg','carne picada,picada,ternera|minced beef,ground beef,beef mince',{w:0.12,t:0.09}],
    ['lomo','carne','Lomo de cerdo','Pork loin','500 g','🥩',3.95,0.5,'kg','lomo,cerdo|pork loin,pork'],
    ['chorizo','carne','Chorizo dulce','Mild chorizo','250 g','🌭',2.35,0.25,'kg','chorizo,chorizos|chorizo',{w:0.15}],
    ['jamon','carne','Jamón serrano lonchas','Sliced serrano ham','200 g','🥓',3.49,0.2,'kg','jamon,jamón,serrano|ham,serrano ham',{w:0.18}],
    ['morcilla','carne','Morcilla de Burgos','Burgos black pudding','300 g','🌭',1.95,0.3,'kg','morcilla|black pudding,blood sausage'],
    ['muslos','carne','Muslos de pollo','Chicken thighs','1 kg','🍗',3.99,1,'kg','muslos,contramuslos,muslo de pollo|chicken thighs'],
    ['costilla','carne','Costilla de cerdo','Pork ribs','1 kg','🍖',5.95,1,'kg','costilla,costillas|ribs,pork ribs'],
    ['salchichas','carne','Salchichas frescas','Fresh sausages','400 g','🌭',2.15,0.4,'kg','salchicha,salchichas|sausage,sausages',{w:0.15}],
    ['pavo','carne','Pechuga de pavo fiambre','Sliced turkey breast','250 g','🦃',2.29,0.25,'kg','pavo,fiambre|turkey',{w:0.16}],
    ['merluza','pescado','Merluza en rodajas','Hake steaks','500 g','🐟',6.45,0.5,'kg','merluza|hake',{t:0.07}],
    ['salmon','pescado','Salmón fresco','Fresh salmon','400 g','🐟',6.95,0.4,'kg','salmon,salmón|salmon',{t:-0.08}],
    ['gambas','pescado','Gambas peladas','Peeled prawns','400 g','🦐',5.45,0.4,'kg','gamba,gambas,langostinos|prawns,shrimp'],
    ['mejillones','pescado','Mejillones de Galicia','Galician mussels','1 kg','🦪',2.95,1,'kg','mejillon,mejillón,mejillones|mussels'],
    ['atun','pescado','Atún claro en aceite','Tuna in oil','3 × 80 g','🐟',3.15,0.24,'kg','atun,atún|tuna',{w:0.2}],
    ['pulpo','pescado','Pulpo cocido','Cooked octopus','400 g','🐙',11.95,0.4,'kg','pulpo|octopus',{t:0.14}],
    ['bacalao','pescado','Bacalao desalado','Desalted cod','400 g','🐟',6.25,0.4,'kg','bacalao|cod,salt cod'],
    ['calamares','pescado','Calamares limpios','Cleaned squid','500 g','🦑',5.75,0.5,'kg','calamar,calamares|squid,calamari'],
    ['mantequilla','lacteos','Mantequilla','Butter','250 g','🧈',2.45,0.25,'kg','mantequilla|butter',{w:0.15,t:0.12}],
    ['queso_fresco','lacteos','Queso fresco de Burgos','Burgos fresh cheese','3 × 72 g','🧀',1.85,0.216,'kg','queso fresco,burgos|fresh cheese'],
    ['queso_rallado','lacteos','Queso rallado','Grated cheese','200 g','🧀',1.79,0.2,'kg','queso rallado,rallado|grated cheese',{w:0.18}],
    ['natillas','lacteos','Natillas de vainilla','Vanilla custard','4 × 125 g','🍮',1.39,0.5,'kg','natillas|custard',{w:0.2}],
    ['leche_semi','lacteos','Leche semidesnatada','Semi-skimmed milk','6 × 1 L','🥛',5.70,6,'L','leche semi,semidesnatada|semi-skimmed,semi skimmed',{w:0.12}],
    ['lentejas','despensa','Lentejas pardinas','Pardina lentils','1 kg','🫘',1.95,1,'kg','lenteja,lentejas|lentils',{w:0.15}],
    ['fabes','despensa','Fabes asturianas','Asturian fabes beans','500 g','🫘',3.95,0.5,'kg','fabes,alubias blancas,alubias|fabes,butter beans,white beans'],
    ['garbanzo_seco','despensa','Garbanzos secos','Dried chickpeas','1 kg','🫘',1.85,1,'kg','garbanzos secos|dried chickpeas',{w:0.15}],
    ['harina','despensa','Harina de trigo','Wheat flour','1 kg','🌾',0.85,1,'kg','harina|flour',{w:0.15}],
    ['azucar','despensa','Azúcar blanco','White sugar','1 kg','🍬',1.15,1,'kg','azucar,azúcar|sugar'],
    ['sal','despensa','Sal fina','Fine salt','1 kg','🧂',0.39,1,'kg','sal|salt'],
    ['pimenton','despensa','Pimentón de la Vera','Smoked paprika','75 g','🌶️',1.65,0.075,'kg','pimenton,pimentón|paprika'],
    ['azafran','despensa','Azafrán en hebra','Saffron threads','0,4 g|0.4 g','🌼',2.95,0.4,'g','azafran,azafrán|saffron',{t:0.05}],
    ['laurel','despensa','Laurel','Bay leaves','10 g','🍃',0.85,1,'u','laurel|bay leaf,bay leaves'],
    ['fideos','despensa','Fideos finos','Fine noodles','500 g','🍜',0.89,0.5,'kg','fideo,fideos|noodles,vermicelli',{w:0.2}],
    ['pan_rallado','despensa','Pan rallado','Breadcrumbs','500 g','🍞',0.99,0.5,'kg','pan rallado|breadcrumbs',{w:0.2}],
    ['tomate_tri','despensa','Tomate triturado','Crushed tomatoes','800 g','🥫',0.99,0.8,'kg','tomate triturado,triturado,tomate frito|crushed tomatoes,tomato sauce',{w:0.2}],
    ['caldo','despensa','Caldo de pollo','Chicken stock','1 L','🥣',1.29,1,'L','caldo|stock,broth',{w:0.18}],
    ['vinagre','despensa','Vinagre de Jerez','Sherry vinegar','500 ml','🍶',1.89,0.5,'L','vinagre|vinegar'],
    ['aceitunas','despensa','Aceitunas manzanilla','Manzanilla olives','350 g','🫒',1.35,0.35,'kg','aceituna,aceitunas,olivas|olives',{w:0.18}],
    ['mayonesa','despensa','Mayonesa','Mayonnaise','450 ml','🥫',1.75,0.45,'L','mayonesa|mayonnaise,mayo',{w:0.2}],
    ['galletas','despensa','Galletas María','Maria biscuits','800 g','🍪',1.65,0.8,'kg','galleta,galletas|biscuits,cookies',{w:0.2}],
    ['cereales','despensa','Copos de avena','Rolled oats','500 g','🥣',1.25,0.5,'kg','avena,cereales,copos|oats,cereal',{w:0.18}],
    ['cacao','despensa','Cacao soluble','Cocoa drink powder','760 g','🍫',4.25,0.76,'kg','cacao,colacao,cola cao|cocoa,hot chocolate',{w:0.25,t:0.18}],
    ['canela','despensa','Canela en rama','Cinnamon sticks','15 g','🪵',1.15,1,'u','canela|cinnamon'],
    ['tofu','despensa','Tofu firme','Firm tofu','400 g','🧊',2.15,0.4,'kg','tofu|tofu'],
    ['harina_sg','despensa','Harina sin gluten','Gluten-free flour','1 kg','🌾',2.95,1,'kg','harina sin gluten|gluten-free flour'],
    ['pan_rallado_sg','despensa','Pan rallado sin gluten','Gluten-free breadcrumbs','250 g','🍞',1.95,0.25,'kg','pan rallado sin gluten|gluten-free breadcrumbs'],
    ['margarina','lacteos','Margarina vegetal','Plant margarine','250 g','🧈',1.45,0.25,'kg','margarina|margarine'],
    ['agua','bebidas','Agua mineral','Mineral water','6 × 1,5 L|6 × 1.5 L','💧',1.59,9,'L','agua|water',{w:0.25}],
    ['cerveza','bebidas','Cerveza lager','Lager beer','12 latas|12 cans','🍺',5.95,12,'u','cerveza,cervezas,birra|beer,beers',{w:0.25}],
    ['vino','bebidas','Vino tinto Rioja crianza','Rioja crianza red wine','75 cl','🍷',4.95,0.75,'L','vino,tinto,rioja|wine,red wine'],
    ['zumo','bebidas','Zumo de naranja','Orange juice','1 L','🧃',1.55,1,'L','zumo|juice,orange juice',{w:0.2}],
    ['cola','bebidas','Refresco de cola','Cola soft drink','2 L','🥤',1.65,2,'L','cola,refresco,coca cola|cola,soda,soft drink',{w:0.3}],
    ['lavavajillas','limpieza','Lavavajillas a mano','Dish soap','750 ml','🧽',1.45,0.75,'L','lavavajillas,fairy,jabon de platos|dish soap,washing up liquid',{w:0.25}],
    ['suavizante','limpieza','Suavizante','Fabric softener','60 lavados|60 washes','🫧',2.95,60,'lav','suavizante|fabric softener,softener',{w:0.25}],
    ['lejia','limpieza','Lejía','Bleach','2 L','🧴',0.99,2,'L','lejia,lejía|bleach'],
    ['friegasuelos','limpieza','Friegasuelos','Floor cleaner','1,5 L|1.5 L','🧴',1.75,1.5,'L','friegasuelos|floor cleaner',{w:0.25}],
    ['bolsas','limpieza','Bolsas de basura','Bin bags','30 u|30 ct','🗑️',1.35,30,'u','bolsas de basura,bolsas|bin bags,trash bags'],
    ['servilletas','limpieza','Servilletas de papel','Paper napkins','100 u|100 ct','🧻',1.05,100,'u','servilleta,servilletas|napkins'],
    ['champu','higiene','Champú','Shampoo','400 ml','🧴',2.25,0.4,'L','champu,champú|shampoo',{w:0.3}],
    ['gel','higiene','Gel de ducha','Shower gel','750 ml','🧴',1.95,0.75,'L','gel|shower gel,body wash',{w:0.3}],
    ['dentifrico','higiene','Pasta de dientes','Toothpaste','75 ml','🪥',1.85,0.075,'L','pasta de dientes,dentifrico,dentífrico|toothpaste',{w:0.3}],
  ];

  ROWS.forEach(([id, category, es, en, unit, emoji, base, size, su, kw, o = {}]) => {
    const [ue, un] = unit.split('|');
    const prices = {}; STORES.forEach(s => { prices[s.id] = price(base, id, s.id); });
    const t = o.t !== undefined ? o.t : (hash(id + 't') - 0.5) * 0.08;
    const history = [0, 1, 2, 3, 4, 5].map(i => Math.round(prices.merc / (1 + t) * (1 + t * i / 5) * 100) / 100);
    const p = { id, category, name: { es, en }, unit: { es: ue, en: un || ue }, emoji, prices, history };
    if (o.w) p.whiteLabel = { name: { es: `${es} · marca blanca`, en: `${en} · store brand` }, save: Math.round(prices.merc * o.w * 100) / 100 };
    if (o.s) { p.seasonal = o.s; p.tag = { es: 'Temporada', en: 'In season' }; }
    if (t > 0.08) { p.trend = 'up'; p.tag = p.tag || { es: `↑ ${Math.round(t * 100)}% 6 m`, en: `↑ ${Math.round(t * 100)}% 6 mo` }; }
    if (t < -0.08) { p.trend = 'down'; p.tag = p.tag || { es: `↓ ${Math.round(-t * 100)}% 6 m`, en: `↓ ${Math.round(-t * 100)}% 6 mo` }; }
    CATALOG[id] = p;
    UNIT_SIZE[id] = [size, su];
    const [kes, ken] = kw.split('|');
    PRODUCT_KW[id] = [...kes.split(','), ...(ken ? ken.split(',') : [])];
    STORES.forEach(s => { if (hash(id + s.id + 'gap') < GAP[s.id]) MISSING[s.id].push(id); });
  });
  // Every store gets a real coverage figure from what it actually carries.
  const total = Object.keys(CATALOG).length;
  STORES.forEach(s => { s.coverage = Math.round((total - MISSING[s.id].length) / total * 100) / 100; s.carries = total - MISSING[s.id].length; });

  Object.assign(DIETS.veg.swap, { ternera:'tofu', lomo:'tofu', chorizo:'champis', jamon:'champis', morcilla:'champis', muslos:'garbanzos', costilla:'tofu', salchichas:'tofu', pavo:'queso_fresco', merluza:'tofu', salmon:'tofu', gambas:'champis', mejillones:'champis', atun:'garbanzos', pulpo:'champis', bacalao:'tofu', calamares:'champis' });
  Object.assign(DIETS.gluten.swap, { harina:'harina_sg', pan_rallado:'pan_rallado_sg', fideos:'pasta_sg' });
  Object.assign(DIETS.lactose.swap, { mantequilla:'margarina', queso_rallado:'queso_sl', queso_fresco:'queso_sl', natillas:'yogur_sl', leche_semi:'leche_sl' });

  // Typical Spanish home recipes. per = catalog units per serving.
  const R = (id, emoji, serves, time, es, en, des, den, keywords, ingredients, region) => ({ id, emoji, serves, time: { es: time, en: time }, name: { es, en }, desc: { es: des, en: den }, keywords, ingredients: ingredients.map(([i, per]) => ({ id: i, per })), region });
  Object.assign(RECIPES, {
    gazpacho: R('gazpacho','🍅',4,'15 min','Gazpacho andaluz','Andalusian gazpacho','Frío, de tomate maduro, pepino y pimiento.','Chilled, ripe tomato, cucumber and pepper.',['gazpacho'],[['tomate',0.4],['pepino',0.25],['pimiento_verde',0.25],['ajo',0.1],['pan',0.1],['vinagre',0.05],['aceite',0.05],['sal',0.01]],'Andalucía'),
    salmorejo: R('salmorejo','🥣',4,'15 min','Salmorejo cordobés','Córdoba salmorejo','Tomate y pan, espeso, con huevo y jamón por encima.','Thick tomato and bread soup topped with egg and ham.',['salmorejo'],[['tomate',0.4],['pan',0.25],['ajo',0.1],['aceite',0.08],['huevos',0.1],['jamon',0.25]],'Andalucía'),
    lentejas: R('lentejas','🫘',4,'45 min','Lentejas con chorizo','Lentils with chorizo','El plato de cuchara de toda la vida.','The classic Spanish spoon dish.',['lentejas con chorizo','lentejas de la abuela','lentil stew'],[['lentejas',0.1],['chorizo',0.25],['zanahoria',0.1],['patatas',0.1],['cebolla',0.1],['pimenton',0.05],['laurel',0.25],['aceite',0.03]]),
    cocido: R('cocido','🍲',6,'2 h 30 min','Cocido madrileño','Madrid stew','Garbanzos, carnes y verduras en tres vuelcos.','Chickpeas, meats and veg served in three courses.',['cocido','cocido madrileño','madrid stew'],[['garbanzo_seco',0.08],['muslos',0.15],['chorizo',0.2],['morcilla',0.17],['zanahoria',0.1],['patatas',0.12],['fideos',0.1],['puerro',0.15]],'Madrid'),
    fabada: R('fabada','🫘',4,'2 h','Fabada asturiana','Asturian fabada','Fabes, chorizo, morcilla y lacón a fuego lento.','Fabes beans, chorizo and black pudding, slow-cooked.',['fabada','fabada asturiana'],[['fabes',0.25],['chorizo',0.25],['morcilla',0.25],['costilla',0.1],['azafran',0.25],['laurel',0.25]],'Asturias'),
    pisto: R('pisto','🍆',4,'40 min','Pisto manchego','Manchego pisto','Verduras de huerta pochadas con tomate y huevo.','Slow-cooked garden veg with tomato and egg.',['pisto','pisto manchego','ratatouille'],[['calabacin',0.15],['berenjena',0.12],['pimiento',0.25],['pimiento_verde',0.25],['cebolla',0.12],['tomate_tri',0.3],['huevos',0.1],['aceite',0.05]],'Castilla-La Mancha'),
    croquetas: R('croquetas','🧆',4,'1 h 15 min','Croquetas de jamón','Ham croquettes','Bechamel cremosa y rebozado crujiente.','Creamy béchamel, crunchy coating.',['croquetas','croquetas de jamon','croquetas de jamón','croquettes'],[['jamon',0.3],['leche',0.03],['harina',0.05],['mantequilla',0.15],['huevos',0.1],['pan_rallado',0.15],['aceite',0.08]]),
    albondigas: R('albondigas','🍝',4,'50 min','Albóndigas en salsa','Meatballs in sauce','Las de la abuela, con salsa de tomate.','Grandma-style, in tomato sauce.',['albondigas','albóndigas','meatballs'],[['ternera',0.25],['huevos',0.1],['pan_rallado',0.06],['ajo',0.1],['perejil',0.25],['tomate_tri',0.3],['cebolla',0.1],['harina',0.03]]),
    bravas: R('bravas','🥔',4,'35 min','Patatas bravas','Patatas bravas','Patata frita con salsa brava y alioli.','Fried potatoes with spicy sauce and aioli.',['bravas','patatas bravas'],[['patatas',0.25],['pimenton',0.1],['tomate_tri',0.15],['harina',0.02],['mayonesa',0.12],['ajo',0.1],['aceite',0.12]]),
    pollo_ajillo: R('pollo_ajillo','🍗',4,'40 min','Pollo al ajillo','Garlic chicken','Muslos dorados con mucho ajo y un chorro de vino.','Browned thighs with lots of garlic and a splash of wine.',['pollo al ajillo','ajillo','garlic chicken'],[['muslos',0.3],['ajo',0.3],['vino',0.1],['laurel',0.25],['perejil',0.25],['aceite',0.06]]),
    merluza_verde: R('merluza_verde','🐟',4,'30 min','Merluza en salsa verde','Hake in green sauce','Con almejas, perejil y un buen pil-pil.','With parsley and a silky pil-pil.',['merluza en salsa verde','salsa verde','hake in green sauce'],[['merluza',0.5],['ajo',0.1],['perejil',0.25],['harina',0.02],['caldo',0.15],['guisantes',0.25],['aceite',0.05]],'País Vasco'),
    gambas_ajillo: R('gambas_ajillo','🦐',4,'15 min','Gambas al ajillo','Garlic prawns','Cazuela de barro, guindilla y pan para mojar.','Clay dish, chilli and bread for dipping.',['gambas al ajillo','garlic prawns'],[['gambas',0.25],['ajo',0.25],['aceite',0.08],['perejil',0.2],['pan',0.25]]),
    pulpo: R('pulpo','🐙',4,'20 min','Pulpo a la gallega','Galician octopus','Sobre cachelos, con pimentón y aceite.','On boiled potatoes, with paprika and olive oil.',['pulpo a la gallega','pulpo a feira','galician octopus'],[['pulpo',0.5],['patatas',0.15],['pimenton',0.05],['sal',0.01],['aceite',0.05]],'Galicia'),
    fideua: R('fideua','🥘',4,'40 min','Fideuà','Fideuà','Como la paella pero con fideos. Con alioli.','Like paella but with noodles. Served with aioli.',['fideua','fideuà'],[['fideos',0.2],['gambas',0.25],['calamares',0.2],['tomate_tri',0.1],['caldo',0.3],['azafran',0.25],['ajo',0.1],['aceite',0.06]],'Comunidad Valenciana'),
    migas: R('migas','🍳',4,'40 min','Migas extremeñas','Extremaduran migas','Pan del día anterior, chorizo, panceta y uvas.','Day-old bread, chorizo, bacon and grapes.',['migas'],[['pan',0.5],['chorizo',0.2],['bacon',0.3],['ajo',0.15],['pimenton',0.05],['uvas',0.25],['aceite',0.08]],'Extremadura'),
    ensaladilla: R('ensaladilla','🥗',6,'40 min','Ensaladilla rusa','Russian salad','La tapa de los bares: patata, atún y mayonesa.','The bar classic: potato, tuna and mayo.',['ensaladilla','ensaladilla rusa','russian salad'],[['patatas',0.15],['zanahoria',0.08],['guisantes',0.15],['atun',0.2],['huevos',0.17],['mayonesa',0.12],['aceitunas',0.1]]),
    huevos_rotos: R('huevos_rotos','🍳',2,'25 min','Huevos rotos con jamón','Broken eggs with ham','Patatas fritas, huevo de yema líquida y jamón.','Fried potatoes, runny eggs and ham.',['huevos rotos','huevos estrellados'],[['patatas',0.3],['huevos',0.17],['jamon',0.5],['aceite',0.1]]),
    marmitako: R('marmitako','🍲',4,'45 min','Marmitako de atún','Tuna marmitako','Guiso marinero de atún con patata.','Fishermen\'s stew of tuna and potato.',['marmitako'],[['atun',0.4],['patatas',0.2],['pimiento_verde',0.25],['cebolla',0.1],['tomate_tri',0.15],['pimenton',0.05],['caldo',0.25]],'País Vasco'),
    espinacas_garbanzos: R('espinacas_garbanzos','🥬',4,'25 min','Espinacas con garbanzos','Spinach with chickpeas','Tapa sevillana, con comino y pan frito.','Seville tapa with cumin and fried bread.',['espinacas con garbanzos','spinach and chickpeas'],[['espinacas',0.5],['garbanzos',0.5],['ajo',0.1],['pan',0.1],['pimenton',0.05],['vinagre',0.03],['aceite',0.05]],'Andalucía'),
    sopa_ajo: R('sopa_ajo','🥣',4,'25 min','Sopa castellana','Castilian garlic soup','Ajo, pan, pimentón y huevo. Reconfortante.','Garlic, bread, paprika and egg. Pure comfort.',['sopa de ajo','sopa castellana','garlic soup'],[['ajo',0.15],['pan',0.25],['jamon',0.2],['pimenton',0.05],['huevos',0.1],['caldo',0.3],['aceite',0.04]],'Castilla y León'),
    arroz_leche: R('arroz_leche','🍚',6,'50 min','Arroz con leche','Rice pudding','Postre asturiano con canela y limón.','Asturian dessert with cinnamon and lemon.',['arroz con leche','rice pudding'],[['arroz',0.04],['leche',0.03],['azucar',0.03],['canela',0.17],['limon',0.03]],'Asturias'),
    torrijas: R('torrijas','🍞',6,'30 min','Torrijas','Torrijas','Pan empapado en leche, frito y con canela.','Bread soaked in milk, fried, with cinnamon.',['torrijas'],[['pan',0.17],['leche',0.03],['huevos',0.08],['azucar',0.03],['canela',0.17],['aceite',0.06]]),
    lomo_pimientos: R('lomo_pimientos','🥩',4,'25 min','Lomo con pimientos','Pork loin with peppers','Cena rápida de diario.','Quick weeknight dinner.',['lomo con pimientos','pork loin with peppers'],[['lomo',0.25],['pimiento_verde',0.25],['pimiento',0.25],['ajo',0.1],['aceite',0.04]]),
    salmon_plancha: R('salmon_plancha','🐟',2,'20 min','Salmón a la plancha con verduras','Grilled salmon with veg','Ligero y en 20 minutos.','Light and ready in 20 minutes.',['salmón a la plancha','salmon a la plancha','grilled salmon'],[['salmon',0.5],['calabacin',0.2],['zanahoria',0.15],['limon',0.1],['aceite',0.04]]),
  });

})();

// Product matcher: whole-word, accent-tolerant, longest phrase first, quantities read right before each product.
const PRODUCT_NUM = { un: 1, una: 1, uno: 1, dos: 2, 'un par de': 2, par: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10, docena: 1, a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, couple: 2 };
const deaccent = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
function matchCatalogProducts(text) {
  let t = ' ' + deaccent(text).replace(/[.,;:!¡¿?()]/g, ' ') + ' ';
  const pairs = [];
  Object.entries(PRODUCT_KW).forEach(([id, ks]) => ks.forEach(k => pairs.push([id, deaccent(k)])));
  pairs.sort((a, b) => b[1].length - a[1].length);
  const found = [];
  const numRe = '(\\d+|un par de|un|una|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|a couple of|one|two|three|four|five|six)';
  const unitRe = '(?:\\s*(kg|kilos?|g|gramos?|l|litros?|u|ud|uds|unidades|paquetes?|latas?|botellas?|bolsas?|botes?|cajas?|x|packs?|bricks?)\\b)?\\s*(?:de\\s+|of\\s+)?';
  pairs.forEach(([id, k]) => {
    if (!CATALOG[id]) return;
    const kre = k.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const re = new RegExp(`(?:${numRe}${unitRe})?(?<![a-zñ])${kre}(?:s|es)?(?![a-zñ])`);
    const m = t.match(re);
    if (!m) return;
    t = t.slice(0, m.index) + ' '.repeat(m[0].length) + t.slice(m.index + m[0].length);
    if (found.some(f => f.id === id)) return;
    const n = m[1] ? (/^\d+$/.test(m[1]) ? +m[1] : (PRODUCT_NUM[m[1].replace('a couple of', 'couple')] || 1)) : 1;
    // "3 litros de leche" or "6 huevos" means units inside one pack, not 3 or 6 packs.
    const sz = UNIT_SIZE[id];
    const q = sz && sz[0] > 1 && n <= sz[0] && ((m[2] && /^(kg|kilos?|g|gramos?|l|litros?|u|ud|uds|unidades)$/.test(m[2])) || (sz[1] === 'u' && sz[0] >= 6)) ? Math.ceil(n / sz[0]) : n;
    found.push({ id, qty: Math.min(Math.max(q, 1), 10) });
  });
  return found;
}

Object.assign(window, { matchCatalogProducts, deaccent });
