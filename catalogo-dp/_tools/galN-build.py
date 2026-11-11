"""(Lote naturaleza y ciencia; basado en gal-build.py)
Genera galerias/<slug>/gallery.json, galerias-naturaleza.manifest.json y la sección «Lote naturaleza y ciencia»
de GALERIAS-FUENTES.md a partir de galN-files.json + galN-meta.json + galN-content/<slug>.json.
Uso: python3 -I galN-build.py"""
import os, json, re
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
FILES = json.load(open(os.path.join(HERE, "galN-files.json")))
META = json.load(open(os.path.join(HERE, "galN-meta.json")))
TODAY = "2026-10-31"
CP = os.path.join(HERE, "galN-credits.json")
CRED = json.load(open(CP)) if os.path.exists(CP) else {}  # correcciones manuales de crédito {slug: {"n": "texto"}}

def lic_name(m):
    s = m["license"]
    if s.lower() in ("public domain", "pdm-owner"): return "Dominio público"
    return s

def lic_url(m):
    if m.get("licenseUrl"): return m["licenseUrl"]
    code = m["licenseCode"]
    if code == "cc0": return "https://creativecommons.org/publicdomain/zero/1.0/deed.es"
    if code == "pd" or m["license"].lower() == "public domain": return "https://creativecommons.org/publicdomain/mark/1.0/deed.es"
    return m["sourceUrl"]

def credit(m, override=None):
    if override: return override
    c = m["credit"]
    if c.startswith(("Esta imagen fue donada", "This file was donated", "Creator:")):
        return "The Metropolitan Museum of Art (Open Access)"
    c = re.sub(r"\s*\(\s*talk\s*\)", "", c)
    if not c: c = m.get("rawCredit") or "Autor no indicado en Commons (ver página de origen)"
    return c[:200]

manifest, fuentes = [], []
for slug, files in FILES.items():
    cp = os.path.join(HERE, "galN-content", slug + ".json")
    if not os.path.exists(cp): print("sin contenido:", slug); continue
    C = json.load(open(cp))
    assert len(C["items"]) == len(files), (slug, len(C["items"]), len(files))
    overrides = {**C.get("credits", {}), **CRED.get(slug, {})}
    items = []
    for i, ((title, base), (alt, cap)) in enumerate(zip(files, C["items"])):
        m = META[f"{slug}/{base}"]
        assert m["ok"] and m["acceptable"], (slug, base)
        assert "__" not in alt, (slug, base, "alt pendiente")
        it = {"file": m["file"], "alt": alt, "caption": cap, "credit": credit(m, overrides.get(str(i + 1))),
              "license": lic_name(m), "licenseUrl": lic_url(m), "sourceUrl": m["sourceUrl"]}
        items.append(it)
        fuentes.append((slug, it, m))
    g = {"slug": slug, "title": C["title"], "description": C["description"], "items": items,
         "activity": {"kind": "trivia", "questions": [
             {"prompt": q[0], "options": q[1], "answer": q[2], "explanation": q[3]} for q in C["questions"]]}}
    gdir = os.path.join(ROOT, "galerias", slug)
    keep = {it["file"] for it in items} | {"gallery.json"}
    for f in os.listdir(gdir):  # quitar imágenes reemplazadas (solo en carpetas de este lote)
        if f not in keep: os.remove(os.path.join(gdir, f)); print("  borrado huérfano", slug, f)
    json.dump(g, open(os.path.join(gdir, "gallery.json"), "w"), ensure_ascii=False, indent=2)
    size = sum(os.path.getsize(os.path.join(gdir, f)) for f in os.listdir(gdir) if not f.startswith("."))
    mix = {}
    for it in items: mix[it["license"]] = mix.get(it["license"], 0) + 1
    manifest.append({
        "file": f"galerias/{slug}",
        "cover": f"galerias/{slug}/{items[C.get('cover', 1) - 1]['file']}",
        "title": C["title"],
        "creator": "Biblioteca Macondo (curaduría) · imágenes de Wikimedia Commons",
        "type": "GALLERY",
        "description": C["description"],
        "gradeMin": C["gradeMin"], "gradeMax": C["gradeMax"],
        "categories": C["categories"],
        "language": "es", "narrator": None, "durationSeconds": None,
        "status": "PUBLISHED",
        "license": {"rightsHolder": "Varios autores (ver créditos por imagen)",
                    "licenseName": "Imágenes de Wikimedia Commons con licencias libres; créditos por imagen en la galería",
                    "licenseUrl": "https://commons.wikimedia.org/wiki/Commons:Licensing",
                    "authorizedDevices": 30, "offlineAllowed": True,
                    "validFrom": None, "validUntil": None, "territory": "CO"},
        "source": {"provider": "Wikimedia Commons", "id": slug, "url": "https://commons.wikimedia.org/", "retrievedAt": TODAY},
        "rights": {"basis": "Licencia de cada imagen verificada con la API de Commons (extmetadata LicenseShortName/License); solo dominio público, CC0, CC BY y CC BY-SA. Las CC BY/BY-SA exigen mostrar el crédito y la licencia de cada imagen (incluidos en gallery.json).",
                   "licenseMix": mix, "imageCount": len(items)},
        "sha256": None, "sizeBytes": size,
        "reviewNotes": C.get("reviewNotes"),
    })
