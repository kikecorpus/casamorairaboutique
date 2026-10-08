#!/usr/bin/env bash
# Une los módulos de css/src/ (en el orden de build-manifest.txt) en css/main.css.
# Uso:  ./css/build-css.sh        (desde la raíz del proyecto)
set -euo pipefail
cd "$(dirname "$0")"
OUT="main.css"
{
  echo "/* =========================================================="
  echo "   CASA MORAIRA — main.css  (ARCHIVO GENERADO, no editar)"
  echo "   Edita los módulos en css/src/ y ejecuta ./css/build-css.sh"
  echo "   ========================================================== */"
  while IFS= read -r f; do
    [ -z "$f" ] && continue
    echo; echo "/* >>> src/$f */"
    cat "src/$f"
  done < src/build-manifest.txt
} > "$OUT"
echo "✔ $OUT generado ($(wc -c < "$OUT") bytes, $(grep -c . src/build-manifest.txt) módulos)"
