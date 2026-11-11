"""Biblioteca de ilustraciones vectoriales propias para los cuentos originales de Biblioteca Macondo.

Todo el dibujo está escrito a mano aquí (formas SVG simples, estilo plano). No usa imágenes de terceros.
Una escena es: {"bg": <fondo>, "time": "dia|atardecer|noche", "items": [[nombre, x, y, escala, {opciones}], ...]}
Lienzo: 800 x 600. (x, y) es el punto de apoyo (normalmente la base/centro inferior del elemento).
"""
import math
from html import escape as _esc

W, H = 800, 600

# Paleta cálida del Caribe + acentos Comfasucre (#17365d, #205b88, #1595a3, #76a82b)
P = {
    'navy': '#17365d', 'blue': '#205b88', 'turq': '#1595a3', 'green': '#76a82b',
    'sky': '#bfe6f2', 'sky2': '#e6f6fa', 'sea': '#2fa7b5', 'sea2': '#1595a3', 'deep': '#205b88',
    'sand': '#f3d9a4', 'sand2': '#e8c483', 'grass': '#8cc152', 'grass2': '#76a82b', 'grass3': '#5f8d28',
    'leaf': '#4f9a3a', 'leaf2': '#3d7f2e', 'trunk': '#8a5a3b', 'trunk2': '#6e4529',
    'sun': '#ffc93c', 'sun2': '#ffb000', 'orange': '#f28c38', 'coral': '#ef6f5e', 'pink': '#f49ac1',
    'yellow': '#ffd84d', 'purple': '#8e6cc9', 'white': '#ffffff', 'cream': '#fff6e5', 'ink': '#24364b',
    'gray': '#9aa8b5', 'mud': '#a9825a', 'red': '#d9534f',
}
SKIN = {'clara': '#f4cfa8', 'trigueña': '#dba574', 'morena': '#a9714a', 'oscura': '#6f442b'}
HAIR = {'negro': '#2b1d16', 'castaño': '#5a3a22', 'canoso': '#d9d9d9', 'rubio': '#d8a84e'}


def c(name, default=None):
    if name is None:
        return default
    return P.get(name, SKIN.get(name, HAIR.get(name, name)))


def g(x, y, s, body, flip=False):
    sx = -s if flip else s
    return f'<g transform="translate({x:.1f},{y:.1f}) scale({sx:.3f},{s:.3f})">{body}</g>'


def eye(x, y, r=3.2):
    return f'<circle cx="{x}" cy="{y}" r="{r}" fill="#24364b"/><circle cx="{x+r*0.35:.1f}" cy="{y-r*0.35:.1f}" r="{r*0.35:.1f}" fill="#fff"/>'


def smile(x, y, w=8, col='#24364b', sw=2.4):
    return f'<path d="M{x-w} {y} Q{x} {y+w*0.9} {x+w} {y}" fill="none" stroke="{col}" stroke-width="{sw}" stroke-linecap="round"/>'


def cheek(x, y, r=4):
    return f'<circle cx="{x}" cy="{y}" r="{r}" fill="#f28c8c" opacity=".45"/>'

# ---------------------------------------------------------------- fondos

_GID = [0]


def sky(time='dia', h=H):
    _GID[0] += 1
    gid = f'sk{_GID[0]}'
    if time == 'noche':
        stops = ('#17365d', '#205b88')
    elif time == 'atardecer':
        stops = ('#f7a76c', '#ffe1a8')
    else:
        stops = ('#9fdcef', '#e6f6fa')
    return (f'<defs><linearGradient id="{gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{stops[0]}"/>'
            f'<stop offset="1" stop-color="{stops[1]}"/></linearGradient></defs><rect width="{W}" height="{h}" fill="url(#{gid})"/>')


def waves_band(y, col, amp=8, period=80, h=None, opacity=1):
    h = h or (H - y)
    d = f'M0 {y} '
    x = 0
    while x < W:
        d += f'q{period/4} {-amp} {period/2} 0 t{period/2} 0 '
        x += period
    d += f'L{W} {H} L0 {H} Z'
    return f'<path d="{d}" fill="{col}" opacity="{opacity}"/>'


