"""Reemplaza o quita una imagen de una galería (galC-files.json, galC-meta.json y archivo en disco).
Uso: galC-swap.py slug base-viejo 'base-nuevo=Titulo'   |   galC-swap.py slug base-viejo -"""
import sys, json, os
H = os.path.dirname(os.path.abspath(__file__)); R = os.path.dirname(H)
fp, mp = os.path.join(H, "galC-files.json"), os.path.join(H, "galC-meta.json")
F, M = json.load(open(fp)), json.load(open(mp))
slug, old, new = sys.argv[1:4]
lst = F[slug]; idx = [b for _, b in lst].index(old)
m = M.pop(f"{slug}/{old}", None)
if m and os.path.exists(os.path.join(R, "galerias", slug, m["file"])): os.remove(os.path.join(R, "galerias", slug, m["file"]))
if new == "-": lst.pop(idx)
else: b, t = new.split("=", 1); lst[idx] = [t, b]
json.dump(F, open(fp, "w"), ensure_ascii=False, indent=1); json.dump(M, open(mp, "w"), ensure_ascii=False, indent=1)
print(slug, old, "->", new[:60], "| n =", len(lst))
