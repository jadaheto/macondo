"""Define/reemplaza la lista de imágenes de una galería en galN-files.json. Uso: galN-add.py slug 'Título.jpg=>01-base' ..."""
import sys, os, json
P = os.path.join(os.path.dirname(os.path.abspath(__file__)), "galN-files.json")
F = json.load(open(P)) if os.path.exists(P) else {}
F[sys.argv[1]] = [a.split("=>") for a in sys.argv[2:]]
json.dump(F, open(P, "w"), ensure_ascii=False, indent=1)
print(sys.argv[1], len(F[sys.argv[1]]), "| total galerías:", len(F))
