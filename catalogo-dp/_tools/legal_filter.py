import json, sys, collections
rows=json.load(open(sys.argv[1]))
ok=[];rej=[]
for r in rows:
    reasons=[]
    for a in r['authors']:
        if a['name'].lower() in ('anonymous','unknown','various'):
            if a['name'].lower()=='various': reasons.append('Various (autores no identificados)')
            continue
        if a['death'] is None: reasons.append(f"{a['name']} [{a['role']}]: muerte desconocida")
        elif a['uncertain']: reasons.append(f"{a['name']} [{a['role']}]: año incierto {a['death']}")
        elif a['death']>1945: reasons.append(f"{a['name']} [{a['role']}]: †{a['death']}")
    r['reasons']=reasons
    (rej if reasons else ok).append(r)
json.dump(ok,open(sys.argv[2],'w'),ensure_ascii=False)
json.dump(rej,open(sys.argv[3],'w'),ensure_ascii=False)
print('ok',len(ok),'rej',len(rej))
print(collections.Counter(a['role'] for r in rows for a in r['authors']))
