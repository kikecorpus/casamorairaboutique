<?php
declare(strict_types=1);

if (!defined('CM_API')) { http_response_code(403); exit; }

/* ---------- Respuestas ---------- */
function cm_out(int $status, array $data): never {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
function cm_fail(int $status, string $code, string $message = ''): never {
    $defaults = [
        'origin_not_allowed' => 'Este sitio no está autorizado para usar el servicio de reservas.',
        'method_not_allowed' => 'Método no permitido.',
        'invalid_json'       => 'Solicitud no válida.',
        'body_too_large'     => 'Solicitud demasiado grande.',
        'upstream_error'     => 'No se pudo consultar la disponibilidad.',
    ];
    if ($message === '') $message = $defaults[$code] ?? 'No se pudo completar la solicitud.';
    cm_out($status, ['ok' => false, 'error' => $code, 'message' => $message]);
}

/* ---------- Configuración ---------- */
function cm_config(): array {
    static $cfg = null;
    if ($cfg !== null) return $cfg;
    $paths = [dirname(__DIR__, 2) . '/casamoraira-config.php', __DIR__ . '/config.php'];
    foreach ($paths as $p) {
        if (is_file($p)) {
            $loaded = require $p;
            if (is_array($loaded)) return $cfg = $loaded;
        }
    }
    error_log('[casamoraira] No se encontró casamoraira-config.php ni api/config.php');
    cm_fail(500, 'server_misconfigured', 'Servicio no disponible.');
}

/* ---------- Arranque común: cabeceras, CORS, método, rate-limit ---------- */
function cm_boot(string $bucket, int $maxPerMinute): array {
    header('Content-Type: application/json; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    header('Cache-Control: no-store');

    $cfg    = cm_config();
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if ($origin !== '') {
        $host = parse_url($origin, PHP_URL_HOST) ?: '';
        $port = parse_url($origin, PHP_URL_PORT);
        if ($host !== '' && $port) $host .= ':' . $port;      // localhost:8000
        $sameHost = $host !== '' && strcasecmp($host, $_SERVER['HTTP_HOST'] ?? '') === 0;
        if ($sameHost || in_array($origin, $cfg['allowed_origins'] ?? [], true)) {
            header('Access-Control-Allow-Origin: ' . $origin);
            header('Vary: Origin');
            header('Access-Control-Allow-Methods: POST, OPTIONS');
            header('Access-Control-Allow-Headers: Content-Type');
            header('Access-Control-Max-Age: 600');
        } else {
            cm_fail(403, 'origin_not_allowed');
        }
    }

    $method = $_SERVER['REQUEST_METHOD'] ?? '';
    if ($method === 'OPTIONS') { http_response_code(204); exit; }
    if ($method !== 'POST')    { header('Allow: POST, OPTIONS'); cm_fail(405, 'method_not_allowed'); }

    cm_rate_limit($bucket, $maxPerMinute, 60);
    return $cfg;
}

function cm_rate_limit(string $bucket, int $max, int $window): void {
    $ip   = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $file = sys_get_temp_dir() . '/cm_rl_' . md5($bucket . '|' . $ip);
    $fh   = @fopen($file, 'c+');
    if (!$fh) return;                       // si no se puede, no bloquea
    flock($fh, LOCK_EX);
    $raw  = stream_get_contents($fh);
    $hits = $raw ? json_decode($raw, true) : [];
    $now  = time();
    $hits = is_array($hits) ? array_values(array_filter($hits, fn($t) => $t > $now - $window)) : [];
    if (count($hits) >= $max) {
        flock($fh, LOCK_UN); fclose($fh);
        header('Retry-After: ' . $window);
        cm_fail(429, 'rate_limited', 'Demasiadas solicitudes. Inténtalo en un minuto.');
    }
    $hits[] = $now;
    ftruncate($fh, 0); rewind($fh); fwrite($fh, json_encode($hits));
    flock($fh, LOCK_UN); fclose($fh);
}

function cm_body(): array {
    $raw = file_get_contents('php://input', false, null, 0, 8193);
    if ($raw === false || strlen($raw) > 8192) cm_fail(413, 'body_too_large');
    $data = json_decode($raw, true);
    if (!is_array($data)) cm_fail(400, 'invalid_json');
    // Honeypot anti-bots: el campo "website" debe llegar vacío
    if (!empty($data['website'])) cm_out(200, ['ok' => true, 'rooms' => []]);
    return $data;
}

/* ---------- Validación ---------- */
function cm_date(mixed $v): ?DateTimeImmutable {
    if (!is_string($v)) return null;
    $d = DateTimeImmutable::createFromFormat('!Y-m-d', $v, new DateTimeZone('America/Bogota'));
    return ($d && $d->format('Y-m-d') === $v) ? $d : null;
}

/** Valida fechas, huéspedes y habitación. Devuelve datos limpios. */
function cm_search_input(array $in, array $cfg): array {
    $from = cm_date($in['checkin']  ?? null);
    $to   = cm_date($in['checkout'] ?? null);
    if (!$from || !$to) cm_fail(422, 'invalid_dates', 'Fechas no válidas.');

    $today = new DateTimeImmutable('today', new DateTimeZone('America/Bogota'));
    if ($from < $today)  cm_fail(422, 'past_date', 'La fecha de llegada ya pasó.');
    if ($to <= $from)    cm_fail(422, 'invalid_range', 'La salida debe ser posterior a la llegada.');

    $nights = (int) $from->diff($to)->days;
    if ($nights > ($cfg['max_nights'] ?? 30)) {
        cm_fail(422, 'too_long', 'Estancia máxima: ' . ($cfg['max_nights'] ?? 30) . ' noches.');
    }

    $guests = filter_var($in['guests'] ?? 1, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => $cfg['max_guests'] ?? 10]]);
    if ($guests === false) cm_fail(422, 'invalid_guests', 'Número de huéspedes no válido.');

    $room = $in['room'] ?? 'cualquiera';
    if (!is_string($room) || ($room !== 'cualquiera' && !isset($cfg['rooms'][$room]))) {
        cm_fail(422, 'invalid_room', 'Habitación no válida.');
    }

    return [
        'from' => $from->format('Y-m-d'), 'to' => $to->format('Y-m-d'),
        'nights' => $nights, 'guests' => $guests, 'room' => $room,
    ];
}

/* ---------- Cliente de Stays ---------- */
/** Llama a Stays. Devuelve ['status'=>int, 'data'=>mixed]. Falla con 502 si no hay conexión. */
function cm_stays(string $method, string $path, ?array $body = null): array {
    $cfg = cm_config();
    $ch  = curl_init(rtrim($cfg['stays_base_url'], '/') . $path);
    curl_setopt_array($ch, [
        CURLOPT_CUSTOMREQUEST  => $method,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 8,
        CURLOPT_TIMEOUT        => 20,
        CURLOPT_HTTPHEADER     => [
            'Authorization: Basic ' . base64_encode($cfg['client_id'] . ':' . $cfg['client_secret']),
            'Content-Type: application/json',
            'Accept: application/json',
        ],
    ]);
    if ($body !== null) curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));

    $raw    = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err    = curl_error($ch);


    if ($raw === false) {
        error_log("[casamoraira] Stays $method $path sin respuesta: $err");
        cm_fail(502, 'upstream_unreachable', 'No se pudo consultar la disponibilidad. Inténtalo de nuevo.');
    }
    if ($status >= 400) {
        error_log("[casamoraira] Stays $method $path -> $status " . substr($raw, 0, 400));
    }
    return ['status' => $status, 'data' => json_decode($raw, true)];
}
