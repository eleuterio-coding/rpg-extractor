#!/usr/bin/env python3
"""Acceptance of local RC3/RC4 exports; Python 3, jsonschema, Node 22 for engine replay."""
import argparse, hashlib, json, pathlib, subprocess, tempfile, zipfile
from jsonschema import Draft202012Validator as Validator

def require(ok, message):
    if not ok:
        raise ValueError(message)

def digest(b):
    return hashlib.sha256(b).hexdigest()

MAPPING = {
    'semantica': ('1.5.0', {'fatos':'fato','expressoes':'expressao','consulta':'consulta','transformacoes':'transformacao'}),
    'motor': ('1.6.0', {'componentes':'componente'}),
    'testes': ('1.7.0', {'casos':'caso','relatorio':'relatorio','integridade':'integridade'}),
    'multissistemas': ('1.8.0', {'identidades':'identidade','componentes':'componente','testes':'caso','manifesto':'relatorio'}),
    'homologacao': ('1.9.0', {'registros':'registro','componentes':'componente','matriz':'matriz','relatorio':'relatorio','plano-simulacao':'plano','snapshot-entrada':'snapshot','snapshot-projetado':'snapshot','contratos-provisorios':'contrato'}),
    'rc1': ('2.0.0-rc.1', {'identidades':'identidade','dependencias':'dependencia','probabilidades':'probabilidade','recargas':'recarga','identidades-componentes':'identidadeComponente','testes':'caso','plano-migracao':'plano','snapshot-entrada':'snapshot','snapshot-projetado':'snapshot','reversao':'reversao'}),
    'rc2': ('2.0.0-rc.2', {'componentes':'componente','testes':'caso','vinculos-documentais':'vinculoDocumental','plano-migracao':'plano','snapshot-entrada':'snapshot','snapshot-projetado':'snapshot','reversao':'reversao'}),
    'rc3': ('2.0.0-rc.3', {'componentes':'componente','materializacoes':'materializacao','testes':'caso','identidades-componentes':'identidadeComponente'}),
    'rc4': ('2.0.0-rc.4', {'diagnostico':'diagnostico'}),
}

def audit(path):
    with zipfile.ZipFile(path) as z:
        names = z.namelist(); ns = set(names)
        require(len(ns)==len(names), 'duplicate ZIP entry')
        require(all(n and not n.startswith('/') and '\\' not in n and all(k not in ('','.','..') for k in n.split('/')) for n in names), 'unsafe ZIP path')
        require(z.testzip() is None, 'CRC mismatch')
        hashes = {n:digest(z.read(n)) for n in names}
        def j(n): return json.loads(z.read(n))
        def l(n): return [json.loads(x) for x in z.read(n).splitlines() if x.strip()]
        def load(n): return l(n) if n.endswith('.jsonl') else j(n)
        m=j('manifesto.json'); version=m['version']; require(version in ('2.0.0-rc.3','2.0.0-rc.4'), 'unsupported export version')
        require(m['bloquear_importacao'] is True, 'official import not blocked')
        global_name='proveniencia/hashes-sha256.json'; global_seal=j(global_name)
        require(global_seal=={n:h for n,h in hashes.items() if n!=global_name}, 'global seal incomplete or divergent')
        seals=['homologacao/selo.json','rc1/selo.json','rc2/selo.json','rc3/selo.json']
        if version.endswith('.4'): seals.append('rc4/selo.json')
        if 'multissistemas/integridade.json' in ns: seals.append('multissistemas/integridade.json')
        for p in seals:
            d=j(p); d=d.get('files',d)
            require(bool(d) and all(hashes.get(n)==h and n!=p for n,h in d.items()), f'bad seal: {p}')
        schemas={n:j(n) for n in names if n.startswith('schemas/') and n.endswith('.schema.json')}
        for s in schemas.values(): Validator.check_schema(s)
        checked=0
        def validate(p, sp):
            nonlocal checked
            data=load(p); v=Validator(schemas[sp]); items=data if isinstance(data,list) else [data]
            for i,x in enumerate(items):
                e=next(v.iter_errors(x),None)
                require(e is None, f'{p}[{i}]: {e.message if e else ""}')
            checked+=len(items)
        for directory,(v,mp) in MAPPING.items():
            for stem,schema in mp.items():
                for ext in ('.json','.jsonl'):
                    p=directory+'/'+stem+ext
                    if p in ns: validate(p,f'schemas/{v}/{schema}.schema.json')
        for i in range(1,11):
            k=f'M{i:02d}'; p=f'modulos/{k}.json'
            if p in ns: validate(p,f'schemas/1.4.0/{k}.schema.json')
        ids=l('rc1/identidades.jsonl'); ci=l('rc3/identidades-componentes.jsonl'); legacy=l('rc1/identidades-componentes.jsonl')
        for values in (ids,ci):
            for key in ('logicalId','revisionId'): require(len({x[key] for x in values})==len(values), f'duplicate {key}')
        require(ci[:len(legacy)]==legacy,'legacy index changed')
        cases={}
        for p in ('testes/casos.jsonl','multissistemas/testes.jsonl','homologacao/testes-isolamento.jsonl','rc1/testes.jsonl','rc2/testes.jsonl','rc3/testes.jsonl'):
            if p not in ns: continue
            a=l(p); require(all(x.get('status')=='aprovado' or x.get('passed') is True for x in a), f'failed or unexecuted: {p}'); cases[p]=len(a)
        if version.endswith('.4'):
            d=j('rc4/diagnostico.json'); p=j('rc2/plano-migracao.json')
            require(d['planStatus']==p['status'] and d['errors']==p['errors'] and d['planSha256']==j('rc2/plano-sha256.json')['planSha256'], 'diagnostic differs from plan')
            require(d['projection']==('rc2/snapshot-projetado.json' in ns) and d['reversal']==('rc2/reversao.json' in ns),'diagnostic file flags differ')
            require(p['status']!='bloqueado' or not d['projection'] and not d['reversal'],'blocked plan has projection')
            require(d['official'] is False and d['bloquear_importacao'] is True,'diagnostic permits import')
        return {'file':path.name,'sha256':digest(path.read_bytes()),'version':version,'files':len(names),'globalHashes':len(global_seal),'seals':len(seals),'schemas':len(schemas),'schemaInstances':checked,'identities':len(ids),'components':len(ci),'recordedCases':cases,'structure':'passed','engineReplay':'not_executed'}

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('packages',nargs='+',type=pathlib.Path);p.add_argument('--somente-estrutura',action='store_true');p.add_argument('--saida',type=pathlib.Path);a=p.parse_args();results=[]
    for package in a.packages:
        r=audit(package);results.append(r)
        if not a.somente_estrutura:
            root=pathlib.Path(__file__).resolve().parents[1]
            with tempfile.TemporaryDirectory() as t:
                with zipfile.ZipFile(package) as z:
                    for n in z.namelist():
                        if n.endswith(('.json','.jsonl')):
                            dest=pathlib.Path(t)/n;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(z.read(n))
                proc=subprocess.run(['node',str(root/'tests'/'aceitacao-v2.cjs'),t],check=True,text=True,capture_output=True)
                r['engineReplay']=json.loads(proc.stdout)
    result={'packages':results,'certification':'external_review_required','official':False,'bloquear_importacao':True}
    out=json.dumps(result,ensure_ascii=False,indent=2)+'\n';print(out,end='')
    if a.saida: a.saida.write_text(out,encoding='utf-8')

if __name__=='__main__': main()
