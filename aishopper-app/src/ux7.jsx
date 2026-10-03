// Round 7 — testing in the wild: event log, feedback hook, missing-items detail, return-visit card, landing handoff.

// ─── Event log (Analytics plan.md schema). Local only; exported from the feedback sheet. ───
const TRACK_KEY = 'ai-shopper-events';
function track(event, props) {
  try {
    const log = JSON.parse(localStorage.getItem(TRACK_KEY) || '[]');
    log.push({ t: Date.now(), event, ...(props || {}) });
    localStorage.setItem(TRACK_KEY, JSON.stringify(log.slice(-500)));
  } catch (e) {}
}
function readTrack() { try { return JSON.parse(localStorage.getItem(TRACK_KEY) || '[]'); } catch (e) { return []; } }
function trackFunnel() {
  const ev = readTrack(); const has = (n) => ev.some(e => e.event === n);
  return ['app_opened', 'request_sent', 'pick_shown', 'checkout_opened', 'checkout_handed_off'].map(n => ({ n, ok: has(n) }));
}

// ─── Feedback: one line, in the moment. Mailto with the event log appended, or copy. ───
const FEEDBACK_TO = 'hola@aishopper.es';
function FeedbackSheet({ variant, onClose }) {
  const ctx = React.useContext(AppCtx); const lang = ctx.lang;
  const [text, setText] = useState('');
  const [mood, setMood] = useState(null);
  const [sent, setSent] = useState(false);
  const funnel = trackFunnel();
  const body = () => {
    const ev = readTrack().slice(-40).map(e => `${new Date(e.t).toISOString().slice(11, 19)} ${e.event}${Object.keys(e).filter(k => k !== 't' && k !== 'event').map(k => ` ${k}=${JSON.stringify(e[k])}`).join('')}`).join('\n');
    return `${text}\n\n— ${mood || ''} · ${ctx.state && ctx.state.started ? 'started' : 'fresh'} · ${window.innerWidth}px · ${lang}\n\n${ev}`;
  };
  const send = () => {
    track('feedback_sent', { mood, len: text.length });
    window.open(`mailto:${FEEDBACK_TO}?subject=${encodeURIComponent('aishopper · feedback')}&body=${encodeURIComponent(body())}`, '_self');
    setSent(true);
  };
  const copy = async () => { try { await navigator.clipboard.writeText(body()); ctx.notify(L(lang, 'Copiado · pégalo en WhatsApp', 'Copied · paste it in WhatsApp')); } catch (e) {} };
  const moods = [['😕', L(lang, 'Algo falla', 'Something’s off')], ['🤔', L(lang, 'No lo entiendo', 'I don’t get it')], ['💡', L(lang, 'Una idea', 'An idea')], ['👍', L(lang, 'Me gusta', 'Like it')]];
  return (
    <Sheet variant={variant} onClose={onClose} width={460} kicker={L(lang, 'Estás probando aishopper', 'You’re testing aishopper')} title={L(lang, '¿Algo raro? Cuéntamelo', 'Anything odd? Tell me')}
      footer={sent ? <div style={{ fontSize: 13, color: 'var(--sage-ink)' }}>{L(lang, 'Gracias. Si no se abrió tu correo, usa Copiar.', 'Thanks. If your mail app didn’t open, use Copy.')}</div> : (
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={copy} style={{ ...fxBtnGhost }}>{L(lang, 'Copiar', 'Copy')}</button>
          <button onClick={send} disabled={!text.trim()} style={{ ...fxBtnPrimary, flex: 1, opacity: text.trim() ? 1 : 0.5 }}>{L(lang, 'Enviar', 'Send')}</button>
        </div>)}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        {moods.map(([e, l]) => <button key={l} aria-pressed={mood === l} onClick={() => setMood(l)} style={{ ...fxBtnGhost, minHeight: 36, fontSize: 12, padding: '0 10px', background: mood === l ? 'var(--ink)' : 'var(--bg-panel)', color: mood === l ? 'var(--bg)' : 'var(--ink)' }}><span aria-hidden="true">{e}</span>{l}</button>)}
      </div>
      <textarea value={text} onChange={e => setText(e.target.value)} rows={4} autoFocus placeholder={L(lang, 'Qué esperabas, qué pasó…', 'What you expected, what happened…')}
        style={{ width: '100%', boxSizing: 'border-box', padding: 12, borderRadius: 12, border: '1px solid var(--line)', background: 'var(--bg-sunk)', fontSize: 14, lineHeight: 1.45, resize: 'vertical', outline: 'none', fontFamily: 'inherit' }}/>
      <div style={{ marginTop: 14, fontSize: 12, color: 'var(--ink-3)' }}>{L(lang, 'Se adjunta lo que has hecho en la app (sin datos personales):', 'Your steps in the app are attached (no personal data):')}</div>
      <div style={{ display: 'flex', gap: 4, marginTop: 8 }} aria-label="funnel">
        {funnel.map(f => <span key={f.n} title={f.n} style={{ flex: 1, height: 4, borderRadius: 2, background: f.ok ? 'var(--sage)' : 'var(--line)' }}></span>)}
      </div>
    </Sheet>
  );
}
function FeedbackButton({ compact }) {
  const ctx = React.useContext(AppCtx); const lang = ctx.lang;
  return (
    <button onClick={() => { track('feedback_opened'); ctx.openOverlay('feedback'); }} title={L(lang, '¿Algo raro?', 'Anything odd?')} aria-label={L(lang, 'Enviar comentario', 'Send feedback')} style={{
      height: compact ? 34 : 32, padding: compact ? 0 : '0 10px', width: compact ? 34 : undefined, borderRadius: compact ? 12 : 8, border: '1px solid var(--line)', background: 'var(--bg-panel)', color: 'var(--ink-2)', fontSize: 12, fontWeight: 500, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, flexShrink: 0 }}>
      <Icon name="sparkle" size={13}/>{!compact && <span className="wtb-lbl">{L(lang, '¿Algo raro?', 'Feedback')}</span>}
    </button>
  );
}

