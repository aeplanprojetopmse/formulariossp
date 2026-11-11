# Plano de Implementação: Suporte a Publicação no GitHub Pages via Pasta `dist`

## Contexto & Causa do Erro 404
Ao enviar um projeto Vite diretamente para o GitHub Pages sem configuração de caminhos relativos:
1. **Caminhos Absolutos (`/assets/...`)**: Por padrão, o Vite referencia arquivos estáticos a partir da raiz (`/`). No GitHub Pages de repositório comum (`https://usuario.github.io/nome-do-repositorio/`), as chamadas vão para `https://usuario.github.io/assets/...`, gerando o erro `404 Not Found`.
2. **Processamento Jekyll**: O GitHub Pages ativa o motor Jekyll por padrão, ignorando pastas ou arquivos com prefixos específicos se não houver um arquivo `.nojekyll`.
3. **Necessidade dos arquivos compilados**: O GitHub Pages atua como servidor estático (HTML, CSS e JS pré-compilados). O comando `npm run build` deve gerar a pasta `dist` com os arquivos finais prontos para publicação.

---

## Modificações Propostas

### 1. Configurar `base: './'` no `vite.config.ts`
- Alterar `vite.config.ts` para usar caminhos relativos em todos os assets gerados (`./assets/...`).
- Dessa forma, o projeto funciona em qualquer subdiretório do GitHub Pages (`https://usuario.github.io/qualquer-nome/`) e também localmente.

### 2. Adicionar arquivo `public/.nojekyll`
- Criar o arquivo `public/.nojekyll` para que o GitHub Pages desative o Jekyll e sirva todos os arquivos estáticos gerados na pasta `dist` sem filtros.

### 3. Criar instruções claras de publicação da pasta `dist`
Fornecer comandos simples e rápidos para:
- Rodar o build: `npm run build`
- Duas formas práticas de subir no GitHub Pages:
  - **Opção A (Branch `gh-pages`)**: Usar o utilitário ou comando git para subir a pasta `dist` para a branch `gh-pages`.
  - **Opção B (Pasta docs)**: Configurar o build para gerar em `docs/` e apontar o Pages diretamente nas configurações do repositório.

---

## Verificação e Validação
1. Executar `npm run build` para garantir que a pasta `dist` seja gerada com sucesso.
2. Inspecionar o `dist/index.html` gerado para confirmar que os links para CSS e JS usam caminhos relativos (`./assets/...`).
3. Executar `compile_applet` e `lint_applet` para assegurar integridade total do código.
