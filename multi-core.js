/* Universal infrastructure, independent of rule systems. */
(function(root){'use strict';const enc=new TextEncoder(), registry=new Map();
async function gitHash(bytes){const prefix=enc.encode('blob '+bytes.length+'\0');const blob=new Uint8Array(prefix.length+bytes.length);blob.set(prefix);blob.set(bytes,prefix.length);return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-1',blob)),x=>x.toString(16).padStart(2,'0')).join('');}
const crcTable=Uint32Array.from({length:256},(_,n)=>{for(let k=0;k<8;k++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
function crc32(bytes){let c=0xffffffff;for(const b of bytes)c=crcTable[(c^b)&255]^(c>>>8);return(c^0xffffffff)>>>0;}
// ZIP STORE, UTF-8 filenames, CRC32, no CDN. Explicitly reject ZIP64-sized archives.
function zip(files){const chunks=[],central=[];let offset=0,cs=0;if(files.length>65535)throw Error('Limite ZIP32 de arquivos');for(const [name,value] of files){const n=enc.encode(name),b=typeof value==='string'?enc.encode(value):value;if(n.length>65535||b.length>0xffffffff||offset+30+n.length+b.length>0xffffffff)throw Error('Limite ZIP32 excedido');const crc=crc32(b),h=new Uint8Array(30+n.length),d=new DataView(h.buffer);d.setUint32(0,0x04034b50,true);d.setUint16(4,20,true);d.setUint16(6,0x800,true);d.setUint16(12,33,true);d.setUint32(14,crc,true);d.setUint32(18,b.length,true);d.setUint32(22,b.length,true);d.setUint16(26,n.length,true);h.set(n,30);chunks.push(h,b);const c=new Uint8Array(46+n.length),v=new DataView(c.buffer);v.setUint32(0,0x02014b50,true);v.setUint16(4,20,true);v.setUint16(6,20,true);v.setUint16(8,0x800,true);v.setUint16(14,33,true);v.setUint32(16,crc,true);v.setUint32(20,b.length,true);v.setUint32(24,b.length,true);v.setUint16(28,n.length,true);v.setUint32(42,offset,true);c.set(n,46);central.push(c);cs+=c.length;offset+=h.length+b.length;}if(offset+cs+22>0xffffffff)throw Error('Limite ZIP32 excedido');const e=new Uint8Array(22),d=new DataView(e.buffer);d.setUint32(0,0x06054b50,true);d.setUint16(8,files.length,true);d.setUint16(10,files.length,true);d.setUint32(12,cs,true);d.setUint32(16,offset,true);return new Blob([...chunks,...central,e],{type:'application/zip'});}

function treeBytes(entries){
 const seen=new Set(), rows=[];
 for(const x of entries){
  if(typeof x.path!=='string'||!x.path||x.path.includes('/')||x.path.includes('\0')||x.path==='.'||x.path==='..'||seen.has(x.path))throw Error('Nome inválido ou duplicado na árvore Git: '+x.path);
  seen.add(x.path);
  const mode=x.mode==='040000'?'40000':x.mode;
  if(!['40000','100644','100755','120000','160000'].includes(mode)||!/^[0-9a-f]{40}$/.test(x.sha)||({40000:'tree',160000:'commit'}[mode]||'blob')!==x.type)throw Error('Entrada Git inválida: '+x.path);
  const name=enc.encode(x.path+(mode==='40000'?'/':''));const head=enc.encode(mode+' '+x.path+'\0');
  const hash=Uint8Array.from(x.sha.match(/../g),v=>parseInt(v,16));rows.push({name,head,hash});
 }
 rows.sort((a,b)=>{const n=Math.min(a.name.length,b.name.length);for(let i=0;i<n;i++)if(a.name[i]!==b.name[i])return a.name[i]-b.name[i];return a.name.length-b.name.length;});
 const body=new Uint8Array(rows.reduce((n,r)=>n+r.head.length+20,0));let off=0;for(const r of rows){body.set(r.head,off);off+=r.head.length;body.set(r.hash,off);off+=20;}return body;
}
async function shaHex(algo,bytes){return Array.from(new Uint8Array(await crypto.subtle.digest(algo,bytes)),x=>x.toString(16).padStart(2,'0')).join('');}
async function gitTreeHash(entries){const body=treeBytes(entries),header=enc.encode('tree '+body.length+'\0'),bytes=new Uint8Array(header.length+body.length);bytes.set(header);bytes.set(body,header.length);return shaHex('SHA-1',bytes);}

function validateSemantic(value,schema,path='$'){
 const errors=[],bad=m=>errors.push(path+': '+m);
 if(schema.oneOf){if(schema.oneOf.filter(s=>validateSemantic(value,s,path).length===0).length!==1)bad('oneOf');return errors;}
 if(Object.hasOwn(schema,'const')&&value!==schema.const)bad('const');
 if(schema.enum&&!schema.enum.includes(value))bad('enum');
 const types=Array.isArray(schema.type)?schema.type:schema.type?[schema.type]:[];
 const is=t=>t==='null'?value===null:t==='array'?Array.isArray(value):t==='object'?value!==null&&typeof value==='object'&&!Array.isArray(value):t==='integer'?Number.isSafeInteger(value):t==='number'?typeof value==='number'&&Number.isFinite(value):typeof value===t;
 if(types.length&&!types.some(is)){bad('type '+types.join('|'));return errors;}
 if(typeof value==='string'){if(schema.minLength!=null&&value.length<schema.minLength)bad('minLength');if(schema.pattern&&!new RegExp(schema.pattern).test(value))bad('pattern');}
 if(typeof value==='number'){if(schema.minimum!=null&&value<schema.minimum)bad('minimum');if(schema.maximum!=null&&value>schema.maximum)bad('maximum');}
 if(Array.isArray(value)){if(schema.minItems!=null&&value.length<schema.minItems)bad('minItems');if(schema.maxItems!=null&&value.length>schema.maxItems)bad('maxItems');if(schema.uniqueItems&&new Set(value.map(x=>JSON.stringify(x))).size!==value.length)bad('uniqueItems');if(schema.items)for(let i=0;i<value.length;i++)errors.push(...validateSemantic(value[i],schema.items,path+'/'+i));}
 else if(value&&typeof value==='object'){for(const k of schema.required||[])if(!Object.hasOwn(value,k))bad('required '+k);for(const [k,v] of Object.entries(value)){if(Object.hasOwn(schema.properties||{},k))errors.push(...validateSemantic(v,schema.properties[k],path+'/'+k));else if(schema.additionalProperties===false)bad('additionalProperties '+k);}}
 return errors;
}
function findPointer(data,p){if(!p)return data;return p.slice(1).split('/').reduce((v,k)=>{const a=k.replace(/~1/g,'/').replace(/~0/g,'~');if(!v||typeof v!=='object'||!Object.prototype.hasOwnProperty.call(v,a))throw Error('Ponteiro ausente: '+p);return v[a];},data);}
function canonical(v){if(Array.isArray(v))return '['+v.map(canonical).join(',')+']';if(v!==null&&typeof v==='object')return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}';return JSON.stringify(v);}
const same=(a,b)=>canonical(a)===canonical(b),str={type:'string',minLength:1},sha={type:'string',pattern:'^[a-f0-9]{40}$'},int=(minimum,maximum)=>({type:'integer',minimum,maximum}),obj=p=>({type:'object',properties:p,required:Object.keys(p),additionalProperties:false}),arr=items=>({type:'array',items});
const scope=obj({adapter:{enum:['dnd5e-5etools','pf2e-foundry']},system:{enum:['dnd5e','pf2e']},edition:{enum:['5e-2024-revisada','remaster','legacy','nao_confirmada']},publication:str}),evidence=obj({repo:str,commit:sha,path:str,pointer:{type:'string',pattern:'^(?:/.*)?$'},sourceSha:sha});
const identity=obj({id:str,localId:str,scope,evidence,nativeType:str,partition:{enum:['principal','dependencia','auxiliar']},editionEvidence:str,automation:{const:'consultiva'},bloquear_importacao:{const:true}});
const component=obj({id:str,recordId:str,scope,evidence,params:{oneOf:[obj({kind:{const:'multiplicador_forca'},multiplier:{enum:[7.5,15,30,60,120,240]}}),obj({kind:{const:'custo_acao_pf2e'},cost:int(1,3)}),obj({kind:{const:'dados_fixos_pf2e'},count:int(1,100),sides:int(2,1000),modifier:int(-1000000,1000000)})]},raw:{},limits:str,automation:{const:'componente_executavel_isolado'},bloquear_importacao:{const:true}});
const entrada=obj({scope,values:{type:'object'}}),saida=obj({kind:{enum:['multiplicador_forca','custo_acao_pf2e','dados_fixos_pf2e']},value:{type:'number'},rollsConsumed:int(0,100),bloquear_importacao:{const:true}});
const caso=obj({id:str,componentId:str,input:entrada,expected:{},actual:{},status:{enum:['aprovado','reprovado']}});
const relatorio=obj({version:{const:'1.8.0'},scope,records:int(0,1000000),components:int(0,1000000),tests:obj({total:int(0,10000000),passed:int(0,10000000),failed:int(0,10000000)}),pending:int(0,10000000),status:{enum:['aprovado_no_escopo_testado','bloqueado']},bloquear_importacao:{const:true},homologacao:{const:'bloqueada'},limits:arr(str)});
const schemas=Object.fromEntries(Object.entries({identidade:identity,componente:component,entrada,saida,caso,relatorio}).map(([k,v])=>[k,{$schema:'https://json-schema.org/draft/2020-12/schema',$id:'https://eleuterio-coding.github.io/rpg-extractor/schemas/1.8.0/'+k+'.schema.json',...v}]));
function assert(v,k){const es=validateSemantic(v,schemas[k]);if(es.length)throw Error(k+': '+es[0]);return v;}
function register(a){if(!a||!['dnd5e-5etools','pf2e-foundry'].includes(a.id)||registry.has(a.id)||typeof a.run!=='function'||typeof a.validate!=='function')throw Error('Adaptador inválido');registry.set(a.id,Object.freeze(a));}
function adapter(id){const a=registry.get(id);if(!a)throw Error('Adaptador não registrado');return a;}
function makeIdentity(s,e,localId,nativeType,partition,editionEvidence){return assert({id:JSON.stringify([s.system,s.edition,s.publication,e.repo,e.commit,localId]),localId,scope:s,evidence:e,nativeType,partition,editionEvidence,automation:'consultiva',bloquear_importacao:true},'identidade');}
function makeComponent(r,pointer,params,raw,limits){return assert({id:JSON.stringify([r.id,pointer,params.kind]),recordId:r.id,scope:r.scope,evidence:{...r.evidence,pointer},params,raw,limits,automation:'componente_executavel_isolado',bloquear_importacao:true},'componente');}
function result(kind,value,rollsConsumed=0){return assert({kind,value,rollsConsumed,bloquear_importacao:true},'saida');}
function run(c,input){assert(c,'componente');assert(input,'entrada');if(!same(c.scope,input.scope)||c.scope.edition==='nao_confirmada')throw Error('Sistema, edição ou publicação incompatíveis');const a=adapter(c.scope.adapter);a.validate(c);return assert(a.run(c,input.values),'saida');}
function fixture(c,values,expected,s=c.scope){return {c,input:{scope:s,values},expected};}
function tests(fixtures){return fixtures.map((f,i)=>{let actual;try{actual=run(f.c,f.input);}catch{actual={error:true};}return assert({id:'MS'+String(i+1).padStart(6,'0'),componentId:f.c.id,input:f.input,expected:f.expected,actual,status:same(actual,f.expected)?'aprovado':'reprovado'},'caso');});}
function report(s,ids,cs,ts,ps,limits){const rids=new Set(ids.map(r=>r.id)),cids=new Set(cs.map(c=>c.id)),tested=new Set(ts.filter(t=>t.status==='aprovado').map(t=>t.componentId)),passed=ts.filter(t=>t.status==='aprovado').length;return assert({version:'1.8.0',scope:s,records:ids.length,components:cs.length,tests:{total:ts.length,passed,failed:ts.length-passed},pending:ps.length,status:rids.size===ids.length&&cids.size===cs.length&&cs.every(c=>rids.has(c.recordId)&&tested.has(c.id))&&passed===ts.length?'aprovado_no_escopo_testado':'bloqueado',bloquear_importacao:true,homologacao:'bloqueada',limits},'relatorio');}
async function inventory(root,scope,getTree){if(!/^packs\/pf2e\/[A-Za-z0-9_./-]+$/.test(scope)||scope.split('/').some(x=>!x||x==='.'||x==='..'))throw Error('Escopo inválido');const proof=[],files=[];
 async function read(sha,path){if(proof.length>=60)throw Error('Limite de árvores');const t=await getTree(sha);if(t.truncated||!Array.isArray(t.tree)||t.sha!==sha||await gitTreeHash(t.tree)!==sha)throw Error('Árvore divergente '+path);proof.push({path,sha,entries:t.tree});return t.tree;}
 function add(e,path){if(e.type!=='blob'||!['100644','100755'].includes(e.mode)||!Number.isSafeInteger(e.size)||e.size<0||e.size>8388608)throw Error('Blob inválido');files.push({path,sha:e.sha,size:e.size,mode:e.mode,type:e.type});if(files.length>200)throw Error('Limite de 200 JSONs; reduza o escopo');}
 let sha=root,path='';const parts=scope.split('/');for(let i=0;i<parts.length;i++){const e=(await read(sha,path)).find(e=>e.path===parts[i]);if(!e)throw Error('Escopo não encontrado');path+=(path?'/':'')+parts[i];if(i===parts.length-1&&e.type==='blob'&&/\.json$/i.test(path)){add(e,path);sha=null;break;}if(e.type!=='tree')throw Error('Escopo não é árvore');sha=e.sha;}
 async function walk(sha,path){for(const e of await read(sha,path)){const p=path+'/'+e.path;if(e.type==='tree')await walk(e.sha,p);else if(/\.json$/i.test(p))add(e,p);}}if(sha)await walk(sha,path);files.sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0);if(!files.length)throw Error('Nenhum JSON no escopo');return {root,scope,proof,files,status:'cadeia_e_subarvores_do_escopo_conferidas'};}
async function verifyBlob(f,bytes){if(!(bytes instanceof Uint8Array)||bytes.length!==f.size||await gitHash(bytes)!==f.sha)throw Error('Blob divergente '+f.path);return {data:JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes)),sha256:await shaHex('SHA-256',bytes)};}
root.RPGMulti=Object.freeze({register,adapter,schemas,assert,same,canonical,findPointer,makeIdentity,makeComponent,result,run,fixture,tests,report,inventory,verifyBlob,zip,shaHex,gitHash,gitTreeHash});
})(globalThis);
