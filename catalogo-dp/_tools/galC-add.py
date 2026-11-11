"""Agrega/reemplaza la lista de archivos de una galería en galC-files.json. Uso: galC-add.py slug 'base=Titulo' ..."""
import sys, json, os
p = os.path.join(os.path.dirname(os.path.abspath(__file__)), "galC-files.json")
F = json.load(open(p)); slug = sys.argv[1]
F[slug] = [[a.split("=", 1)[1], a.split("=", 1)[0]] for a in sys.argv[2:]]
json.dump(F, open(p, "w"), ensure_ascii=False, indent=1); print(slug, len(F[slug]), "| total", len(F))
