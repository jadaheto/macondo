"""Construye demo-content/ de Macondo Digital a partir de descargas verificadas + contenido propio.
Uso: python3 -I build_demo.py <dl_dir> <repo_root>
"""
import os, re, shutil, subprocess, sys, tempfile, zipfile

DL, REPO = sys.argv[1], sys.argv[2]
OUT = os.path.join(REPO, 'demo-content')
FILES = os.path.join(OUT, 'files')
COVERS = os.path.join(OUT, 'covers')
WORK = tempfile.mkdtemp(prefix='macondo-demo-')
for d in (FILES, COVERS, WORK):
    os.makedirs(d, exist_ok=True)


# ---------- EPUB: quitar portada escaneada (derechos del ilustrador no verificados) ----------
def strip_cover(src, dst, title, author):
    zin = zipfile.ZipFile(src)
    names = zin.namelist()
    cover = [n for n in names if re.search(r'_cover\.(jpg|png)$', n)]
    with zipfile.ZipFile(dst, 'w') as zout:
        zout.writestr(zipfile.ZipInfo('mimetype'), zin.read('mimetype'), compress_type=zipfile.ZIP_STORED)
        for n in names:
            if n == 'mimetype' or n in cover:
                continue
            data = zin.read(n)
            if n.endswith('content.opf'):
                s = data.decode('utf-8')
                s = re.sub(r'\s*<meta name="cover"[^>]*/>', '', s)
                for c in cover:
                    s = re.sub(r'\s*<item href="%s"[^>]*/>' % re.escape(os.path.basename(c)), '', s)
                data = s.encode('utf-8')
            elif n.endswith('.html') and not n.endswith('wrap0000.html'):
                s = data.decode('utf-8')
                s = re.sub(r'<link href="[^"]*_cover\.(jpg|png)" rel="icon"[^>]*/>', '', s)
                data = s.encode('utf-8')
            elif n.endswith('wrap0000.html'):
                s = data.decode('utf-8')
                s = re.sub(r'<img [^>]*x-ebookmaker-cover[^>]*/>',
                           '<h1>%s</h1><p>%s</p>' % (title, author), s)
                data = s.encode('utf-8')
            zout.writestr(zin.getinfo(n), data, compress_type=zipfile.ZIP_DEFLATED)
    # verificación: ninguna referencia residual a la portada
    z = zipfile.ZipFile(dst)
    for n in z.namelist():
        if n.endswith(('.html', '.opf')):
            assert '_cover.' not in z.read(n).decode('utf-8'), n


strip_cover(os.path.join(DL, 'pg55206.epub'), os.path.join(FILES, 'samaniego-fabulas.epub'),
            'Fábulas', 'Félix María Samaniego')
strip_cover(os.path.join(DL, 'pg52894.epub'), os.path.join(FILES, 'dario-azul.epub'),
            'Azul...', 'Rubén Darío')
# La Edad de Oro: la portada es la generada automáticamente por Project Gutenberg -> se deja intacto.
shutil.copyfile(os.path.join(DL, 'pg19898.epub'), os.path.join(FILES, 'marti-la-edad-de-oro.epub'))

# ---------- MP3 LibriVox (sin modificar) ----------
shutil.copyfile(os.path.join(DL, 'quiroga03.mp3'), os.path.join(FILES, 'quiroga-las-medias-de-los-flamencos.mp3'))
shutil.copyfile(os.path.join(DL, 'marti19.mp3'), os.path.join(FILES, 'marti-los-zapaticos-de-rosa.mp3'))


# ---------- PDF generado (Pombo, texto de Wikisource) ----------
def poem_lines(path):
    raw = open(path, encoding='utf-8').read()
    body = raw.split('<poem>')[1].split('</poem>')[0]
    return [l.rstrip() for l in body.strip('\n').split('\n')]


def pdf_escape(s):
    b = s.encode('cp1252', errors='replace')
    return b.replace(b'\\', b'\\\\').replace(b'(', b'\\(').replace(b')', b'\\)')