def bg(name, time='dia'):
    s = sky(time)
    if name == 'playa':
        s += waves_band(330, c('sea'), 6) + waves_band(360, c('sea2'), 5, 100, opacity=.6)
        s += f'<path d="M0 430 Q200 400 400 420 T800 410 L800 600 L0 600Z" fill="{c("sand")}"/>'
        s += f'<path d="M0 470 Q250 450 520 475 T800 465 L800 600 L0 600Z" fill="{c("sand2")}" opacity=".45"/>'
    elif name == 'mar':
        s += waves_band(300, c('sea'), 7) + waves_band(380, c('sea2'), 7, 120) + waves_band(470, c('deep'), 6, 140, opacity=.7)
    elif name == 'bajoagua':
        _GID[0] += 1
        s = (f'<defs><linearGradient id="bw{_GID[0]}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fd3dc"/>'
             f'<stop offset="1" stop-color="#1b6f8f"/></linearGradient></defs><rect width="{W}" height="{H}" fill="url(#bw{_GID[0]})"/>')
        for i in range(5):
            s += f'<path d="M{80+i*170} 0 L{140+i*170} 0 L{60+i*170} 600 L{20+i*170} 600Z" fill="#fff" opacity=".07"/>'
        s += f'<path d="M0 540 Q200 510 400 535 T800 525 L800 600 L0 600Z" fill="{c("sand2")}"/>'
        for x in (60, 230, 610, 740):
            s += seagrass(x, 545)
    elif name in ('manglar', 'cienaga', 'rio'):
        if name == 'rio':
            s += f'<path d="M0 300 Q400 270 800 300 L800 600 L0 600Z" fill="{c("grass")}"/>'
            s += f'<path d="M0 380 Q300 350 520 375 T800 365 L800 520 Q500 540 260 515 T0 525Z" fill="#5fb6c4"/>'
            s += f'<path d="M60 430 h120 M300 455 h90 M560 420 h140" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".5"/>'
        else:
            s += f'<path d="M0 310 Q200 280 400 300 T800 295 L800 340 L0 340Z" fill="{c("grass2")}" opacity=".8"/>'
            s += f'<rect y="330" width="{W}" height="270" fill="{"#4fb3a9" if name == "manglar" else "#6cbcc2"}"/>'
            for yy in (380, 440, 510):
                s += f'<path d="M{(yy*3)%200+40} {yy} h110 M{(yy*7)%300+380} {yy+12} h90" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".45"/>'
            if name == 'cienaga':
                for x in (30, 120, 680, 760):
                    s += reeds(x, 345, 1)
    elif name == 'sabana':
        s += f'<path d="M0 330 Q150 280 330 320 T640 300 T800 310 L800 600 L0 600Z" fill="{c("grass")}"/>'
        s += f'<path d="M0 420 Q250 380 480 420 T800 400 L800 600 L0 600Z" fill="{c("grass2")}"/>'
    elif name == 'bosque':
        s += f'<path d="M0 320 Q150 280 330 320 T640 300 T800 310 L800 600 L0 600Z" fill="{c("grass2")}"/>'
        for i, x in enumerate((40, 170, 640, 770)):
            s += f'<circle cx="{x}" cy="{250 + (i%2)*30}" r="95" fill="{c("leaf2")}" opacity=".55"/>'
        s += f'<path d="M0 450 Q250 420 480 450 T800 440 L800 600 L0 600Z" fill="{c("grass3")}"/>'
    elif name in ('pueblo', 'patio'):
        s += f'<rect y="390" width="{W}" height="210" fill="{c("sand") if name == "pueblo" else "#d9e9c7"}"/>'
        s += f'<rect y="380" width="{W}" height="14" fill="{c("grass2")}" opacity=".7"/>'
    elif name == 'huerta':
        s += f'<path d="M0 330 Q200 300 400 320 T800 315 L800 600 L0 600Z" fill="{c("grass")}"/>'
        for i, yy in enumerate((420, 480, 545)):
            s += f'<path d="M0 {yy} Q400 {yy-18} 800 {yy}" stroke="{c("mud")}" stroke-width="{26+i*6}" fill="none" stroke-linecap="round"/>'
    elif name in ('aula', 'casa'):
        wall = '#fdf1d6' if name == 'aula' else '#f8e0c4'
        s = f'<rect width="{W}" height="{H}" fill="{wall}"/><rect y="440" width="{W}" height="160" fill="{"#e2c39b" if name == "aula" else "#d8a87a"}"/>'
        s += f'<rect y="430" width="{W}" height="14" fill="{c("turq")}" opacity=".6"/>'
        if name == 'aula':
            s += f'<rect x="210" y="70" width="380" height="200" rx="10" fill="#2f5d50" stroke="{c("trunk")}" stroke-width="10"/>'
        else:
            s += (f'<rect x="560" y="90" width="170" height="150" rx="8" fill="#bfe6f2" stroke="#fff" stroke-width="10"/>'
                  f'<path d="M645 90 v150 M560 165 h170" stroke="#fff" stroke-width="6"/>')
    elif name == 'noche':
        s = sky('noche')
        s += waves_band(380, '#1d4f7a', 6) + waves_band(430, '#163f63', 6, 120)
    elif name == 'cielo':
        pass
    if name not in ('noche', 'aula', 'casa', 'bajoagua', 'cielo'):
        if time == 'noche':
            s += f'<rect y="250" width="{W}" height="{H-250}" fill="#0d2440" opacity=".38"/>'
        elif time == 'atardecer':
            s += f'<rect width="{W}" height="{H}" fill="#f28c38" opacity=".10"/>'
    return s


# ---------------------------------------------------------------- naturaleza

def sol(s=1, **o):
    rays = ''.join(f'<rect x="-5" y="-78" width="10" height="24" rx="5" fill="{c("sun2")}" transform="rotate({a})"/>' for a in range(0, 360, 30))
    face = (eye(-14, -6, 4) + eye(14, -6, 4) + smile(0, 10, 12) + cheek(-24, 8, 6) + cheek(24, 8, 6)) if o.get('cara', True) else ''
    return rays + f'<circle r="46" fill="{c("sun")}"/>' + face


def luna(s=1, fase='llena', **o):
    base = f'<circle r="44" fill="#fdf3c8"/>'
    if fase == 'llena':
        body = base + '<circle cx="-14" cy="-10" r="8" fill="#efe1a6"/><circle cx="16" cy="12" r="6" fill="#efe1a6"/><circle cx="6" cy="-22" r="4" fill="#efe1a6"/>'
    elif fase == 'nueva':
        body = '<circle r="44" fill="#2a4f78" stroke="#fdf3c8" stroke-width="2" stroke-dasharray="6 6"/>'
    elif fase == 'creciente':
        body = '<path d="M0 -44 A44 44 0 0 1 0 44 A26 44 0 0 0 0 -44Z" fill="#fdf3c8"/>'
    elif fase == 'menguante':
        body = '<path d="M0 -44 A44 44 0 0 0 0 44 A26 44 0 0 1 0 -44Z" fill="#fdf3c8"/>'
    elif fase == 'cuarto':
        body = '<path d="M0 -44 A44 44 0 0 1 0 44 Z" fill="#fdf3c8"/><circle r="44" fill="none" stroke="#fdf3c8" stroke-width="2" stroke-dasharray="5 6" opacity=".6"/>'
    else:
        body = base
    if o.get('cara') and fase == 'llena':
        body += eye(-12, -4, 3.5) + eye(12, -4, 3.5) + smile(0, 12, 10)
    return body


def estrellas(s=1, n=14, **o):
    out = ''
    for i in range(n):
        x = (i * 137) % 760 - 380
        y = (i * 71) % 220 - 110
        r = 2 + (i % 3)
        out += f'<circle cx="{x}" cy="{y}" r="{r}" fill="#fff8d6" opacity=".9"/>'
    return out


def nube(s=1, **o):
    col = o.get('color', '#ffffff')
    return f'<g fill="{col}"><ellipse cx="0" cy="0" rx="70" ry="26"/><circle cx="-26" cy="-14" r="28"/><circle cx="18" cy="-24" r="34"/><circle cx="48" cy="-6" r="22"/></g>'


def lluvia(s=1, **o):
    out = nube(color='#cfe2ee')
    for i in range(9):
        x = -60 + i * 15
        y = 30 + (i % 3) * 22
        out += f'<path d="M{x} {y} q-5 10 0 14 q5 -4 0 -14Z" fill="#4aa8d8"/>'
    return out


def arcoiris(s=1, **o):
    cols = ['#ef6f5e', '#f28c38', '#ffd84d', '#76a82b', '#1595a3', '#205b88', '#8e6cc9']
    return ''.join(f'<path d="M{-200+i*14} 0 A{200-i*14} {200-i*14} 0 0 1 {200-i*14} 0" fill="none" stroke="{col}" stroke-width="14"/>' for i, col in enumerate(cols))