json.dump(manifest, open(os.path.join(ROOT, "galerias-naturaleza.manifest.json"), "w"), ensure_ascii=False, indent=2)

# Sección «Lote naturaleza y ciencia» en GALERIAS-FUENTES.md (se re-lee el archivo justo antes de escribir;
# solo se reemplaza el bloque entre marcadores, o se añade al final si no existe).
esc = lambda s: str(s).replace("|", "\\|").replace("\n", " ")
B0, B1 = "<!-- lote-naturaleza:inicio -->", "<!-- lote-naturaleza:fin -->"
mixT = {}
for _, it, _m in fuentes: mixT[it["license"]] = mixT.get(it["license"], 0) + 1
L = [B0, "", "# Lote naturaleza y ciencia", "",
     f"Generado por `_tools/galN-build.py` el {TODAY}: {len(manifest)} galerías, {len(fuentes)} imágenes "
     f"({sum(e['sizeBytes'] for e in manifest) / 1048576:.1f} MB). Manifiesto: `galerias-naturaleza.manifest.json`. "
     "Mismo método que el primer lote: solo API de Wikimedia Commons (miniaturas `iiurlwidth=1600`, User-Agent identificado, "
     "peticiones secuenciales con pausa ≥1,6 s y espera exponencial ante 429), licencia leída de `extmetadata` y aceptadas solo "
     "dominio público, CC0, CC BY y CC BY-SA. Para cada imagen en dominio público se revisaron además las plantillas de la página "
     "(`PD-USGov-NASA/NOAA/FWS/NPS…`, `PD-old`, `PD-Art`); las obras de arte en dominio público solo se aceptaron si el autor murió "
     "en 1945 o antes (regla colombiana de 80 años). Reescalado ≤1600 px, ≤1,5 MB, bytes mágicos verificados. Alt y pies de foto "
     "redactados en español tras revisar hojas de contacto de cada galería.", "",
     "Mezcla de licencias: " + ", ".join(f"{k}: {v}" for k, v in sorted(mixT.items(), key=lambda x: -x[1])) + ".", ""]
cur = None
for slug, it, m in fuentes:
    if slug != cur:
        cur = slug
        L += ["", f"## {slug}", "", "| Archivo | Autor / crédito | Licencia | Original en Commons |", "|---|---|---|---|"]
    L.append(f"| {it['file']} | {esc(it['credit'])} | [{esc(it['license'])}]({it['licenseUrl']}) | [{esc(m['title'][5:])}]({it['sourceUrl']}) |")
rej = os.path.join(HERE, "galN-rechazadas.md")
if os.path.exists(rej):
    L += ["", open(rej).read().strip()]
L += ["", B1]
block = "\n".join(L) + "\n"
P = os.path.join(ROOT, "GALERIAS-FUENTES.md")
cur_txt = open(P).read()
if B0 in cur_txt and B1 in cur_txt:
    a = cur_txt.index(B0); b = cur_txt.index(B1) + len(B1)
    new = cur_txt[:a] + block.rstrip("\n") + cur_txt[b:]
else:
    new = cur_txt.rstrip("\n") + "\n\n" + block
open(P, "w").write(new)
print("galerías:", len(manifest), "imágenes:", len(fuentes), "bytes:", sum(e["sizeBytes"] for e in manifest))
