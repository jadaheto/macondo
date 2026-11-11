"""Extrae texto plano de un EPUB (orden del spine) -> stdout. Uso: python3 -I biores-epub2txt.py libro.epub"""
import sys, zipfile, re, html
from xml.etree import ElementTree as ET
z = zipfile.ZipFile(sys.argv[1])
cont = ET.fromstring(z.read('META-INF/container.xml'))
opf_path = cont.find('.//{*}rootfile').get('full-path')
opf = ET.fromstring(z.read(opf_path)); base = opf_path.rsplit('/', 1)[0] + '/' if '/' in opf_path else ''
man = {i.get('id'): i.get('href') for i in opf.find('{*}manifest')}
for ref in opf.find('{*}spine'):
    h = z.read(base + man[ref.get('idref')]).decode('utf-8', 'replace')
    h = re.sub(r'(?is)<(script|style|head).*?</\1>', '', h)
    h = re.sub(r'(?i)<br\s*/?>|</p>|</h\d>|</div>', '\n', h)
    t = html.unescape(re.sub(r'<[^>]+>', '', h))
    print(re.sub(r'\n\s*\n+', '\n\n', t))
