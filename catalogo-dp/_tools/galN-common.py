"""Utilidades comunes para el lote naturaleza y ciencia (Wikimedia Commons API). Basado en gal-common.py."""
import json, re, time, urllib.parse, urllib.request, html

UA = ("MacondoDigital-GaleriasNaturaleza/0.2 (biblioteca escolar Comfasucre, Sucre, Colombia; "
      "contacto: https://www.comfasucre.com.co/ ; script educativo, peticiones secuenciales)")
API = "https://commons.wikimedia.org/w/api.php"
_last = [0.0]

def get(url, binary=False, tries=7):
    for i in range(tries):
        wait = 1.6 - (time.time() - _last[0])
        if wait > 0: time.sleep(wait)
        _last[0] = time.time()
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=60) as r:
                data = r.read()
            return data if binary else json.loads(data)
        except Exception as e:
            if i == tries - 1: raise
            code = getattr(e, "code", 0)
            ra = getattr(e, "headers", None) and e.headers.get("Retry-After")
            if code == 429:
                d = max(int(ra) if ra and ra.isdigit() else 0, 20 * (2 ** i))
            else:
                d = 4 * (2 ** i)
            print(f"   [espera {d}s tras error {code or e}]", flush=True)
            time.sleep(min(d, 600))

def api(**params):
    params.update(format="json", formatversion="2")
    return get(API + "?" + urllib.parse.urlencode(params))

def strip(s):
    s = re.sub(r"<[^>]+>", " ", s or "")
    s = html.unescape(s)
    return re.sub(r"\s+", " ", s).strip()

ACCEPT = re.compile(r"^(pd|cc0|cc-by-\d(\.\d)?(-\w+)?|cc-by-sa-\d(\.\d)?(-\w+)?)$", re.I)

def info_from_page(p):
    ii = (p.get("imageinfo") or [{}])[0]
    m = ii.get("extmetadata") or {}
    g = lambda k: (m.get(k) or {}).get("value", "")
    lic = g("License").strip().lower()
    short = strip(g("LicenseShortName"))
    restr = strip(g("Restrictions"))
    ok = bool(ACCEPT.match(lic)) or short.lower() in ("public domain", "cc0", "pdm-owner")
    if re.search(r"\b(nd|nc)\b|noderiv|noncommercial|fair use|non-free", (lic + " " + short).lower()):
        ok = False
    return {
        "title": p["title"],
        "license": short, "licenseCode": lic,
        "licenseUrl": g("LicenseUrl") or None,
        "credit": strip(g("Artist")) or strip(g("Credit")),
        "rawCredit": strip(g("Credit")),
        "desc": strip(g("ImageDescription"))[:400],
        "date": strip(g("DateTimeOriginal"))[:40],
        "restrictions": restr,
        "w": ii.get("width"), "h": ii.get("height"), "mime": ii.get("mime"),
        "thumburl": ii.get("thumburl"), "sourceUrl": ii.get("descriptionurl"),
        "acceptable": ok and not restr,
        "categories": [c["title"][9:] for c in p.get("categories", [])][:12],
    }
