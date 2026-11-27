/* Praxis Carina Schönfeld – kleines, abhängigkeitsfreies Script */
(function () {
  'use strict';

  /* Header-Linie beim Scrollen */
  var header = document.querySelector('.site-header');
  var onScroll = function () { header && header.classList.toggle('is-scrolled', window.scrollY > 8); };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Mobile Navigation */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('nav');
  if (toggle && nav) {
    var setOpen = function (open) {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
    };
    toggle.addEventListener('click', function () { setOpen(!nav.classList.contains('is-open')); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
  }

  /* Aktiven Abschnitt in der Navigation markieren */
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav a[href^="#"]'));
  if ('IntersectionObserver' in window && links.length) {
    var byId = {};
    links.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && byId[en.target.id]) {
          links.forEach(function (a) { a.classList.remove('is-active'); });
          byId[en.target.id].classList.add('is-active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(byId).forEach(function (id) { var s = document.getElementById(id); if (s) spy.observe(s); });
  }

  /* Dezente Einblendung */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* Akkordeon per Anker öffnen (z. B. Link auf #unterlagen innerhalb eines details) */
  var openFromHash = function () {
    var t = location.hash && document.querySelector(location.hash);
    var d = t && t.closest('details');
    if (d) d.open = true;
  };
  window.addEventListener('hashchange', openFromHash);
  openFromHash();

  /* Anliegen im Formular vorauswählen (data-anliegen="Gruppentherapie") */
  var select = document.getElementById('f-anliegen');
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-anliegen]');
    if (a && select) select.value = a.getAttribute('data-anliegen');
  });

  /* Kontaktformular – sendet per fetch an kontakt.php, ohne Seitenwechsel */
  var form = document.getElementById('kontaktformular');
  if (form) {
    var status = form.querySelector('.form-status');
    var show = function (msg, ok) {
      status.textContent = msg;
      status.className = 'form-status ' + (ok ? 'is-ok' : 'is-error');
    };
    if (/[?&]gesendet=1/.test(location.search)) show('Vielen Dank für Ihre Nachricht! Ich melde mich so schnell wie möglich bei Ihnen.', true);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) {
        var first = form.querySelector(':invalid');
        show('Bitte füllen Sie alle Pflichtfelder (*) aus und prüfen Sie Ihre E-Mail-Adresse.', false);
        if (first) first.focus();
        return;
      }
      var btn = form.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = 'Wird gesendet …';
      fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
        .then(function (r) { return r.json().catch(function () { return { ok: r.ok }; }); })
        .then(function (res) {
          if (res && res.ok) {
            form.reset();
            show('Vielen Dank für Ihre Nachricht! Ich melde mich so schnell wie möglich bei Ihnen.', true);
          } else {
            show((res && res.error) || 'Beim Senden ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut oder schreiben Sie direkt an info@schoenfeld-psychotherapie.de.', false);
          }
        })
        .catch(function () {
          show('Beim Senden ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut oder schreiben Sie direkt an info@schoenfeld-psychotherapie.de.', false);
        })
        .then(function () { btn.disabled = false; btn.textContent = 'Anfrage senden'; });
    });
  }

  /* Jahr im Footer */
  var y = document.querySelector('[data-year]');
  if (y) y.textContent = new Date().getFullYear();
})();
