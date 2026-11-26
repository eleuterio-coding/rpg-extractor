# RPG Extractor 1.0

Aplicação independente e autocontida em `index.html`, preparada para GitHub Pages. Configuração inicial: XPHB, repositório público 5etools-mirror-3/5etools-src, branch main.

## Publicação
Em Settings → Pages, escolha Deploy from a branch, main e /(root).

## Uso
Abra a página, informe o repositório e o código da fonte, confirme que tem autorização para processar os dados e inicie a extração. O motor inventaria JSONs em data/, verifica integridade, registra proveniência e exporta ZIP com relatório de auditoria. O processamento ocorre no navegador.

## Limites
A cobertura é estrutural dentro do escopo implementado, não uma comprovação de completude do livro original. Dependências e interpretação semântica não estão homologadas. Testes unitários locais passaram, mas a extração real do XPHB e o fluxo completo em navegador ainda precisam ser verificados. Não publique conteúdo de terceiros sem autorização.
