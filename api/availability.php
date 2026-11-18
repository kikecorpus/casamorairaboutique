<?php
/**
 * POST /api/availability.php
 * Body JSON: { checkin, checkout, guests, room ("cualquiera"|slug) }
 * Respuesta: { ok, nights, currency, rooms:[{room,name,total,perNight,currency}] }
 */
declare(strict_types=1);
define('CM_API', true);
require __DIR__ . '/lib.php';

$cfg = cm_boot('availability', 20);
$in  = cm_body();
$q   = cm_search_input($in, $cfg);

/* 1) Listings reservables en esas fechas (paginado de 20 en 20) */
$byKey = [];  // id corto y largo -> listing
for ($page = 0; $page < 5; $page++) {
    $res  = cm_stays('POST', '/booking/search-listings', [
        'from' => $q['from'], 'to' => $q['to'], 'guests' => $q['guests'],
        'skip' => $page * 20, 'limit' => 20,
    ]);
    if ($res['status'] >= 400) cm_fail(502, 'upstream_error', 'No se pudo consultar la disponibilidad.');
    $list = $res['data'];
    if (is_array($list) && isset($list['data']) && is_array($list['data'])) $list = $list['data'];
    if (!is_array($list)) break;
    foreach ($list as $l) {
        if (!is_array($l)) continue;
        foreach (['id', '_id'] as $k) if (!empty($l[$k])) $byKey[$l[$k]] = $l;
    }
    if (count($list) < 20) break;
}

/* 2) Nos quedamos con nuestras habitaciones */
$wanted = $q['room'] === 'cualquiera' ? array_keys($cfg['rooms']) : [$q['room']];
$avail  = [];   // slug => listing
foreach ($wanted as $slug) {
    $key = $cfg['rooms'][$slug]['listing'];
    if (isset($byKey[$key])) $avail[$slug] = $byKey[$key];
}

/* 3) Precio por habitación.
 *    Si search-listings no trae precio (p. ej. no se cumple la estadía mínima),
 *    se le pide a calculate-price habitación por habitación. */
$currency  = $cfg['currency'] ?? 'COP';
$idOf      = fn(array $l) => $l['_id'] ?? $l['id'] ?? null;
$totals    = [];
$minNights = null;

foreach ($avail as $slug => $l) {
    $t = $l['bookingPrice']['_mctotal'][$currency] ?? null;
    if ($t !== null) { $totals[$slug] = (float) $t; continue; }

    $calc = cm_stays('POST', '/booking/calculate-price', [
        'from' => $q['from'], 'to' => $q['to'], 'guests' => $q['guests'],
        'listingIds' => [$idOf($l)],
    ], true);

    if ($calc['status'] >= 400) {
        $n = cm_min_nights($calc['data']);
        if ($n !== null) $minNights = $minNights === null ? $n : min($minNights, $n);
        continue;
    }
    foreach (cm_rows($calc['data']) as $row) {
        if (isset($row['_mctotal'][$currency])) { $totals[$slug] = (float) $row['_mctotal'][$currency]; break; }
    }
}

$rooms = [];
foreach ($totals as $slug => $total) {
    $rooms[] = [
        'room'     => $slug,
        'name'     => $cfg['rooms'][$slug]['name'],
        'total'    => round($total, 2),
        'perNight' => round($total / $q['nights'], 2),
        'currency' => $currency,
    ];
}

$out = [
    'ok' => true, 'nights' => $q['nights'], 'currency' => $currency, 'rooms' => $rooms,
];
if (!$rooms && $minNights !== null) { $out['reason'] = 'min_nights'; $out['minNights'] = $minNights; }
cm_out(200, $out);
