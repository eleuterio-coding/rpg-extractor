# RPG Extractor 1.7

Aplicação independente e autocontida em `index.html`, preparada para GitHub Pages. Configuração inicial: XPHB, repositório público 5etools-mirror-3/5etools-src, branch main.

## Publicação
Em Settings → Pages, escolha Deploy from a branch, main e /(root).

## Uso
Abra a página, informe o repositório e o código da fonte, inicie a extração. O motor inventaria JSONs em data/, verifica integridade, registra proveniência e exporta ZIP com relatório de auditoria. O processamento ocorre no navegador.

## Limites
A cobertura é estrutural dentro do escopo implementado, não uma comprovação de completude do livro original. Dependências e interpretação semântica não estão homologadas. Testes unitários locais passaram, mas a extração real do XPHB e o fluxo completo em navegador ainda precisam ser verificados. Não publique conteúdo de terceiros sem autorização.

## Versão 1.1.0 — auditoria XPHB

- Preserva todos os registros da coleta; separa candidatos de índices, adaptadores, metadados e fragmentos por contexto. Classificação conservadora e provisória, não taxonomia homologada.
- Inventaria tags repetidas, referências `_copy`/`_mod`, statblocks e imagens; alvos locais são candidatos, não resolução definitiva. Não baixa ativos nem importa dependências externas automaticamente.
- Exporta entidades-candidatas.jsonl, auxiliares.jsonl, unidades-livro.json, ativos-pendentes.json e conflitos-identidade.json, além dos arquivos anteriores.
- Manifesto inclui SHA-256 calculado dos JSONs lidos, SHA Git conferido, inventário e gates independentes. A árvore Git continua declarada, não recalculada; blobs brutos não são arquivados integralmente.
- Homologação documental, semântica, mecânica e integração continuam bloqueadas. O ZIP estrutural não autoriza importação no Hub.
- Novo banco IndexedDB para impedir reaproveitamento de checkpoints incompatíveis com 1.0; execute nova coleta.
- 13 verificações dirigidas executadas com dados sintéticos: 7 partições, repetição de tags, alvo local, fonte implícita, statblock externo, imagem e gate de homologação. Não houve novo processamento XPHB nem teste integral de navegador nesta atualização.

## Versão 1.2.0 — correções da reauditoria

- O coletor original continua preservado. Propriedades de itens com abreviação e sem nome são candidatas; referências de itens consultam item, baseitem e itemGroup, sem resolver ambiguidades arbitrariamente.
- Identidade contextual de características usa classe, fonte da classe, nível e, quando aplicável, subclasse e fonte da subclasse. UIDs incompletos permanecem pendentes; a fonte final omitida no UID contextual usa a fonte explícita do contexto, identificada no relatório.
- Inventário de progressão em classFeatures/subclassFeatures, incluindo entradas de objeto. Localizadores de criaturas no repositório são obtidos de JSONs cujo SHA Git foi conferido, e exportados em dependencias-localizadas.json; não incorporam os blocos completos externos. Não constituem resolução recursiva nem autocontenção documental.
- 18 verificações passaram: 13 sintéticas e cinco sobre os arquivos data/items-base.json e data/class/class-fighter.json do commit 2512db75eb48ef06f6190b086a82430887906dca. Ambos os scripts do HTML passaram na verificação sintática. Não foi repetida a extração integral nem testada a interface em navegador nesta rodada.
- Checkpoint em banco IndexedDB separado (v1-2). Para comparação, fixe o commit original em vez de main. A exportação permanece não homologada; a árvore Git não foi recalculada e as dependências externas, validação mecânica, documentação e integração continuam pendentes.

## Versão 1.3.0 — proveniência e dependências