def build_pdf(dst, pages):
    """pages: lista de listas de (font, size, x, y, text). Fuentes base-14 con WinAnsiEncoding."""
    W, H = 420, 595  # A5
    objs = []
    def add(b):
        objs.append(b); return len(objs)
    f1 = add(b'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>')
    f2 = add(b'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>')
    f3 = add(b'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique /Encoding /WinAnsiEncoding >>')
    pages_id = len(objs) + 1 + 2 * len(pages)  # se reserva al final
    kids = []
    for p in pages:
        stream = b''
        for font, size, x, y, text in p:
            stream += b'BT /%s %d Tf %d %d Td (' % (font.encode(), size, x, y) + pdf_escape(text) + b') Tj ET\n'
        c = add(b'<< /Length %d >>\nstream\n' % len(stream) + stream + b'endstream')
        kids.append(add(b'<< /Type /Page /Parent %d 0 R /MediaBox [0 0 %d %d] /Contents %d 0 R '
                        b'/Resources << /Font << /F1 %d 0 R /F2 %d 0 R /F3 %d 0 R >> >> >>'
                        % (pages_id, W, H, c, f1, f2, f3)))
    assert add(b'<< /Type /Pages /Kids [%s] /Count %d >>' % (b' '.join(b'%d 0 R' % k for k in kids), len(kids))) == pages_id
    info = add('<< /Title (El renacuajo paseador y La pobre viejecita) /Author (Rafael Pombo) '
               '/Producer (Macondo Digital demo-content build script) >>'.encode('latin-1'))
    cat = add(b'<< /Type /Catalog /Pages %d 0 R >>' % pages_id)
    out = b'%PDF-1.4\n%\xe2\xe3\xcf\xd3\n'
    offsets = []
    for i, o in enumerate(objs, 1):
        offsets.append(len(out))
        out += b'%d 0 obj\n' % i + o + b'\nendobj\n'
    xref = len(out)
    out += b'xref\n0 %d\n0000000000 65535 f \n' % (len(objs) + 1)
    out += b''.join(b'%010d 00000 n \n' % off for off in offsets)
    out += b'trailer\n<< /Size %d /Root %d 0 R /Info %d 0 R >>\nstartxref\n%d\n%%%%EOF\n' % (len(objs) + 1, cat, info, xref)
    open(dst, 'wb').write(out)


def layout_poem(title, lines, stanza=None):
    pages, cur, y = [], [], 520
    cur.append(('F2', 20, 40, 545, title)); cur.append(('F3', 11, 40, 527, 'Rafael Pombo (1833-1912)'))
    y = 495
    if stanza:  # el original de Wikisource no separa estrofas; se agrupan de 8 versos solo para legibilidad
        out = []
        for i, l in enumerate(lines):
            if i and i % stanza == 0: out.append('')
            out.append(l)
        lines = out
    for l in lines:
        if y < 50:
            pages.append(cur); cur, y = [], 550
        if l.strip():
            cur.append(('F1', 13, 40, y, l.strip()))
        y -= 18 if l.strip() else 12
    pages.append(cur)
    return pages


ren = poem_lines(os.path.join(DL, 'ws_El_renacuajo_paseador.txt'))
vie = poem_lines(os.path.join(DL, 'ws_La_pobre_viejecita.txt'))
cover_page = [('F2', 26, 40, 430, 'El renacuajo paseador'), ('F1', 18, 40, 400, 'y'),
              ('F2', 26, 40, 370, 'La pobre viejecita'), ('F1', 15, 40, 320, 'Rafael Pombo (Bogotá, 1833-1912)'),
              ('F3', 11, 40, 80, 'Macondo Digital - Biblioteca Macondo, Comfasucre'),
              ('F3', 11, 40, 64, 'Edición de demostración. Obra en dominio público.')]
colophon = [('F2', 14, 40, 540, 'Sobre esta edición')] + [
    ('F1', 10, 40, 515 - 15 * i, t) for i, t in enumerate([
        'Textos: Rafael Pombo (1833-1912). Dominio público en Colombia',
        '(Ley 23 de 1982: vida del autor + 80 años).',
        'Transcripción tomada de es.wikisource.org (páginas "El renacuajo',
        'paseador" y "La pobre viejecita"), consultadas el 31-10-2026.',
        'Maquetación generada automáticamente para Macondo Digital.',
        'Cambios: solo formato (tipografía, paginación; en "La pobre',
        'viejecita" se separaron estrofas de 8 versos para facilitar la lectura).',
        'No se modificó el texto de los poemas.',
    ])]
