# Macondo Digital — Web (Next.js, salida standalone). Contexto de build: RAÍZ del repositorio.
#   docker build -f apps/web/Dockerfile --build-arg API_INTERNAL_URL=http://macondo-api:4100 -t macondo-web .
FROM node:22-bookworm-slim AS build
WORKDIR /app
# Los rewrites /api/* de Next se fijan en el build: la URL interna de la API debe venir como build-arg.
ARG API_INTERNAL_URL=http://macondo-api:4100
# Origen público (para los códigos QR de kiosco y TV). Vacío = usar el origen con el que se abre la página,
# que en producción ya es https://macondo.comfasucre.co. Solo hace falta fijarlo si la web se sirve detrás
# de un proxy con otro host. Se incrusta en el build (NEXT_PUBLIC_*).
ARG NEXT_PUBLIC_PUBLIC_ORIGIN=
ENV NEXT_PUBLIC_PUBLIC_ORIGIN=${NEXT_PUBLIC_PUBLIC_ORIGIN} \
    API_INTERNAL_URL=${API_INTERNAL_URL} \
    NEXT_OUTPUT=standalone \
    NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci --workspace @macondo/shared --workspace @macondo/web --include-workspace-root --no-audit --no-fund
COPY packages/shared packages/shared
COPY apps/web apps/web
RUN npm run build -w @macondo/shared && npm run build -w @macondo/web

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3100 HOSTNAME=0.0.0.0
COPY --from=build --chown=node:node /app/apps/web/.next/standalone ./
COPY --from=build --chown=node:node /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=node:node /app/apps/web/public ./apps/web/public
USER node
EXPOSE 3100
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3100)+'/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "apps/web/server.js"]
