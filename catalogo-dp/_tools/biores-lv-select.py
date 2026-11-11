"""Selección de secciones LibriVox para audiobiografías (Macondo Digital).
Genera _tmp/biores/lv_plan.json con las URL 64 kbps de cada sección elegida."""
import json, sys, os
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
LV = os.path.join(ROOT, '_tmp/biores/lv')
# slug -> (librivox id, [section numbers])
SEL = {
  'marti-tres-heroes': ('2162', ['1']),
  'marti-el-padre-las-casas': ('2162', ['18']),
  'marti-musicos-poetas-y-pintores': ('2162', ['14']),
  'caballero-licurgo-socrates-platon': ('13232', ['16']),
  'caballero-aristoteles-heraclito-democrito': ('13232', ['17']),
  'caballero-pitagoras-epicuro-epicteto': ('13232', ['19']),
  'caballero-esopo-y-poetas-griegos': ('13232', ['22']),
  'ramon-y-cajal-recuerdos-infancia': ('19586', ['4', '5']),
  'dario-vida-caps-1-5': ('13121', ['1']),
  'obregon-balboa-primeros-anos': ('22137', ['1']),
  'obregon-balboa-descubrimiento-pacifico': ('22137', ['4']),
  'lummis-colon-el-descubridor': ('22609', ['3']),
  'lummis-cabeza-de-vaca': ('22609', ['9']),
  'confucio-vida-de-confucio': ('22907', ['3']),
  'gimeno-heroinas-mexicanas-y-espanolas': ('21404', ['9']),
  'gimeno-dos-grandes-reinas': ('21404', ['14']),
  'gimeno-dos-escritoras-realistas': ('21404', ['15']),
  'plutarco-alejandro-1': ('17686', ['1']),
}
plan = {}
for slug, (bid, secs) in SEL.items():
    b = json.load(open(os.path.join(LV, bid + '.json')))['books'][0]
    out = []
    for s in b['sections']:
        if s['section_number'] in secs:
            out.append({'n': s['section_number'], 'title': s['title'], 'url': s['listen_url'].replace('://www.archive.org/', '://archive.org/'),
                        'readers': [r['display_name'] for r in s['readers']], 'playtime': int(s['playtime'] or 0)})
    plan[slug] = {'id': bid, 'title': b['title'], 'url_librivox': b['url_librivox'], 'url_text_source': b.get('url_text_source'),
                  'authors': b['authors'], 'translators': b.get('translators') or [], 'sections': out}
json.dump(plan, open(os.path.join(ROOT, '_tmp/biores/lv_plan.json'), 'w'), ensure_ascii=False, indent=1)
print(len(plan), 'items;', sum(len(p['sections']) for p in plan.values()), 'sections')
