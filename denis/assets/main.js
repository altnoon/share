// Mobile menu toggle
(function () {
  var btn = document.querySelector('.menu-btn');
  var nav = document.getElementById('nav');
  if (!btn || !nav) return;
  btn.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
})();

// Parts request form: compose an email in the visitor's mail app (no server needed)
(function () {
  var form = document.querySelector('.rfq-form');
  if (!form) return;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var lines = [];
    form.querySelectorAll('.field').forEach(function (f) {
      var label = f.querySelector('label, legend');
      var input = f.querySelector('input:not([type=radio]), textarea');
      var radio = f.querySelector('input[type=radio]:checked');
      var val = radio ? radio.value : (input ? input.value.trim() : '');
      if (label && val) lines.push(label.childNodes[0].textContent.trim() + ': ' + val);
    });
    var urgent = form.querySelector('input[type=radio]:checked');
    var subject = form.dataset.subject + (urgent && urgent !== form.querySelector('input[type=radio]') ? ' – URGENT' : '');
    location.href = 'mailto:' + form.dataset.to + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(lines.join('\n'));
  });
})();

// Photo galleries: open a photo large with its caption; arrows, keyboard and swipe to browse
(function () {
  var galleries = document.querySelectorAll('[data-lightbox]');
  if (!galleries.length || !window.HTMLDialogElement) return;
  var dlg = document.createElement('dialog');
  dlg.className = 'lightbox';
  dlg.setAttribute('aria-label', 'Photo viewer');
  dlg.innerHTML = '<div class="lb-top"><span class="lb-count"></span><button class="lb-close" aria-label="Close">×</button></div>' +
    '<div class="lb-stage"><button class="lb-prev" aria-label="Previous photo">‹</button><figure><img alt=""></figure><button class="lb-next" aria-label="Next photo">›</button></div>' +
    '<figcaption class="lb-cap"></figcaption>';
  document.body.appendChild(dlg);
  var im = dlg.querySelector('img'), cap = dlg.querySelector('.lb-cap'), count = dlg.querySelector('.lb-count');
  var items = [], i = 0;
  function show(n) {
    i = (n + items.length) % items.length;
    var a = items[i];
    im.style.maxWidth = '';
    im.onload = function () { im.style.maxWidth = 'min(100%, ' + Math.round(im.naturalWidth * 1.25) + 'px)'; }; // don't blow small photos up past ~125%
    im.src = a.href; im.alt = a.dataset.caption || '';
    cap.textContent = a.dataset.caption || '';
    count.textContent = (i + 1) + ' / ' + items.length;
  }
  galleries.forEach(function (g) {
    var links = Array.prototype.slice.call(g.querySelectorAll('a'));
    links.forEach(function (a, n) {
      a.addEventListener('click', function (e) { e.preventDefault(); items = links; show(n); dlg.showModal(); });
    });
  });
  dlg.querySelector('.lb-close').onclick = function () { dlg.close(); };
  dlg.querySelector('.lb-prev').onclick = function () { show(i - 1); };
  dlg.querySelector('.lb-next').onclick = function () { show(i + 1); };
  dlg.addEventListener('click', function (e) { if (e.target === dlg || e.target.tagName === 'FIGURE') dlg.close(); });
  dlg.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') show(i - 1);
    if (e.key === 'ArrowRight') show(i + 1);
  });
  var x0 = null;
  dlg.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  dlg.addEventListener('touchend', function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (Math.abs(dx) > 40) show(dx < 0 ? i + 1 : i - 1);
  });
})();

// Keep the quick-links strip stuck right under the sticky header, whatever the header's height
(function () {
  var h = document.querySelector('.site-header');
  if (!h || !document.querySelector('.ticker')) return;
  function set() { document.documentElement.style.setProperty('--header-h', h.offsetHeight + 'px'); }
  set(); addEventListener('resize', set);
})();

// Reveal the overhaul steps one by one when they scroll into view
(function () {
  var els = document.querySelectorAll('[data-reveal]');
  if (!els.length || !('IntersectionObserver' in window)) return;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { threshold: 0.25 });
  els.forEach(function (el) { el.classList.add('ready'); io.observe(el); });
})();

/* Projects world map: pins select a place, tabs select a job */
(function () {
  var map = document.querySelector('[data-worldmap]');
  if (!map) return;
  var pins = map.querySelectorAll('.wm-pin'), groups = map.querySelectorAll('.wm-group');
  function showJob(group, id) {
    group.querySelectorAll('.wm-job').forEach(function (j) { j.hidden = j.id !== 'job-' + id; });
    group.querySelectorAll('[role=tab]').forEach(function (t) { t.setAttribute('aria-selected', t.dataset.job === String(id)); });
  }
  function select(place, scroll) {
    pins.forEach(function (p) { p.setAttribute('aria-pressed', p.dataset.place === place); });
    groups.forEach(function (g) {
      g.hidden = g.dataset.place !== place;
      if (!g.hidden) { var first = g.querySelector('.wm-job'); showJob(g, first.id.slice(4)); }
    });
    var panel = map.querySelector('.wm-panel'); panel.scrollTop = 0;
    if (scroll && window.matchMedia('(max-width: 960px)').matches) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  pins.forEach(function (p) { p.addEventListener('click', function () { select(p.dataset.place, true); }); });
  map.querySelectorAll('[role=tab]').forEach(function (t) {
    t.addEventListener('click', function () { showJob(t.closest('.wm-group'), t.dataset.job); });
  });
  select(pins[0].dataset.place, false);
})();
