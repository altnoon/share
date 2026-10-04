// Conversational concierge — Block A + diálogo de calificación + memoria.
function ChatPane({ lang, messages, onUserSend, onQuickReply, entryMode, onAddFromForm, onStartScenario, started, pref, memory }) {
  const scrollRef = useRef(null);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages.length]);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: 'var(--bg-panel)',
      borderRight: '1px solid var(--line)',
      minWidth: 0,
    }}>
      {/* Header */}
      <div style={{ padding: '14px 20px 12px', borderBottom: '1px solid var(--line-2)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap: 10 }}>
          <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
            <ConciergeAvatar/>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, letterSpacing:'-0.01em' }}>{tr('ai', lang)}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', display:'flex', alignItems:'center', gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius:'50%', background:'var(--sage)', display:'inline-block' }}/>
                {lang === 'es' ? 'Listo — 7 supers conectados' : 'Ready — 7 stores connected'}
              </div>
            </div>
          </div>
          {pref && (
            <Pill tone="accent" size="sm">
              <Icon name="sparkle" size={10}/>
              {tr('pref' + pref[0].toUpperCase() + pref.slice(1), lang)}
            </Pill>
          )}
        </div>
      </div>

      {/* Scroll area */}
      <div ref={scrollRef} style={{
        flex: 1, overflowY: 'auto', padding: '18px 20px 12px',
        display: 'flex', flexDirection: 'column', gap: 14,
      }}>
        {!started && <WeeklyCard/>}
        {!started && <EmptyState lang={lang} onStart={onStartScenario} onUserSend={onUserSend}/>}
        {messages.map((m, i) => <Message key={i} msg={m} lang={lang} onQuickReply={onQuickReply}/>)}

        {memory && memory.length > 0 && (
          <MemoryCard lang={lang} memory={memory}/>
        )}
      </div>

      {/* Input */}
      <div data-fly-source="1" style={{ padding: '12px 16px 14px', borderTop: '1px solid var(--line-2)', background:'var(--bg-panel)' }}>
        {entryMode !== 'form' && <QuickTools/>}
        {entryMode === 'form'
          ? <FormEntry lang={lang} onAdd={onAddFromForm}/>
          : <ChatInput lang={lang} draft={draft} setDraft={setDraft} onSend={(t) => { onUserSend(t); setDraft(''); }}/>
        }
      </div>
    </div>
  );
}

function ConciergeAvatar() {
  return (
    <div style={{
      width: 30, height: 30, borderRadius: 8,
      background: 'linear-gradient(135deg, var(--accent-soft) 0%, var(--accent-soft) 100%)',
      border: '1px solid var(--accent-line)',
      display:'flex', alignItems:'center', justifyContent:'center',
      color: 'var(--accent-ink)',
    }}>
      <Icon name="sparkle" size={14}/>
    </div>
  );
}

