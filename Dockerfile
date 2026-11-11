# Macondo Digital — imagen TODO EN UNO (API NestJS + web Next.js en un solo contenedor).
# Pensada para EasyPanel con un único servicio "App" (fuente: ZIP subido o Git): EasyPanel/Nixpacks
# detecta este Dockerfile en la raíz y lo usa. Solo hacen falta: un servicio Postgres, las variables de
# entorno (DATABASE_URL, JWT_SECRET, CORS_ORIGIN…), un volumen en /app/storage y el dominio al puerto 3100.
#
#   docker build -t macondo-digital .
#   docker run -p 3100:3100 -e DATABASE_URL=... -e JWT_SECRET=... -v macondo_storage:/app/storage macondo-digital
#
# Dentro del contenedor la API escucha en 127.0.0.1:4100 (no expuesta) y la web en $PORT (3100) reenviando /api/*.
# Incluye la narración sintética (ADR-017): Piper en /opt/piper-venv (proceso aparte) + voz es_ES-davefx-medium.
FROM node:22-bookworm-slim AS base
# apt por https: la imagen slim no trae CA y algunas redes bloquean los .deb por http. Se arranca con el
# almacén de raíces de Node (Mozilla) solo para instalar `ca-certificates`; después apt usa el almacén del sistema.
RUN node -e "require('fs').writeFileSync('/tmp/node-ca.pem', require('tls').rootCertificates.join('\n'))" \
  && sed -i 's#http://deb.debian.org/debian-security#https://security.debian.org/debian-security#; s#http://deb.debian.org#https://deb.debian.org#' /etc/apt/sources.list.d/debian.sources \
  && apt-get -o Acquire::https::CaInfo=/tmp/node-ca.pem update \
  && apt-get -o Acquire::https::CaInfo=/tmp/node-ca.pem install -y --no-install-recommends openssl ca-certificates \
  && rm -f /tmp/node-ca.pem && rm -rf /var/lib/apt/lists/*
WORKDIR /app

FROM base AS build
ARG NEXT_PUBLIC_PUBLIC_ORIGIN=
ENV NEXT_OUTPUT=standalone \
    NEXT_TELEMETRY_DISABLED=1 \
    NEXT_PUBLIC_PUBLIC_ORIGIN=${NEXT_PUBLIC_PUBLIC_ORIGIN}
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci --include-workspace-root --workspace @macondo/shared --workspace @macondo/api --workspace @macondo/web --no-audit --no-fund
COPY packages/shared packages/shared
COPY apps/api apps/api
COPY apps/web apps/web
RUN npm run build -w @macondo/shared \
  && npm run prisma:generate -w @macondo/api \
  && npm run build -w @macondo/api \
  && npm run build -w @macondo/web

# ── Narración sintética (ADR-017): Piper en su propio venv (GPL-3, proceso aparte) + voz es_ES-davefx-medium (datos CC0).
# Se descarga en el BUILD (no en el arranque) y se verifica el SHA-256 de cada archivo. Esta etapa no viaja a la imagen final.
# (Misma etapa que en apps/api/Dockerfile; mantener ambas iguales.)
FROM base AS tts
ARG PIPER_VERSION=1.8.0
ARG PIPER_VOICE_URL=https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/davefx/medium
RUN apt-get update && apt-get install -y --no-install-recommends python3 python3-venv curl \
  && rm -rf /var/lib/apt/lists/*
RUN /usr/bin/python3.11 -m venv /opt/piper-venv \
  && /opt/piper-venv/bin/pip install --no-cache-dir --disable-pip-version-check "piper-tts==${PIPER_VERSION}" \
  && /opt/piper-venv/bin/pip uninstall -y pip setuptools \
  && SP=/opt/piper-venv/lib/python3.11/site-packages \
  && rm -rf "$SP"/numpy/*/tests "$SP"/numpy/tests "$SP"/numpy/*/*/tests "$SP"/onnxruntime/transformers "$SP"/onnxruntime/quantization "$SP"/onnxruntime/tools "$SP"/onnxruntime/datasets \
  && find /opt/piper-venv -type d -name __pycache__ -prune -exec rm -rf {} + \
  && /opt/piper-venv/bin/python -c "import piper, onnxruntime, numpy"
RUN mkdir -p /opt/piper/voices && cd /opt/piper/voices \
  && for f in es_ES-davefx-medium.onnx es_ES-davefx-medium.onnx.json MODEL_CARD; do curl -fsSL --retry 3 -o "$f" "${PIPER_VOICE_URL}/$f"; done \
  && printf '%s\n' \
       "6658b03b1a6c316ee4c265a9896abc1393353c2d9e1bca7d66c2c442e222a917  es_ES-davefx-medium.onnx" \
       "0e0dda87c732f6f38771ff274a6380d9252f327dca77aa2963d5fbdf9ec54842  es_ES-davefx-medium.onnx.json" \
       "420703b5d8ea239b729f13d83f31eea9bae5fcb89447de23ebc94aa8a4768f95  MODEL_CARD" | sha256sum -c -

FROM base AS runtime
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    API_PORT=4100 \
    API_INTERNAL_URL=http://127.0.0.1:4100 \
    PORT=3100 \
    HOSTNAME=0.0.0.0 \
    STORAGE_DIR=/app/storage \
    DEMO_CONTENT_DIR=/app/demo-content \
    TTS_ENABLED=true \
    TTS_ENGINE=piper \
    TTS_PIPER_BIN=/opt/piper-venv/bin/piper \
    TTS_VOICE=/opt/piper/voices/es_ES-davefx-medium.onnx
# Intérprete mínimo para el venv de Piper + `lame` (MP3 64 kbps). Sin pip ni herramientas de build.
# fonts-dejavu-core: sharp/librsvg necesita una fuente para rasterizar la portada SVG de los cuentos (ADR-018).
RUN apt-get update && apt-get install -y --no-install-recommends python3.11-minimal libpython3.11-stdlib lame fonts-dejavu-core \
  && rm -rf /var/lib/apt/lists/*
COPY --from=tts /opt/piper-venv /opt/piper-venv
COPY --from=tts /opt/piper /opt/piper
WORKDIR /app
# API completa (node_modules incluye prisma CLI para migraciones y ts-node para el seed opcional)
COPY --from=build /app/package.json /app/package-lock.json /app/tsconfig.base.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/shared ./packages/shared
COPY --from=build /app/apps/api ./apps/api
# Web en modo standalone (servidor autónomo de Next)
COPY --from=build /app/apps/web/.next/standalone ./web
COPY --from=build /app/apps/web/.next/static ./web/apps/web/.next/static
COPY --from=build /app/apps/web/public ./web/apps/web/public
COPY demo-content ./demo-content
COPY infra/docker/start-all.sh /usr/local/bin/macondo-start
RUN chmod +x /usr/local/bin/macondo-start && mkdir -p /app/storage && chown -R node:node /app/storage /app/web
# Humo: Piper sintetiza una frase como usuario `node` y lame la codifica (falla el build si el TTS no funciona).
RUN runuser -u node -- sh -c 'echo "Prueba de la voz de la biblioteca." | /opt/piper-venv/bin/piper -m "$TTS_VOICE" -f /tmp/tts-smoke.wav \
  && lame --quiet -b 64 -m m --resample 44.1 /tmp/tts-smoke.wav /tmp/tts-smoke.mp3 && test -s /tmp/tts-smoke.mp3 && rm -f /tmp/tts-smoke.*'
EXPOSE 3100
VOLUME ["/app/storage"]
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3100)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
ENTRYPOINT ["macondo-start"]
