#!/usr/bin/env python3
"""Regression against the original XPHB v1.1 ZIP, never committed as a fixture.
Run: python tests/regressao_xphb.py /path/to/XPHB-2512db75eb48-v1.1-nao-homologado.zip
Requires Python 3 and Node.js. Runs the actual JavaScript engine in index.html.
"""
import argparse, hashlib, json, pathlib, re, subprocess, zipfile

ROOT = pathlib.Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("zip", type=pathlib.Path)
parser.add_argument("--html", type=pathlib.Path, default=ROOT / "index.html")
args = parser.parse_args()
expected_hash = "fc201d7167a5d1bcf18564cde8861c96b798b8312500447631774fc4339fd83d"
actual_hash = hashlib.sha256(args.zip.read_bytes()).hexdigest()
if actual_hash != expected_hash:
    raise SystemExit("Fixture diferente do ZIP original verificado: " + actual_hash)
with zipfile.ZipFile(args.zip) as z:
    if z.testzip() is not None:
        raise SystemExit("CRC inválido")
    records = [json.loads(line) for line in z.read("registros.jsonl").splitlines() if line]
    refs = json.loads(z.read("referencias.json"))
    manifest = json.loads(z.read("manifesto.json"))
    assert manifest["commit"] == "2512db75eb48ef06f6190b086a82430887906dca"
    assert len(records) == 4286 and len(refs) == 9173
html = args.html.read_text(encoding="utf-8")
scripts = re.findall(r"<script>([\s\S]*?)</script>", html)
if not scripts:
    raise SystemExit("Motor JavaScript não encontrado")
runner = """
const fs = require('node:fs');
const input = JSON.parse(fs.readFileSync(0, 'utf8'));
const E = new Function('module', input.core + '\\nreturn module.exports;')({exports:{}});
const result = E.inspectRelations(input.records);
const lookup = new Map(result.relations.map(x => [JSON.stringify([x.record,x.pointer,x.tag,x.offset]), x]));
const fixes = {item:0,itemproperty:0};
for (const x of input.refs) {
  if (x.status !== 'alvo_nao_encontrado') continue;
  const t = x.tag.toLowerCase();
  if (!(t in fixes)) continue;
  const y = lookup.get(JSON.stringify([x.record,x.pointer,x.tag,x.offset]));
  if (y && y.status === 'alvo_local_candidato') fixes[t]++;
}
const progression = result.relations.filter(x => x.kind === 'progressao');
const candidates = input.records.filter(x => E.classifyRecord(x) === 'entidade_candidata');
const properties = input.records.filter(x => x.partition !== 'entidade_candidata' && x.category === 'itemProperty' && E.classifyRecord(x) === 'entidade_candidata');
console.log(JSON.stringify({
  itens: fixes.item, propriedades: fixes.itemproperty,
  propriedades_reclassificadas: properties.length,
  conflitos: result.identityConflicts.length,
  progresso: progression.length,
  progresso_local: progression.filter(x => x.status === 'alvo_local_candidato').length,
  progresso_pendente: progression.filter(x => x.status !== 'alvo_local_candidato').length,
  candidatas: candidates.length,
  bloqueio: E.gates(true).bloquear_importacao
}));
"""
run = subprocess.run(["node", "-e", runner], input=json.dumps({"core":scripts[0],"records":records,"refs":refs}), text=True, encoding="utf-8", capture_output=True, check=True)
observed = json.loads(run.stdout)
expected = dict(itens=388, propriedades=157, propriedades_reclassificadas=9,
                conflitos=0, progresso=453, progresso_local=451,
                progresso_pendente=2, candidatas=1679, bloqueio=True)
failures = []
for name, value in expected.items():
    ok = observed.get(name) == value
    print(f"{'OK' if ok else 'FALHA'} {name}: {observed.get(name)} (esperado {value})")
    if not ok:
        failures.append(name)
print(f"{len(expected)-len(failures)}/{len(expected)} verificações aprovadas")
raise SystemExit(bool(failures))