function EmptyState({ lang, onStart, onUserSend }) {
  const dishes = ['paella', 'tortilla', 'lentejas', 'gazpacho', 'croquetas'];
  return (
    <div style={{
      border: '1px dashed var(--line)', borderRadius: 12,
      padding: '22px 20px', background: 'var(--bg-sunk)',
      display:'flex', flexDirection:'column', gap: 12,
    }}>
      <div className="serif" style={{ fontSize: 26, lineHeight: 1.1, letterSpacing: '-0.015em' }}>
        {lang === 'es'
          ? <>Dime un plato.<br/><span style={{ fontStyle:'italic', color:'var(--ink-3)' }}>Te digo dónde sale más barato.</span></>
          : <>Name a dish.<br/><span style={{ fontStyle:'italic', color:'var(--ink-3)' }}>I'll tell you where it's cheapest.</span></>}
      </div>
      <div style={{ fontSize: 13, color: 'var(--ink-2)', maxWidth: 380 }}>
        {lang === 'es'
          ? 'Dicta productos sueltos ("3 l de leche") o pídeme un plato entero — saco los ingredientes y los añado.'
          : 'Dictate loose items ("3 L milk") or ask for a whole dish — I pull the ingredients and add them.'}
      </div>
      {onUserSend && (
        <div style={{ display:'flex', flexDirection:'column', gap: 7 }}>
          <div style={{ fontSize: 11, color:'var(--ink-3)', textTransform:'uppercase', letterSpacing:'0.07em' }}>
            {lang === 'es' ? 'Prueba un plato' : 'Try a dish'}
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap: 6 }}>
            {dishes.map(d => {
              const r = RECIPES[d];
              return (
                <button key={d} onClick={() => onUserSend(r.name[lang])} style={{
                  display:'inline-flex', alignItems:'center', gap: 6,
                  padding: '6px 11px 6px 8px', borderRadius: 999,
                  background:'var(--bg-panel)', border:'1px solid var(--line)',
                  fontSize: 12, color:'var(--ink)', fontWeight: 500,
                }}>
                  <span style={{ fontSize: 14 }}>{r.emoji}</span>
                  {r.name[lang]}
                </button>
              );
            })}
          </div>
          <AllRecipesLink/>
        </div>
      )}
      <button onClick={onStart} style={{
        alignSelf:'flex-start', marginTop: 2,
        padding: '7px 12px', borderRadius: 8,
        background: 'var(--ink)', color: 'var(--bg)',
        fontSize: 12, fontWeight: 500,
        display:'inline-flex', alignItems:'center', gap: 6,
      }}>
        <Icon name="sparkle" size={11}/>
        {tr('startScenario', lang)}
      </button>
    </div>
  );
}

function Message({ msg, lang, onQuickReply }) {
  if (msg.type === 'user') return <UserBubble text={msg.text[lang]} queued={msg.queued} lang={lang}/>;
  if (msg.type === 'parsing') return <Parsing lang={lang}/>;
  if (msg.type === 'ai-parsed') return <ParsedItems items={msg.items} guess={msg.guess} lang={lang}/>;
  if (msg.type === 'ai-context') return <ContextNote productId={msg.productId} text={msg.text[lang]} lang={lang}/>;
  if (msg.type === 'ai-qualify') return <QualifyPrompt msg={msg} lang={lang} onReply={onQuickReply}/>;
  if (msg.type === 'ai-preference') return <PreferencePrompt msg={msg} lang={lang} onReply={onQuickReply}/>;
  if (msg.type === 'ai-subs') return <SubsNote items={msg.items} lang={lang}/>;
  if (msg.type === 'ai-summary') return <SummaryNote lang={lang}/>;
  if (msg.type === 'ai-next') return <NextStepCard msg={msg}/>;
  if (msg.type === 'ai-recipe') return <RecipeCard recipeId={msg.recipeId} initialServings={msg.servings} src={msg.src} lang={lang} onReply={onQuickReply}/>;
  return null;
}

function UserBubble({ text, queued, lang }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap: 4, opacity: queued ? 0.6 : 1 }}>
      <div style={{
        maxWidth: '78%',
        background: 'var(--ink)', color: 'var(--bg)',
        padding: '8px 12px', borderRadius: '14px 14px 3px 14px',
        fontSize: 13, lineHeight: 1.45,
      }}>{text}</div>
      {queued && <div style={{ fontSize: 11, color:'var(--ink-3)' }}>{L(lang, 'En cola · se envía al volver la conexión', 'Queued · sends when you’re back online')}</div>}
    </div>
  );
}

function AIBubble({ children, tone = 'default' }) {
  return (
    <div style={{ display:'flex', gap: 8, alignItems:'flex-start' }}>
      <ConciergeAvatar/>
      <div style={{
        flex: 1, minWidth: 0, background: tone === 'accent' ? 'var(--accent-soft)' : 'var(--bg-sunk)',
        border: `1px solid ${tone === 'accent' ? 'var(--accent-line)' : 'var(--line-2)'}`,
        padding: '10px 12px', borderRadius: '3px 14px 14px 14px',
        fontSize: 13, lineHeight: 1.5, color: 'var(--ink)',
      }}>{children}</div>
    </div>
  );
}

function Parsing({ lang }) {
  return (
    <AIBubble>
      <div style={{ display:'flex', alignItems:'center', gap: 8, color: 'var(--ink-2)' }}>
        <ThinkingSteps/>
      </div>
    </AIBubble>
  );
}

