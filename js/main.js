/**
 * CASA MORAIRA — main.js
 * -----------------------------------------------------------------------
 * 1) Header: cambia de estilo al hacer scroll
 * 2) Menú hamburguesa para móvil
 * 3) Aparición progresiva de elementos al hacer scroll (IntersectionObserver)
 * 4) Formulario de reservas: simulación de comprobación de disponibilidad
 *    (preparado para conectarse más adelante a un motor de reservas real)
 * -----------------------------------------------------------------------
 */
(function () {
  'use strict';

  /* ---------- 1) Header al hacer scroll ---------- */
  const header = document.getElementById('siteHeader');
  const onScrollHeader = () => {
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 40);
  };
  document.addEventListener('scroll', onScrollHeader, { passive: true });
  onScrollHeader();

  /* ---------- 2) Menú hamburguesa ---------- */
  const menuToggle = document.getElementById('menuToggle');
  const mainNav = document.getElementById('mainNav');

  if (menuToggle && mainNav) {
    menuToggle.addEventListener('click', () => {
      const isOpen = mainNav.classList.toggle('is-open');
      menuToggle.setAttribute('aria-expanded', String(isOpen));
      menuToggle.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Cierra el menú al pulsar un enlace (navegación por anclas)
    mainNav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        if (mainNav.classList.contains('is-open')) {
          mainNav.classList.remove('is-open');
          menuToggle.setAttribute('aria-expanded', 'false');
          menuToggle.setAttribute('aria-label', 'Abrir menú');
          document.body.style.overflow = '';
        }
      });
    });
  }

  /* ---------- 3) Aparición progresiva al hacer scroll ---------- */
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
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    );
    revealEls.forEach((el) => observer.observe(el));
  } else {
    // Fallback: si no hay soporte, se muestran directamente
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------- 4) Formulario de reservas (simulado) ---------- */
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

  function nightsBetween(checkin, checkout) {
    const d1 = new Date(checkin);
    const d2 = new Date(checkout);
    const diff = (d2 - d1) / (1000 * 60 * 60 * 24);
    return diff > 0 ? Math.round(diff) : 0;
  }

  function renderResults(rooms, nights) {
    if (!bookingResults) return;
    bookingResults.innerHTML = '';

    if (!rooms.length) {
      bookingResults.hidden = false;
      bookingResults.innerHTML =
        '<p>No hay habitaciones disponibles para esas fechas. (Resultado de ejemplo — este formulario aún no está conectado a un sistema de reservas real.)</p>';
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
        </div>
      `;
      bookingResults.appendChild(card);
    });

    bookingResults.hidden = false;
  }

  if (bookingForm) {
    bookingForm.addEventListener('submit', (event) => {
      event.preventDefault();

      const checkin = bookingForm.checkin.value;
      const checkout = bookingForm.checkout.value;
      const roomChoice = bookingForm.room.value;

      const nights = nightsBetween(checkin, checkout) || 1;

      let available = ROOMS_DEMO;
      if (roomChoice !== 'cualquiera') {
        available = ROOMS_DEMO.filter((r) => r.id === roomChoice);
      }

      // NOTA: esta comprobación es una simulación con fines de maquetación.
      // Sustituir por una llamada real a la API/PMS del hotel, que reciba
      // checkin, checkout, guests y room, y devuelva la disponibilidad real.
      renderResults(available, nights);

      bookingResults.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
})();
