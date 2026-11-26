/* RPG Extractor 1.9 — granular review and offline provisional import plan. No destination API. */
(function(root){'use strict';
const U=root.RPGMulti,V='1.9.0',str={type:'string',minLength:1},sha={type:'string',pattern:'^[a-f0-9]{64}$'},num={type:'integer',minimum:0},bool={type:'boolean'},obj=p=>({type:'object',properties:p,required:Object.keys(p),additionalProperties:false}),arr=i=>({type:'array',items:i}),cn=v=>({const:v});
const scope=U.schemas.identidade.properties.scope;
const target=obj({id:str,version:cn(V),scope,official:cn(false),mode:cn('simulacao_local'),allowedKinds:{type:'array',items:{enum:['registro_consultivo','componente_isolado']},uniqueItems:true},bloquear_importacao:cn(true)});
const candidate=obj({id:str,kind:{enum:['registro_consultivo','componente_isolado']},scope,payloadSha256:sha,sourceId:str});
const snapshot=obj({version:cn(V),contractId:str,scope,items:arr(candidate)});
const status={enum:['aprovado_no_escopo_testado','bloqueado','consultivo','nao_testado']};
const recordReview=obj({id:str,scope,partition:str,sourceEvidence:{enum:['conferida','divergente']},state:status,payloadSha256:sha,reasons:arr(str),bloquear_importacao:cn(true)});
const componentReview=obj({id:str,recordId:str,scope,layer:{enum:['motor-1.6','multissistemas-1.8','perfil-1.6']},sourceEvidence:{enum:['conferida','divergente']},tests:obj({passed:num,failed:num,positive:num,negative:num,isolation:num}),state:status,payloadSha256:sha,reasons:arr(str),bloquear_importacao:cn(true)});
const planRow=obj({candidate,operation:{enum:['criar_simulado','inalterado','conflito','bloqueado']},reason:str,existingSha256:{oneOf:[sha,{type:'null'}]}});
const planSchema=obj({version:cn(V),contractId:{type:['string','null']},scope,mode:cn('simulacao_local'),official:cn(false),snapshotOrigin:{enum:['vazio_declarado','arquivo_local']},counts:obj({create:num,unchanged:num,conflict:num,blocked:num}),operations:arr(planRow),status:{enum:['simulacao_sem_conflitos','bloqueado']},rollbackCandidates:arr(str),errors:arr(str),bloquear_importacao:cn(true)});
const matrixRow=obj({scope,records:num,components:num,passedComponents:num,contractId:{type:['string','null']},compatibility:{enum:['contrato_provisorio_local','sem_contrato_provisorio']},official:cn(false),integration:cn('bloqueada')});
const reportSchema=obj({version:cn(V),scope,records:num,components:num,passedComponents:num,blockedComponents:num,sourcePending:num,sourceFailures:num,releaseIntegrity:{enum:['conferida','divergente','nao_conferida']},reviewStatus:{enum:['aprovado_no_escopo_testado','bloqueado']},official:cn(false),integration:cn('bloqueada'),bloquear_importacao:cn(true),limits:arr(str)});
const schemas=Object.fromEntries(Object.entries({contrato:target,candidato:candidate,snapshot,registro:recordReview,componente:componentReview,plano:planSchema,planoLinha:planRow,matriz:matrixRow,relatorio:reportSchema}).map(([k,v])=>[k,{$schema:'https://json-schema.org/draft/2020-12/schema',$id:'https://eleuterio-coding.github.io/rpg-extractor/schemas/1.9.0/'+k+'.schema.json',...v}]));
const DND={adapter:'dnd5e-5etools',system:'dnd5e',edition:'5e-2024-revisada',publication:'XPHB'},PF={adapter:'pf2e-foundry',system:'pf2e',edition:'remaster',publication:'Pathfinder Player Core'};
const contracts=[{id:'local-xphb-1.9.0',version:V,scope:DND,official:false,mode:'simulacao_local',allowedKinds:['registro_consultivo','componente_isolado'],bloquear_importacao:true},{id:'local-pf2e-player-core-1.9.0',version:V,scope:PF,official:false,mode:'simulacao_local',allowedKinds:['registro_consultivo','componente_isolado'],bloquear_importacao:true}];
const clone=x=>JSON.parse(JSON.stringify(x)),same=U.same,matchScope=(a,b)=>same(a,b),key=s=>U.canonical(s);
function deepFreeze(x){if(x&&typeof x==='object'&&!Object.isFrozen(x)){for(const v of Object.values(x))deepFreeze(v);Object.freeze(x);}return x;}
deepFreeze(contracts);deepFreeze(schemas);
// Reuse the universal validator through an isolated schema registration, never validate an arbitrary external schema.
function assert(x,k){const name='h19-'+k;U.schemas[name]=schemas[k];try{return U.assert(x,name);}finally{delete U.schemas[name];}}
function contractFor(s){return contracts.find(c=>matchScope(c.scope,s))||null;}
const enc=new TextEncoder();
async function digest(v){return U.shaHex('SHA-256',enc.encode(U.canonical(v)));}
function countDuplicates(items,keyfn){const counts=new Map();for(const x of items){const k=keyfn(x);counts.set(k,(counts.get(k)||0)+1);}return counts;}
function assertDistinct(items,keyfn){const counts=countDuplicates(items,keyfn);return [...counts.values()].every(n=>n===1);}
function originalMap(sourceRows){const out=new Map();for(const r of sourceRows){if(out.has(r.localId))throw Error('ID de origem duplicado: '+r.localId);out.set(r.localId,r);}return out;}
function recordEvidence(id,r){if(!id||!r||!r.data||!matchScope(id.scope,r.scope)||id.evidence.path!==r.path||id.evidence.pointer!==r.pointer||id.evidence.sourceSha!==r.sha||id.evidence.repo!==r.repo||id.evidence.commit!==r.commit||id.nativeType!==r.nativeType||id.partition!==r.partition)return false;
 return id.id===JSON.stringify([id.scope.system,id.scope.edition,id.scope.publication,id.evidence.repo,id.evidence.commit,id.localId]);}
function componentEvidence(c,id,r,legacySemantic=null){if(!id||!r||!recordEvidence(id,r))return false;const e=c.evidence;if(!e||e.path!==id.evidence.path||e.sourceSha!==id.evidence.sourceSha||e.pointer!==r.pointer&&!e.pointer.startsWith(r.pointer+'/')||(e.repo&&e.repo!==id.evidence.repo)||e.commit!==id.evidence.commit)return false;
 try{const v=U.findPointer(r.data,e.pointer.slice(r.pointer.length));if(legacySemantic){if(legacySemantic.evidence.record!==id.localId||legacySemantic.raw!==c.raw||legacySemantic.evidence.pointer!==e.pointer)return false;return legacySemantic.offset===null?same(v,c.raw):typeof v==='string'&&v.slice(legacySemantic.offset,legacySemantic.offset+c.raw.length)===c.raw;}
 if(typeof c.raw==='string'&&typeof v==='string'&&c.raw.startsWith('{@'))return v.includes(c.raw);
 return same(v,c.raw);}catch{return false;}}
function valueFor(c){const p=c.params;if(p.kind==='multiplicador_forca')return {strengthScore:10};if(p.kind==='custo_acao_pf2e')return {actionsAvailable:3};if(p.kind==='dados_fixos_pf2e')return {rolls:Array(p.count).fill(1)};return null;}
// Separate expectation from the adapter's execution. Only these audited isolated primitives.
function oracle(c,v){const p=c.params;if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).length!==1)return {error:true};let value,n=0;
 if(p.kind==='multiplicador_forca'){if(!Number.isInteger(v.strengthScore)||v.strengthScore<1||v.strengthScore>30)return {error:true};value=v.strengthScore*p.multiplier;}
 else if(p.kind==='custo_acao_pf2e'){if(!Number.isInteger(v.actionsAvailable)||v.actionsAvailable< p.cost||v.actionsAvailable>3)return {error:true};value=v.actionsAvailable-p.cost;}
 else if(p.kind==='dados_fixos_pf2e'){if(!Array.isArray(v.rolls)||v.rolls.length!==p.count||v.rolls.some(x=>!Number.isInteger(x)||x<1||x>p.sides))return {error:true};n=v.rolls.length;value=v.rolls.reduce((a,b)=>a+b,0)+p.modifier;}
 else return {error:true};
 return {kind:p.kind,value,rollsConsumed:n,bloquear_importacao:true};}
