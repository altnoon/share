// Tweaks panel — toggled from toolbar, persisted via __edit_mode_set_keys
function TweaksPanel({ open, tweaks, setTweaks }) {
  if (!open) return null;
  const lang = tweaks.language;
  const set = (k, v) => {
    setTweaks(prev => ({ ...prev, [k]: v }));
    try { window.parent.postMessage({ type:'__edit_mode_set_keys', edits: { [k]: v } }, '*'); } catch(e){}
  };

  return (
    <div style={{
      position:'fixed', right: 20, bottom: 20, width: 260, zIndex: 90,
      background:'var(--bg-panel)', border:'1px solid var(--line)', borderRadius: 12,
      boxShadow: '0 12px 36px oklch(0.2 0.01 60 / 0.15)',
      padding: 14, animation: 'tweaksIn 220ms',
    }}>
      <style>{`@keyframes tweaksIn { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: none } }`}</style>
      <div style={{
        fontSize: 11, color:'var(--ink-3)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom: 12,
        display:'flex', alignItems:'center', gap: 6,
      }}>
        <Icon name="sparkle" size={11}/> {tr('tweaks', lang)}
      </div>

      <TweakRow label={lang === 'es' ? 'Vista' : 'View'}>
        <Segment size="sm" value={tweaks.viewMode || 'auto'} onChange={v => set('viewMode', v)} options={[
          { value:'auto', label: lang === 'es' ? 'Auto' : 'Auto' },
          { value:'web',  label: lang === 'es' ? 'Web'  : 'Web' },
          { value:'mobile', label: lang === 'es' ? 'Móvil' : 'Mobile' },
        ]}/>
      </TweakRow>

      <TweakRow label={tr('language', lang)}>
        <Segment size="sm" value={tweaks.language} onChange={v => set('language', v)} options={[
          { value:'es', label:'ES' }, { value:'en', label:'EN' },
        ]}/>
      </TweakRow>

      <TweakRow label={tr('entryMode', lang)}>
        <Segment size="sm" value={tweaks.entryMode} onChange={v => set('entryMode', v)} options={[
          { value:'chat', label: tr('chat', lang) },
          { value:'form', label: tr('form', lang) },
        ]}/>
      </TweakRow>

      <TweakRow label={tr('compareView', lang)}>
        <Segment size="sm" value={tweaks.compareView || 'ladder'} onChange={v => set('compareView', v)} options={[
          { value:'ladder', label: lang === 'es' ? 'Ranking' : 'Ranking' },
          { value:'shelf', label: tr('shelf', lang) },
          { value:'bars', label: tr('bars', lang) },
          { value:'table', label: tr('table', lang) },
        ]}/>
      </TweakRow>

      <TweakRow label={lang === 'es' ? 'Simular sin conexión' : 'Simulate offline'}>
        <Segment size="sm" value={tweaks.simOffline ? 'on' : 'off'} onChange={v => set('simOffline', v === 'on')} options={[
          { value:'off', label: lang === 'es' ? 'No' : 'Off' }, { value:'on', label: lang === 'es' ? 'Sí' : 'On' },
        ]}/>
      </TweakRow>

      <TweakRow label={lang === 'es' ? 'Logos de tienda' : 'Store logos'}>
        <Segment size="sm" value={tweaks.storeLogos || 'letters'} onChange={v => set('storeLogos', v)} options={[
          { value:'letters', label: lang === 'es' ? 'Iniciales' : 'Letters' },
          { value:'favicons', label: lang === 'es' ? 'Logos' : 'Logos' },
        ]}/>
      </TweakRow>

      <TweakRow label={lang === 'es' ? 'Cierre en el súper' : 'Store handoff'}>
        <Segment size="sm" value={tweaks.handoff || 'cart'} onChange={v => { set('handoff', v); window.__TWEAKS.handoff = v; }} options={[
          { value:'cart', label: lang === 'es' ? 'Carrito listo' : 'Ready cart' },
          { value:'list', label: lang === 'es' ? 'Solo lista' : 'List only' },
        ]}/>
      </TweakRow>

      <TweakRow label={tr('density', lang)}>
        <Segment size="sm" value={tweaks.density} onChange={v => set('density', v)} options={[
          { value:'comfortable', label: tr('comfortable', lang) },
          { value:'compact', label: tr('compact', lang) },
        ]}/>
      </TweakRow>

      <TweakRow label="Accent">
        <div style={{ display:'flex', gap: 6 }}>
          {[
            { v:'indigo', hue: 255 },
            { v:'plum',   hue: 310 },
            { v:'moss',   hue: 150 },
            { v:'amber',  hue: 60 },
          ].map(a => (
            <button key={a.v} onClick={() => set('accent', a.v)} style={{
              width: 22, height: 22, borderRadius: '50%',
              background: `oklch(0.55 0.18 ${a.hue})`,
              border: tweaks.accent === a.v ? '2px solid var(--ink)' : '2px solid transparent',
              outline: '1px solid var(--line)',
            }}/>
          ))}
        </div>
      </TweakRow>
    </div>
  );
}

function TweakRow({ label, children }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap: 10, marginBottom: 10, fontSize: 12 }}>
      <span style={{ color:'var(--ink-2)' }}>{label}</span>
      {children}
    </div>
  );
}

Object.assign(window, { TweaksPanel });
