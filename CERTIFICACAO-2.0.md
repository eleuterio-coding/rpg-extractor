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