function replayMulti(c,rows){let passed=0,failed=0,positive=0,negative=0,isolation=0;const reasons=[],details=[];
 for(const t of rows){let actual;try{actual=U.run(c,t.input);}catch{actual={error:true};}
  const sameCtx=matchScope(c.scope,t.input.scope),validOwn=oracle(c,t.input.values),expected=sameCtx?validOwn:{error:true};
  const ok=t.status==='aprovado'&&same(expected,t.expected)&&same(actual,expected)&&same(t.actual,actual);
  if(ok){passed++;if(expected.error)negative++;else positive++;if(!sameCtx&&!validOwn.error)isolation++;}else{failed++;reasons.push('Caso divergente '+t.id);}
 }
 // Exact same valid values for the control and all incompatible contexts, independent of recorded tests.
 const v=valueFor(c);if(v){const own=oracle(c,v);const alt=[c.scope,{...c.scope,edition:'incompativel-1.9'},{...c.scope,publication:'incompativel-1.9'},{...c.scope,adapter:c.scope.adapter==='pf2e-foundry'?'dnd5e-5etools':'pf2e-foundry',system:c.scope.system==='pf2e'?'dnd5e':'pf2e'}];
 for(let i=0;i<alt.length;i++){const input={scope:alt[i],values:v},expected=i?{error:true}:own;let actual;try{actual=U.run(c,input);}catch{actual={error:true};}const ok=!own.error&&same(actual,expected);details.push({componentId:c.id,dimension:['controle','edicao','publicacao','sistema'][i],input,expected,actual,status:ok?'aprovado':'reprovado'});if(ok){passed++;if(i){negative++;isolation++;}else positive++;}else{failed++;reasons.push('Isolamento divergente: '+i);}}
 }else reasons.push('Sem oráculo para o componente');
 if(!rows.length)reasons.push('Sem casos originais');if(!positive||!negative||isolation<3)reasons.push('Cobertura insuficiente');
 return {passed,failed,positive,negative,isolation,reasons,details};}
