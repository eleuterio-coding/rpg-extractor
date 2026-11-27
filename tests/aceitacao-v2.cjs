/* Called by acceptance_v2.py with a temporary directory containing only validated JSON/JSONL. */
const fs=require('node:fs'),path=require('node:path');
const base=path.resolve(__dirname,'..'),dir=process.argv[2];
if(!dir)throw Error('Use python tests/aceitacao_v2.py PACKAGE.zip');
globalThis.crypto=require('node:crypto').webcrypto;
const exists=p=>fs.existsSync(path.join(dir,p)),j=p=>JSON.parse(fs.readFileSync(path.join(dir,p),'utf8')),l=p=>fs.readFileSync(path.join(dir,p),'utf8').split(/\r?\n/).filter(x=>x.trim()).map(x=>JSON.parse(x)),opt=(p,fallback)=>exists(p)?j(p):fallback;
const manifest=j('manifesto.json'),dnd=exists('testes/casos.jsonl'),profile=dnd?'dnd':'pf2e',adapter=dnd?'dnd5e':'pf2e';
for(const f of ['multi-core.js','adapters/'+adapter+'.js','homologation.js','rc1.js','rc2.js','rc3.js','rc4.js','release-integrity.js'])require(path.join(base,f));
const {RPGMulti:U,RPGHomolog:H,RPGRC1:R1,RPGRC2:R2,RPGRC3:R3,RPGRC4:R4,RPGRelease19:Release}=globalThis;
const html=fs.readFileSync(path.join(base,dnd?'index.html':'pf2e.html'),'utf8'),core=dnd?html.match(/<script id="rpgCore">([\s\S]*?)<\/script>/)[1]:null,E=dnd?new Function('module',core+'\nreturn module.exports;')({exports:{}}):null;
const eq=U.same,fail=m=>{throw Error(m)},check=(ok,m)=>{if(!ok)fail(m)},compare=(name,a,b)=>{if(!eq(a,b))fail(name+' differs');return Array.isArray(a)?a.length:1};
const normalized=x=>x&&x.error?{error:true}:x;
(async()=>{
 const tags=[...html.matchAll(/<script src="([^"]+)" integrity="([^"]+)"/g)].map(m=>({getAttribute:k=>k==='src'?m[1]:k==='integrity'?m[2]:null})),doc={querySelectorAll:()=>tags,getElementById:()=>({textContent:core})};
 const integrity=await Release.verify(profile,doc,async f=>new Uint8Array(fs.readFileSync(path.join(base,f))));
 check(integrity.status==='conferida','checkout SRI/schema integrity: '+integrity.errors.join('; '));
 const pack={identities:l('multissistemas/identidades.jsonl'),components:l('multissistemas/componentes.jsonl'),cases:l('multissistemas/testes.jsonl'),pending:j('multissistemas/pendencias.json'),report:j('multissistemas/manifesto.json')};
 let rows,semantic=null,engine=null,refs=[],units=[],legacy=null;const results={releaseIntegrity:integrity.status};
 if(dnd){
  const source=j('testes/relatorio.json').source,records=l('registros.jsonl'),dependencies=l('dependencias/materializadas.jsonl'),files=manifest.files;
  semantic={expressions:l('semantica/expressoes.jsonl'),facts:l('semantica/fatos.jsonl'),transformations:l('semantica/transformacoes.jsonl'),report:j('semantica/manifesto.json')};
  engine={components:l('motor/componentes.jsonl'),profiles:j('motor/perfis.json'),pending:j('motor/pendencias.json'),report:j('motor/manifesto.json')};
  const inspection={relations:j('referencias.json'),dependencyRelations:j('dependencias/referencias.json'),assets:j('ativos-pendentes.json')},sourceValidation=j('testes/fontes.json'),suite=E.suite17({engine,semantic,modular:{report:j('modulos/manifesto.json')},inspection,records,dependencies,files,source,sourceValidation});
  results.legacy17=compare('1.7 cases',suite.cases,l('testes/casos.jsonl'));compare('1.7 report',suite.report,j('testes/relatorio.json'));compare('1.7 seal',await E.seal17(suite,engine,source,sourceValidation,core),j('testes/integridade.json'));
  check(suite.report.counts.failed===0&&suite.report.counts.notExecuted===0,'1.7 not approved');
  legacy={E,components:engine.components,profiles:engine.profiles,cases:suite.cases,semantic:semantic.expressions,report:suite.report};
  rows=H.dndRows(records,dependencies,files,source);refs=[...inspection.relations,...inspection.dependencyRelations];units=j('auditoria/reconciliacao-documental.json').units;
 }else{
  const files=new Map(manifest.files.map(x=>[x.path,x.sha])),native=l('registros-nativos.jsonl').map(x=>{const local=JSON.parse(x.id).at(-1),p=local.slice(0,local.lastIndexOf('#'));return {path:p,sha:files.get(p),data:x.data};});
  rows=H.pfRows(native,manifest.selection);
 }
 const components=new Map(pack.components.map(x=>[x.id,x]));
 function replay(t,c,fn){let actual;try{actual=fn(c,t.input);}catch{actual={error:true};}check((t.status==='aprovado'||t.passed===true)&&eq(normalized(actual),normalized(t.expected))&&eq(normalized(t.actual),normalized(actual)),'case divergent: '+(t.id||t.componentId||t.component));}
 for(const t of pack.cases){const c=components.get(t.componentId);check(c,'missing multissystem component');replay(t,c,U.run);}
 results.multisystem=pack.cases.length;
 const review=await H.review({pack,sourceRows:rows,legacy,releaseIntegrity:integrity.status});
 results.reviewRecords=compare('1.9 records',review.records,l('homologacao/registros.jsonl'));results.reviewComponents=compare('1.9 components',review.components,l('homologacao/componentes.jsonl'));results.isolation=compare('1.9 isolation',review.details,l('homologacao/testes-isolamento.jsonl'));compare('1.9 report',review.report,j('homologacao/relatorio.json'));
 const ids=await R1.identities(rows);results.identities=compare('RC1 identities',ids.rows,l('rc1/identidades.jsonl'));check(!ids.collisions.length,'RC1 collisions');
 const prob={components:l('rc1/probabilidades.jsonl')},rech={components:l('rc1/recargas.jsonl')},pr=new Map(prob.components.map(x=>[x.id,x])),re=new Map(rech.components.map(x=>[x.id,x])),oldCases=l('rc1/testes.jsonl');
 for(const t of oldCases){if(pr.has(t.component))replay(t,pr.get(t.component),R1.calcChance);else if(re.has(t.component))replay(t,re.get(t.component),R1.calcRecharge);else if(E&&t.component==='xphb-d20')replay(t,null,(_,x)=>E.selectD2016(x));else if(E&&t.component==='xphb-death-save')replay(t,null,(_,x)=>E.deathSave16(x));else fail('unrecognized RC1 case '+t.component);}
 results.rc1=oldCases.length;
 const ci=await R1.componentIndex(rows,ids,semantic,engine,pack,prob,rech);compare('RC1 component identities',ci.rows,l('rc1/identidades-componentes.jsonl'));check(!ci.missing&&!ci.collisions,'RC1 index errors');
 const mech=R2.components(rows,semantic,engine),rc2={mech};compare('RC2 components',mech.components,l('rc2/componentes.jsonl'));results.rc2=compare('RC2 cases',mech.tests,l('rc2/testes.jsonl'));check(mech.tests.every(t=>t.passed),'RC2 failed');
 const docs=await R2.documentary(rows,refs,units);results.documentaryLinks=compare('RC2 documentary links',docs.links,l('rc2/vinculos-documentais.jsonl'));compare('RC2 documentary pending',docs.missing,j('rc2/vinculos-pendentes.json'));
 const added=await R3.additions(rows,semantic,rc2);compare('RC3 components',added.components,l('rc3/componentes.jsonl'));compare('RC3 materializations',added.materializations,l('rc3/materializacoes.jsonl'));results.rc3=compare('RC3 cases',added.tests,l('rc3/testes.jsonl'));check(added.tests.every(t=>t.passed),'RC3 failed');
 const index=await R3.index(rows,{ids,ci},rc2,added,semantic);results.componentIndex=compare('RC3 component identities',index.rows,l('rc3/identidades-componentes.jsonl'));check(!index.missing&&!index.collisions&&!index.revisionCollisions,'RC3 index errors');
 const plan=j('rc2/plano-migracao.json'),planSha256=j('rc2/plano-sha256.json').planSha256,projected=opt('rc2/snapshot-projetado.json',null),authorization=opt('rc2/reversao.json',null);
 check(await H.digest(plan)===planSha256,'archived plan hash differs');R2.assert(plan,'plano');if(plan.status==='simulado')await R2.reverse(projected,authorization,planSha256);else check(projected===null&&authorization===null&&plan.afterSha256===null,'blocked plan has projection or authorization');
 if(exists('rc4/diagnostico.json')){const d=j('rc4/diagnostico.json');R4.assert(d);const operations={criar:0,inalterado:0,nova_revisao:0,conflito:0,bloqueado:0};for(const o of plan.operations)operations[o.operation]++;check(eq(operations,d.operations)&&d.planSha256===planSha256&&d.planStatus===plan.status&&eq(d.errors,plan.errors),'RC4 diagnostic differs');}
 results.plan='checked';const stable=await require('./rc4-stability.cjs')(globalThis),prior=await require('./rc3-integrity.cjs')(globalThis);check(stable.passed===stable.total&&prior.results.every(x=>x.passed),'stability regression');results.rc4Stability=stable.total;results.rc3Integrity=prior.results.length;
 console.log(JSON.stringify({results,status:'passed_in_tested_scope',official:false,bloquear_importacao:true}));
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