function DotsLoader() {
  return (
    <div style={{ display:'inline-flex', gap: 3 }}>
      {[0,1,2].map(i => (
        <span key={i} style={{
          width: 5, height: 5, borderRadius: '50%', background:'var(--ink-3)',
          animation: `dot 1s ${i*0.15}s infinite ease-in-out`,
        }}/>
      ))}
      <style>{`@keyframes dot { 0%,80%,100% { transform:scale(0.6); opacity:0.4 } 40% { transform:scale(1); opacity:1 } }`}</style>
    </div>
  );
}

function ParsedItems({ items, guess, lang }) {
  const ctx = React.useContext(AppCtx);
  const [picked, setPicked] = useState({});
  const pending = (guess || []).filter(g => !picked[g]);
  return (
    <AIBubble>
      <div style={{ fontWeight: 500, marginBottom: 6 }}>{tr('parsedAdded', lang)}</div>
      <div style={{ display:'flex', flexWrap:'wrap', gap: 6 }}>
        {items.map((orig, ix) => {
          const id = picked[orig] || orig;
          const p = CATALOG[id];
          const unsure = pending.includes(orig);
          return (
            <div key={orig} style={{
              display:'inline-flex', alignItems:'center', gap: 6,
              padding: '4px 9px 4px 6px', borderRadius: 999,
              background: unsure ? 'var(--warn-soft)' : 'var(--bg-panel)', border: unsure ? '1px dashed var(--warn-line)' : '1px solid var(--line)',
              fontSize: 12, animation: `popIn 300ms ${ix * 110}ms both`,
            }}>
              <PThumb id={p.id} size={22} radius={5}/>
              <span style={{ fontWeight: 500 }}>{p.name[lang]}</span>
              {unsure ? <span style={{ color:'var(--warn-ink)', fontWeight: 600 }} title={L(lang,'Por confirmar','To confirm')}>?</span>
                      : <span style={{ color:'var(--ink-3)', fontSize: 12 }} className="mono">{p.unit[lang]}</span>}
            </div>
          );
        })}
      </div>
      {pending.map(g => (
        <GuessPicker key={g} id={g} onPick={(to) => { ctx.actions.swapItem(g, to, true); setPicked(s => ({ ...s, [g]: to })); }}/>
      ))}
      <style>{`@keyframes popIn { from { transform: translateY(4px) scale(0.96); opacity:0 } to { transform: none; opacity: 1 } }`}</style>
    </AIBubble>
  );
}

function ContextNote({ productId, text, lang }) {
  const p = CATALOG[productId];
  return (
    <AIBubble>
      <div style={{ display:'flex', alignItems:'flex-start', gap: 8 }}>
        <div style={{
          fontSize: 22, lineHeight: 1, flexShrink: 0,
          padding: '2px 6px', borderRadius: 6, background:'var(--bg-panel)',
          border:'1px solid var(--line-2)',
        }}>{p.emoji}</div>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap: 6, marginBottom: 4 }}>
            {p.seasonal && <Pill tone="sage" size="sm"><Icon name="leaf" size={9}/>{tr('seasonNow', lang)}</Pill>}
            {p.trend === 'down' && <Pill tone="accent" size="sm"><Icon name="down" size={9}/>{p.tag[lang]}</Pill>}
            {p.tag && p.trend !== 'down' && !p.seasonal && <Pill tone="default" size="sm">{p.tag[lang]}</Pill>}
          </div>
          <div style={{ color:'var(--ink)' }}>{text}</div>
        </div>
      </div>
    </AIBubble>
  );
}

function QualifyPrompt({ msg, lang, onReply }) {
  return (
    <AIBubble tone="accent">
      <div style={{ marginBottom: 8, fontWeight: 500 }}>{msg.q[lang]}</div>
      <div style={{ display:'flex', gap: 6 }}>
        <button onClick={() => onReply({ kind:'qualify', choice:'yes', productId: msg.productId })}
          style={btnSolid}>{msg.yes[lang]}</button>
        <button onClick={() => onReply({ kind:'qualify', choice:'no', productId: msg.productId })}
          style={btnGhost}>{msg.no[lang]}</button>
      </div>
    </AIBubble>
  );
}