function replayLegacy(c,rows,E,sem){let passed=0,failed=0,positive=0,negative=0;const reasons=[];const raw=sem?.offset===null?c.raw:c.raw.match(/^\{@[^\s{}]+\s+([^|{}]+)/)?.[1]?.replace(/\}$/,'');
 for(const t of rows){if(t.operation==='schema_e_evidencia')continue;let actual,expect=t.expected;
  try{if(t.operation.startsWith('aritmetica_')){const mode=t.operation.slice('aritmetica_'.length),ref=E.referenceFixture17(raw,t.input.variables?.summonSpellLevel??null,mode);if(!ref||!same(ref.input,t.input)||!same(ref.expected,t.expected))throw Error('Oráculo divergente');}
   else if(!['entrada_invalida','variavel_ausente'].includes(t.operation)||!expect?.error)throw Error('Caso não reconhecido');
  }catch{failed++;reasons.push('Expectativa não reproduzida '+t.id);continue;}
  try{actual=E.runMath16(c.ast,t.input);}catch{actual={error:true};}
  const oldActual=t.actual?.error?{error:true}:t.actual,ok=t.status==='aprovado'&&same(actual,expect)&&same(oldActual,actual);
  if(ok){passed++;if(expect.error)negative++;else positive++;}else{failed++;reasons.push('Caso divergente '+t.id);}}
 if(!positive||!negative||!rows.some(t=>t.operation==='schema_e_evidencia'&&t.status==='aprovado'))reasons.push('Cobertura insuficiente');
 return {passed,failed,positive,negative,isolation:0,reasons,details:[]};}
