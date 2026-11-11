"""Busca candidatos en Commons. Uso: gal-search.py OUT.json 'search:consulta' 'cat:Categoría' ...
Imprime lista compacta de candidatos con licencia aceptable."""
import sys, json, os, importlib.util
spec = importlib.util.spec_from_file_location("gc", os.path.join(os.path.dirname(__file__), "galC-common.py"))
gc = importlib.util.module_from_spec(spec); spec.loader.exec_module(gc)

out, queries = sys.argv[1], sys.argv[2:]
cache = json.load(open(out)) if os.path.exists(out) else {}
common = dict(action="query", prop="imageinfo|categories", iiprop="url|extmetadata|size|mime",
              iiurlwidth="1600", iiextmetadatalanguage="es", cllimit="max", clshow="!hidden")
for q in queries:
    kind, _, val = q.partition(":")
    if kind == "search":
        r = gc.api(generator="search", gsrsearch=val + " filetype:bitmap", gsrnamespace="6", gsrlimit=os.environ.get("N","12"), **common)
    elif kind == "svg":
        r = gc.api(generator="search", gsrsearch=val + " filetype:drawing", gsrnamespace="6", gsrlimit=os.environ.get("N","12"), **common)
    elif kind == "cat":
        r = gc.api(generator="categorymembers", gcmtitle="Category:" + val, gcmtype="file", gcmlimit="40", **common)
    elif kind == "file":
        r = gc.api(titles="|".join("File:" + t for t in val.split("|")), **common)
    pages = (r.get("query") or {}).get("pages", [])
    print(f"\n=== {q} ({len(pages)})")
    for p in pages:
        if "imageinfo" not in p: print("  MISSING", p.get("title")); continue
        i = gc.info_from_page(p)
        cache[i["title"]] = i
        flag = "OK " if i["acceptable"] else "NO "
        if kind == "file" or i["acceptable"]:
            print(f"  {flag}{i['title'][5:]} | {i['license']} | {i['w']}x{i['h']} | {i['credit'][:40]} | {i['date'][:20]} | {i['restrictions']} | {i['desc'][:150]}")
    json.dump(cache, open(out, "w"), ensure_ascii=False, indent=1)
