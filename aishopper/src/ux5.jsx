// Round 5 — first-run coach, permission priming, inbox bell, household roles, web keyboard shortcuts.

// ─── First-run coach: one concrete thing to say, shown once ───
function FirstRunCoach({ onSend }) {
  const ctx = React.useContext(AppCtx); const lang = ctx.lang;
  const asked = ctx.profile.asked || {};
  if (!ctx.profile.onboarded || asked.firstHint || ctx.state.started) return null;
  const n = ctx.profile.household || 4;
  const ex = L(lang, `Paella para ${n}`, `Paella for ${n}`);
  return (
    <div role="status" style={{ display:'flex', alignItems:'center', gap: 10, padding:'10px 12px', borderRadius: 12, background:'var(--accent-soft)', border:'1px solid var(--accent-line)', animation:'riseIn 300ms cubic-bezier(.2,.7,.3,1)' }}>
      <span style={{ color:'var(--accent-ink)', display:'inline-flex' }}><Icon name="sparkle" size={14}/></span>
      <div style={{ flex: 1, minWidth: 0, fontSize: 13, color:'var(--accent-ink)' }}>
        {L(lang, 'Empieza con un plato. Yo saco la lista y el súper más barato.', 'Start with a dish. I pull the list and the cheapest store.')}
      </div>
      <button onClick={() => { ctx.markAsked('firstHint'); onSend(ex); }} style={{ ...fxBtnPrimary, minHeight: 36, padding:'0 12px', fontSize: 12, whiteSpace:'nowrap' }}>«{ex}»</button>
      <button onClick={() => ctx.markAsked('firstHint')} aria-label={L(lang,'Cerrar','Dismiss')} style={{ width: 32, height: 32, display:'inline-flex', alignItems:'center', justifyContent:'center', color:'var(--accent-ink)', flexShrink: 0 }}><Icon name="x" size={12}/></button>
    </div>
  );
}

// ─── Permission priming: explain before the OS asks ───
function MicPrimeSheet({ variant, onClose, data }) {
  const ctx = React.useContext(AppCtx); const lang = ctx.lang;
  const go = (allow) => { ctx.markAsked('mic'); if (allow) ctx.updateProfile({ micOk: true }); onClose(); if (allow && data && data.then) setTimeout(data.then, 80); };
  return (
    <Sheet variant={variant} onClose={() => go(false)} width={440} kicker={L(lang,'Micrófono','Microphone')} title={L(lang,'Para dictarme la lista necesito oírte','To take your list by voice I need to hear you')}
      footer={<div style={{ display:'flex', gap: 8 }}>
        <button onClick={() => go(false)} style={{ ...fxBtnGhost, border:'none' }}>{L(lang,'Prefiero escribir','I’ll type')}</button>
        <button onClick={() => go(true)} style={{ ...fxBtnPrimary, flex: 1 }}><Icon name="mic" size={13}/>{L(lang,'Permitir micrófono','Allow microphone')}</button>
      </div>}>
      <ul style={{ margin: 0, padding: 0, listStyle:'none', display:'flex', flexDirection:'column', gap: 10, fontSize: 13, color:'var(--ink-2)' }}>
        {[L(lang,'Solo escucho mientras mantienes pulsado.','I only listen while you hold the button.'), L(lang,'Nada se guarda: convierto la voz en lista y se descarta.','Nothing is stored: voice becomes a list and is discarded.'), L(lang,'Puedes quitarlo cuando quieras en Ajustes.','You can revoke it any time in Settings.')].map((t, i) => (
          <li key={i} style={{ display:'flex', gap: 10, alignItems:'flex-start' }}><span style={{ color:'var(--sage)', display:'inline-flex', marginTop: 2 }}><Icon name="check" size={12}/></span>{t}</li>
        ))}
      </ul>
      <div style={{ marginTop: 14, fontSize: 12, color:'var(--ink-3)' }}>{L(lang,'A continuación el sistema te pedirá confirmación.','Your device will ask you to confirm next.')}</div>
    </Sheet>
  );
}
// Returns true if the caller should stop and let the primer run first.
function needMicPrime(ctx, then) {
  if ((ctx.profile.asked || {}).mic) return false;
  ctx.openOverlay('micprime', { then }); return true;
}