def palmera(s=1, **o):
    trunk = '<path d="M-8 0 Q-2 -90 18 -190 L30 -188 Q12 -90 10 0Z" fill="#a8774f"/>'
    for i in range(6):
        trunk += f'<path d="M-6 {-20-i*28} h16" stroke="#8a5a3b" stroke-width="3"/>'
    leaves = ''
    for a in (-20, 25, -60, -115, -160, 150):
        leaves += f'<path d="M24 -190 q60 -30 110 10 q-55 -10 -110 -10Z" fill="{c("leaf")}" transform="rotate({a} 24 -190)"/>'
    return trunk + leaves + '<circle cx="18" cy="-182" r="8" fill="#7a5230"/><circle cx="32" cy="-180" r="8" fill="#7a5230"/>'


def mangle(s=1, **o):
    roots = ''
    for dx in (-60, -35, -10, 15, 40, 62):
        roots += f'<path d="M{dx*0.3:.0f} -70 Q{dx*0.8:.0f} -50 {dx} 10" stroke="#6e4529" stroke-width="6" fill="none" stroke-linecap="round"/>'
    trunk = '<path d="M-10 -60 L-8 -150 L10 -150 L12 -60Z" fill="#7a4f33"/>'
    crown = (f'<g fill="{c("leaf2")}"><ellipse cx="0" cy="-185" rx="95" ry="55"/></g>'
             f'<g fill="{c("leaf")}"><ellipse cx="-40" cy="-200" rx="50" ry="36"/><ellipse cx="38" cy="-205" rx="55" ry="38"/><ellipse cx="0" cy="-230" rx="45" ry="30"/></g>')
    return roots + trunk + crown


def ceiba(s=1, **o):
    trunk = '<path d="M-28 0 Q-18 -80 -16 -170 L16 -170 Q18 -80 28 0Z" fill="#9c6b48"/><path d="M-28 0 q-20 -10 -40 0 M28 0 q20 -10 40 0" stroke="#9c6b48" stroke-width="10" fill="none"/>'
    crown = (f'<g fill="{c("leaf2")}"><ellipse cx="0" cy="-200" rx="150" ry="70"/></g>'
             f'<g fill="{c("leaf")}"><ellipse cx="-70" cy="-215" rx="80" ry="48"/><ellipse cx="70" cy="-220" rx="85" ry="50"/><ellipse cx="0" cy="-250" rx="80" ry="45"/></g>')
    flores = ''
    if o.get('flores'):
        for i in range(10):
            flores += f'<circle cx="{-110+i*24}" cy="{-215 + (i*37)%60 - 20}" r="6" fill="{c(o["flores"])}"/>'
    return trunk + crown + flores


def arbusto(s=1, **o):
    col = c(o.get('color', 'leaf'))
    return f'<g fill="{col}"><circle cx="-30" cy="-25" r="28"/><circle cx="0" cy="-38" r="34"/><circle cx="32" cy="-24" r="26"/><rect x="-55" y="-26" width="110" height="26" rx="12"/></g>'


def flor(s=1, **o):
    col = c(o.get('color', 'coral'))
    pet = ''.join(f'<ellipse cx="0" cy="-12" rx="7" ry="12" fill="{col}" transform="rotate({a} 0 -60)" transform-origin="0 -60"/>' for a in ())
    petals = ''.join(f'<ellipse cx="{12*math.cos(math.radians(a)):.1f}" cy="{-60+12*math.sin(math.radians(a)):.1f}" rx="9" ry="9" fill="{col}"/>' for a in range(0, 360, 60))
    return (f'<path d="M0 0 Q4 -30 0 -60" stroke="{c("leaf2")}" stroke-width="5" fill="none"/>'
            f'<ellipse cx="10" cy="-26" rx="12" ry="5" fill="{c("leaf")}" transform="rotate(-30 10 -26)"/>' + petals + f'<circle cy="-60" r="7" fill="{c("sun2")}"/>')


def juncos(s=1, **o):
    return reeds(0, 0, 1)


def reeds(x, y, s):
    out = ''
    for i, dx in enumerate((-14, -4, 6, 16)):
        h = 70 + (i * 17) % 30
        out += f'<path d="M{x+dx} {y} Q{x+dx+(i%2*2-1)*8} {y-h/2} {x+dx+(i%2*2-1)*4} {y-h}" stroke="{c("grass3")}" stroke-width="4" fill="none"/>'
        if i % 2:
            out += f'<rect x="{x+dx+(i%2*2-1)*4-3}" y="{y-h-2}" width="7" height="20" rx="3" fill="{c("trunk")}"/>'
    return out


def seagrass(x, y):
    return ''.join(f'<path d="M{x+dx} {y} q{8*(1 if dx%2 else -1)} -30 0 -60 q-8 -25 0 -50" stroke="#3f9e6b" stroke-width="6" fill="none" stroke-linecap="round"/>' for dx in (-12, 0, 12))


def roca(s=1, **o):
    return '<path d="M-50 0 Q-48 -34 -10 -40 Q30 -44 48 -14 L52 0Z" fill="#a3aab3"/><path d="M-20 -30 q15 -6 30 0" stroke="#c7ccd2" stroke-width="5" fill="none" stroke-linecap="round"/>'


def olas(s=1, **o):
    return ''.join(f'<path d="M{-90+i*60} 0 q15 -18 30 0 t30 0" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".8"/>' for i in range(3))

# ---------------------------------------------------------------- construcciones y objetos

def casa(s=1, **o):
    wall = c(o.get('color', '#f6c36b'))
    roof = o.get('techo', 'palma')
    body = f'<rect x="-80" y="-110" width="160" height="110" fill="{wall}"/>'
    body += f'<rect x="-22" y="-70" width="44" height="70" rx="4" fill="{c("trunk")}"/><circle cx="12" cy="-34" r="3" fill="#fbd56b"/>'
    body += f'<rect x="-66" y="-88" width="34" height="30" fill="#bfe6f2" stroke="#fff" stroke-width="4"/><rect x="32" y="-88" width="34" height="30" fill="#bfe6f2" stroke="#fff" stroke-width="4"/>'
    if roof == 'palma':
        body += f'<path d="M-100 -105 L0 -190 L100 -105Z" fill="#d6a85a"/>' + ''.join(f'<path d="M{-80+i*20} -110 L{-40+i*10} -160" stroke="#b9873f" stroke-width="3"/>' for i in range(8))
    else:
        body += f'<path d="M-100 -105 L0 -175 L100 -105Z" fill="#9aa8b5"/>' + ''.join(f'<path d="M{-70+i*20} -112 L{-35+i*10} -150" stroke="#7d8b99" stroke-width="3"/>' for i in range(8))
    return body


