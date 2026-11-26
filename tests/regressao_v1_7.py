#!/usr/bin/env python3
"""Rerun the published browser core against a local v1.6/v1.7 ZIP. Requires Node.js 20+."""
import json, pathlib, subprocess, sys, zipfile, re, tempfile
if len(sys.argv) != 2:
    raise SystemExit("Usage: python tests/regressao_v1_7.py PACKAGE.zip")
root=pathlib.Path(__file__).resolve().parents[1]
html=(root/"index.html").read_text(encoding="utf-8")
core=re.search(r'<script id="rpgCore">([\s\S]*?)</script>',html).group(1)
with zipfile.ZipFile(sys.argv[1]) as z:
    if z.testzip(): raise SystemExit("CRC inválido")
    def j(p): return json.loads(z.read(p))
    def l(p): return [json.loads(x) for x in z.read(p).splitlines() if x.strip()]
    m=j("manifesto.json")
    source={k:m[k] for k in ["repo","commit","tree","code","scope","requestedRef"] if k in m}
    records=l("registros.jsonl"); deps=l("dependencias/materializadas.jsonl")
    a=j("auditoria.json")
    selection={"valid":True,"requested":m["allowedDependencySources"],"available":[],"invalid":[],"scope":"Seleção registrada no ZIP; catálogo integral não reconstruído no replay."}
    if "testes/fontes.json" in z.namelist(): selection=j("testes/fontes.json")
    ctx=dict(records=records,dependencies=deps,files=m["files"],source=source,sourceValidation=selection,
        engine=dict(components=l("motor/componentes.jsonl"),profiles=j("motor/perfis.json"),pending=j("motor/pendencias.json"),report=j("motor/manifesto.json")),
        semantic=dict(expressions=l("semantica/expressoes.jsonl"),facts=l("semantica/fatos.jsonl"),report=j("semantica/manifesto.json")),
        modular=dict(report=j("modulos/manifesto.json")),
        inspection=dict(relations=j("referencias.json"),dependencyRelations=j("dependencias/referencias.json"),assets=j("ativos-pendentes.json")))
    prior=j("testes/relatorio.json") if "testes/relatorio.json" in z.namelist() else None
    prior_cases=l("testes/casos.jsonl") if "testes/casos.jsonl" in z.namelist() else None
    seal=j("testes/integridade.json") if "testes/integridade.json" in z.namelist() else None
with tempfile.TemporaryDirectory() as temp:
    p=pathlib.Path(temp)
    (p/"core.js").write_text(core,encoding="utf-8")
    (p/"data.json").write_text(json.dumps(dict(ctx=ctx,prior=prior,priorCases=prior_cases,seal=seal),ensure_ascii=False),encoding="utf-8")
    (p/"run.js").write_text("""const fs=require('node:fs'), E=require('./core.js'), d=JSON.parse(fs.readFileSync(__dirname+'/data.json','utf8'));
(async()=>{const t=E.suite17(d.ctx);const eq=(a,b)=>E.canonical(a)===E.canonical(b);let replay=true;if(d.prior){replay=eq(t.report,d.prior)&&eq(t.cases,d.priorCases)&&eq(await E.seal17(t,d.ctx.engine,d.ctx.source,d.ctx.sourceValidation,fs.readFileSync(__dirname+'/core.js','utf8')),d.seal);}console.log(JSON.stringify({report:t.report,replay,failed:t.cases.filter(x=>x.status!=='aprovado').slice(0,10)},null,2));if(!replay||t.report.status==='bloqueado')process.exitCode=1;})().catch(e=>{console.error(e);process.exitCode=1;});""",encoding="utf-8")
    subprocess.run(["node",str(p/"run.js")],check=True)