function NotifPrime() {
  const ctx = React.useContext(AppCtx); const lang = ctx.lang;
  if ((ctx.profile.asked || {}).notif) return null;
  const yes = () => { ctx.markAsked('notif'); ctx.updateProfile({ notifOk: true }); ctx.notify(L(lang,'Te aviso al salir y al llegar','I’ll ping you when it leaves and when it arrives')); };
  return (
    <div style={{ ...fxCard, display:'flex', flexDirection:'column', gap: 10, marginBottom: 16 }}>
      <div style={{ display:'flex', gap: 10, alignItems:'flex-start' }}>
        <span style={{ color:'var(--ink-2)', display:'inline-flex', marginTop: 2 }}><Icon name="bell" size={14}/></span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 500 }}>{L(lang,'¿Te aviso cuando salga el pedido?','Want a ping when the order leaves?')}</div>
          <div style={{ fontSize: 12, color:'var(--ink-3)', marginTop: 2 }}>{L(lang,'Dos avisos por pedido: sale y llega. Nada más.','Two per order: it’s out, it’s here. Nothing else.')}</div>
        </div>
      </div>
      <div style={{ display:'flex', gap: 8 }}>
        <button onClick={yes} style={{ ...fxBtnPrimary, minHeight: 40, flex: 1 }}>{L(lang,'Sí, avísame','Yes, ping me')}</button>
        <button onClick={() => ctx.markAsked('notif')} style={{ ...fxBtnGhost, minHeight: 40, background:'transparent' }}>{L(lang,'Ahora no','Not now')}</button>
      </div>
    </div>
  );
}

// ─── Inbox: the retention surfaces have one front door ───
function inboxCount(ctx) {
  const p = ctx.profile; if (p.inboxSeen) return 0;
  let n = 0;
  if ((ctx.orders || []).some(x => x.date && x.date.es !== 'Hoy' && x.items) && notifOn(p, 'weekly')) n++;
  if (notifOn(p, 'drops') && (ctx.alerts || []).some(a => a.on)) n++;
  if (ctx.activeOrder && notifOn(p, 'order')) n++;
  if ((ctx.shared || {}).on && (ctx.shared.pending || []).length && notifOn(p, 'household')) n++;
  return n;
}
function InboxButton({ size = 32, radius = 8 }) {
  const ctx = React.useContext(AppCtx); const lang = ctx.lang;
  const n = inboxCount(ctx);
  return (
    <button onClick={() => { ctx.updateProfile({ inboxSeen: true }); ctx.openOverlay('notifs'); }} aria-label={n ? L(lang, `Avisos: ${n} nuevos`, `Notifications: ${n} new`) : L(lang,'Avisos','Notifications')} style={{ position:'relative', width: size, height: size, borderRadius: radius, background:'var(--bg-sunk)', border:'1px solid var(--line-2)', color:'var(--ink-2)', display:'inline-flex', alignItems:'center', justifyContent:'center', flexShrink: 0 }}>
      <Icon name="bell" size={14}/>
      {n > 0 && <span style={{ position:'absolute', top: -4, right: -4, minWidth: 16, height: 16, padding:'0 4px', borderRadius: 8, background:'var(--accent)', color:'#fff', fontSize: 10, fontWeight: 600, display:'inline-flex', alignItems:'center', justifyContent:'center', animation:'badgePop 420ms ease-out' }}>{n}</span>}
    </button>
  );
}

// ─── Household roles ───
const ROLES = [
  { k:'owner',   es:'Decide',  en:'Owner',   sub:{ es:'Añade, aprueba y paga', en:'Adds, approves and pays' } },
  { k:'add',     es:'Añade',   en:'Adds',    sub:{ es:'Lo que añade entra directo', en:'Items go straight in' } },
  { k:'approve', es:'Propone', en:'Proposes',sub:{ es:'Lo que añade lo apruebas tú', en:'You approve what they add' } },
];
function roleOf(m) { return m.me ? 'owner' : (m.role || 'approve'); }
function MemberRole({ m }) {
  const ctx = React.useContext(AppCtx); const lang = ctx.lang;
  const r = roleOf(m);
  if (m.me) return <span style={{ fontSize: 12, color:'var(--ink-3)' }}>{ROLES[0][lang]}</span>;
  const next = r === 'add' ? 'approve' : 'add';
  const ro = ROLES.find(x => x.k === r);
  return (
    <button onClick={() => { ctx.setMemberRole(m.name, next); ctx.notify(L(lang, `${m.name}: ${ROLES.find(x => x.k === next).sub.es.toLowerCase()}`, `${m.name}: ${ROLES.find(x => x.k === next).sub.en.toLowerCase()}`)); }} title={ro.sub[lang]} style={{ minHeight: 32, padding:'0 10px', borderRadius: 999, border:'1px solid var(--line)', background:'var(--bg-sunk)', fontSize: 12, fontWeight: 500, display:'inline-flex', alignItems:'center', gap: 5 }}>
      {ro[lang]} <Icon name="down" size={9}/>
    </button>
  );
}
function WhoAdded() {
  const ctx = React.useContext(AppCtx); const lang = ctx.lang;
  if (!(ctx.shared || {}).on) return null;
  const by = {}; ctx.basket.forEach(b => { const k = b.by || L(lang,'Tú','You'); by[k] = (by[k] || 0) + 1; });
  const ks = Object.keys(by); if (ks.length < 2) return null;
  return <div style={{ fontSize: 12, color:'var(--ink-3)' }}>{ks.map(k => `${k} ${by[k]}`).join(' · ')}</div>;
}

