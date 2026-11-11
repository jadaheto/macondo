import csv, json, re, sys
src, out = sys.argv[1], sys.argv[2]
rows=[]
def parse_authors(s):
    res=[]
    for part in [p.strip() for p in s.split(';') if p.strip()]:
        role='Author'
        m=re.search(r'\[([^\]]+)\]\s*$', part)
        if m: role=m.group(1); part=part[:m.start()].strip()
        # years
        birth=death=None; uncertain=False
        m=re.search(r',\s*(BCE?\s*)?(\??\d{1,4}\??)?\s*(BCE)?\s*-\s*(\??\d{1,4}\??)?\s*(BCE)?\s*$', part)
        name=part
        if m:
            name=part[:m.start()].strip()
            d=m.group(4)
            if d:
                if '?' in d: uncertain=True
                death=int(d.strip('?'))
                if m.group(5): death=-death
            b=m.group(2)
            if b: birth=int(b.strip('?'))
        else:
            m2=re.search(r',\s*(active|fl\.)?\s*.*?(\d{1,4}).*$', part)
            if re.search(r'\d', part):
                name=re.split(r',\s*(?=[^,]*\d)', part)[0]
                uncertain=True
        res.append(dict(raw=part,name=name,role=role,birth=birth,death=death,uncertain=uncertain))
    return res
with open(src,newline='',encoding='utf-8') as f:
    for r in csv.DictReader(f):
        if r['Type']!='Text': continue
        langs=[l.strip() for l in r['Language'].split(';')]
        if langs!=['es']: continue
        rows.append(dict(id=int(r['Text#']),title=r['Title'],issued=r['Issued'],authors=parse_authors(r['Authors']),authors_raw=r['Authors'],subjects=r['Subjects'],locc=r['LoCC'],shelves=r['Bookshelves']))
json.dump(rows,open(out,'w'),ensure_ascii=False,indent=0)
print(len(rows))