def escuela(s=1, **o):
    body = f'<rect x="-160" y="-140" width="320" height="140" fill="#fdf6e8"/><rect x="-160" y="-140" width="320" height="22" fill="{c("turq")}"/>'
    body += f'<path d="M-180 -138 L0 -200 L180 -138Z" fill="{c("blue")}"/>'
    for x in (-130, -70, 40, 100):
        body += f'<rect x="{x}" y="-100" width="36" height="34" fill="#bfe6f2" stroke="{c("navy")}" stroke-width="3"/>'
    body += f'<rect x="-22" y="-80" width="44" height="80" fill="{c("green")}"/><rect x="-24" y="-168" width="48" height="24" rx="4" fill="#fff"/>'
    body += f'<circle cx="0" cy="-156" r="8" fill="{c("sun")}"/>'
    return body


def canoa(s=1, **o):
    col = c(o.get('color', 'trunk'))
    return (f'<path d="M-120 -30 Q0 10 120 -30 Q110 0 80 8 L-80 8 Q-110 0 -120 -30Z" fill="{col}"/>'
            f'<path d="M-112 -26 Q0 8 112 -26" stroke="#c8915e" stroke-width="5" fill="none"/>'
            + (f'<path d="M40 -60 L70 20" stroke="#6e4529" stroke-width="6" stroke-linecap="round"/><ellipse cx="72" cy="22" rx="8" ry="16" fill="#6e4529" transform="rotate(-20 72 22)"/>' if o.get('remo', True) else ''))


def sombrero(s=1, **o):
    """Sombrero tejido de ala ancha con franjas (evocación del sombrero vueltiao, patrimonio cultural)."""
    stripes = ''.join(f'<ellipse cx="0" cy="-8" rx="{88-i*12}" ry="{20-i*2.5:.1f}" fill="none" stroke="#2b1d16" stroke-width="3"/>' for i in range(3))
    crown = '<path d="M-36 -10 Q-34 -60 0 -62 Q34 -60 36 -10Z" fill="#f4ead2"/>'
    crown += ''.join(f'<path d="M{-34+i*1} {-18-i*12} Q0 {-26-i*12} {34-i*1} {-18-i*12}" stroke="#2b1d16" stroke-width="3" fill="none"/>' for i in range(3))
    return f'<ellipse cx="0" cy="-8" rx="96" ry="24" fill="#f4ead2"/>' + stripes + crown


def gaita(s=1, **o):
    """Gaita (flauta tradicional de cardón y cabeza de cera)."""
    col = '#4a3426' if o.get('tipo', 'hembra') == 'hembra' else '#5d4330'
    holes = ''.join(f'<circle cx="0" cy="{-30-i*16}" r="3.4" fill="#f4ead2"/>' for i in range(5))
    return f'<rect x="-7" y="-140" width="14" height="140" rx="6" fill="{col}"/>' + holes + '<path d="M-11 -140 Q0 -165 11 -140Z" fill="#1d1d1d"/><rect x="-1.5" y="-170" width="3" height="20" fill="#e8c483"/>'


def tambor(s=1, **o):
    return ('<path d="M-38 -80 L38 -80 L30 0 L-30 0Z" fill="#c0703f"/><ellipse cx="0" cy="-80" rx="38" ry="10" fill="#f4ead2" stroke="#6e4529" stroke-width="3"/>'
            + ''.join(f'<path d="M{-36+i*12} -78 L{-28+i*10} -2" stroke="#f4ead2" stroke-width="2.5"/>' for i in range(7)))


def libro(s=1, **o):
    col = c(o.get('color', 'turq'))
    return (f'<path d="M0 -10 Q-40 -26 -70 -14 L-70 -64 Q-40 -76 0 -60Z" fill="#fff" stroke="{col}" stroke-width="5"/>'
            f'<path d="M0 -10 Q40 -26 70 -14 L70 -64 Q40 -76 0 -60Z" fill="#fff" stroke="{col}" stroke-width="5"/>'
            '<path d="M-55 -48 q25 -8 45 0 M-55 -34 q25 -8 45 0 M10 -48 q25 -8 45 0 M10 -34 q25 -8 45 0" stroke="#b9cad8" stroke-width="3" fill="none"/>')


def pelota(s=1, **o):
    return f'<circle cy="-22" r="22" fill="{c(o.get("color","coral"))}"/><path d="M-22 -22 Q0 -8 22 -22 M0 -44 Q-10 -22 0 0" stroke="#fff" stroke-width="4" fill="none"/>'


def botella(s=1, **o):
    return '<path d="M-10 -70 L10 -70 L10 -58 Q22 -50 22 -36 L22 0 L-22 0 L-22 -36 Q-22 -50 -10 -58Z" fill="#9fdcef" opacity=".85" stroke="#205b88" stroke-width="3"/><rect x="-11" y="-80" width="22" height="10" rx="3" fill="#1595a3"/>'


def caneca(s=1, **o):
    col = c(o.get('color', 'green'))
    lab = o.get('label', '')
    arrows = '<path d="M-14 -50 l14 -20 l14 20 M14 -30 l-14 20 l-14 -20" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
    return (f'<path d="M-40 -100 L40 -100 L32 0 L-32 0Z" fill="{col}"/><rect x="-46" y="-112" width="92" height="16" rx="6" fill="{col}" stroke="#fff" stroke-width="2"/>' + arrows
            + (f'<text y="-14" text-anchor="middle" font-family="Outfit, sans-serif" font-weight="700" font-size="16" fill="#fff">{_esc(lab)}</text>' if lab else ''))


def barrilete(s=1, **o):
    col = c(o.get('color', 'coral'))
    tail = ''.join(f'<path d="M{-4+i*10} {40+i*22} l8 6 l-8 6Z" fill="{c(["yellow","turq","green","purple"][i%4])}"/>' for i in range(5))
    return (f'<path d="M0 -60 L44 0 L0 50 L-44 0Z" fill="{col}"/><path d="M0 -60 L0 50 M-44 0 L44 0" stroke="#fff" stroke-width="3"/>'
            f'<path d="M0 50 Q20 90 10 160" stroke="#24364b" stroke-width="2" fill="none"/>' + tail)


def semilla(s=1, **o):
    return '<ellipse cy="-10" rx="14" ry="10" fill="#8a5a3b"/><path d="M-6 -14 q6 -4 12 0" stroke="#c8915e" stroke-width="3" fill="none"/>'


