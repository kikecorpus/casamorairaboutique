# Intermediario Stays (PHP)

Pequeña API que conecta el sitio con Stays **sin exponer las credenciales** en el navegador.

```
Navegador ──► /api/availability.php ──► Stays  (search-listings, calculate-price)
Navegador ──► /api/checkout.php     ──► Stays  (book-request → URL de pago)
```

Requisitos de Hostinger: **PHP 8.1 o superior** (hPanel → Avanzado → Configuración de PHP) y la extensión `curl` (viene activa por defecto).

## Instalación en Hostinger

1. Sube el sitio a `public_html/` con la carpeta `api/` incluida (Administrador de archivos o Git).
2. Copia `api/config.example.php` como **`casamoraira-config.php`** y súbelo **una carpeta por encima de `public_html`** (así no es accesible por web). Ej.: `/home/uXXXX/domains/casamoraira.co/casamoraira-config.php`.
   Alternativa menos segura: `api/config.php` (el `.htaccess` de `api/` lo bloquea).
3. Rellena en ese archivo: `stays_base_url`, `client_id`, `client_secret`, `currency` y el `listing` de cada habitación.
4. Prueba:
   ```bash
   curl -X POST https://casamoraira.co/api/availability.php \
     -H 'Content-Type: application/json' \
     -d '{"checkin":"2026-12-20","checkout":"2026-12-23","guests":2,"room":"cualquiera"}'
   ```

## Mientras sigas en GitHub Pages
GitHub Pages no ejecuta PHP. Para probar antes de migrar, sube **solo la carpeta `api/`** a Hostinger y en el sitio de Pages define, antes de `reservas.js`:
```html
<script>window.CM_API_BASE = 'https://TU-DOMINIO-HOSTINGER/api';</script>
```
y añade `https://kikecorpus.github.io` a `allowed_origins`. Quítalo al terminar la migración.

## Qué valida el servidor
Fechas (formato, no pasadas, salida > llegada, máx. noches), huéspedes, habitación permitida, nombre y correo, CORS por origen, límite de peticiones por IP (20/min disponibilidad, 6/min checkout), campo trampa anti-bots y cuerpo máx. 8 KB. Los errores de Stays se registran en el log de PHP y al visitante solo se le muestra un mensaje genérico.

## ⚠ Verificar contra tu Swagger (`/external/v1/docs/`)
La documentación pública de Stays que leí tenía huecos, así que confirma:
- **URL base** de tu instancia (`stays_base_url`).
- `book-request`: el nombre del campo de email dentro de `client` (supuse `email`) y la clave de la respuesta con la URL de pago (acepto `url`, `checkoutUrl`, `redirectUrl` o `link`).
- Que el `listing` configurado coincide con el `id` corto o `_id` que devuelve `search-listings`.
- Que `_mctotal` incluye la moneda de `currency`.
