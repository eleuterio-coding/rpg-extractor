# RPG Extractor 1.5

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