def planta(s=1, etapa=2, **o):
    out = '<ellipse cy="0" rx="40" ry="10" fill="#8a5a3b"/>'
    if etapa == 0:
        return out + semilla()
    h = [0, 40, 90, 150][min(int(etapa), 3)]
    out += f'<path d="M0 0 Q6 {-h/2} 0 {-h}" stroke="{c("leaf2")}" stroke-width="6" fill="none"/>'
    for k in range(int(etapa)):
        yy = -h * (0.4 + 0.25 * k)
        out += f'<ellipse cx="18" cy="{yy:.0f}" rx="20" ry="9" fill="{c("leaf")}" transform="rotate(-25 18 {yy:.0f})"/><ellipse cx="-18" cy="{yy-10:.0f}" rx="20" ry="9" fill="{c("leaf")}" transform="rotate(25 -18 {yy-10:.0f})"/>'
    if etapa >= 3:
        out += f'<circle cy="{-h-8}" r="14" fill="{c(o.get("color","coral"))}"/><circle cy="{-h-8}" r="5" fill="{c("sun")}"/>'
    return out


def gota(s=1, **o):
    return ('<path d="M0 -70 Q30 -30 30 -18 A30 30 0 0 1 -30 -18 Q-30 -30 0 -70Z" fill="#4aa8d8"/>'
            '<ellipse cx="-12" cy="-30" rx="5" ry="9" fill="#fff" opacity=".6"/>' + eye(-9, -20, 3.5) + eye(9, -20, 3.5) + smile(0, -10, 7))


def corazon(s=1, **o):
    return f'<path d="M0 0 C-40 -30 -30 -70 0 -50 C30 -70 40 -30 0 0Z" fill="{c(o.get("color","coral"))}"/>'


def texto(s=1, **o):
    t = _esc(str(o.get('t', 'A')))
    size = o.get('size', 90)
    col = c(o.get('color', 'navy'))
    bgc = o.get('bg')
    box = f'<rect x="{-size*0.62*max(1,len(t))/1.2:.0f}" y="{-size*1.05:.0f}" width="{size*1.24*max(1,len(t))/1.2:.0f}" height="{size*1.2:.0f}" rx="18" fill="{c(bgc)}"/>' if bgc else ''
    return box + f'<text y="{-size*0.2:.0f}" text-anchor="middle" font-family="Outfit, sans-serif" font-weight="800" font-size="{size}" fill="{col}" stroke="#fff" stroke-width="{size/14:.1f}" paint-order="stroke">{t}</text>'


def nido(s=1, **o):
    eggs = ''.join(f'<ellipse cx="{-16+i*16}" cy="-14" rx="9" ry="12" fill="#f4f1e6"/>' for i in range(o.get('huevos', 3)))
    return eggs + '<path d="M-40 -14 Q0 20 40 -14 Q30 6 0 8 Q-30 6 -40 -14Z" fill="#a8774f"/><path d="M-36 -10 q36 18 72 0" stroke="#7a5230" stroke-width="3" fill="none"/>'


def lampara(s=1, **o):
    return ('<rect x="-30" y="-8" width="60" height="8" rx="3" fill="#24364b"/><rect x="-4" y="-80" width="8" height="74" fill="#24364b"/>'
            '<path d="M-30 -80 L30 -80 L18 -110 L-18 -110Z" fill="#ffc93c"/><path d="M-30 -80 L-140 40 L140 40 L30 -80Z" fill="#fff3b0" opacity=".35"/>')


def pupitre(s=1, **o):
    return '<rect x="-60" y="-70" width="120" height="12" rx="4" fill="#c8915e"/><rect x="-52" y="-58" width="8" height="58" fill="#6e4529"/><rect x="44" y="-58" width="8" height="58" fill="#6e4529"/>'


def grifo(s=1, **o):
    drop = '' if o.get('cerrado') else '<path d="M30 -38 q-6 12 0 16 q6 -4 0 -16Z" fill="#4aa8d8"/><path d="M30 -16 q-6 12 0 16 q6 -4 0 -16Z" fill="#4aa8d8"/>'
    return ('<rect x="-50" y="-100" width="30" height="100" fill="#b9cad8"/><path d="M-20 -80 h40 q10 0 10 10 v20 h-14 v-14 h-36Z" fill="#9aa8b5"/>'
            '<rect x="-6" y="-96" width="12" height="16" rx="3" fill="#205b88"/><rect x="-16" y="-100" width="32" height="6" rx="3" fill="#205b88"/>' + drop)


def balde(s=1, **o):
    return '<path d="M-30 -50 L30 -50 L24 0 L-24 0Z" fill="#1595a3"/><ellipse cy="-50" rx="30" ry="8" fill="#5fc6d1"/><path d="M-30 -50 Q0 -95 30 -50" stroke="#24364b" stroke-width="3" fill="none"/>'

# ---------------------------------------------------------------- animales

def manati(s=1, **o):
    col = '#8e9aa6'
    return (f'<ellipse cx="0" cy="-40" rx="110" ry="42" fill="{col}"/>'
            f'<path d="M95 -50 Q150 -90 170 -40 Q150 10 95 -30Z" fill="{col}"/>'
            f'<ellipse cx="-95" cy="-46" rx="42" ry="34" fill="#a3aeb9"/>'
            f'<ellipse cx="-120" cy="-36" rx="22" ry="16" fill="#b8c2cc"/>'
            f'<path d="M-40 -10 q-10 30 -30 34 q20 4 40 -24Z" fill="#7d8995"/>'
            + eye(-100, -58, 4) + '<circle cx="-128" cy="-38" r="2" fill="#5b6672"/><circle cx="-118" cy="-34" r="2" fill="#5b6672"/>'
            + smile(-120, -28, 8) + cheek(-90, -40, 6))


def tortuga(s=1, **o):
    shell = '#5f8d28'
    return ('<ellipse cx="-80" cy="-30" rx="28" ry="12" fill="#9cc96b" transform="rotate(-30 -80 -30)"/>'
            '<ellipse cx="70" cy="-30" rx="30" ry="12" fill="#9cc96b" transform="rotate(30 70 -30)"/>'
            '<ellipse cx="-70" cy="-62" rx="34" ry="12" fill="#9cc96b" transform="rotate(30 -70 -62)"/>'
            '<ellipse cx="62" cy="-64" rx="34" ry="12" fill="#9cc96b" transform="rotate(-30 62 -64)"/>'
            f'<ellipse cx="0" cy="-48" rx="80" ry="46" fill="{shell}"/>'
            '<path d="M-40 -70 L0 -84 L40 -70 L46 -36 L0 -16 L-46 -36Z" fill="#76a82b" stroke="#4d7420" stroke-width="3"/>'
            '<path d="M0 -84 L0 -16 M-46 -36 L46 -36" stroke="#4d7420" stroke-width="3"/>'
            '<circle cx="-104" cy="-56" r="24" fill="#9cc96b"/>' + eye(-112, -62, 4) + smile(-108, -48, 7))


