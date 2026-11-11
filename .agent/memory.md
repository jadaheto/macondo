# Memoria del agente (resumen, no sensible)

- Proyecto: Macondo Digital, biblioteca escolar (Comfasucre). Spec: `CLAUDE_CODE_MACONDO_DIGITAL.md`. Reglas: `CLAUDE.md`.
- Stack: npm workspaces (sin pnpm), Next.js :3100, NestJS+Prisma :4100, Postgres 16 `macondo_db` en 127.0.0.1:5544.
- Puertos prohibidos (otros proyectos): 3000, 5433, 3307, 8000, 8080.
- Contrato: `packages/shared/src/index.ts` (fuente de verdad); `npm run build:shared` tras cambios. 8/8 pruebas pasan (2026-10-31).
- Demo legal: `demo-content/manifest.json` (8 recursos) + `SOURCES.md`; el seed de la API lo importa. Voz sintética = solo demo.
- macOS tiene `ffmpeg`, `lame`, `say` (voz Paulina), `qlmanage`/`sips`; no hay reportlab ni PIL.
- Fire HD 10: todo pendiente de validación física. Sin commits sin autorización.
- Reanudar: leer `docs/PROGRESS.md`, `.agent/tasks.json`, `.agent/checkpoints.json`; no confiar ciegamente en esta memoria.
