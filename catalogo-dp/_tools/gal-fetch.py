"""Descarga las imágenes de gal-files.json desde Wikimedia Commons (miniatura 1600 px), verifica licencia,
re-codifica (≤1600 px lado mayor, ≤1,5 MB), verifica bytes mágicos y guarda metadatos en gal-meta.json.
Uso: python3 -I gal-fetch.py [slug ...]"""
import sys, os, json, subprocess, shutil, tempfile, importlib.util
HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location("gc", os.path.join(HERE, "gal-common.py"))
gc = importlib.util.module_from_spec(spec); spec.loader.exec_module(gc)
ROOT = os.path.dirname(HERE)
FILES = json.load(open(os.path.join(HERE, "gal-files.json")))
META_P = os.path.join(HERE, "gal-meta.json")
META = json.load(open(META_P)) if os.path.exists(META_P) else {}
MAXB = 1_500_000

def magic(path):
    b = open(path, "rb").read(12)
    if b[:3] == b"\xff\xd8\xff": return "jpg"
    if b[:4] == b"\x89PNG": return "png"
    if b[:4] == b"RIFF" and b[8:12] == b"WEBP": return "webp"
    return None

def dims(path):
    out = subprocess.run(["sips", "-g", "pixelWidth", "-g", "pixelHeight", path], capture_output=True, text=True).stdout
    w = int(out.split("pixelWidth:")[1].split()[0]); h = int(out.split("pixelHeight:")[1].split()[0])
    return w, h

def process(raw, dest_noext):
    kind = magic(raw)
    rw, rh = dims(raw)
    Z = ["-Z", "1600"] if max(rw, rh) > 1600 else []  # nunca ampliar
    tmpd = tempfile.mkdtemp()
    if kind == "png":
        out = dest_noext + ".png"
        subprocess.run(["sips", "-s", "format", "png", *Z, raw, "--out", out], capture_output=True, check=True)
        side = min(1600, max(rw, rh))
        while os.path.getsize(out) > MAXB and side > 800:
            side -= 200
            subprocess.run(["sips", "-Z", str(side), raw, "--out", out], capture_output=True, check=True)
        if os.path.getsize(out) > MAXB:  # último recurso: JPEG
            os.remove(out); kind = "jpg-from-png"
        else:
            return out
    out = dest_noext + ".jpg"
    q = 80
    subprocess.run(["sips", "-s", "format", "jpeg", *Z, "--setProperty", "formatOptions", str(q), raw, "--out", out], capture_output=True, check=True)
    while os.path.getsize(out) > MAXB and q > 50:
        q -= 10
        subprocess.run(["sips", "-s", "format", "jpeg", *Z, "--setProperty", "formatOptions", str(q), raw, "--out", out], capture_output=True, check=True)
    return out

slugs = sys.argv[1:] or list(FILES)
for slug in slugs:
    items = FILES[slug]
    gdir = os.path.join(ROOT, "galerias", slug); os.makedirs(gdir, exist_ok=True)
    r = gc.api(action="query", titles="|".join("File:" + t for t, _ in items), prop="imageinfo",
               iiprop="url|extmetadata|size|mime", iiurlwidth="1600")
    q = r["query"]
    norm = {n["from"]: n["to"] for n in q.get("normalized", [])}
    pages = {p["title"]: p for p in q["pages"]}
    for title, base in items:
        key = "File:" + title; key = norm.get(key, key)
        p = pages.get(key)
        if not p or "imageinfo" not in p:
            print(f"!! {slug}: FALTA {title}"); continue
        info = gc.info_from_page(p)
        if not info["acceptable"]:
            print(f"!! {slug}: LICENCIA NO ACEPTADA {title} -> {info['license']} {info['restrictions']}"); continue
        mk = f"{slug}/{base}"
        if mk in META and os.path.exists(os.path.join(gdir, META[mk]["file"])):
            continue
        url = info["thumburl"] or p["imageinfo"][0]["url"]
        data = None
        if "/thumb/" not in url and not title.lower().endswith((".svg", ".tif", ".tiff")):
            # Commons devolvió el original sin escalar (la imagen es pequeña o estrecha).
            w0, h0 = info["w"] or 0, info["h"] or 0
            if max(w0, h0) <= 4000:
                try:  # original pequeño: descargarlo tal cual (un intento; Wikimedia limita originales)
                    data = gc.get(url, binary=True, tries=1)
                except Exception:
                    data = None
            if data is None:  # pedir un tamaño estándar de miniatura menor que el original
                std = [s for s in (1280, 960, 500, 330) if s < w0] or [250]
                r2 = gc.api(action="query", titles=key, prop="imageinfo", iiprop="url", iiurlwidth=str(std[0]))
                url = r2["query"]["pages"][0]["imageinfo"][0]["thumburl"]
        raw = os.path.join(tempfile.mkdtemp(), "raw")
        open(raw, "wb").write(data if data is not None else gc.get(url, binary=True))
        if not magic(raw):  # p.ej. TIFF/GIF original: convertir
            subprocess.run(["sips", "-s", "format", "jpeg", raw, "--out", raw + ".jpg"], capture_output=True)
            raw = raw + ".jpg"
        rawdims = dims(raw)
        out = process(raw, os.path.join(gdir, base))
        k = magic(out); w, h = dims(out); size = os.path.getsize(out)
        ok = k in ("jpg", "png", "webp") and max(w, h) <= 1600 and size <= MAXB
        info.update(file=os.path.basename(out), width=w, height=h, bytes=size, magic=k, ok=ok, downloadedFrom=url, rawDims=list(rawdims))
        META[mk] = info
        print(f"{'OK' if ok else '!!'} {slug}/{os.path.basename(out)} {w}x{h} {size//1024}KB {info['license']}")
        json.dump(META, open(META_P, "w"), ensure_ascii=False, indent=1)
