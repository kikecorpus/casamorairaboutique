<?php
/**
 * POST /api/checkout.php
 * Body JSON: { checkin, checkout, guests, room (slug), firstName, lastName, email }
 * Respuesta: { ok, url }  -> el navegador redirige al huésped a esa URL de Stays.
 */
declare(strict_types=1);
define('CM_API', true);
require __DIR__ . '/lib.php';

$cfg = cm_boot('checkout', 6);
$in  = cm_body();
$q   = cm_search_input($in, $cfg);
if ($q['room'] === 'cualquiera') cm_fail(422, 'room_required', 'Elige una habitación.');

$clean = fn($v) => is_string($v) ? trim(preg_replace('/\s+/u', ' ', $v)) : '';
$first = $clean($in['firstName'] ?? '');
$last  = $clean($in['lastName']  ?? '');
$email = $clean($in['email']     ?? '');
if (!preg_match('/^.{1,60}$/us', $first) || !preg_match('/^.{1,60}$/us', $last)) {
    cm_fail(422, 'invalid_name', 'Escribe tu nombre y apellido.');
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 120) {
    cm_fail(422, 'invalid_email', 'Correo electrónico no válido.');
}

$res = cm_stays('POST', '/book-request', [
    'from'    => $q['from'],
    'to'      => $q['to'],
    'aptid'   => $cfg['rooms'][$q['room']]['listing'],
    'persons' => $q['guests'],
    'client'  => ['email' => $email, 'fName' => $first, 'lName' => $last],
]);

if ($res['status'] >= 400) {
    // 401/403 = credenciales; el resto suele ser "ya no disponible"
    if (in_array($res['status'], [401, 403], true)) cm_fail(502, 'upstream_error', 'Servicio no disponible.');
    cm_fail(409, 'not_available', 'Esas fechas ya no están disponibles. Prueba otras.');
}

$data = is_array($res['data']) ? $res['data'] : [];
$url  = $data['url'] ?? $data['checkoutUrl'] ?? $data['redirectUrl'] ?? $data['link'] ?? null;
if (!is_string($url) || !preg_match('#^https://#i', $url)) {
    error_log('[casamoraira] book-request sin URL en la respuesta: ' . substr(json_encode($data), 0, 400));
    cm_fail(502, 'no_checkout_url', 'No se pudo iniciar la reserva. Escríbenos por WhatsApp.');
}

cm_out(200, ['ok' => true, 'url' => $url]);