// ─── Web keyboard shortcuts ───
const SHORTCUTS = [
  { keys:['/'], es:'Escribir al concierge', en:'Type to the concierge' },
  { keys:['C'], es:'Cambiar vista de comparación', en:'Cycle compare view' },
  { keys:['K'], es:'Elegir franja (checkout)', en:'Pick a slot (checkout)' },
  { keys:['Y'], es:'Abrir Tú', en:'Open You' },
  { keys:['N'], es:'Avisos', en:'Notifications' },
  { keys:['R'], es:'Repetir último pedido', en:'Repeat last order' },
  { keys:['Z'], es:'Deshacer lo último', en:'Undo last change' },
  { keys:['?'], es:'Esta ayuda', en:'This help' },
  { keys:['Esc'], es:'Cerrar', en:'Close' },
];
function ShortcutsSheet({ variant, onClose }) {
  const lang = React.useContext(AppCtx).lang;
  const kbd = { minWidth: 26, height: 24, padding:'0 7px', borderRadius: 6, border:'1px solid var(--line)', borderBottomWidth: 2, background:'var(--bg-sunk)', fontSize: 12, fontWeight: 500, display:'inline-flex', alignItems:'center', justifyContent:'center' };
  return (
    <Sheet variant={variant} onClose={onClose} width={420} kicker={L(lang,'Teclado','Keyboard')} title={L(lang,'Atajos','Shortcuts')}>
      <div style={{ display:'flex', flexDirection:'column' }}>
        {SHORTCUTS.map((s, i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap: 12, minHeight: 40, borderTop: i ? '1px solid var(--line-2)' : 'none', fontSize: 13 }}>
            <span>{s[lang]}</span><span className="mono" style={kbd}>{s.keys[0]}</span>
          </div>
        ))}
      </div>
    </Sheet>
  );
}
function useWebShortcuts({ onCycleView, onCheckout }) {
  const ctx = React.useContext(AppCtx);
  const ref = useRef(null); ref.current = { ctx, onCycleView, onCheckout };
  useEffect(() => {
    const k = (e) => {
      const { ctx, onCycleView, onCheckout } = ref.current;
      const t = e.target; const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (typing) { if (e.key === 'Escape') t.blur(); return; }
      if (ctx.overlay && e.key !== 'Escape') return;
      const key = e.key.toLowerCase();
      if (e.key === '/') { e.preventDefault(); const el = document.querySelector('textarea'); if (el) el.focus(); }
      else if (e.key === '?') { e.preventDefault(); ctx.openOverlay('shortcuts'); }
      else if (key === 'c' && onCycleView) onCycleView();
      else if (key === 'k' && ctx.winner && onCheckout) onCheckout();
      else if (key === 'y') ctx.openOverlay('you');
      else if (key === 'n') { ctx.updateProfile({ inboxSeen: true }); ctx.openOverlay('notifs'); }
      else if (key === 'r') ctx.repeatLast();
      else if (key === 'z' && ctx.notice && ctx.notice.undo) { ctx.notice.undo(); ctx.notify(null); }
    };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, []);
}
function ShortcutHint() {
  const ctx = React.useContext(AppCtx); const lang = ctx.lang;
  return (
    <button onClick={() => ctx.openOverlay('shortcuts')} aria-label={L(lang,'Atajos de teclado','Keyboard shortcuts')} title={L(lang,'Atajos de teclado · ?','Keyboard shortcuts · ?')} className="mono" style={{ width: 32, height: 32, borderRadius: 8, background:'var(--bg-sunk)', border:'1px solid var(--line-2)', color:'var(--ink-3)', fontSize: 12, display:'inline-flex', alignItems:'center', justifyContent:'center' }}>?</button>
  );
}

Object.assign(window, { FirstRunCoach, MicPrimeSheet, needMicPrime, NotifPrime, InboxButton, inboxCount, ROLES, roleOf, MemberRole, WhoAdded, ShortcutsSheet, useWebShortcuts, ShortcutHint });
