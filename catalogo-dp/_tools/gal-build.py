"""Genera galerias/<slug>/gallery.json, galerias.manifest.json y GALERIAS-FUENTES.md
a partir de gal-files.json + gal-meta.json + gal-content/<slug>.json.  Uso: python3 -I gal-build.py"""
import os, json, re
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
FILES = json.load(open(os.path.join(HERE, "gal-files.json")))
META = json.load(open(os.path.join(HERE, "gal-meta.json")))
TODAY = "2026-10-31"

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
    cp = os.path.join(HERE, "gal-content", slug + ".json")
    if not os.path.exists(cp): print("sin contenido:", slug); continue
    C = json.load(open(cp))
    assert len(C["items"]) == len(files), (slug, len(C["items"]), len(files))
    overrides = C.get("credits", {})
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
        "status": "DRAFT",
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
json.dump(manifest, open(os.path.join(ROOT, "galerias.manifest.json"), "w"), ensure_ascii=False, indent=2)

# GALERIAS-FUENTES.md
esc = lambda s: str(s).replace("|", "\\|").replace("\n", " ")
L = ["# Galerías interactivas — fuentes y créditos", "",
     f"Generado por `_tools/gal-build.py` el {TODAY}. Todas las imágenes provienen de **Wikimedia Commons** (miniaturas de 1600 px "
     "descargadas vía API con User-Agent identificado, peticiones secuenciales). La licencia de cada archivo se leyó de "
     "`extmetadata` (LicenseShortName / License / Restrictions) y se aceptaron solo: dominio público, CC0, CC BY y CC BY-SA. "
     "Las imágenes se reescalaron (lado mayor ≤ 1600 px) y re-codificaron (≤ 1,5 MB); para CC BY-SA esto es una adaptación "
     "técnica de tamaño que se comparte bajo la misma licencia.", "",
     "**Atribución obligatoria:** las imágenes CC BY / CC BY-SA deben mostrarse con su autor, licencia y enlace (campos "
     "`credit`, `license`, `licenseUrl`, `sourceUrl` de cada `gallery.json`).", ""]
cur = None
for slug, it, m in fuentes:
    if slug != cur:
        cur = slug
        L += ["", f"## {slug}", "", "| Archivo | Autor / crédito | Licencia | Original en Commons |", "|---|---|---|---|"]
    L.append(f"| {it['file']} | {esc(it['credit'])} | [{esc(it['license'])}]({it['licenseUrl']}) | [{esc(m['title'][5:])}]({it['sourceUrl']}) |")
rej = os.path.join(HERE, "gal-rechazadas.md")
if os.path.exists(rej):
    L += ["", open(rej).read()]
open(os.path.join(ROOT, "GALERIAS-FUENTES.md"), "w").write("\n".join(L) + "\n")
print("galerías:", len(manifest), "imágenes:", len(fuentes), "bytes:", sum(e["sizeBytes"] for e in manifest))
