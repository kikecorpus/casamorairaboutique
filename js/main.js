/**
 * CASA MORAIRA — main.js
 * 1) Header: cambia de estilo al hacer scroll
 * 2) Menú hamburguesa (móvil/tablet): Escape, cierre al navegar y al ampliar la ventana
 * 3) Aparición progresiva (IntersectionObserver)
 * 4) Formulario de reservas (simulado, listo para conectar a un PMS/API)
 * 5) Animaciones: configuración automática, parallax del hero y contador de reseñas
 */
(function () {
  'use strict';

  /* 1) Header al hacer scroll */
  const header = document.getElementById('siteHeader');
  const onScrollHeader = () => {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 40);
  };
  document.addEventListener('scroll', onScrollHeader, { passive: true });
  onScrollHeader();

  /* 2) Menú hamburguesa */
  const menuToggle = document.getElementById('menuToggle');
  const mainNav = document.getElementById('mainNav');

  function setMenu(open) {
    if (!menuToggle || !mainNav) return;
    mainNav.classList.toggle('is-open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    document.body.style.overflow = open ? 'hidden' : '';
  }

  if (menuToggle && mainNav) {
    menuToggle.addEventListener('click', () => setMenu(!mainNav.classList.contains('is-open')));
    mainNav.querySelectorAll('a').forEach((link) =>
      link.addEventListener('click', () => setMenu(false))
    );
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mainNav.classList.contains('is-open')) {
        setMenu(false);
        menuToggle.focus();
      }
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 1100) setMenu(false);
    });
  }

  /* 3) Aparición progresiva al hacer scroll
        Las animaciones se declaran aquí (MOTION) para no tocar el HTML de
        cada página. Para animar algo nuevo basta con añadir una línea. */
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // [selector, { variant, step (s entre elementos), base (s de retraso inicial), mask }]
  const MOTION = [
    // Home
    ['.intro-media',                { variant: 'left' }],
    ['.intro-media img',            { mask: true }],
    ['.intro-text',                 { variant: 'right' }],
    ['.intro-feature',              { step: 0.12, base: 0.3 }],
    ['.experience-strip figure',    { variant: 'zoom', step: 0.12 }],
    ['.location iframe',            { variant: 'left' }],
    ['.location-content',           { variant: 'right' }],
    ['.location-item',              { variant: 'right', step: 0.15, base: 0.3 }],
    // Reseñas
    ['.reviews__header',            {}],
    ['.reviews__profile',           { variant: 'left' }],
    ['.reviews__score',             { variant: 'right', base: 0.15 }],
    ['.reviews__item',              { variant: 'zoom', step: 0.15 }],
    ['.reviews__action',            {}],
    // Páginas interiores
    ['.feature__media img',         { mask: true }],
    ['.feature__copy > *',          { step: 0.1, base: 0.15 }],
    ['.info-card',                  { variant: 'zoom', step: 0.1 }],
    ['.details__item',              { step: 0.1 }],
    ['.faq__item',                  { step: 0.06 }],
    ['.room-gallery > a',           { variant: 'zoom', step: 0.1 }],
    ['.other-room-card',            { variant: 'zoom', step: 0.1 }],
    ['.gallery-split__gallery img', { variant: 'zoom', step: 0.15 }],
  ];

  // La tira de experiencia ya no aparece como bloque: lo hace foto a foto
  document.querySelectorAll('.experience-strip.reveal').forEach((el) => el.classList.remove('reveal'));

  MOTION.forEach(([selector, opt]) => {
    // Agrupa por contenedor padre para que el escalonado empiece de cero en cada bloque
    const groups = new Map();
    document.querySelectorAll(selector).forEach((el) => {
      const parent = el.parentElement;
      if (!groups.has(parent)) groups.set(parent, []);
      groups.get(parent).push(el);
    });
    groups.forEach((els) => {
      els.forEach((el, i) => {
        if (opt.mask) el.classList.add('mask-reveal');
        else el.classList.add('reveal');
        if (opt.variant && !el.dataset.reveal) el.dataset.reveal = opt.variant;
        const delay = (opt.base || 0) + i * (opt.step || 0);
        if (delay) el.style.setProperty('--reveal-delay', delay.toFixed(2) + 's');
      });
    });
  });

  // Las imágenes con cortina están recortadas (clip-path) y el observer no las
  // "ve": se observa su contenedor y, cuando entra, se destapa la imagen.
  const maskTargets = new Map();   // contenedor -> [imágenes]
  document.querySelectorAll('.mask-reveal').forEach((img) => {
    const box = img.parentElement;
    if (!maskTargets.has(box)) maskTargets.set(box, []);
    maskTargets.get(box).push(img);
  });

  const revealEls = [...document.querySelectorAll('.reveal'), ...maskTargets.keys()];
  const showAll = () => document.querySelectorAll('.reveal, .mask-reveal').forEach((el) => el.classList.add('is-visible'));

  if ('IntersectionObserver' in window && revealEls.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          observer.unobserve(el);
          if (el.classList.contains('reveal')) {
            el.classList.add('is-visible');
            // Tras animar, quita el retraso para que los hover posteriores respondan al instante
            el.addEventListener('transitionend', function clean(e) {
              if (e.target !== el) return;
              el.style.removeProperty('--reveal-delay');
              el.removeEventListener('transitionend', clean);
            });
          }
          (maskTargets.get(el) || []).forEach((img) => img.classList.add('is-visible'));
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );
    revealEls.forEach((el) => observer.observe(el));
    // Red de seguridad: si algo no llegó a activarse, nunca deja una imagen oculta
    setTimeout(() => {
      document.querySelectorAll('.mask-reveal:not(.is-visible)').forEach((img) => {
        const r = img.parentElement.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) img.classList.add('is-visible');
      });
    }, 2500);
  } else {
    showAll();
  }

  /* 3b) Parallax del hero: --hero-p va de 0 (arriba) a 1 (hero fuera de pantalla) */
  const hero = document.querySelector('.hero');
  if (hero && !reduceMotion) {
    let ticking = false;
    const updateHero = () => {
      const p = Math.min(Math.max(window.scrollY / (hero.offsetHeight * 0.9), 0), 1);
      hero.style.setProperty('--hero-p', p.toFixed(3));
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(updateHero); }
    }, { passive: true });
  }

  /* 3c) Contador de la valoración (9,2): sube de 0 al valor real al aparecer */
  const scoreEl = document.querySelector('.reviews__score-number strong');
  if (scoreEl && 'IntersectionObserver' in window && !reduceMotion) {
    const target = parseFloat(scoreEl.textContent.replace(',', '.'));
    const decimals = (scoreEl.textContent.split(/[.,]/)[1] || '').length;
    if (!isNaN(target)) {
      const countObserver = new IntersectionObserver((entries) => {
        if (!entries[0].isIntersecting) return;
        countObserver.disconnect();
        const duration = 1600;
        const t0 = performance.now();
        const tick = (now) => {
          const k = Math.min((now - t0) / duration, 1);
          const eased = 1 - Math.pow(1 - k, 3);                       // easeOutCubic
          scoreEl.textContent = (target * eased).toFixed(decimals).replace('.', ',');
          if (k < 1) requestAnimationFrame(tick);
        };
        scoreEl.textContent = (0).toFixed(decimals).replace('.', ',');
        requestAnimationFrame(tick);
      }, { threshold: 0.6 });
      countObserver.observe(scoreEl);
    }
  }

  /* 4) Formulario de reservas (simulado) */
  const bookingForm = document.getElementById('bookingForm');
  const bookingResults = document.getElementById('bookingResults');

  // Datos de ejemplo — sustituir por la respuesta real de un motor de reservas (API/PMS)
  const ROOMS_DEMO = [
    { id: 'sol', name: 'Sol', price: 120 },
    { id: 'arena', name: 'Arena', price: 110 },
    { id: 'luna', name: 'Luna', price: 115 },
    { id: 'agua', name: 'Agua', price: 135 },
    { id: 'mar', name: 'Mar', price: 150 },
  ];

  const toISO = (d) => {
    const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return z.toISOString().slice(0, 10);
  };

  function nightsBetween(checkin, checkout) {
    const diff = (new Date(checkout) - new Date(checkin)) / 86400000;
    return diff > 0 ? Math.round(diff) : 0;
  }

  function showMessage(text) {
    if (!bookingResults) return;
    bookingResults.innerHTML = '';
    const p = document.createElement('p');
    p.textContent = text;
    bookingResults.appendChild(p);
    bookingResults.hidden = false;
  }

  function renderResults(rooms, nights) {
    if (!bookingResults) return;
    bookingResults.innerHTML = '';
    if (!rooms.length) {
      showMessage('No hay habitaciones disponibles para esas fechas. (Resultado de ejemplo — este formulario aún no está conectado a un sistema de reservas real.)');
      return;
    }
    rooms.forEach((room) => {
      const total = room.price * nights;
      const card = document.createElement('div');
      card.className = 'result-card';
      card.innerHTML = `
        <div>
          <h4>${room.name}</h4>
          <p style="margin:0;color:var(--carbon-suave);font-size:0.85rem;">
            ${nights} noche${nights === 1 ? '' : 's'} · ${total} €* en total
          </p>
        </div>
        <div style="text-align:right;">
          <p class="price">${room.price} €*</p>
          <a class="btn btn-outline" href="habitaciones/${room.id}.html">Ver / Reservar</a>
        </div>`;
      bookingResults.appendChild(card);
    });
    bookingResults.hidden = false;
  }

  if (bookingForm) {
    const inEl = bookingForm.elements.checkin;
    const outEl = bookingForm.elements.checkout;
    const today = new Date();
    inEl.min = toISO(today);
    outEl.min = inEl.min;
    inEl.addEventListener('change', () => {
      if (!inEl.value) return;
      const next = new Date(inEl.value + 'T00:00:00');
      next.setDate(next.getDate() + 1);
      outEl.min = toISO(next);
      if (outEl.value && outEl.value < outEl.min) outEl.value = '';
    });

    bookingForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const nights = nightsBetween(inEl.value, outEl.value);
      if (!nights) {
        showMessage('La fecha de salida debe ser posterior a la de llegada.');
        return;
      }
      const roomChoice = bookingForm.elements.room.value;
      // NOTA: simulación. Sustituir por una llamada real a la API/PMS con checkin, checkout, guests y room.
      const available = roomChoice === 'cualquiera'
        ? ROOMS_DEMO
        : ROOMS_DEMO.filter((r) => r.id === roomChoice);
      renderResults(available, nights);
      bookingResults.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
})();
