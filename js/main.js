/**
 * CASA MORAIRA — main.js
 * 1) Header: cambia de estilo al hacer scroll
 * 2) Menú hamburguesa (móvil/tablet): Escape, cierre al navegar y al ampliar la ventana
 * 3) Aparición progresiva (IntersectionObserver)
 * 4) Formulario de reservas (simulado, listo para conectar a un PMS/API)
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

  /* 3) Aparición progresiva al hacer scroll */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.05, rootMargin: '0px 0px -40px 0px' }
    );
    revealEls.forEach((el) => observer.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
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