- Recalcula SHA-1 Git de cada árvore, incluindo a raiz, com ordenação por bytes UTF-8, modos e hashes de objetos. Inventários truncados são percorridos por subárvores; falha ou divergência bloqueia a coleta. A identidade do commit e o hash da raiz vêm da API GitHub; o commit não é reconstruído nem assinado localmente. Blobs fora do escopo têm hashes referenciados pela árvore, mas não são baixados.
- Guarda bytes brutos dos JSONs do escopo no IndexedDB v1-3; reconfere SHA Git e SHA-256 na exportação. Opção de ZIP com brutos desmarcada por padrão: pode conter outras publicações e o tamanho aumenta substancialmente. Não use para redistribuir conteúdo sem direito de fazê-lo.
- Campo opcional de fontes externas (ex. XMM, XDMG) na exportação. Sem fontes externas selecionadas, só materializa eventuais dependências da fonte principal. Busca entidades por contexto e identidade, materializa dependências em partição separada e percorre relações em até 12 rodadas e 2.000 entidades, sem duplicar IDs. Não executa `_copy`/`_mod`, não confunde materialização com validade semântica. Dependências fora do escopo, ambíguas, não selecionadas ou não encontradas permanecem explícitas.
- Separa marcadores não executados de dependências; tenta relações documentais por âncora/nome no livro composto, classifica filtros e navegação como pendentes. Fonte implícita de maestria recebe candidato local, não confirmação. Reconciliador bidirecional por ponteiros e referências não substitui auditoria independente do PDF.
- Inventaria ativos e tenta localizar caminhos exatos na árvore; não baixa imagens nem verifica hosts externos. Mantém as exportações anteriores, acrescenta dependencias/materializadas.jsonl, dependencias/referencias.json, dependencias/pendencias.json, proveniencia/arvore-git.json e auditoria/reconciliacao-documental.json. Os JSONs brutos são opcionais.
- Testes executados na revisão de publicação: 22 verificações passaram, incluindo SHA da raiz Git e a subárvore data/ (550 entradas, 7 árvores), detecção de omissão/mutação, dados reais de items-base, class-fighter e book-xphb do commit 2512db75eb48ef06f6190b086a82430887906dca; ciclos, limites, falhas e bloqueios em fixtures sintéticas. O teste de SHA-1 usou implementação independente injetada no ambiente de teste, não WebCrypto do navegador. Scripts do HTML passaram na verificação sintática. Não foi realizada extração integral, prova de todas as subárvores fora de data/, execução completa no navegador ou verificação do ZIP v1.3 real. O conector retornou conteúdo vazio para bestiary-xmm.json, impedindo o teste real de materialização XMM nessa rodada.
- Versão 1.3 usa banco separado, requer nova coleta. Gates documental, semântico, mecânico e integração permanecem bloqueados.

### Revisão de exportação 1.3

A exportação também reconcilia a lista de JSONs com a árvore verificada, os checkpoints e os tamanhos; refaz a auditoria de seleção e o catálogo a partir dos bytes brutos antes de gerar o ZIP. `dependencias/pendencias.json` inclui falhas de materialização e ocorrências ainda pendentes; os estados anteriores das referências a criaturas são preservados no campo `previousStatus`. Cinco verificações adicionais passaram: inventário de 543 JSONs na subárvore real (metadados e checkpoints simulados), detecção de checkpoint ausente, detecção de SHA divergente, preservação do estado anterior e ciclo recursivo. Total: 22 verificações iniciais e cinco adicionais; não é uma reexecução integral de todos os casos sobre a revisão final. A auditoria integral do ZIP gerado no navegador continua pendente.

## Versão 1.4.0 — taxonomia modular provisória