function groupBy(items,k){const m=new Map();for(const x of items){const v=k(x);if(!m.has(v))m.set(v,[]);m.get(v).push(x);}return m;}
function safeArray(x){return Array.isArray(x)?x:[];}
async function review({pack,sourceRows,legacy=null,releaseIntegrity='nao_conferida'}){
 const orig=originalMap(sourceRows),identities=pack.identities,ids=new Map(identities.map(x=>[x.id,x])),locals=new Map(identities.map(x=>[x.localId,x])),recordRows=[],components=[],details=[],issues=[],candidateRows=[];
 const dup=countDuplicates(identities,x=>x.id),dupLocal=countDuplicates(identities,x=>x.localId),mcases=groupBy(pack.cases,x=>x.componentId),legacyCases=groupBy(legacy?.cases||[],x=>x.component),semantics=new Map((legacy?.semantic||[]).map(x=>[x.id,x]));
 const legacyIds=new Set((legacy?.components||[]).map(c=>c.id));const multiIds=new Set(pack.components.map(c=>c.id));
 for(const id of identities){const r=orig.get(id.localId),reasons=[];let good=false;try{U.assert(id,'identidade');good=recordEvidence(id,r)&&dup.get(id.id)===1&&dupLocal.get(id.localId)===1;}catch{}if(!good)reasons.push('Identidade, escopo ou evidência divergente');if(id.scope.edition==='nao_confirmada')reasons.push('Edição não confirmada');if(!contractFor(id.scope))reasons.push('Sem contrato provisório exato');if(id.partition!=='principal')reasons.push('Partição segregada; não candidata à simulação');
  const payloadSha256=await digest({identity:id,data:r?.data??null}),state=good?'consultivo':'bloqueado';recordRows.push(assert({id:id.id,scope:id.scope,partition:id.partition,sourceEvidence:good?'conferida':'divergente',state,payloadSha256,reasons,bloquear_importacao:true},'registro'));
  if(good&&id.partition==='principal')candidateRows.push(assert({id:id.id,kind:'registro_consultivo',scope:id.scope,payloadSha256,sourceId:id.id},'candidato'));}
 const recordBy=new Map(recordRows.map(r=>[r.id,r]));
 const all=[...pack.components.map(c=>({c,layer:'multissistemas-1.8',id:ids.get(c.recordId),rows:mcases.get(c.id)||[]})),...(legacy?.components||[]).map(c=>({c,layer:'motor-1.6',id:locals.get(c.evidence.record),rows:legacyCases.get(c.id)||[]}))];
 const dupC=countDuplicates(all,x=>x.c.id);
 for(const {c,layer,id,rows} of all){const r=id&&orig.get(id.localId),s=id?.scope||pack.report.scope,sem=semantics.get(c.semanticId),reasons=[];let good=false,t={passed:0,failed:0,positive:0,negative:0,isolation:0,reasons:[],details:[]};
  try{if(layer==='multissistemas-1.8'){U.assert(c,'componente');U.assert(c.params,'perfil-'+c.scope.adapter);good=!!id&&matchScope(c.scope,id.scope)&&c.id===JSON.stringify([id.id,c.evidence.pointer,c.params.kind])&&componentEvidence(c,id,r);t=replayMulti(c,rows);}
   else{good=!!id&&!!sem&&legacy.E.validateEngine16(c,legacy.E.engineSchemas16().componente).length===0&&componentEvidence(c,id,r,sem);t=replayLegacy(c,rows,legacy.E,sem);}}
  catch(e){reasons.push(String(e.message||e));}
  if(!good||recordBy.get(id?.id)?.sourceEvidence!=='conferida')reasons.push('Evidência do componente divergente');
  if(dupC.get(c.id)!==1||!assertDistinct(rows,x=>x.id))reasons.push('ID de componente ou teste duplicado');
  if(s.edition==='nao_confirmada')reasons.push('Edição não confirmada');
  if(releaseIntegrity!=='conferida')reasons.push('Integridade do código não conferida');
  reasons.push(...t.reasons);const state=good&&t.failed===0&&!reasons.length&&t.positive>0&&t.negative>0?'aprovado_no_escopo_testado':'bloqueado',payloadSha256=await digest(c);
  const row=assert({id:c.id,recordId:id?.id||c.evidence.record||c.recordId||'ausente',scope:s,layer,sourceEvidence:good?'conferida':'divergente',tests:{passed:t.passed,failed:t.failed,positive:t.positive,negative:t.negative,isolation:t.isolation},state,payloadSha256,reasons,bloquear_importacao:true},'componente');components.push(row);details.push(...t.details);
  if(state==='aprovado_no_escopo_testado'&&id.partition==='principal')candidateRows.push(assert({id:JSON.stringify(['componente',id.id,c.id]),kind:'componente_isolado',scope:s,payloadSha256,sourceId:c.id},'candidato'));}
 // The two D&D profiles are compound components: retain distinct rows, not import candidates.
 for(const p of legacy?.profiles||[]){const e=p.evidence?.[0],id=e&&locals.get(e.record),scope=id?.scope||pack.report.scope,group=p.id==='xphb-d20'?'d20':p.id==='xphb-death-save'?'morte':null,rows=(legacy.cases||[]).filter(t=>t.group===group),reasons=[];let passed=0,failed=0,positive=0,negative=0;
  let good=!!id&&!!group&&p.evidence.every(v=>{const i=locals.get(v.record),r=i&&orig.get(i.localId);try{return recordEvidence(i,r)&&v.sourceSha===r.sha&&v.commit===r.commit&&v.path===r.path&&!!U.findPointer(r.data,v.pointer.slice(r.pointer.length));}catch{return false;}});
  for(const t of rows){let a;try{a=group==='d20'?legacy.E.selectD2016(t.input):legacy.E.deathSave16(t.input);}catch{a={error:true};}const ok=t.status==='aprovado'&&same(a,t.expected)&&same(a,t.actual?.error?{error:true}:t.actual);if(ok){passed++;if(a.error)negative++;else positive++;}else failed++;}
  if(!good)reasons.push('Evidência do perfil divergente');if(!positive||!negative||failed)reasons.push('Casos insuficientes ou divergentes');if(releaseIntegrity!=='conferida')reasons.push('Integridade do código não conferida');
  // Without an independent mechanical oracle for complete profile, do not promote.
  reasons.push('Reexecução de expectativas 1.7; perfil composto não homologado individualmente para importação');
  components.push(assert({id:p.id,recordId:id?.id||'ausente',scope,layer:'perfil-1.6',sourceEvidence:good?'conferida':'divergente',tests:{passed,failed,positive,negative,isolation:0},state:'nao_testado',payloadSha256:await digest(p),reasons,bloquear_importacao:true},'componente'));}
 for(const r of recordRows)if(r.reasons.length)issues.push({kind:'registro',id:r.id,reasons:r.reasons});
 for(const c of components)if(c.reasons.length)issues.push({kind:'componente',id:c.id,reasons:c.reasons});
 for(const t of pack.cases)if(!multiIds.has(t.componentId))issues.push({kind:'teste_orfao',id:t.id,reasons:['Componente ausente']});
 for(const t of legacy?.cases||[])if(t.group==='componente'&&!legacyIds.has(t.component))issues.push({kind:'teste_orfao',id:t.id,reasons:['Componente ausente']});
 const scopes=new Map();for(const r of [...recordRows,...components])scopes.set(key(r.scope),r.scope);if(!scopes.size)scopes.set(key(pack.report.scope),pack.report.scope);
 const matrix=[...scopes.values()].map(s=>{const rs=recordRows.filter(r=>matchScope(r.scope,s)),cs=components.filter(r=>matchScope(r.scope,s)),contract=contractFor(s);return assert({scope:s,records:rs.length,components:cs.length,passedComponents:cs.filter(r=>r.state==='aprovado_no_escopo_testado').length,contractId:contract?.id||null,compatibility:contract?'contrato_provisorio_local':'sem_contrato_provisorio',official:false,integration:'bloqueada'},'matriz');});
 const passedComponents=components.filter(c=>c.state==='aprovado_no_escopo_testado').length,blockedComponents=components.length-passedComponents,sourceFailures=recordRows.filter(r=>r.sourceEvidence==='divergente').length;
 const hardFailure=sourceFailures>0||components.some(c=>c.state==='bloqueado')||issues.some(x=>x.kind==='teste_orfao')||releaseIntegrity!=='conferida'||pack.report.status!=='aprovado_no_escopo_testado'||(legacy&&legacy.report?.status!=='aprovado_no_escopo_testado');
 const report=assert({version:V,scope:pack.report.scope,records:recordRows.length,components:components.length,passedComponents,blockedComponents,sourcePending:pack.pending.length,sourceFailures,releaseIntegrity,reviewStatus:!hardFailure&&passedComponents>0?'aprovado_no_escopo_testado':'bloqueado',official:false,integration:'bloqueada',bloquear_importacao:true,limits:['Estados individuais e escopos não certificam regras completas.','Prova local de correspondência com registros previamente verificados; não é auditoria externa do livro.','Perfis compostos permanecem fora de candidaturas à importação.','Sem contrato oficial Hub, sem API de destino, sem gravação.']},'relatorio');
 return {report,records:recordRows,components,matrix,issues,pending:pack.pending,details,candidates:candidateRows};}