pages = [cover_page] + layout_poem('El renacuajo paseador', ren) + layout_poem('La pobre viejecita', vie, stanza=8) + [colophon]
build_pdf(os.path.join(FILES, 'pombo-renacuajo-y-viejecita.pdf'), pages)


# ---------- Audio propio (texto original del proyecto, voz sintética macOS) ----------
BIO = """Audiobiografía de Rafael Pombo. Una producción de demostración de Macondo Digital.

Rafael Pombo nació en Bogotá en 1833 y murió en la misma ciudad en 1912. Es uno de los poetas más queridos de Colombia, sobre todo por los niños y las niñas.

De joven estudió matemáticas e ingeniería, pero lo que más le gustaba era escribir versos.

Vivió muchos años en los Estados Unidos, en la ciudad de Nueva York, donde trabajó como diplomático de su país. Allí una editorial le pidió textos para niños, y así nacieron sus Cuentos pintados para niños y sus Cuentos morales para niños formales. Algunos de esos cuentos se inspiraron en canciones infantiles en inglés, pero Pombo los transformó con su humor, su ritmo y palabras muy nuestras.

Gracias a él conocemos a Rinrín Renacuajo, que salió muy tieso y muy majo sin hacer caso a su mamá; a la pobre viejecita, que no tenía nada que comer sino carnes, frutas y dulces; a Simón el bobito y al gato Michín.

Pombo también escribió poemas para personas adultas, sobre la naturaleza, el amor y las grandes preguntas de la vida. En 1905 recibió en Bogotá un homenaje muy especial: fue coronado como poeta en el Teatro Colón.

Un dato curioso: sus versos tienen rima y ritmo, por eso son fáciles de recordar y de cantar. Muchas abuelas y abuelos colombianos todavía los saben de memoria.

Preguntas para pensar. Primera: ¿en qué ciudad nació Rafael Pombo? Segunda: ¿qué le pasó a Rinrín Renacuajo por no hacer caso a su mamá? Tercera: ¿cuál es tu personaje favorito de Pombo, y por qué?
"""

SUM = """Audioresumen de Las medias de los flamencos, un cuento de Horacio Quiroga. Una producción de demostración de Macondo Digital.

Las víboras organizaron un gran baile a la orilla del río e invitaron a las ranas, a los sapos, a los yacarés, a los pescados y a los flamencos. Todos llegaron muy adornados. Las más elegantes eran las víboras de coral, con largas gasas rojas, blancas y negras.

En aquel tiempo los flamencos tenían las patas blancas. Estaban tristes porque no sabían cómo adornarse, y sentían envidia de las víboras de coral. Entonces decidieron buscar medias coloradas, blancas y negras. Fueron de almacén en almacén, pero en todas partes se burlaron de ellos.

Un tatú, para burlarse, les dijo que su cuñada, la lechuza, tenía esas medias. La lechuza les entregó unas medias que en realidad eran cueros de víboras de coral, y les advirtió que debían bailar toda la noche sin detenerse.

En el baile, todos admiraban las medias de los flamencos, pero las víboras empezaron a sospechar. Cuando un flamenco, agotado, se cayó, las víboras alumbraron sus patas con luciérnagas y descubrieron el engaño. Furiosas, les mordieron las patas.

Los flamencos no murieron, pero sus patas quedaron coloradas y con un ardor que no se quita. Por eso, según el cuento, los flamencos pasan casi todo el día con las patas metidas en el agua.

Ideas principales: la envidia y querer aparentar pueden traer problemas; no conviene confiar en quien se burla de nosotros; y el cuento explica, con imaginación, por qué los flamencos tienen las patas rojas.

Preguntas: ¿De qué color tenían las patas los flamencos al principio? ¿Quién les dio las medias? ¿Qué consejo le darías a los flamencos?

Puedes escuchar el cuento completo en el audiolibro Las medias de los flamencos, en Macondo Digital.
"""