// ─── Missing items at a store: what, and the two ways out. ───
function MissingSheet({ variant, onClose, data }) {
  const ctx = React.useContext(AppCtx); const lang = ctx.lang;
  const store = STORES.find(s => s.id === data.storeId);
  const missing = missingAt(store.id, ctx.basket);
  const alt = (id) => { const p = CATALOG[id]; return p && p.whiteLabel ? p.whiteLabel.name[lang] : null; };
  const removeAll = () => { track('basket_edited', { action: 'remove_missing', store: store.id, n: missing.length }); missing.forEach(b => ctx.removeFromBasket && ctx.removeFromBasket(b.id)); onClose(); };
  return (
    <Sheet variant={variant} onClose={onClose} width={460} kicker={store.name} title={L(lang, `${missing.length} ${missing.length === 1 ? 'producto sin stock hoy' : 'productos sin stock hoy'}`, `${missing.length} out of stock today`)}
      footer={<div style={{ display: 'flex', gap: 8 }}>
        {ctx.removeFromBasket && <button onClick={removeAll} style={{ ...fxBtnGhost }}>{L(lang, 'Quitarlos', 'Remove them')}</button>}
        <button onClick={() => { track('split_opened', { from: 'missing' }); onClose(); ctx.openOverlay('split'); }} style={{ ...fxBtnPrimary, flex: 1 }}>{L(lang, 'Dividir en dos supers', 'Split across two stores')}</button>
      </div>}>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {missing.map(b => { const p = CATALOG[b.id]; const a = alt(b.id); return (
          <li key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, background: 'var(--bg-sunk)', border: '1px solid var(--line-2)' }}>
            <span aria-hidden="true" style={{ fontSize: 18 }}>{p.emoji}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 500 }}>{p.name[lang]} <span style={{ color: 'var(--ink-3)', fontWeight: 400 }}>× {b.qty}</span></div>
              <div style={{ fontSize: 12, color: a ? 'var(--ink-2)' : 'var(--warn-ink)', marginTop: 1 }}>{a ? L(lang, `Alternativa: ${a}`, `Alternative: ${a}`) : L(lang, 'Sin alternativa en este súper', 'No alternative at this store')}</div>
            </div>
          </li>); })}
      </ul>
      <div style={{ marginTop: 14, fontSize: 12, color: 'var(--ink-3)' }}>{L(lang, 'El total de esta tienda no incluye estos productos.', 'This store’s total excludes these items.')}</div>
    </Sheet>
  );
}

// ─── Return visit: the last basket, one tap away. Replaces the first-run coach once there is history. ───
function ReturnCard({ onSend }) {
  const ctx = React.useContext(AppCtx); const lang = ctx.lang;
  const o = (ctx.orders || []).find(x => x.placedAt);
  if (!o || (ctx.state && ctx.state.started) || !ctx.profile.onboarded || ctx.activeOrder) return null;
  const store = STORES.find(s => s.id === (o.stores || [])[0]);
  const days = Math.max(1, Math.round((Date.now() - o.placedAt) / 864e5));
  const names = o.items.slice(0, 3).map(b => CATALOG[b.id].name[lang].toLowerCase()).join(', ') + (o.items.length > 3 ? ` +${o.items.length - 3}` : '');
  return (
    <div style={{ ...fxCard, display: 'flex', alignItems: 'center', gap: 12, animation: 'riseIn 300ms cubic-bezier(.2,.7,.3,1)' }}>
      {store && <StoreMark store={store} size={36}/>}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600 }}>{L(lang, 'Tu última cesta', 'Your last basket')} <span style={{ color: 'var(--ink-3)', fontWeight: 400 }}>· {days === 1 ? L(lang, 'ayer', 'yesterday') : L(lang, `hace ${days} días`, `${days} days ago`)}</span></div>
        <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{names} · {eur(o.total)}</div>
      </div>
      <button onClick={() => { track('request_sent', { input: 'repeat' }); ctx.repeatOrder(o); }} style={{ ...fxBtnPrimary, minHeight: 38, padding: '0 12px', fontSize: 12.5, whiteSpace: 'nowrap' }}><Icon name="repeat" size={12}/>{L(lang, 'Repetir', 'Repeat')}</button>
    </div>
  );
}

// ─── Landing handoff: /aishopper-app?say=paella%20para%204 pre-sends the first message. ───
function useLandingHandoff(send, ready) {
  const done = useRef(false);
  useEffect(() => {
    if (done.current || !ready) return;
    const q = new URLSearchParams(window.location.search);
    const say = q.get('say'); const from = q.get('from');
    if (from) track('app_opened', { source: from });
    if (!say) return;
    done.current = true;
    setTimeout(() => send(say), 500);
    try { history.replaceState(null, '', window.location.pathname); } catch (e) {}
  }, [ready]);
}

Object.assign(window, { track, readTrack, trackFunnel, FeedbackSheet, FeedbackButton, MissingSheet, ReturnCard, useLandingHandoff });