function plan(review,snapshotData=null){
 const s=review.report.scope,c=contractFor(s),origin=snapshotData===null?'vazio_declarado':'arquivo_local',errors=[],existing=new Map(),operations=[],rollbackCandidates=[],counts={create:0,unchanged:0,conflict:0,blocked:0};
 if(!c)errors.push('Sem contrato provisório para escopo exato');if(review.report.reviewStatus!=='aprovado_no_escopo_testado')errors.push('Revisão do escopo bloqueada');
 const incoming=review.candidates.filter(x=>matchScope(x.scope,s));if(!assertDistinct(incoming,x=>x.id))errors.push('IDs candidatos duplicados');
 if(snapshotData!==null)try{assert(snapshotData,'snapshot');if(!c||snapshotData.contractId!==c.id||!matchScope(snapshotData.scope,s))throw Error('Contrato ou escopo do snapshot incompatível');if(!assertDistinct(snapshotData.items,x=>x.id))throw Error('IDs existentes duplicados');for(const x of snapshotData.items){if(!matchScope(x.scope,s)||!c.allowedKinds.includes(x.kind))throw Error('Registro existente de escopo/tipo incompatível');existing.set(x.id,x);}}catch(e){errors.push(String(e.message||e));}
 for(const x of incoming){const old=existing.get(x.id);let operation,reason;if(errors.length||!c||!c.allowedKinds.includes(x.kind)){operation='bloqueado';reason='Gate ou contrato incompatível';counts.blocked++;}
  else if(!old){operation='criar_simulado';reason='ID ausente no snapshot local';counts.create++;rollbackCandidates.push(x.id);}
  else if(same(old,x)){operation='inalterado';reason='Identidade, tipo, escopo e hash idênticos';counts.unchanged++;}
  else{operation='conflito';reason='ID existente com conteúdo/tipo divergente; nenhuma sobrescrita';counts.conflict++;}
  operations.push(assert({candidate:x,operation,reason,existingSha256:old?.payloadSha256||null},'planoLinha'));}
 // The operation list is a proposal only; do not emit projected snapshot or rollback if any conflict.
 const status=errors.length||counts.conflict||counts.blocked?'bloqueado':'simulacao_sem_conflitos';
 return assert({version:V,contractId:c?.id||null,scope:s,mode:'simulacao_local',official:false,snapshotOrigin:origin,counts,operations,status,rollbackCandidates:status==='bloqueado'?[]:rollbackCandidates,errors,bloquear_importacao:true},'plano');
}
function projectSnapshot(p,snapshotData=null){assert(p,'plano');if(p.status!=='simulacao_sem_conflitos'||!p.contractId)return null;const items=[...(snapshotData?.items||[])];for(const r of p.operations)if(r.operation==='criar_simulado')items.push(r.candidate);return assert({version:V,contractId:p.contractId,scope:p.scope,items},'snapshot');}
function dndRows(records,deps,files,source){const hashes=new Map(files.map(f=>[f.path,f.sha])),a=U.adapter('dnd5e-5etools');return [...records,...deps].map(r=>({localId:r.id,scope:a.scopeFor(source,typeof r.data?.source==='string'&&r.data.source.trim()?r.data.source:source.code),repo:source.repo,commit:source.commit,path:r.path,pointer:r.pointer,sha:hashes.get(r.path),nativeType:r.category,partition:r.partition==='dependencia_segregada'?'dependencia':r.partition==='entidade_candidata'?'principal':'auxiliar',data:r.data}));}
function pfRows(rows,s){const a=U.adapter('pf2e-foundry');return rows.filter(r=>{const m=a.meta(r.data);return m&&m.edition===s.edition&&m.publication===s.publication;}).map(r=>({localId:r.path+'#'+r.data._id,scope:s,repo:a.repo,commit:a.commit,path:r.path,pointer:'',sha:r.sha,nativeType:r.data.type,partition:'principal',data:r.data}));}
function exportFiles(review,p,snapshotData,integrity){const j=x=>JSON.stringify(x,null,2),l=x=>x.map(v=>JSON.stringify(v)).join('\n')+'\n',files=[['homologacao/relatorio.json',j(review.report)],['homologacao/registros.jsonl',l(review.records)],['homologacao/componentes.jsonl',l(review.components)],['homologacao/matriz.json',j(review.matrix)],['homologacao/incompatibilidades.json',j(review.issues)],['homologacao/pendencias.json',j(review.pending)],['homologacao/testes-isolamento.jsonl',l(review.details)],['homologacao/plano-simulacao.json',j(p)],['homologacao/contratos-provisorios.json',j(contracts)],['homologacao/integridade-adaptadores.json',j(integrity)]];
 const projected=projectSnapshot(p,snapshotData);if(projected)files.push(['homologacao/snapshot-projetado.json',j(projected)]);for(const [k,v] of Object.entries(schemas))files.push(['schemas/1.9.0/'+k+'.schema.json',j(v)]);return files;}
root.RPGHomolog=Object.freeze({schemas,contracts,assert,digest,contractFor,review,plan,projectSnapshot,dndRows,pfRows,exportFiles,replayMulti,oracle});
})(globalThis);