def tts(text, name, title, artist):
    txt = os.path.join(WORK, name + '.txt'); open(txt, 'w', encoding='utf-8').write(text)
    aiff = os.path.join(WORK, name + '.aiff')
    subprocess.run(['say', '-v', 'Paulina', '-r', '165', '-f', txt, '-o', aiff], check=True)
    mp3 = os.path.join(FILES, name + '.mp3')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', aiff, '-ac', '1', '-ar', '22050', '-c:a', 'libmp3lame',
                    '-b:a', '64k', '-id3v2_version', '3', '-metadata', 'title=' + title, '-metadata', 'artist=' + artist,
                    '-metadata', 'album=Macondo Digital (demo)', '-metadata', 'language=spa', mp3], check=True)


tts(BIO, 'audiobiografia-rafael-pombo', 'Audiobiografía: Rafael Pombo', 'Macondo Digital')
tts(SUM, 'audioresumen-las-medias-de-los-flamencos', 'Audioresumen: Las medias de los flamencos', 'Macondo Digital')


# ---------- Portadas propias (SVG -> PNG con qlmanage + sips) ----------
def esc(s):
    return s.replace('&', '&amp;').replace('<', '&lt;')


def cover(name, title_lines, author, label, bg, fg, accent):
    # lienzo cuadrado 900x900; el área útil es la franja central x=150..750 (se recorta a 600x900)
    t = ''.join('<text x="450" y="%d" font-family="Georgia" font-size="58" font-weight="bold" fill="%s" text-anchor="middle">%s</text>'
                % (330 + i * 72, fg, esc(l)) for i, l in enumerate(title_lines))
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900" viewBox="0 0 900 900">
<rect width="900" height="900" fill="{bg}"/>
<rect x="190" y="40" width="520" height="820" rx="18" fill="none" stroke="{accent}" stroke-width="6"/>
<circle cx="450" cy="190" r="56" fill="{accent}"/>
<text x="450" y="210" font-family="Georgia" font-size="54" fill="{bg}" text-anchor="middle">M</text>
{t}
<text x="450" y="{330 + len(title_lines) * 72 + 40}" font-family="Helvetica" font-size="34" fill="{fg}" text-anchor="middle">{esc(author)}</text>
<rect x="250" y="740" width="400" height="56" rx="28" fill="{accent}"/>
<text x="450" y="778" font-family="Helvetica" font-size="26" font-weight="bold" fill="{bg}" text-anchor="middle">{esc(label)}</text>
</svg>'''
    p = os.path.join(WORK, name + '.svg'); open(p, 'w', encoding='utf-8').write(svg)
    subprocess.run(['qlmanage', '-t', '-s', '900', '-o', WORK, p], check=True, capture_output=True)
    subprocess.run(['sips', '-c', '900', '600', p + '.png', '-s', 'format', 'png', '--out',
                    os.path.join(COVERS, name + '.png')], check=True, capture_output=True)


COV = [
    ('samaniego-fabulas', ['Fábulas'], 'Félix María Samaniego', 'LIBRO', '#2f5d50', '#fdf6e3', '#e9b44c'),
    ('marti-la-edad-de-oro', ['La Edad', 'de Oro'], 'José Martí', 'LIBRO', '#7a3b12', '#fff4e0', '#f2c14e'),
    ('dario-azul', ['Azul...'], 'Rubén Darío', 'LIBRO', '#1d3557', '#f1faee', '#a8dadc'),
    ('pombo-renacuajo-y-viejecita', ['El renacuajo', 'paseador'], 'Rafael Pombo', 'LIBRO PDF', '#386641', '#f2e8cf', '#a7c957'),
    ('quiroga-las-medias-de-los-flamencos', ['Las medias de', 'los flamencos'], 'Horacio Quiroga', 'AUDIOLIBRO', '#9d0208', '#fff1e6', '#ffba08'),
    ('marti-los-zapaticos-de-rosa', ['Los zapaticos', 'de rosa'], 'José Martí', 'AUDIOLIBRO', '#6d2e46', '#fdf0f5', '#ecb0c6'),
    ('audiobiografia-rafael-pombo', ['Rafael', 'Pombo'], '1833-1912', 'AUDIOBIOGRAFÍA', '#264653', '#f4f1de', '#e9c46a'),
    ('audioresumen-las-medias-de-los-flamencos', ['Las medias de', 'los flamencos'], 'Resumen', 'AUDIORESUMEN', '#3d405b', '#f4f1de', '#f2cc8f'),
]
for c in COV:
    cover(*c)

print('ok')