function PreferencePrompt({ msg, lang, onReply }) {
  return (
    <AIBubble tone="accent">
      <div style={{ marginBottom: 8, fontWeight: 500 }}>{msg.q[lang]}</div>
      <div style={{ display:'flex', gap: 6, flexWrap:'wrap' }}>
        {msg.options.map(o => (
          <button key={o.key} onClick={() => onReply({ kind:'pref', value: o.key, label: o[lang] })}
            style={btnGhost}>{o[lang]}</button>
        ))}
      </div>
    </AIBubble>
  );
}

function SubsNote({ items, lang }) {
  return (
    <AIBubble>
      <div style={{ display:'flex', alignItems:'center', gap: 6, marginBottom: 6 }}>
        <Icon name="sparkle" size={12}/>
        <span style={{ fontWeight: 500 }}>
          {lang === 'es' ? 'He encontrado alternativas de marca blanca' : 'Found store-brand alternatives'}
        </span>
      </div>
      <div style={{ color:'var(--ink-2)', fontSize: 13 }}>
        {lang === 'es'
          ? <>Mira el panel de <b style={{ color:'var(--ink)' }}>Optimización</b> a la derecha — puedes aplicarlas todas o una a una.</>
          : <>Check the <b style={{ color:'var(--ink)' }}>Optimize</b> panel on the right — apply them all or pick and choose.</>}
      </div>
    </AIBubble>
  );
}

function SummaryNote({ lang }) {
  return (
    <AIBubble>
      <div style={{ fontWeight: 500, marginBottom: 4 }}>
        {lang === 'es' ? 'Tu cesta está lista' : 'Your basket is ready'}
      </div>
      <div style={{ color:'var(--ink-2)' }}>
        {lang === 'es'
          ? 'He comparado 7 supers en tu CP. Revisa el ganador a la derecha y pulsa revisar para abrir el carrito directamente.'
          : 'Compared 7 stores in your postal code. Review the winner on the right and tap checkout to open the cart directly.'}
      </div>
    </AIBubble>
  );
}

