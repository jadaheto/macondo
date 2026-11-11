"""Descarga miniaturas pequeñas (300px) para revisión visual y arma una hoja de contacto. Uso: gal-preview.py OUTDIR 'Titulo1|Titulo2'"""
import sys, os, json, subprocess, importlib.util
spec = importlib.util.spec_from_file_location("gc", os.path.join(os.path.dirname(__file__), "gal-common.py"))
gc = importlib.util.module_from_spec(spec); spec.loader.exec_module(gc)
out = sys.argv[1]; os.makedirs(out, exist_ok=True)
titles = sys.argv[2].split("|")
r = gc.api(action="query", titles="|".join("File:" + t for t in titles), prop="imageinfo", iiprop="url", iiurlwidth="300")
for i, p in enumerate(r["query"]["pages"]):
    if "imageinfo" not in p: print("MISSING", p["title"]); continue
    data = gc.get(p["imageinfo"][0]["thumburl"], binary=True)
    fn = os.path.join(out, f"p{i:02d}.jpg")
    open(fn + ".bin", "wb").write(data)
    subprocess.run(["sips", "-s", "format", "jpeg", "-Z", "300", "--padToHeightWidth", "300", "300", "--padColor", "FFFFFF", fn + ".bin", "--out", fn], capture_output=True)
    os.remove(fn + ".bin")
    print(fn, p["title"])
n = len([f for f in os.listdir(out) if f.startswith("p") and f.endswith(".jpg")])
cols = 4; rows = (n + cols - 1) // cols
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", os.path.join(out, "p%02d.jpg"), "-vf",
    f"tile={cols}x{rows}:padding=4:color=gray",
    "-frames:v", "1", os.path.join(out, "sheet.jpg")], check=True)
print("sheet", os.path.join(out, "sheet.jpg"))
