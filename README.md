# Formulário de Proposta de Projeto (FPP) - SSP Sergipe

Sistema web completo para elaboração, estruturação com Inteligência Artificial (Gemini) e geração oficial em PDF do **Formulário de Proposta de Projeto (FPP)** da **Secretaria de Estado da Segurança Pública do Estado de Sergipe (SSP/SE)**, em conformidade com a **Portaria SSP nº 1998/2025**, **Lei nº 13.756/2018 (FNSP)** e **Portaria MJSP nº 685/2024**.

---

## 🚀 Principais Funcionalidades

1. **Geração Automática do PDF Oficial SSP/SE**:
   - Cabeçalho institucional completo da Secretaria de Segurança Pública e Governo de Sergipe (Brasão *PORVIR 1820*).
   - Diagramação fiel ao documento padrão com citação metodológica do PMBOK.
   - Quadro de Identificação Institucional.
   - Todos os 12 itens oficiais:
     - I. Objetivo Geral da Aquisição
     - II. Objetivos Específicos
     - III. Justificativa
     - IV. Público-Alvo (Direto e Indireto)
     - V. Resultados Esperados
     - VI. Metas (Quantitativas no tempo)
     - VII. Sustentabilidade do Projeto (MCASP, vida útil, manutenção)
     - VIII. Mensuração dos Resultados (ROP, indicadores, estatísticas SSP)
     - IX. Plano de Localização (Tabela com itens, quantidades e endereços)
     - X. Materiais / Serviços (Tabela de pesquisa de preços com cálculo automático e valor total em R$)
     - XI. Implementação (Etapas e cronograma pós-aquisição)
     - XII. Anexos
   - Rodapé oficial em todas as páginas: *Praça Tobias Barreto, 20, Bairro São José – Aracaju/SE*.

2. **Áreas Temáticas Prioritárias**:
   - **MVI** — Redução de Mortes Violentas Intencionais (Viaturas 4x4, radiopatrulha, armas 9mm, saturação em manchas criminais).
   - **EVM** — Enfrentamento à Violência contra a Mulher (Patrulha Maria da Penha, Sala Lilás, medidas protetivas).
   - **MQV** — Melhoria da Qualidade de Vida (Academias de musculação, saúde mental, salubridade e alojamentos).

3. **Assistente de Inteligência Artificial com Google Gemini**:
   - **Gerador Completo**: Você digita uma ideia simples (ex: *"5 viaturas para o Alto Sertão"*) e a IA preenche formalmente todos os 12 campos da proposta!
   - **Assistente por Campo**: Botão *"Sugerir com IA"* em cada seção para tornar mais técnico, adicionar metas quantitativas ou adequar às portarias SSP e MJSP.
   - Modelo configurado: `gemini-2.5-flash` (rápido e gratuito).
   - Chave padrão injetada e configurável na tela de Ajustes.

4. **Envio Integrado para o Google Apps Script**:
   - Envia o PDF em Base64 diretamente para o endpoint:
     `https://script.google.com/macros/s/AKfycbxRqa4OXU3dn-RqGshwxtqqOqoJ8plbkJBk6D9ZpGhE2xIK4R4MtuQoZq4iWI1nF25xlQ/exec`
   - Formato do Payload:
     ```json
     {
       "fileName": "FPP_MVI_2025_001.pdf",
       "base64Data": "JVBERi0xLjQN..."
     }
     ```
   - Resposta esperada:
     ```json
     {
       "status": "success",
       "message": "Arquivo salvo com sucesso!",
       "fileId": "1a2b3c4d5e6f7g8h9i0j",
       "fileUrl": "..."
     }
     ```

---

## 📦 Como Baixar e Subir para o seu Git

Para enviar este projeto para o seu repositório no **GitHub** ou **GitLab**:

1. Baixe os arquivos do projeto para o seu computador.
2. Abra o terminal na pasta do projeto e execute:

```bash
# 1. Inicializar o repositório Git local
git init

# 2. Adicionar todos os arquivos
git add .

# 3. Criar o commit inicial
git commit -m "feat: Sistema de Projetos FPP SSP-SE com IA Gemini e Apps Script"

# 4. Conectar ao seu repositório remoto no GitHub (substitua pelo seu link)
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git

# 5. Enviar para o GitHub
git push -u origin main
```

---

## 💻 Como Rodar Localmente na Sua Máquina

```bash
# Instalar dependências
npm install

# Iniciar servidor em desenvolvimento
npm run dev
```

A aplicação abrirá no endereço `http://localhost:3000`.

---

## 🌐 Como Publicar na Web (Deploy)

A aplicação foi desenvolvida em **React 19 + Vite + Tailwind CSS** e roda perfeitamente em qualquer provedor de hospedagem web moderno:

- **Vercel / Netlify / Render**:
  - Conecte o repositório do GitHub.
  - Comando de Build: `npm run build`
  - Diretório de saída: `dist`
- **GitHub Pages**:
  - Execute `npm run build` e publique a pasta `dist`.

---

## ⚙️ Variáveis de Ambiente (`.env`)

```env
# Chave da API do Gemini (opcional se fornecida no frontend)
GEMINI_API_KEY="SUA_CHAVE_AQUI"

# Porta do servidor (padrão: 3000)
PORT=3000
```
