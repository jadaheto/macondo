# Macondo Digital — API (NestJS + Prisma). Contexto de build: RAÍZ del repositorio.
#   docker build -f apps/api/Dockerfile -t macondo-api .
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
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci --workspace @macondo/shared --workspace @macondo/api --include-workspace-root --no-audit --no-fund
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN npm run build -w @macondo/shared \
  && npm run prisma:generate -w @macondo/api \
  && npm run build -w @macondo/api

# ── Narración sintética (ADR-017): Piper en su propio venv (GPL-3, proceso aparte) + voz es_ES-davefx-medium (datos CC0).
# Se descarga en el BUILD (no en el arranque) y se verifica el SHA-256 de cada archivo. Esta etapa no viaja a la imagen final.
FROM base AS tts
ARG PIPER_VERSION=1.8.0
# Revisión FIJA del repositorio de voces: el 2026-11-09 y 2026-11-11 upstream reentrenó davefx y cambiaron los archivos.
# e7229f7 es la versión que se escuchó y aprobó (muestras del 2026-11-05) y cuyas sumas SHA-256 se verifican abajo.
ARG PIPER_VOICE_REV=e7229f7d33a10e145e109b886d661984201ac3c4
ARG PIPER_VOICE_URL=https://huggingface.co/rhasspy/piper-voices/resolve/${PIPER_VOICE_REV}/es/es_ES/davefx/medium
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
    API_PORT=4100 \
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
# Se conservan node_modules completos: prisma CLI (migraciones) y ts-node (seed opcional).
COPY --from=build /app /app
COPY demo-content /app/demo-content
COPY apps/api/docker-entrypoint.sh /usr/local/bin/macondo-api-entrypoint
RUN chmod +x /usr/local/bin/macondo-api-entrypoint && mkdir -p /app/storage && chown -R node:node /app/storage
USER node
# Humo: Piper sintetiza una frase como usuario `node` y lame la codifica (falla el build si el TTS no funciona).
RUN echo "Prueba de la voz de la biblioteca." | /opt/piper-venv/bin/piper -m "$TTS_VOICE" -f /tmp/tts-smoke.wav \
  && lame --quiet -b 64 -m m --resample 44.1 /tmp/tts-smoke.wav /tmp/tts-smoke.mp3 && test -s /tmp/tts-smoke.mp3 && rm -f /tmp/tts-smoke.*
WORKDIR /app/apps/api
EXPOSE 4100
VOLUME ["/app/storage"]
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.API_PORT||process.env.PORT||4100)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
ENTRYPOINT ["macondo-api-entrypoint"]