- Dez módulos M01–M10 e schemas JSON Draft 2020-12, gerados da mesma definição que o validador interno (subconjunto dos keywords utilizados). Validam envelopes e categorias, não semântica interna. Não são contratos do Hub.
- Separa registros principais e dependências, mantém SHA e ponteiros, vistas documentais de itens mágicos e exploração e relatório de itens ambíguos. Não declara módulos vazios completos.
- Corrige referências documentais por título/alias e tabela contextual, fonte padrão itemMastery apenas para commit verificado (js/render.js, TagItemMastery.defaultSource), marcadores hit/recharge e alvo de _copy por abreviação. Transformações não executadas. Ativos externos ausentes permanecem pendentes.
- Novo IndexedDB v1-4: requer nova coleta. Exporta modulos/M01.json–M10.json, modulos/manifesto.json e schemas/1.4.0/*.schema.json. Preserva formatos anteriores. Homologação e importação bloqueadas.
- Testes dirigidos sobre seis arquivos reais do commit XPHB e fixtures negativas/sintéticas: tests/resultados-v1.4.json. Não é teste integral de navegador ou auditoria de todos os 543 blobs. Nenhum payload do livro publicado.

## Versão 1.5.0 — camada semântica parcial

- Mantém módulos e schemas 1.4.0, registros originais, dependências e auditoria criptográfica. Nova camada derivada sem substituir fonte: consultas, fatos por campo, expressões AST restritas, prévias de transformações e pendências, com evidência de registro/ponteiro/commit/SHA. Vistas M07/M10 indexam texto para consulta, sem inventar regras.
- AST de soma/subtração de constantes inteiras, dados fixos e variável explícita summonSpellLevel; entradas externas de faces e variáveis, sem eval ou RNG. Não executa combate, custos, efeitos, escalonamento contextual, condições nem regras completas. Zero regras integralmente executáveis declaradas.
- Seis schemas JSON Draft 2020-12 (quatro tipos de registro e dois contratos de entrada/saída); validação interna do subconjunto utilizado. Schemas provisórios, não contratos oficiais do Hub. As prévias de _copy/_mod são limitadas ao commit verificado; quatro modos de array simples, sem templates, regex ou expansão integral, mantendo os originais pendentes.
- Referências area podem localizar âncora do mesmo livro no perfil verificado; book com capítulo explícito usa seção e nome; publicação externa fica pendente. Não materializa WoW automaticamente nem baixa ativos.
- Novo banco IndexedDB v1-5. Mantém opções de fontes e brutos. Novos arquivos em semantica/ e schemas/1.5.0/. Gates de importação e homologação continuam bloqueados. Ver testes/resultados-v1.5.json; testes dirigidos com dados reais e sintéticos, não nova coleta integral no navegador. Os scripts e schemas oficiais do plugin não estavam acessíveis.

## Versão 1.6.0 — motor experimental

- Mantém coleta, checkpoints, verificação criptográfica, módulos 1.4 e camada 1.5. Adiciona sete campos semânticos omitidos. Novo IndexedDB v1-6; nova coleta necessária.
- AST pós-fixa restrita com precedência, parênteses, soma, subtração, multiplicação, divisão, arredondamento explícito e quantidade variável de dados. Entradas de faces externas; sem eval nem RNG. Limites de tamanho, profundidade, dados, faces e valores. Componentes 1.6 separados dos anteriores, sem promoção de regra inteira.
- Simulador genérico de um ator: estado explícito, condições, pré-requisitos all/any/none, custos agregados, recursos limitados, cura, dano não terminal, condições; transação atômica por cópia, bloqueio de estados inválidos/mortos. Dano que leva a zero ou em zero PV exige adjudicação, não é automaticamente resolvido.
- Perfis XPHB do commit de referência: escolha D20 com cancelamento de vantagem/desvantagem, uma salvaguarda contra morte com contadores, 1/20 e estados terminais; face fornecida externamente, sem cálculo de modificadores ou aplicação de dano. Evidências exportadas apenas quando as unidades existem. O laboratório usa exemplos explícitos, não aplica regras a personagens reais.
- Onze schemas Draft 2020-12 e quatro arquivos motor/. A validação interna suporta os keywords usados. Templates, escalonamento contextual, tags de filtro, ativos e semântica integral continuam pendentes; não há importação no Hub. Scripts e contratos oficiais do plugin não disponíveis; testes próprios registrados em tests/resultados-v1.6.json. Não é teste integral no navegador.

## Versão 1.7.0 — testes mecânicos reproduzíveis

- Mantém motor e schemas 1.6.0, sem alterar regras ou IDs. Executa suíte genérica e testes de cada componente durante exportação; inclui evidência, entradas, expectativas, resultados, bloqueios, cobertura e hashes SHA-256 do core, casos, relatório, componentes, perfis e origem. O oráculo separado cobre gramática aditiva, multiplicação de dados e dados variáveis observados na referência XPHB. Não executado ou reprovado bloqueia aprovação mecânica, não a exportação diagnóstica. A importação permanece sempre bloqueada.
- Valida códigos de fontes externas contra catálogo do escopo, com sugestões e sem alterar automaticamente a seleção. Código inexistente no catálogo impede exportação até correção; checkpoint preservado. Novo IndexedDB v1-7.
- Testes de regressão numérica fixados para XPHB no commit de referência, 543 JSONs e XMM+XDMG. Relatórios distinguem pendências preexistentes (marcadores contextuais, Força, transformações, ativos) de falhas de testes. Não inventa regras, não materializa WoW. Suíte genérica disponível no laboratório.
- Reexecução local: `python tests/regressao_v1_7.py caminho.zip` (Node 20+). Em v1.7 compara casos, relatório e selo, em v1.6 roda contra dados antigos; a validação de catálogo em ZIP v1.6 não é reconstruída. Novos schemas 1.7.0 são provisórios. Testes próprios, não os scripts oficiais do plugin. Veja tests/resultados-v1.7.json. Não certifica completude semântica ou integração.

## Versão 1.8.0 — adaptadores multissistemas experimentais

- D&D/5etools permanece na página principal, com o núcleo 1.7 literalmente preservado; `multissistemas/` é adicional. IDs legados mantidos, novo índice com namespace de sistema, edição, publicação, repo, commit e ID local. XPHB/XMM/XDMG no commit de referência identificados como revisão 2024; outras edições não confirmadas. Novo IndexedDB v1-8. Dez expressões de Força do XPHB têm componentes isolados separados, entrada explícita 1–30, sem arredondamento ou interpretação de carga. As pendências legadas permanecem preservadas e a extensão indica as cobertas.
- `pf2e.html`: Foundry PF2e em commit fixo `edd853bd51a735e60477ab9b56536e1b233dd804`. Edição Remaster/Legacy por metadado do registro; título exato; excluídos inventariados; tipos desconhecidos bloqueiam aprovação. Custo fixo de ação e fórmula simples são componentes isolados. RuleElements não executados. Fonte e licença por documento. Limites: 200 JSONs, 60 árvores, 8 MiB por blob. Cadeia raiz–escopo e subárvores percorridas recalculadas; não é a prova de todas as subárvores do repositório. Cache IndexedDB próprio, exportação ZIP com hashes. Não publica dados da fonte no repositório do extrator.
- `multi-core.js` contém proveniência, identidade, contratos e despacho; `adapters/` separa sistemas. Despacho exige igualdade de adaptador, sistema, edição e publicação. Seis schemas provisórios 1.8.0. Importação sempre bloqueada. `tests/resultados-v1.8.json` registra testes reais; `tests/integracao-v1.8.json` registra a conferência estática da interface. Coletas integrais em navegador ainda devem ser auditadas. Contratos oficiais Hub/plugin não disponíveis.

Revisão 1.8: contratos de parâmetros agora residem nos adaptadores (`perfil-dnd5e-5etools.schema.json`, `perfil-pf2e-foundry.schema.json`); o núcleo não contém enumeração de sistemas nem operações específicas. Cada ZIP inclui seis contratos universais e o contrato do perfil carregado. Coleta sem componentes/testes ou edição não confirmada não recebe aprovação. O registro extensível não carrega código de fontes externas; novos adaptadores precisam ser implementados e auditados.

## Versão 1.9.0 — revisão granular e simulação de integração

- Preserva o núcleo 1.7, os contratos 1.4–1.8 e o checkpoint v1.8 (reverifica todos os bytes/seleção na exportação; registra checkpointVersion). PF2e corrige os testes de isolamento com entradas válidas e acrescenta publicação incompatível. Nova revisão reexecuta componentes, verifica identidade/ponteiro/escopo, registra resultado e hash individual, distingue registros consultivos e componentes isolados. Perfis compostos apenas reexecutados e não promovidos sem oráculo independente.
- Contratos locais versionados e explicitamente não oficiais para XPHB revisado e PF2e Remaster Player Core. Matriz exata por sistema/edição/publicação; dependências e auxiliares não viram candidatos. Snapshot local opcional JSON (máx. 20 MiB), vazio por padrão; plano criar/inalterado/conflito/bloqueado. Sem sobrescrever; snapshot projetado e lista de reversão de criações somente se não houver conflito. Snapshot válido fornecido será incluído no ZIP local. Nenhuma API de destino, gravação ou credencial de Hub/Firebase.
- SRI em scripts externos, SHA-256 do núcleo legado, comparação de contratos e schemas publicados com instâncias carregadas, hashes de revisão. Não é assinatura de editor; bloqueia revisão se integridade divergir. Preserva pendências 1.8; não resolve semântica ausente. Nove schemas 1.9 e dois contratos provisórios. Relatórios em homologacao/. Testes reais dirigidos e simulação de integridade em executor JS; não homologação oficial nem fluxo completo no navegador. Contrato e scripts oficiais do Hub/plugin continuam indisponíveis.

## 2.0.0-rc.1 — candidata a lançamento, não homologada

- Preserva o núcleo e arquivos legados; RC1 adiciona índice lógico de entidades por sistema, edição, publicação, repo e chave contextual D&D ou ID nativo PF2e, separado do hash da revisão. Auxiliares e edições não confirmadas não têm identidade persistente. Componentes têm localizador estrutural condicional; não há migração automática nem reconhecimento de renomeações. O perfil D&D 2024 segue limitado ao commit verificado, outras revisões exigem confirmação de edição. Não promete correspondência lógica de regras movidas ou renomeadas.
- Classifica referências e ativos, bloqueia dependências críticas/incertas e propaga bloqueios nos alvos resolvidos. Marcadores contextuais e transformações permanecem pendentes. Migração de índices consultivos locais somente: cria, mantém, nova revisão de conteúdo idêntico, conflito ou bloqueio. Nenhuma sobrescrita semântica, exclusão, importação ou escrita no destino. Projeção/reversão apenas sem conflitos e com conferência do hash do estado atual. Snapshot opcional RC1 separado do 1.9.
- Dez componentes isolados de probabilidade XPHB (percentil e ocorrências explicitamente fornecidos, sem inferir gatilhos, reset ou efeitos); recarga 5–6 da dependência Giant Spider com ponteiro documental do XMM e estado explícito. 1.704 casos D20 e 185 de salvaguarda de morte independentes, 128 de probabilidade e 21 de recarga na amostra. Não certifica regras completas. Os resultados antigos permanecem no ZIP. 11 schemas RC1, exportações rc1/ e selo; scripts e schemas incluídos na verificação SRI. Checkpoint 1.8 preservado. Relatórios em tests/. Coleta integral e execução no navegador devem ser auditadas. Contrato real Hub indisponível, importação bloqueada.

## 2.0.0-rc.2 — candidata a lançamento

- Reversão RC1 desativada (formato histórico mantido para regressão). RC2 valida ambos os snapshots, IDs canônicos, escopos, duplicidades, ordem e operações; reproduz o plano antes de restaurar. Exige SHA-256 original do plano guardado separadamente por canal confiável. Não equivale a assinatura digital ou prova de autenticidade do editor. Interface restaura apenas arquivo JSON local; sem gravação no destino. Migração de índice consultivo, sem sobrescrever conteúdo alterado. Snapshots RC1 e RC2 independentes.
- 70 escalonamentos de slots (64 scaledamage, 6 scaledice), 29 bônus de ataque de magia contextuais; quatro ocorrências em _mod não materializadas ficam pendentes. Retorna composição de dados/constantes e bônus fornecido, sem executar efeitos. PF2e acrescenta contador de três reações e duas ações livres com confirmação explícita de gatilho/elegibilidade; Cast a Spell passiva fica consultiva. Vínculos documentais com ponteiros e hash; não remove bloqueios mecânicos RC1. Seis schemas RC2; arquivos rc2/ e selo. Checkpoint 1.8 preservado.
- Testes reais de Stride entre commits (mudança de caminho, mesmo blob), variantes controladas de conflito, testes negativos de reversão e amostras reais de D&D/PF2e. Ver tests/resultados-v2.0-rc2.json. Não certifica mudança de conteúdo entre publicações reais completas, interpretação integral ou compatibilidade oficial. Sem contrato Hub; importação bloqueada.

## 2.0.0-rc.3 — candidata não homologada

- Protocolo RC2 mantido e reforçado: revisões duplicadas e reaproveitamento de revisão entre identidades rejeitados. Hash externo continua obrigatório.
- Manifesto SHA-256 global em ambos os adaptadores (exclui somente o próprio manifesto); selos anteriores preservados.
- Camada RC3 separada: materialização restrita de Slam em quatro variantes Elemental Spirit e custos isolados de Cast a Spell (1–3 ações, recursos e pré-condições explícitos). Demais efeitos e migração permanecem bloqueados.
- Índice RC3 agrega identidades de componentes RC1, RC2 e RC3, com localizadores estruturais condicionais. Testes em `tests/rc3-integrity.cjs`. Testes de navegador e exportações integrais ainda pendentes; sem contrato oficial Hub.

## 2.0.0-rc.4 — estabilização (não homologada)

- Conflito entre revisão anterior e registro recebido, inclusive com outras pendências, retorna plano bloqueado com motivo e não interrompe a exportação. Erros de validação de projeção/replay são convertidos em bloqueio sem autorização. Protocolo RC2 e controles de reversão preservados.
- Diagnóstico RC4 no ZIP e download JSON independente; manifesto e selos anteriores preservados. Nenhum componente mecânico novo.
- Testes `node tests/rc4-stability.cjs` e `node tests/rc3-integrity.cjs`. Critérios de certificação em `CERTIFICACAO-2.0.md`; exportações integrais e testes de navegador ainda exigem evidência. Sem integração Hub/Firebase.

## 2.0.0 — distribuição estável

A revisão G07 aprovou a distribuição nos escopos XPHB e ações básicas PF2e delimitados em [CERTIFICACAO-2.0.md](CERTIFICACAO-2.0.md). A versão de manifesto da distribuição é `2.0.0`, com protocolos RC1–RC4, schemas e checkpoints anteriores preservados. Os ZIPs mantêm `nao-homologado` e o bloqueio incondicional de importação oficial. Aceitação integrada executada em Python e Node.js 22 sobre três ZIPs RC4 e sobre fixtures de compatibilidade 2.0.0. Não é certificação de regras integrais ou novos escopos.