function RecipeCard({ recipeId, initialServings, src, lang, onReply }) {
  const recipe = RECIPES[recipeId];
  const [servings, setServings] = useState(initialServings || recipe.serves);
  const [added, setAdded] = useState(false);
  const ctx = React.useContext(AppCtx);
  const diet = ctx.diet || [];
  const items = recipe.ingredients.map(ing => {
    const id = applyDiet(ing.id, diet);
    const swapDiet = id !== ing.id ? diet.find(d => DIETS[d].swap[ing.id] === id || Object.values(DIETS[d].swap).includes(id)) : null;
    return { id, swapDiet, qty: Math.max(1, Math.ceil(ing.per * servings)) };
  });
  const [skip, setSkip] = useState(() => items.filter(i => (ctx.pantry || []).includes(i.id)).map(i => i.id));
  const buy = items.filter(i => !skip.includes(i.id));
  const estCost = buy.reduce((sum, it) => {
    const p = CATALOG[it.id];
    const cheapest = Math.min(...Object.values(p.prices));
    return sum + cheapest * it.qty;
  }, 0);

  const add = () => {
    if (added || !buy.length) return;
    onReply({ kind: 'recipe', recipeId, servings, items: buy.map(({ id, qty }) => ({ id, qty })) });
    setAdded(true);
  };

  return (
    <div style={{ display:'flex', gap: 8, alignItems:'flex-start' }}>
      <ConciergeAvatar/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <IntentLine recipe={recipe} servings={servings} src={servings === initialServings ? src : 'explicit'} items={items} skip={skip}/>

        <div style={{
          border:'1px solid var(--line)', borderRadius: 12, overflow:'hidden',
          background:'var(--bg-panel)',
        }}>
          {/* Header */}
          <div style={{
            display:'flex', alignItems:'center', gap: 12,
            padding: '12px 14px', borderBottom:'1px solid var(--line-2)',
            background:'var(--bg-sunk)',
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12, flexShrink: 0,
              background:'var(--bg-panel)', border:'1px solid var(--line-2)',
              display:'flex', alignItems:'center', justifyContent:'center', fontSize: 22,
            }}>{recipe.emoji}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 14, letterSpacing:'-0.01em' }}>{recipe.name[lang]}</div>
              <div style={{ fontSize: 12, color:'var(--ink-3)', marginTop: 1 }}>
                {recipe.time[lang]} · {items.length} {tr('ingredientsN', lang)}
              </div>
            </div>
          </div>


          {/* Servings stepper */}
          <div style={{
            display:'flex', alignItems:'center', justifyContent:'space-between',
            padding: '10px 14px', borderBottom:'1px solid var(--line-2)',
          }}>
            <span style={{ fontSize: 13, color:'var(--ink-2)' }}>{tr('servings', lang)}</span>
            <div style={{
              display:'inline-flex', alignItems:'center',
              border:'1px solid var(--line)', borderRadius: 8, background:'var(--bg-panel)',
            }}>
              <button onClick={() => setServings(s => Math.max(1, s - 1))} disabled={added}
                style={recipeStepBtn}>−</button>
              <span className="mono" style={{ minWidth: 28, textAlign:'center', fontSize: 13, fontWeight: 500 }}>{servings}</span>
              <button onClick={() => setServings(s => Math.min(12, s + 1))} disabled={added}
                style={recipeStepBtn}>+</button>
            </div>
          </div>

          {/* Ingredients */}
          <div style={{ padding: '6px 8px', display:'flex', flexDirection:'column', gap: 0 }}>
            {items.map(it => {
              const p = CATALOG[it.id];
              const home = skip.includes(it.id);
              return (
                <button key={it.id} disabled={added} aria-pressed={!home}
                  onClick={() => { setSkip(s => home ? s.filter(x => x !== it.id) : [...s, it.id]); if (PANTRY_STAPLES.includes(it.id) && (ctx.pantry || []).includes(it.id) === home) ctx.togglePantry(it.id); }}
                  title={home ? L(lang,'Lo tengo en casa · toca para añadirlo','At home · tap to add') : L(lang,'Toca si ya lo tienes','Tap if you already have it')}
                  style={{ display:'flex', alignItems:'center', gap: 9, fontSize: 13, minHeight: 36, padding:'4px 6px', borderRadius: 8, textAlign:'left', width:'100%', color: home ? 'var(--ink-3)' : 'var(--ink)', cursor: added ? 'default' : 'pointer' }}>
                  <span aria-hidden="true" style={{ width: 28, height: 28, borderRadius: 6, overflow:'hidden', flexShrink: 0, display:'flex', border:'1px solid var(--line-2)', opacity: home ? 0.5 : 1 }}><ProductThumb id={it.id}/></span>
                  <span style={{ flex: 1, minWidth: 0, textDecoration: home ? 'line-through' : 'none' }}>{p.name[lang]}</span>
                  {it.swapDiet && !home && <Pill tone="accent" size="sm">{DIETS[it.swapDiet][lang]}</Pill>}
                  {home && <Pill tone="sage" size="sm"><Icon name="home" size={9}/>{L(lang,'En casa','At home')}</Pill>}
                  {p.seasonal && !home && <Pill tone="sage" size="sm"><Icon name="leaf" size={9}/></Pill>}
                  {!home && <span className="mono" style={{ fontSize: 12, color:'var(--ink-3)' }}>×{it.qty}</span>}
                  {!home && <span style={{ fontSize: 12, color:'var(--ink-3)', minWidth: 52, textAlign:'right' }}>{p.unit[lang]}</span>}
                </button>
              );
            })}
            {!added && <div style={{ fontSize: 12, color:'var(--ink-3)', padding:'4px 6px 2px' }}>{L(lang,'Toca lo que ya tengas en casa para no comprarlo.','Tap anything you already have so I skip it.')}</div>}
          </div>

          {/* Footer */}
          <div style={{
            display:'flex', alignItems:'center', gap: 10,
            padding: '10px 14px', borderTop:'1px solid var(--line-2)', background:'var(--bg-sunk)',
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, color:'var(--ink-3)', textTransform:'uppercase', letterSpacing:'0.06em', whiteSpace:'nowrap' }}>
                {L(lang, 'Aprox.', 'Approx.')}
              </div>
              <div className="serif" style={{ fontSize: 18, lineHeight: 1.1, marginTop: 1 }}>{eur(estCost)}</div>
            </div>
            <button onClick={add} disabled={added} style={{
              padding: '9px 14px', borderRadius: 8,
              background: added ? 'var(--sage-soft)' : 'var(--ink)',
              color: added ? 'var(--sage-ink)' : 'var(--bg)',
              border: added ? '1px solid var(--sage-line)' : 'none',
              fontSize: 13, fontWeight: 500, whiteSpace:'nowrap', flexShrink: 0, minHeight: 40,
              display:'inline-flex', alignItems:'center', gap: 7,
            }}>
              <Icon name={added ? 'check' : 'plus'} size={12}/>
              {added ? tr('addedToCart', lang) : skip.length ? L(lang, `Añadir ${buy.length}`, `Add ${buy.length}`) : tr('addAllToCart', lang)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
const recipeStepBtn = {
  width: 36, height: 34, fontSize: 15, color:'var(--ink-2)',
  display:'inline-flex', alignItems:'center', justifyContent:'center',
};

function MemoryCard({ lang, memory }) {
  return (
    <div style={{
      marginTop: 'auto',
      padding: '10px 12px', borderRadius: 12,
      background: 'transparent', border: '1px dashed var(--line)',
      display:'flex', gap: 10, alignItems:'flex-start',
    }}>
      <div style={{ color:'var(--ink-3)', paddingTop: 1 }}><Icon name="memory" size={13}/></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color:'var(--ink-3)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom: 4 }}>
          {tr('memory', lang)}
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap: 3 }}>
          {memory.map((m, i) => (
            <div key={i} style={{ fontSize: 12, color:'var(--ink-2)' }}>· {m[lang]}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ChatInput({ lang, draft, setDraft, onSend }) {
  const send = () => { const t = draft.trim(); if (t) onSend(t); };
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState('');
  const timer = useRef(null);
  useEffect(() => () => clearInterval(timer.current), []);
  const phrase = lang === 'es' ? 'Tortilla de patatas' : 'Spanish omelette';
  const micCtx = React.useContext(AppCtx);
  const startListen = () => {
    if (micCtx && needMicPrime(micCtx, () => startListen())) return;
    setListening(true); setHeard('');
    let i = 0;
    clearInterval(timer.current);
    timer.current = setInterval(() => {
      i++;
      setHeard(phrase.slice(0, i));
      if (i >= phrase.length) {
        clearInterval(timer.current);
        setTimeout(() => { setListening(false); setHeard(''); onSend(phrase); }, 500);
      }
    }, 70);
  };
  const stopListen = () => { clearInterval(timer.current); setListening(false); if (heard) onSend(heard); setHeard(''); };
  const hasText = !!draft.trim();
  if (listening) {
    return (
      <div style={{ display:'flex', alignItems:'center', gap: 10, padding: '6px 6px 6px 14px', border:'1px solid var(--accent-line)', borderRadius: 12, background:'var(--accent-soft)' }}>
        <style>{`@keyframes micPulse{0%{box-shadow:0 0 0 0 oklch(0.55 0.15 255 / .35)}100%{box-shadow:0 0 0 12px oklch(0.55 0.15 255 / 0)}}@keyframes wave{0%,100%{transform:scaleY(.3)}50%{transform:scaleY(1)}}`}</style>
        <div style={{ display:'flex', alignItems:'center', gap: 2, height: 18 }}>
          {[0,1,2,3,4].map(k => <span key={k} style={{ width: 3, height: 18, borderRadius: 2, background:'oklch(0.50 0.15 255)', animation:`wave 700ms ${k*110}ms ease-in-out infinite` }}></span>)}
        </div>
        <div style={{ flex: 1, minWidth: 0, fontSize: 13, color: heard ? 'var(--ink)' : 'var(--ink-3)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
          {heard || (lang === 'es' ? 'Escuchando…' : 'Listening…')}
        </div>
        <button onClick={stopListen} title={lang === 'es' ? 'Parar' : 'Stop'} style={{ width: 40, height: 40, borderRadius: 12, background:'oklch(0.50 0.15 255)', color:'#fff', display:'inline-flex', alignItems:'center', justifyContent:'center', animation:'micPulse 1.2s ease-out infinite' }}>
          <span style={{ width: 12, height: 12, borderRadius: 3, background:'#fff' }}></span>
        </button>
      </div>
    );
  }
  return (
    <div style={{
      display:'flex', alignItems:'center', gap: 6,
      padding: '6px 6px 6px 12px', border:'1px solid var(--line)', borderRadius: 12,
      background:'var(--bg-panel)',
    }}>
      <textarea
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
        placeholder={tr('placeholder', lang)}
        rows={1}
        style={{
          flex: 1, minWidth: 0, resize: 'none', border: 0, outline: 0, background:'transparent', overflow:'hidden',
          padding: '8px 0', fontSize: 14, lineHeight: 1.4, height: 36, whiteSpace: hasText ? 'normal' : 'nowrap', textOverflow:'ellipsis',
        }}
      />
      {hasText ? (
        <button onClick={send} title={lang === 'es' ? 'Enviar' : 'Send'} style={{ width: 40, height: 40, borderRadius: 12, background:'var(--ink)', color:'var(--bg)', display:'inline-flex', alignItems:'center', justifyContent:'center' }}>
          <Icon name="send" size={14}/>
        </button>
      ) : (
        <button onClick={startListen} title={tr('listen', lang)} style={{ width: 40, height: 40, borderRadius: 12, background:'var(--ink)', color:'var(--bg)', display:'inline-flex', alignItems:'center', justifyContent:'center' }}>
          <Icon name="mic" size={17}/>
        </button>
      )}
    </div>
  );
}

function FormEntry({ lang, onAdd }) {
  const [pid, setPid] = useState('');
  const [qty, setQty] = useState(1);
  const available = Object.values(CATALOG);
  return (
    <div style={{ display:'flex', flexDirection:'column', gap: 8 }}>
      <div style={{ fontSize: 11, color:'var(--ink-3)', textTransform:'uppercase', letterSpacing:'0.06em' }}>
        {tr('addProduct', lang)}
      </div>
      <div style={{ display:'flex', gap: 6 }}>
        <select value={pid} onChange={e => setPid(e.target.value)} style={inputStyle}>
          <option value="">{tr('formPlaceholder', lang)}</option>
          {available.map(p => (
            <option key={p.id} value={p.id}>{p.emoji} {p.name[lang]} — {p.unit[lang]}</option>
          ))}
        </select>
        <input type="number" min={1} max={20} value={qty} onChange={e => setQty(+e.target.value || 1)}
          style={{ ...inputStyle, width: 64 }}/>
        <button disabled={!pid} onClick={() => { if (pid) { onAdd(pid, qty); setPid(''); setQty(1); } }}
          style={{
            padding: '8px 14px', borderRadius: 8,
            background: pid ? 'var(--ink)' : 'var(--bg-sunk)',
            color: pid ? 'var(--bg)' : 'var(--ink-3)',
            fontSize: 12, fontWeight: 500,
          }}>
          <Icon name="plus" size={11}/>
        </button>
      </div>
    </div>
  );
}

const inputStyle = {
  flex: 1, padding: '8px 10px', border: '1px solid var(--line)', borderRadius: 8,
  background: 'var(--bg-panel)', fontSize: 12, outline:'none',
};

const btnSolid = {
  padding: '6px 11px', borderRadius: 7,
  background: 'var(--ink)', color: 'var(--bg)',
  fontSize: 12, fontWeight: 500,
};
const btnGhost = {
  padding: '6px 11px', borderRadius: 7,
  background: 'var(--bg-panel)', color: 'var(--ink)',
  border: '1px solid var(--line)',
  fontSize: 12, fontWeight: 500,
};

Object.assign(window, { ChatPane });
