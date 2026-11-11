# Formato de manifiestos de catalogo-dp/

Cada manifiesto (`libros.manifest.json`, `audiolibros.manifest.json`) es un arreglo JSON. Cada entrada:

```json
{
  "file": "libros/gutenberg-12345.epub",
  "cover": null,
  "title": "…", "creator": "…",
  "type": "BOOK | AUDIOBOOK",
  "description": "Español, 1–3 frases, apropiada para estudiantes",
  "gradeMin": 1, "gradeMax": 11,
  "categories": ["…"],
  "language": "es",
  "narrator": null, "durationSeconds": null,
  "status": "DRAFT",
  "license": { "rightsHolder": "Dominio público", "licenseName": "Dominio público en Colombia (Ley 23 de 1982)",
               "licenseUrl": "https://…", "authorizedDevices": 30, "offlineAllowed": true,
               "validFrom": null, "validUntil": null, "territory": "CO" },
  "source": { "provider": "Project Gutenberg | LibriVox", "id": "…", "url": "…", "retrievedAt": "2026-10-31" },
  "rights": { "authorDeathYear": 1916, "translator": null, "translatorDeathYear": null, "basis": "…" },
  "sha256": "…", "sizeBytes": 0,
  "reviewNotes": "Avisos para la bibliotecaria (temas sensibles, edición, etc.) o null"
}
```

Reglas: `status` siempre `DRAFT` (revisión pedagógica antes de publicar). Campos validados contra `ResourceInputSchema` de `@macondo/shared`.

---

## Audiobiografías y audioresúmenes

Mismo formato de manifiesto; `type` = `AUDIOBIOGRAPHY` / `AUDIOSUMMARY`, archivo MP3 en
`audiobiografias/` / `audioresumenes/`. Manifiestos: `audiobiografias.manifest.json`, `audioresumenes.manifest.json`.
Campos extra opcionales (los ignora la API hoy; útiles a futuro):
`"text"` (texto completo narrado, en español), `"relatedTitle"` / `"relatedCreator"` (obra enlazada, solo resúmenes),
`"timeline"` (biografías: `[{ "year": 1833, "event": "…" }]`), `"funFacts"`: `["…"]`, `"questions"`: preguntas de comprensión (formato de trivia de retos).

## Galerías interactivas

Una carpeta por galería: `galerias/<slug>/` con las imágenes y `gallery.json`:

```json
{
  "slug": "fauna-del-caribe",
  "title": "…", "description": "…",
  "items": [
    { "file": "01-iguana.jpg", "alt": "Texto alternativo descriptivo", "caption": "Pie de foto educativo (1–3 frases)",
      "credit": "Autor de la imagen", "license": "CC0 | Dominio público | CC BY 4.0 | CC BY-SA 4.0",
      "licenseUrl": "https://…", "sourceUrl": "https://commons.wikimedia.org/wiki/File:…" }
  ],
  "activity": { "kind": "trivia", "questions": [ { "prompt": "…", "options": ["…"], "answer": 0, "explanation": "…" } ] }
}
```

Imágenes: JPG/PNG/WebP, lado mayor ≤ 1600 px, ≤ 1,5 MB cada una, 6–15 por galería.
Manifiesto `galerias.manifest.json`: entradas con `type` `GALLERY`, `file` = `galerias/<slug>` (carpeta) y la licencia
del conjunto (`licenseName` p. ej. "Imágenes de Wikimedia Commons con licencias libres; ver créditos por imagen").
El importador empaqueta la carpeta en ZIP y la API la valida y extrae (formato `IMAGE_SET`).

## Retos lectores

`retos/retos.json`: arreglo compatible con `Challenge` de `apps/web/src/lib/challenges.ts`, ampliado:

```json
{ "id": "slug-unico", "kind": "trivia | sequence | match", "title": "…",
  "source": "Obra, autor (dominio público)…", "bands": ["1-3","4-5","6-8","9-11"],
  "resource": { "title": "Título exacto en el catálogo", "creator": "Autor exacto" },
  "text": "Fragmento breve o consigna",
  "questions": [ { "prompt": "…", "options": ["…","…","…"], "answer": 0, "explanation": "…" } ],
  "steps": ["…"],
  "pairs": [ { "left": "Personaje", "right": "Descripción" } ] }
```

`questions` solo en `trivia`, `steps` solo en `sequence` (en orden correcto), `pairs` solo en `match`.
