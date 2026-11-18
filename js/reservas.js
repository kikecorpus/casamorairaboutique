/**
 * CASA MORAIRA — reservas.js
 * Formulario de reservas conectado al intermediario PHP (/api), que a su vez
 * habla con Stays. Aquí NO hay credenciales: solo se llama a nuestra API.
 *
 * Flujo: 1) Comprobar disponibilidad  ->  2) "Reservar" en una habitación
 *        ->  3) nombre + correo  ->  4) redirección al checkout de Stays.
 *
 * Para probar desde otro dominio (p. ej. GitHub Pages) define ANTES de este
 * script:  <script>window.CM_API_BASE = 'https://casamoraira.co/api';</script>
 */
(function () {
  'use strict';

  const form = document.getElementById('bookingForm');
  const results = document.getElementById('bookingResults');
  if (!form || !results) return;

  const API = (window.CM_API_BASE || '/api').replace(/\/$/, '');
  const WHATSAPP = 'https://wa.me/573008890099';
  let lastSearch = null;

  /* ---------- utilidades ---------- */
  const toISO = (d) => {
    const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return z.toISOString().slice(0, 10);
  };

  const money = (value, currency) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency', currency, maximumFractionDigits: 0,
    }).format(value);

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  async function api(endpoint, payload) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 25000);
    try {
      const res = await fetch(`${API}/${endpoint}.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: ctrl.signal,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        return { ok: false, message: data.message || 'No se pudo completar la solicitud.' };
      }
      return data;
    } catch (err) {
      return { ok: false, message: 'No hay conexión con el servidor de reservas. Inténtalo de nuevo.' };
    } finally {
      clearTimeout(timer);
    }
  }

  function show(nodes) {
    results.replaceChildren(...nodes);
    results.hidden = false;
  }

  function message(text, withWhatsApp) {
    const p = el('p', null, text + ' ');
    if (withWhatsApp) {
      const a = el('a', null, 'Escríbenos por WhatsApp');
      a.href = WHATSAPP; a.target = '_blank'; a.rel = 'noopener noreferrer';
      p.appendChild(a);
    }
    show([p]);
  }

  /* ---------- paso 1: disponibilidad ---------- */
  const inEl = form.elements.checkin;
  const outEl = form.elements.checkout;
  inEl.min = toISO(new Date());
  outEl.min = inEl.min;
  inEl.addEventListener('change', () => {
    if (!inEl.value) return;
    const next = new Date(inEl.value + 'T00:00:00');
    next.setDate(next.getDate() + 1);
    outEl.min = toISO(next);
    if (outEl.value && outEl.value < outEl.min) outEl.value = '';
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submit = form.querySelector('button[type="submit"]');
    const label = submit.textContent;

    lastSearch = {
      checkin: inEl.value,
      checkout: outEl.value,
      guests: Number(form.elements.guests.value),
      room: form.elements.room.value,
    };

    submit.disabled = true;
    submit.textContent = 'CONSULTANDO…';
    const data = await api('availability', lastSearch);
    submit.disabled = false;
    submit.textContent = label;

    if (!data.ok) return message(data.message, false);
    if (!data.rooms.length && data.minNights) {
      return message(`Para esas fechas la estadía mínima es de ${data.minNights} noches. Prueba con una estancia más larga o`, true);
    }
    if (!data.rooms.length) {
      return message('No hay habitaciones disponibles para esas fechas. Prueba otras fechas o', true);
    }
    renderRooms(data);
  });

  function renderRooms(data) {
    const cards = data.rooms.map((room) => {
      const card = el('div', 'result-card');

      const info = el('div');
      info.appendChild(el('h4', null, room.name));
      info.appendChild(el('p', 'result-card__detail',
        `${data.nights} noche${data.nights === 1 ? '' : 's'} · ${money(room.total, room.currency)} en total`));

      const action = el('div', 'result-card__action');
      action.appendChild(el('p', 'price', money(room.perNight, room.currency) + ' / noche'));
      const btn = el('button', 'btn btn-outline', 'Reservar');
      btn.type = 'button';
      btn.addEventListener('click', () => openGuestPanel(room));
      action.appendChild(btn);

      card.append(info, action);
      return card;
    });

    show(cards);
  }

  /* ---------- paso 2: datos del huésped y checkout ---------- */
  function field(id, label, type, extra) {
    const wrap = el('div', 'field');
    const lab = el('label', null, label);
    lab.htmlFor = id;
    const input = el('input');
    input.id = id; input.name = id; input.type = type; input.required = true;
    Object.assign(input, extra || {});
    wrap.append(lab, input);
    return wrap;
  }

  function openGuestPanel(room) {
    const old = results.querySelector('.guest-panel');
    if (old) old.remove();

    const panel = el('form', 'guest-panel');
    panel.appendChild(el('h4', 'guest-panel__title', `Reservar ${room.name}`));
    panel.append(
      field('firstName', 'Nombre', 'text', { autocomplete: 'given-name', maxLength: 60 }),
      field('lastName', 'Apellido', 'text', { autocomplete: 'family-name', maxLength: 60 }),
      field('email', 'Correo electrónico', 'email', { autocomplete: 'email', maxLength: 120 })
    );

    // Campo trampa para bots (los humanos no lo ven)
    const trap = el('div', 'visually-hidden');
    const trapInput = el('input');
    trapInput.type = 'text'; trapInput.name = 'website'; trapInput.tabIndex = -1;
    trapInput.autocomplete = 'off'; trapInput.setAttribute('aria-hidden', 'true');
    trap.appendChild(trapInput);
    panel.appendChild(trap);

    const go = el('button', 'btn btn-primary', 'CONTINUAR AL PAGO');
    go.type = 'submit';
    panel.appendChild(go);
    const status = el('p', 'guest-panel__status');
    status.setAttribute('role', 'status');
    panel.appendChild(status);

    panel.addEventListener('submit', async (e) => {
      e.preventDefault();
      go.disabled = true;
      go.textContent = 'REDIRIGIENDO…';
      status.textContent = '';

      const data = await api('checkout', {
        ...lastSearch,
        room: room.room,
        firstName: panel.elements.firstName.value,
        lastName: panel.elements.lastName.value,
        email: panel.elements.email.value,
        website: trapInput.value,
      });

      if (data.ok && data.url) {
        window.location.href = data.url;          // checkout seguro de Stays
        return;
      }
      go.disabled = false;
      go.textContent = 'CONTINUAR AL PAGO';
      status.textContent = data.message || 'No se pudo iniciar la reserva.';
    });

    results.appendChild(panel);
    panel.elements.firstName.focus();
    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
})();