def tortuguita(s=1, **o):
    return g(0, 0, 0.35, tortuga())


def iguana(s=1, **o):
    col = c(o.get('color', '#7cbf45'))
    spikes = ''.join(f'<path d="M{-40+i*16} -46 l8 -14 l8 14Z" fill="#4f9a3a"/>' for i in range(7))
    return (f'<path d="M60 -30 Q140 -30 170 -10 Q120 -16 60 -18Z" fill="{col}"/>'
            f'<ellipse cx="0" cy="-30" rx="70" ry="22" fill="{col}"/>' + spikes +
            f'<path d="M-50 -38 Q-80 -60 -110 -48 Q-120 -30 -96 -22 Q-70 -18 -50 -24Z" fill="{col}"/>'
            f'<path d="M-90 -26 q6 18 22 12 q-8 -6 -10 -14Z" fill="#f2b84b"/>'
            f'<path d="M-40 -14 l-12 14 M30 -14 l10 14" stroke="{col}" stroke-width="9" stroke-linecap="round"/>'
            + eye(-92, -44, 4) + smile(-104, -32, 6, sw=2))


def babilla(s=1, **o):
    col = '#6c8f3f'
    scutes = ''.join(f'<circle cx="{-60+i*22}" cy="-38" r="5" fill="#557530"/>' for i in range(8))
    return (f'<path d="M80 -24 Q160 -20 200 -6 Q150 -4 80 -10Z" fill="{col}"/>'
            f'<ellipse cx="0" cy="-24" rx="95" ry="20" fill="{col}"/>' + scutes +
            f'<path d="M-80 -34 L-190 -22 Q-196 -12 -186 -8 L-80 -10Z" fill="{col}"/>'
            f'<path d="M-186 -16 L-90 -18" stroke="#3f5a22" stroke-width="2"/>'
            f'<circle cx="-100" cy="-38" r="11" fill="{col}"/>' + eye(-100, -40, 4) +
            f'<path d="M-170 -14 Q-150 -4 -120 -12" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round"/>'
            f'<path d="M-50 -8 l-10 12 M40 -8 l10 12" stroke="{col}" stroke-width="9" stroke-linecap="round"/>')


def garza(s=1, **o):
    return ('<path d="M-6 0 L-2 -80 M12 0 L6 -80" stroke="#e0a030" stroke-width="5" stroke-linecap="round"/>'
            '<ellipse cx="0" cy="-100" rx="40" ry="26" fill="#fff" stroke="#dce6ee" stroke-width="2"/>'
            '<path d="M30 -110 Q60 -100 64 -60" stroke="#fff" stroke-width="0" fill="none"/>'
            '<path d="M-30 -110 Q-40 -160 -20 -180 Q-8 -190 6 -184" stroke="#fff" stroke-width="12" fill="none" stroke-linecap="round"/>'
            '<circle cx="4" cy="-186" r="14" fill="#fff"/><path d="M14 -190 L56 -182 L14 -180Z" fill="#f2b84b"/>' + eye(6, -190, 3)
            + '<path d="M28 -96 q22 6 36 22 q-24 -4 -40 -10Z" fill="#eef5fa"/>')


def mono(s=1, **o):
    col = '#8a4b2a'
    return (f'<path d="M30 -60 Q90 -60 80 -140 Q76 -160 60 -150" stroke="{col}" stroke-width="10" fill="none" stroke-linecap="round"/>'
            f'<ellipse cx="0" cy="-60" rx="34" ry="44" fill="{col}"/>'
            f'<path d="M-22 -20 l-6 20 M22 -20 l6 20" stroke="{col}" stroke-width="12" stroke-linecap="round"/>'
            f'<path d="M-30 -80 Q-56 -60 -50 -36 M30 -80 Q56 -60 50 -36" stroke="{col}" stroke-width="11" fill="none" stroke-linecap="round"/>'
            f'<circle cx="0" cy="-124" r="32" fill="{col}"/><ellipse cx="0" cy="-112" rx="22" ry="20" fill="#3a2418"/>'
            + eye(-9, -122, 3.5) + eye(9, -122, 3.5) +
            (f'<ellipse cx="0" cy="-104" rx="7" ry="9" fill="#1d120c"/>' if o.get('aullando') else smile(0, -106, 6, '#f4cfa8')))


def chiguiro(s=1, **o):
    col = '#a9774c'
    return (f'<ellipse cx="0" cy="-50" rx="80" ry="44" fill="{col}"/>'
            f'<path d="M-50 -80 Q-110 -86 -116 -54 Q-118 -34 -90 -30 L-50 -34Z" fill="{col}"/>'
            f'<rect x="-50" y="-20" width="16" height="22" rx="6" fill="#8a5d38"/><rect x="34" y="-20" width="16" height="22" rx="6" fill="#8a5d38"/>'
            f'<ellipse cx="-70" cy="-86" rx="8" ry="6" fill="#8a5d38"/>' + eye(-88, -66, 4) +
            '<ellipse cx="-114" cy="-50" rx="5" ry="4" fill="#3a2418"/>' + smile(-104, -40, 6, sw=2) + cheek(-80, -50, 6))


def colibri(s=1, **o):
    col = c(o.get('color', 'turq'))
    return (f'<ellipse cx="0" cy="-20" rx="22" ry="12" fill="{col}"/>'
            f'<path d="M-4 -26 Q-24 -70 6 -60 Q12 -40 4 -26Z" fill="#7fd3dc" opacity=".85"/>'
            f'<path d="M20 -16 L40 -10 L22 -10Z" fill="{col}"/>'
            f'<circle cx="-22" cy="-26" r="11" fill="{col}"/><path d="M-32 -28 L-64 -32 L-32 -24Z" fill="#24364b"/>'
            f'<path d="M-10 -14 q10 6 20 0" stroke="#ef6f5e" stroke-width="4" fill="none"/>' + eye(-24, -29, 2.6))


