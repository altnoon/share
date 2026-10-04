// "How it works" intro video — opened from the app menu, plays in an overlay.
function PlayGlyph({ size = 10 }) {
  return <svg width={size} height={size} viewBox="0 0 10 10"><path d="M2 1.2v7.6L8.6 5z" fill="currentColor"/></svg>;
}

function TourModal({ lang, variant, onClose }) {
  const sa = /standalone/i.test(decodeURIComponent(location.pathname));
  const local = /\.html$/i.test(location.pathname) || location.protocol === 'file:';
  const src = (local ? '' : '/aishopper-app/') + (variant === 'mobile' ? 'Intro Video' : 'Intro Video Desktop') + (sa ? ' (standalone)' : '') + '.html?lang=' + lang + '&restart=1';
  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, []);
  const closeBtn = (
    <button onClick={onClose} title={lang === 'es' ? 'Cerrar' : 'Close'} style={{
      width: 40, height: 40, borderRadius: 20, background: 'oklch(1 0 0 / 0.14)', color: '#fff',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}><Icon name="x" size={16}/></button>
  );
  if (variant === 'mobile') {
    return (
      <div style={{ position: 'absolute', inset: 0, zIndex: 300, background: '#141210', display: 'flex', flexDirection: 'column', animation: 'fadeIn 200ms' }}>
        <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}}`}</style>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px 6px 18px', color: '#fff' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{lang === 'es' ? 'Cómo funciona' : 'How it works'}</div>
            <div style={{ fontSize: 11.5, opacity: 0.6 }}>{lang === 'es' ? '7 pasos + extras · 1 min' : '7 steps + extras · 1 min'}</div>
          </div>
          {closeBtn}
        </div>
        <iframe src={src} title="Intro" style={{ flex: 1, width: '100%', border: 0, background: '#141210' }}></iframe>
      </div>
    );
  }
  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} style={{
      position: 'fixed', inset: 0, zIndex: 400, background: 'oklch(0.15 0.01 60 / 0.72)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, animation: 'fadeIn 200ms',
    }}>
      <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}}`}</style>
      <div style={{ width: 'min(1280px, 100%)', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span className="serif" style={{ fontSize: 26 }}>{lang === 'es' ? 'Cómo funciona' : 'How it works'}</span>
            <span style={{ fontSize: 12.5, opacity: 0.6 }}>{lang === 'es' ? '7 pasos + extras · 1 min' : '7 steps + extras · 1 min'}</span>
          </div>
          {closeBtn}
        </div>
        <div style={{ position: 'relative', width: '100%', maxHeight: 'calc(100vh - 140px)', aspectRatio: '16 / 10', borderRadius: 14, overflow: 'hidden', background: '#141210' }}>
          <iframe src={src} title="Intro" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}></iframe>
        </div>
      </div>
    </div>
  );
}

// Row used in the You tab.
function TourCard({ lang, onOpen }) {
  return (
    <button onClick={onOpen} style={{
      display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left',
      padding: '12px 14px 12px 12px', borderRadius: 14, background: 'var(--ink)', color: 'var(--bg)',
    }}>
      <span style={{ width: 44, height: 44, borderRadius: 12, background: 'oklch(1 0 0 / 0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <PlayGlyph size={14}/>
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 14, fontWeight: 600 }}>{lang === 'es' ? 'Cómo funciona' : 'How it works'}</span>
        <span style={{ display: 'block', fontSize: 12, opacity: 0.7, marginTop: 2 }}>{lang === 'es' ? 'Vídeo de 1 min · de plato a la puerta' : '1 min video · from dish to doorstep'}</span>
      </span>
      <Icon name="arrow" size={13}/>
    </button>
  );
}

Object.assign(window, { TourModal, TourCard, PlayGlyph });
