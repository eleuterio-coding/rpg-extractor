# Critérios de certificação 2.0 — RC4

A certificação do extrator é restrita ao escopo de fontes e revisões auditadas. Não é certificação de todas as regras nem autorização de importação no Hub. Nenhum relatório gerado pelo próprio exportador certifica a versão.

| Gate | Evidência exigida |
| --- | --- |
| G01 | ZIP integral D&D e PF2e RC4; CRC, manifesto SHA-256 de todos os arquivos, selos de camada e schemas válidos; nenhum arquivo anterior omitido. |
| G02 | Registros, identidades, módulos, vínculos, componentes e expectativas preservados; zero colisões ou componentes ausentes. |
| G03 | Reexecução dos motores sobre os casos arquivados (1.7, 1.8, 1.9, RC1, RC2, RC3) e testes RC4; divergência ou caso não executado bloqueia certificação. |
| G04 | Planos válidos e inválidos: conflito de revisão gera diagnóstico, plano bloqueado, sem projeção ou autorização; reversão válida e hash externo obrigatório. |
| G05 | Comparação de revisões reais em escopo integral declarado, inventário dos conjuntos, identidades estáveis, alterações semânticas bloqueadas, sem promover remoções implícitas. |
| G06 | Interface RC4 no GitHub Pages, exportação normal e com snapshot conflitante, verificação de SRI e diagnóstico independente em ambos os adaptadores. |
| G07 | Revisão externa das evidências e pendências; decisão explícita de homologação por escopo, nunca por contagens isoladas. |

O bloqueio oficial do Hub permanece incondicional até existir contrato formal e testes oficiais independentes. Não flexibilizar dependências, perfis compostos, RuleElements, fontes, edições ou regras parciais para obter aprovação. Scripts oficiais do protocolo não estão disponíveis nesta implementação. A RC4 não promove componentes novos.

## Comando de aceitação

Com Python 3, `jsonschema` e Node.js 22, execute no clone atualizado:

```sh
python tests/aceitacao_v2.py XPHB-...zip PF2E-...zip --saida aceitacao.json
```

`--somente-estrutura` executa somente CRC, selos, schemas, índices e estados registrados; não equivale ao replay dos motores. Não publique os ZIPs de fontes no repositório. O script completo executa a suíte 1.7, 1.8, 1.9, RC1–RC3, vínculos documentais, índice, integridade e regressão RC4 no checkout. A parte estrutural foi executada nos dois ZIPs RC3; a execução conjunta via CLI Node ainda está pendente, embora os motores tenham sido reexecutados separadamente em escopos e grupos registrados nos relatórios. Falhas e divergências devem bloquear certificação; as evidências da RC4 no navegador permanecem pendentes.

---

# Decisão G07 — RPG Extractor 2.0.0 (27/11/2026)

**Aprovada a distribuição estável nos escopos auditados.** Revisão por ChatGPT fora do exportador, não auditoria humana independente nem homologação integral das regras. Base avaliada: `dd34e04f854d8007ab53fa2966c726da275b2ebf`. Artefato Pages da execução 45926377259: SHA-256 `30fdcc2526a47ca3c17e15db6f8f7f02abcfd44c16da05b9ff333777927d4de3`.

- D&D XPHB, fonte 5etools-mirror-3/5etools-src, commit 2512db75eb48ef06f6190b086a82430887906dca, data/, dependências XMM/XDMG: 4351 registros, 1259 componentes isolados.
- PF2e Foundry, commit edd853bd51a735e60477ab9b56536e1b233dd804, packs/pf2e/actions/basic, Remaster / Pathfinder Player Core: 27 registros, 27 componentes isolados.

| Gate | Decisão e evidência |
| --- | --- |
| G01 | Aprovado: 404 hashes globais, 16 selos, 46430 instâncias, zero divergências em três ZIPs; nenhum arquivo RC3 omitido. |
| G02 | Aprovado: registros, componentes, módulos, casos e vínculos preservados; apenas relatórios, manifestos e plano de migração conflitante mudaram. |
| G03 | Aprovado: Python e Node.js 22, 9463 casos arquivados + 138 verificações de desenvolvimento reexecutados nos três ZIPs RC4. |
| G04 | Aprovado: conflitos reais de entrada controlada em ambos os adaptadores (2 operações D&D e 1 PF2e), planos bloqueados, sem projeção ou reversão. Suítes negativas e reversão válida aprovadas. |
| G05 | Aprovado no escopo integral de ações básicas PF2e; relatório tests/escopo-pf2e-v2.0-rc4.json: 27 identidades estáveis, 23 revisões sem alteração de conteúdo e 4 conflitos, sem remoção implícita. |
| G06 | Aprovado para exportação normal e conflitante no navegador pelo usuário e diagnóstico verificado independentemente nos ZIPs, inclusive SRI. O download avulso do diagnóstico não foi comprovado em navegador real; o botão não foi alterado. |
| G07 | Aprovado para a distribuição nos dois escopos acima. Não promove nenhuma regra integral, publicação diversa ou integração Hub. |

Os ZIPs originais permanecem fora do repositório. O ZIP normal de D&D foi substituído no ambiente de revisão pelo conflitante de mesmo nome; sua evidência estrutural anterior foi preservada. O navegador automatizado local bloqueou navegação. A alteração de distribuição 2.0.0 foi testada com fixtures dos três ZIPs, modificando exclusivamente a versão de manifesto e recalculando o manifesto global: 9463 casos e 138 verificações novamente aprovados. Essas fixtures não são novas exportações reais. Sintaxe e SRI do código de distribuição conferidas.

Versões de schemas, checkpoints, protocolos RC1–RC4, nomes internos e bloqueios continuam inalterados. A versão 2.0.0 identifica a distribuição, não uma alteração de protocolo. A marca `nao-homologado` nos ZIPs e os estados de homologação/importação permanecem. O relatório RC4 continua a exigir revisão de cada exportação. Sem contrato formal e testes oficiais, o Hub não pode importar. Nenhuma alteração no Hub ou Firebase.