def mariposa(s=1, **o):
    col = c(o.get('color', 'yellow'))
    return (f'<ellipse cx="-18" cy="-28" rx="18" ry="22" fill="{col}" transform="rotate(-20 -18 -28)"/>'
            f'<ellipse cx="18" cy="-28" rx="18" ry="22" fill="{col}" transform="rotate(20 18 -28)"/>'
            f'<ellipse cx="-14" cy="-4" rx="11" ry="13" fill="{col}"/><ellipse cx="14" cy="-4" rx="11" ry="13" fill="{col}"/>'
            '<circle cx="-18" cy="-30" r="5" fill="#fff" opacity=".6"/><circle cx="18" cy="-30" r="5" fill="#fff" opacity=".6"/>'
            '<rect x="-3" y="-36" width="6" height="40" rx="3" fill="#24364b"/>'
            '<path d="M-2 -36 q-8 -14 -14 -14 M2 -36 q8 -14 14 -14" stroke="#24364b" stroke-width="2" fill="none"/>')


def pez(s=1, **o):
    col = c(o.get('color', 'orange'))
    return (f'<ellipse cx="0" cy="-20" rx="36" ry="20" fill="{col}"/><path d="M30 -20 L58 -40 L58 0Z" fill="{col}"/>'
            '<path d="M-6 -38 q10 -10 20 0" stroke="#fff" stroke-width="3" fill="none" opacity=".7"/>' + eye(-18, -24, 3.5) + smile(-28, -14, 4, sw=2))


def cangrejo(s=1, **o):
    col = c(o.get('color', 'coral'))
    legs = ''.join(f'<path d="M{sgn*24} {-16+k*7} l{sgn*20} {8+k*2}" stroke="{col}" stroke-width="5" stroke-linecap="round"/>' for sgn in (-1, 1) for k in range(3))
    return (legs + f'<ellipse cx="0" cy="-22" rx="32" ry="20" fill="{col}"/>'
            f'<path d="M-24 -34 Q-44 -56 -36 -70" stroke="{col}" stroke-width="6" fill="none"/><path d="M24 -34 Q44 -56 36 -70" stroke="{col}" stroke-width="6" fill="none"/>'
            f'<path d="M-46 -78 a12 12 0 1 1 18 6 l-8 -8Z" fill="{col}"/><path d="M46 -78 a12 12 0 1 0 -18 6 l8 -8Z" fill="{col}"/>'
            '<path d="M-8 -40 v-10 M8 -40 v-10" stroke="#24364b" stroke-width="3"/>' + eye(-8, -52, 4) + eye(8, -52, 4) + smile(0, -24, 7))


def pajaro(s=1, **o):
    col = c(o.get('color', 'blue'))
    return (f'<ellipse cx="0" cy="-18" rx="20" ry="16" fill="{col}"/><circle cx="-16" cy="-32" r="11" fill="{col}"/>'
            f'<path d="M-26 -32 L-38 -28 L-26 -26Z" fill="#f2b84b"/><path d="M4 -24 q18 -14 26 4 q-14 0 -26 -4Z" fill="#fff" opacity=".5"/>' + eye(-18, -34, 2.6))

# ---------------------------------------------------------------- personas

