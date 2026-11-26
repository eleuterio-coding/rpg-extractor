# RPG Extractor 1.2

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