def persona(s=1, **o):
    """Niña/niño o adulto. Opciones: piel, pelo (corto|rizos|trenzas|coletas|largo|moño|calvo), pelocolor,
    ropa, pantalon (color), falda (bool), adulto (bool), gafas, silla (silla de ruedas), baston (bastón guía),
    audifono, sombrero (vueltiao), brazos (abajo|arriba|saluda), sosten (gaita|tambor|libro|botella|semilla|balde|pelota)."""
    skin = c(o.get('piel', 'trigueña'))
    hair = c(o.get('pelocolor', 'negro'))
    shirt = c(o.get('ropa', 'turq'))
    pants = c(o.get('pantalon', 'navy'))
    adult = o.get('adulto', False)
    k = 1.25 if adult else 1.0
    silla = o.get('silla', False)
    out = ''
    # medidas
    hy = -150 * k  # centro de la cabeza
    hr = 28 if not adult else 30
    by0, by1 = hy + hr + 2, -62 * k
    if silla:
        # silla de ruedas: niño sentado
        out += '<circle cx="-6" cy="-40" r="40" fill="none" stroke="#24364b" stroke-width="7"/><circle cx="-6" cy="-40" r="6" fill="#24364b"/>'
        out += '<circle cx="46" cy="-10" r="10" fill="#24364b"/><path d="M-40 -90 L-40 -40 L40 -40 L46 -10" stroke="#9aa8b5" stroke-width="6" fill="none"/>'
        hy, by0, by1 = -150, -150 + hr + 2, -72
        out += f'<rect x="-22" y="{by0}" width="44" height="{by1-by0+8}" rx="16" fill="{shirt}"/>'
        out += f'<path d="M-12 -62 h46 v40" stroke="{pants}" stroke-width="16" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
        out += f'<ellipse cx="38" cy="-14" rx="12" ry="7" fill="#24364b"/>'
        arm_y = by0 + 16
    else:
        legs_top = by1
        if o.get('falda'):
            out += f'<rect x="-14" y="{legs_top}" width="10" height="{-legs_top}" rx="5" fill="{skin}"/><rect x="4" y="{legs_top}" width="10" height="{-legs_top}" rx="5" fill="{skin}"/>'
        else:
            out += f'<rect x="-16" y="{legs_top-4}" width="14" height="{-legs_top+4}" rx="6" fill="{pants}"/><rect x="2" y="{legs_top-4}" width="14" height="{-legs_top+4}" rx="6" fill="{pants}"/>'
        out += '<ellipse cx="-10" cy="-2" rx="12" ry="6" fill="#24364b"/><ellipse cx="10" cy="-2" rx="12" ry="6" fill="#24364b"/>'
        out += f'<rect x="-24" y="{by0}" width="48" height="{by1-by0+6}" rx="18" fill="{shirt}"/>'
        if o.get('falda'):
            out += f'<path d="M-26 {by1-10} L26 {by1-10} L34 {by1+22} L-34 {by1+22}Z" fill="{pants}"/>'
        arm_y = by0 + 16
    # brazos
    br = o.get('brazos', 'abajo')
    def arm(sgn, mode):
        x0 = sgn * 20
        if mode == 'arriba':
            return f'<path d="M{x0} {arm_y} Q{sgn*44} {arm_y-30} {sgn*40} {arm_y-62}" stroke="{skin}" stroke-width="11" fill="none" stroke-linecap="round"/>'
        if mode == 'saluda' and sgn > 0:
            return f'<path d="M{x0} {arm_y} Q{sgn*50} {arm_y-6} {sgn*50} {arm_y-50}" stroke="{skin}" stroke-width="11" fill="none" stroke-linecap="round"/>'
        if mode == 'frente':
            return f'<path d="M{x0} {arm_y} Q{sgn*34} {arm_y+30} {sgn*8} {arm_y+40}" stroke="{skin}" stroke-width="11" fill="none" stroke-linecap="round"/>'
        return f'<path d="M{x0} {arm_y} Q{sgn*34} {arm_y+24} {sgn*32} {arm_y+52}" stroke="{skin}" stroke-width="11" fill="none" stroke-linecap="round"/>'
    sost = o.get('sosten')
    if sost:
        out += arm(-1, 'frente') + arm(1, 'frente')
    else:
        out += arm(-1, br) + arm(1, br)
    # cabeza
    style = o.get('pelo', 'corto')
    if style in HAIR:  # p. ej. pelo="canoso": se entiende como color
        hair, style = HAIR[style], 'corto'
    head = ''
    if style == 'largo':
        head += f'<path d="M{-hr-4} {hy} Q{-hr-8} {hy+hr+30} {-hr+4} {hy+hr+34} L{hr-4} {hy+hr+34} Q{hr+8} {hy+hr+30} {hr+4} {hy}Z" fill="{hair}"/>'
    if style == 'trenzas':
        head += f'<path d="M{-hr+2} {hy+6} q-10 30 -4 60 M{hr-2} {hy+6} q10 30 4 60" stroke="{hair}" stroke-width="10" fill="none" stroke-linecap="round"/>'
        head += f'<circle cx="{-hr-1}" cy="{hy+68}" r="5" fill="{c("coral")}"/><circle cx="{hr+1}" cy="{hy+68}" r="5" fill="{c("coral")}"/>'
    if style == 'coletas':
        head += f'<circle cx="{-hr-10}" cy="{hy-10}" r="14" fill="{hair}"/><circle cx="{hr+10}" cy="{hy-10}" r="14" fill="{hair}"/>'
    if style == 'rizos':
        head += ''.join(f'<circle cx="{hr*1.05*math.cos(math.radians(a)):.1f}" cy="{hy-6+hr*0.95*math.sin(math.radians(a)):.1f}" r="13" fill="{hair}"/>' for a in range(180, 361, 30))
    head += f'<circle cx="0" cy="{hy}" r="{hr}" fill="{skin}"/>'
    if style in ('corto', 'largo', 'trenzas', 'coletas', 'moño'):
        head += f'<path d="M{-hr} {hy-2} Q{-hr} {hy-hr-8} 0 {hy-hr-6} Q{hr} {hy-hr-8} {hr} {hy-2} Q{hr*0.4} {hy-hr*0.55} {-hr*0.2} {hy-hr*0.6} Q{-hr*0.6} {hy-hr*0.4} {-hr} {hy-2}Z" fill="{hair}"/>'
    if style == 'moño':
        head += f'<circle cx="0" cy="{hy-hr-10}" r="13" fill="{hair}"/>'
    if style == 'rizos':
        head += f'<path d="M{-hr} {hy-4} Q0 {hy-hr-14} {hr} {hy-4} Q0 {hy-hr*0.5} {-hr} {hy-4}Z" fill="{hair}"/>'
    head += eye(-10, hy + 2, 3.6) + eye(10, hy + 2, 3.6) + smile(0, hy + 13, 7) + cheek(-17, hy + 12) + cheek(17, hy + 12)
    if o.get('gafas'):
        head += f'<circle cx="-10" cy="{hy+2}" r="8" fill="none" stroke="#24364b" stroke-width="2.5"/><circle cx="10" cy="{hy+2}" r="8" fill="none" stroke="#24364b" stroke-width="2.5"/><path d="M-2 {hy+2} h4" stroke="#24364b" stroke-width="2.5"/>'
    if o.get('audifono'):
        head += f'<path d="M{hr-2} {hy-6} q8 4 4 14" stroke="{c("coral")}" stroke-width="5" fill="none" stroke-linecap="round"/>'
    if o.get('sombrero'):
        head += g(0, hy - hr + 12, 0.42, sombrero())
    out += head
    if o.get('baston'):
        out += f'<path d="M30 {arm_y+50} L70 0" stroke="#fff" stroke-width="5" stroke-linecap="round"/><path d="M62 -14 L70 0" stroke="{c("red")}" stroke-width="5" stroke-linecap="round"/>'
    if sost:
        hold = {'gaita': g(4, arm_y + 50, 0.55, gaita()), 'tambor': g(0, arm_y + 96, 0.6, tambor()),
                'libro': g(0, arm_y + 54, 0.42, libro()), 'botella': g(0, arm_y + 58, 0.55, botella()),
                'semilla': g(0, arm_y + 46, 0.9, semilla()), 'balde': g(0, arm_y + 66, 0.6, balde()),
                'pelota': g(0, arm_y + 62, 0.8, pelota()), 'planta': g(0, arm_y + 56, 0.35, planta(etapa=2)),
                'sombrero': g(0, arm_y + 50, 0.38, sombrero()), 'barrilete': g(20, arm_y - 120, 0.5, barrilete())}.get(sost, '')
        out += hold
    return out


ITEMS = {k: v for k, v in globals().items() if callable(v) and k in (
    'sol luna estrellas nube lluvia arcoiris palmera mangle ceiba arbusto flor juncos roca olas casa escuela canoa sombrero gaita '
    'tambor libro pelota botella caneca barrilete semilla planta gota corazon texto nido lampara pupitre grifo balde manati tortuga '
    'tortuguita iguana babilla garza mono chiguiro colibri mariposa pez cangrejo pajaro persona').split()}


def render_scene(scene, w=W, h=H, title=None):
    body = bg(scene.get('bg', 'cielo'), scene.get('time', 'dia'))
    for it in scene.get('items', []):
        name, x, y = it[0], it[1], it[2]
        s = it[3] if len(it) > 3 else 1
        opts = dict(it[4]) if len(it) > 4 else {}
        flip = opts.pop('flip', False)
        fn = ITEMS.get(name)
        if not fn:
            raise ValueError(f'Elemento desconocido: {name}')
        body += g(x, y, s, fn(**opts), flip)
    t = f'<title>{_esc(title)}</title>' if title else ''
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{w}" height="{h}" role="img">{t}'
            f'<rect width="{W}" height="{H}" fill="#fff"/>{body}</svg>')
