# Plano de melhorias incrementais — Curriculum CPM

Auditoria realizada em 05/11/2026, antes de qualquer mudança de funcionalidade. Este documento registra o estado encontrado, os problemas com prioridade, os arquivos envolvidos, os riscos de regressão e os testes exigidos em cada etapa. As regras permanentes estão em `CLAUDE.md`.

## 1. Estado do repositório

- A pasta de trabalho (`curriculos-main`) **não é um repositório Git**: não há `.git`, então não foi possível comparar com o GitHub nem listar alterações locais por `git status`. Ela parece ter sido extraída de um ZIP do GitHub.
- Todos os arquivos têm data de 05/11/2026 10:03, **exceto `curriculo-aluno.html` (10:30)**. Esse arquivo provavelmente foi editado localmente depois da extração. Ele contém `<link rel="stylesheet" href="style.css">`, que aponta para um arquivo inexistente, e não carrega `css/chatbot.css` (problema P0-1). **Antes de corrigir, confirmar com a equipe se a edição foi intencional.** Nada foi sobrescrito nesta auditoria.
- A equipe trabalha direto nesta pasta, sem Git. Por isso, **antes de cada etapa é feita uma cópia completa da pasta** fora do projeto, para permitir voltar atrás. Para publicar, os arquivos são enviados ao GitHub pela equipe.

## 2. Mapa do projeto

### 2.1 Páginas

| Página | Função | Estrutura | Observações |
| --- | --- | --- | --- |
| `index.html` | Início: banner, chamada para criar currículo, novidades | `pagina-padrao` | Banner usa imagem externa (folhadelondrina.com.br) |
| `curriculo.html` | Formulário enviado ao Formspree | `pagina-padrao` | Envio direto por POST, sem JavaScript |
| `vercurriculos.html` | Catálogo em carrossel (1 card por vez) | `pagina-padrao` | Gerado de `data/alunos-dados.json` |
| `curriculo-aluno.html?id=` | Currículo individual A4 + "Salvar como PDF" | `pagina-complementar` | Referência quebrada e chatbot sem CSS |
| `vagas.html` | Vagas (estáticas) | `pagina-padrao` | Empresas de exemplo; botões "Ver detalhes" sem ação |
| `certificados.html` | Links para cursos gratuitos | `pagina-padrao` | Um link com URL malformada |
| `quem-somos-nos.html` | Apresentação da equipe | `pagina-padrao` | Sem `<main>` |
| `modelo-curriculos.html` | Vitrine alternativa com busca e carrossel com rolagem | `pagina-complementar` | **Sem link de entrada**; paleta cinza fora da identidade |
| `dark_light.html` | Página auxiliar sobre o tema | `pagina-complementar` | **Sem link de entrada**; título invisível no tema claro |

### 2.2 CSS por página

- `css/styles.css`: base das páginas `pagina-padrao`. Contém **seletores globais de elemento** (`section`, `h1`, `h2`, `button`, `button:hover`, `input`), que afetam componentes de outros arquivos.
- `css/site-chrome.css`: cabeçalho, menu, rodapé e botão de tema nas duas variantes. Também redefine, no modo escuro de `pagina-complementar`, dois conjuntos de variáveis (`--fundo/--branco/--texto…` e `--bg/--surface/--text…`).
- `css/chatbot.css`: botão `#cb-toggle` e painel `#cb-panel`.
- `css/inicio.css`, `css/curriculo.css`, `css/oportunidades.css`, `css/vercurriculos.css`, `css/curriculo-aluno.css`, `css/modelo-curriculos.css`, `css/dark_light.css`: estilos específicos de cada página.

### 2.3 JavaScript e dependências

| Arquivo | Escopo | Depende de | Observações |
| --- | --- | --- | --- |
| `js/main.js` | Global (`themeToggle`, `darkModeClass`, `setTheme`) | `.theme-toggle` no HTML | Carregado por último em todas as páginas |
| `js/chatbot.js` | IIFE | `.chatbot` no HTML; `css/chatbot.css` | Cria `#cb-panel`; 10 opções, 11 regras |
| `js/vercurriculos.js` | IIFE, `defer` | IDs do catálogo; JSON | Carrossel com `transform`, setas do teclado, `inert` |
| `js/curriculo-aluno.js` | IIFE, `defer` | 22 IDs do currículo; JSON | `window.print()` no `#botao-imprimir` |
| `js/modelo-curriculos.js` | **Global** (`CONFIG`, `elementos`, funções) | IDs da página de modelos; JSON | Usa dados de demonstração se o JSON falhar |

Não há dependência entre os scripts de página. Todos os IDs consultados por `getElementById` existem nos respectivos HTML (verificado automaticamente).

### 2.4 Fluxos principais

- **JSON de estudantes**: `data/alunos-dados.json` → `{ "alunos": [...] }`. São 6 estudantes, todos ativos, com IDs únicos e fotos existentes. Os três scripts que leem o arquivo validam de formas diferentes: o catálogo exige `id` verdadeiro; o currículo compara `id` exato; a página de modelos exige `id` e `nome` em texto e usa `cache: "no-store"`.
- **Formspree**: `<form action="https://formspree.io/f/xeeykpoe" method="POST">` com validação nativa (`required`, `type="email"`, `type="url"`) e `_subject`. Sem `_next`, então o visitante vai para a página de agradecimento do Formspree. Não há aviso de privacidade/LGPD, honeypot antiespam nem `autocomplete`.
- **Chatbot Nina**: escolhe a primeira regra cuja palavra-chave aparece como **substring** da pergunta em minúsculas. Ações `openMaps` (link externo) e `openCatalog` (`vercurriculos.html#carrossel`). O painel usa `role="dialog"` não modal, `role="log"` + `aria-live`, `inert` quando fechado e fecha com Escape.
- **Tema**: `main.js` lê `localStorage.theme` e, na falta dele, `prefers-color-scheme`. Aplica `body.dark-mode` e atualiza `aria-pressed`/`aria-label`. Já na primeira carga **grava a preferência**, e a partir daí deixa de acompanhar o sistema.
- **Currículo e PDF**: `curriculo-aluno.js` lê `?id=`, preenche as seções, oculta as vazias e troca a foto ausente por um avatar SVG. A impressão usa `@page { size: A4; margin: 0 }` e `@media print`, que mostra só `#pagina-curriculo`.

## 3. Problemas encontrados

Legenda de verificação: **[V]** confirmado em navegador (Chrome headless, capturas em 1366/390 px, temas claro/escuro, PDF); **[E]** confirmado por análise estática ou cálculo; **[I]** inferido pela cascata CSS, ainda sem verificação interativa.

### P0 — Quebras visíveis ou de funcionalidade (corrigir primeiro)

| ID | Problema | Arquivos | Verif. |
| --- | --- | --- | --- |
| P0-1 | `curriculo-aluno.html` carrega `style.css` (404) e **não carrega `css/chatbot.css`**. O botão da Nina e o painel aparecem sem estilo no fim da página: texto "Nina…", campo e botão soltos abaixo do rodapé. | `curriculo-aluno.html:11` | [V] |
| P0-2 | Modo escuro no currículo individual: `site-chrome.css` escurece `--branco`/`--texto`, mas nome (`h1`), títulos de seção e títulos de itens continuam `#043175`. O contraste fica em **1,19:1** e o nome praticamente some. | `css/curriculo-aluno.css`, `css/site-chrome.css` | [V] |
| P0-3 | **PDF gerado com o tema escuro ativo** sai com fundo escuro (`#1f2937`) e nome/títulos ilegíveis, porque a impressão herda as variáveis do modo escuro. Afeta o principal uso da página. | `css/curriculo-aluno.css` (`@media print`) | [V] |
| P0-4 | Catálogo no modo escuro: `body.dark-mode h2 { color: #f5f5f5 }` (styles.css) vence `.nome-aluno`, e o **nome do estudante fica branco sobre o card branco** (1,09:1). | `css/styles.css`, `css/vercurriculos.css` | [V] |

### P1 — Acessibilidade WCAG 2.2 AA e defeitos relevantes

| ID | Problema | Arquivos | Verif. |
| --- | --- | --- | --- |
| P1-1 | `dark_light.html`: `h1 { color: white }` sobre fundo branco no tema claro, então o título fica invisível. O reset `* { padding: 0 }` encosta o texto na borda, e há erro de digitação na fonte (`'Outif'`). | `css/dark_light.css` | [V] |
| P1-2 | `modelo-curriculos.html` no escuro: o rótulo "Nossos estudantes" (`#484444` sobre `#111827`, 1,85:1) e o contador de resultados sobre a barra clara ficam ilegíveis; a barra e a mensagem vazia continuam com fundo branco translúcido. | `css/modelo-curriculos.css` | [V] |
| P1-3 | Opções do chatbot no *hover*: texto `#1B2A3D` sobre `#043175` (1,18:1) no tema claro e nas páginas complementares. A nota do rodapé do chat tem 4,20:1. | `css/chatbot.css` | [E] |
| P1-4 | Indicadores de foco amarelos (`#ffbf47`, `#f0b44d`) sobre branco: 1,6–1,9:1, abaixo de 3:1 (1.4.11). Há três cores de foco diferentes no projeto. | `css/vercurriculos.css`, `css/curriculo-aluno.css`, `css/modelo-curriculos.css` | [E] |
| P1-5 | Menu ativo/hover (branco sobre `#62a294`) e textos verdes (título profissional, período) sobre branco: 2,95:1. **Envolve cor institucional**: propor um verde mais escuro só com aprovação. | `css/site-chrome.css`, `css/curriculo-aluno.css`, `css/vercurriculos.css` | [E] |
| P1-6 | `button:hover { transform: translateY(-3px) }` (global) tem especificidade maior que `.controle { transform: translateY(-50%) }`, então as setas do catálogo devem "pular" ao passar o mouse. No escuro, `body.dark-mode button` torna os indicadores inativos `#374151` sobre `#212121` (1,56:1). | `css/styles.css`, `css/vercurriculos.css` | [I]/[E] |
| P1-7 | Formulário: faltam `autocomplete` (1.3.5 — nome, e-mail, URLs), indicação textual de campo obrigatório, aviso de privacidade/LGPD (dados de menores) e honeypot `_gotcha`. O botão "Salvar currículo" na verdade **envia** os dados. Mudanças de texto/consentimento precisam de aprovação da equipe. | `curriculo.html`, `css/curriculo.css` | [E] |
| P1-8 | `certificados.html`: a URL `…categoryid=8%22%3EAcessar` traz resto de HTML colado. O card "Escola Virtual GOV" aponta para `aprendamais.mec.gov.br` (conferir o destino correto). Os links com `target="_blank"` não avisam que abrem nova aba. | `certificados.html:50` | [E] |
| P1-9 | Tema: `main.js` roda no fim do `<body>`, então páginas no escuro piscam em claro primeiro (FOUC). O `localStorage` é usado sem `try/catch`, o que interrompe o script se o armazenamento estiver bloqueado. A primeira carga grava a preferência e "congela" o tema do sistema. `aria-label` muda junto com `aria-pressed` (o nome deveria ser fixo). Corrigir **sem mudar a chave `theme` nem a classe `dark-mode`**. | `js/main.js`, todos os HTML | [E] |
| P1-10 | Títulos de página repetidos ou pouco descritivos (2.4.2): "Curriculum CPM" em `curriculo.html`, `certificados.html` e `modelo-curriculos.html`. | HTML | [E] |

### P2 — Consistência, semântica e conteúdo

| ID | Problema | Arquivos |
| --- | --- | --- |
| P2-1 | Menus e rodapés divergentes: o rodapé de `quem-somos-nos.html` não tem "Ver Currículos"; os de `dark_light.html` e `modelo-curriculos.html` não têm "Certificados"; o menu de `dark_light.html` não tem "Quem Somos Nós". | HTML |
| P2-2 | Duas marcações de cabeçalho: `div.logo > p` (padrão, logo não é link) e `a.logo > span` (complementar). | HTML, `css/site-chrome.css` |
| P2-3 | `quem-somos-nos.html` não tem `<main>`; a hierarquia de títulos salta níveis: rodapé com `h3` sem `h2`, `curriculo.html` com `h2` antes do `h1`. | HTML |
| P2-4 | `modelo-curriculos.html` e `dark_light.html` não têm link de entrada. A página de modelos marca "Ver Currículos" como atual, e seus dados de demonstração (Ana Lima, Bruno Santos, Carolina Mendes, Diego Rocha) **aparecem como se fossem estudantes** quando o JSON falha, o que contraria a regra 14. Decidir: manter, vincular ou arquivar (não excluir sem decisão). | `modelo-curriculos.html`, `js/modelo-curriculos.js`, `dark_light.html` |
| P2-5 | As mensagens de erro para o público citam "Live Server" (instrução de desenvolvimento) no catálogo, no currículo e nos modelos. | `vercurriculos.html`, `js/curriculo-aluno.js`, `modelo-curriculos.html` |
| P2-6 | Conteúdo provisório: vagas com "Empresa Exemplo"/"Empresa ABC" e botões sem ação; notícias estáticas na página inicial. | `vagas.html`, `index.html` |
| P2-7 | O banner depende de imagem externa (disponibilidade e direitos autorais). Não há favicon (404 em `/favicon.ico`). | `css/inicio.css`, HTML |
| P2-8 | `logo3cpm.png` tem 1,49 MB e é exibida com 60 px (desempenho no celular). Otimizar só com um derivado aprovado (regra 4). | `logo3cpm.png` |
| P2-9 | Privacidade: o JSON público expõe e-mails pessoais de estudantes, provavelmente menores. O ID `ana-garcia` usa a foto `fotos/ana-beatriz.png` (só conferir, **não alterar** sem autorização). Levar à equipe/orientação. | `data/alunos-dados.json` |
| P2-10 | A documentação está desatualizada: README e `docs/refatoracao.md` dizem que `chatbot.css` é carregado por todas as páginas, o que deixou de valer para `curriculo-aluno.html`. | `README.md`, `docs/refatoracao.md` |

### P3 — Duplicação e manutenção

- **CSS duplicado ou conflitante**
  - `:root` com as mesmas cores em `vercurriculos.css` e `curriculo-aluno.css`.
  - Dois vocabulários de variáveis (`--fundo` e `--bg`) redefinidos no modo escuro.
  - `[hidden]` aparece 2×, `:focus-visible` 3× (cores diferentes) e o bloco `prefers-reduced-motion` 3×.
  - `.novidades article` e `.noticia` se sobrepõem.
  - `.card { gap }` não tem efeito (o card não é flex), e `box-sizing` do `.card` se repete na media query.
  - `nav` e `.logo` sem escopo em `curriculo-aluno.css` competem com `site-chrome.css`.
  - Nomes de classe iguais com significados diferentes: `.curriculo` (formulário × folha A4), `.foto-aluno`, `.nome-aluno`.
- **Seletores globais** em `styles.css` (`section { padding: 40px }`, `h1`, `h2`, `button`, `button:hover`, `input`) vazam para componentes (causa de P0-4 e P1-6).
- **Funções repetidas**
  - Gerador de avatar SVG 3× (com pequenas diferenças visuais).
  - Criador de elementos 3× (`criar`/`criarElemento`).
  - Verificação de texto 2× (`texto`/`temTexto`).
  - Carga e validação do JSON 3×.
  - `modelo-curriculos.js` expõe variáveis globais.
- **Chatbot** (comportamento a preservar, só documentado):
  - `"turno"` é substring de `"noturno"`, então perguntas com "noturno" sempre caem na regra de turnos, e a palavra `"noturno"` da regra do curso técnico nunca é alcançada.
  - `"como"` captura muitas perguntas livres.
- **Código não utilizado**: a varredura não achou classe CSS sem uso nem arquivos duplicados (hash). Os únicos candidatos são as páginas órfãs de P2-4. **Nenhum arquivo deve ser excluído só com base nisso.**

## 4. Etapas propostas (uma por vez, com aprovação)

| Etapa | Escopo | Arquivos | Risco de regressão | Testes obrigatórios |
| --- | --- | --- | --- | --- |
| 0 | Cópia de segurança da pasta antes de cada etapa (sem Git) | — | Nenhum | Cópia conferida (mesma quantidade de arquivos) |
| 1 | P0-1: trocar `style.css` por `css/chatbot.css` em `curriculo-aluno.html` (após confirmar a edição local) | `curriculo-aluno.html` | Baixo | Sem 404; chatbot abre/fecha/Escape na página; impressão continua ocultando o chatbot |
| 2 | P0-2/P0-3: modo escuro do currículo com cores legíveis; **impressão forçando a paleta clara** | `css/curriculo-aluno.css` | Médio: identidade da folha A4 e impressão | 6 currículos × claro/escuro × 1366/390 px; PDF pelo diálogo real em Chrome, Edge e Firefox nos dois temas; quebra de página; contraste ≥ 4,5:1 |
| 3 | P0-4 e P1-6: escopo dos seletores globais que vazam para o catálogo (nome no escuro, salto das setas, indicadores) | `css/styles.css`, `css/vercurriculos.css` | Médio: `styles.css` atinge 6 páginas | Captura antes/depois de todas as páginas `pagina-padrao` nos dois temas; *hover*/foco das setas; teclado ←/→ |
| 4 | P1-3, P1-4, P1-2, P1-1: contrastes do chatbot, foco unificado, modo escuro da página de modelos e de `dark_light.html` | `css/chatbot.css`, CSS de página | Baixo/médio | Medição de contraste; navegação só por teclado em todas as páginas; chatbot nas duas bases de página |
| 5 | P1-9: tema sem piscar e tolerante a `localStorage` bloqueado, mantendo `theme`/`dark-mode` | `js/main.js`, HTML (script curto no `<head>`) | Médio: atinge todas as páginas | Primeira visita com sistema claro/escuro; troca e persistência entre páginas; aba anônima; `localStorage` bloqueado; leitor de tela no botão |
| 6 | P1-7: formulário (`autocomplete`, obrigatórios, honeypot, texto do botão, aviso LGPD aprovado) | `curriculo.html`, `css/curriculo.css` | Alto: perda de envios | Conferir `action`, `method` e `name` inalterados; validação nativa; envio **interceptado** localmente; um envio real só com autorização e combinado com quem recebe o e-mail |
| 7 | P1-8, P1-10, P2-1 a P2-5: links, títulos, menus/rodapés, semântica, mensagens de erro | HTML, JS de página | Baixo | Verificador de links locais; destinos externos abertos manualmente; árvore de títulos; leitor de tela (NVDA) no menu |
| 8 | P3: consolidar duplicações (variáveis, foco, helpers JS) **sem mudar o visual** | CSS/JS | Médio | Comparação de capturas antes/depois (pixel e estilos calculados) em todas as páginas; mesmos testes dos fluxos JSON |
| 9 | P2-6 a P2-9 e documentação (README, `refatoracao.md`) | conforme decisão | Depende da decisão | Revisão da equipe/orientação; nenhum dado pessoal alterado sem autorização |

### Testes de regressão para toda etapa

1. Servir sob `/curriculos/` e abrir as 9 páginas: nenhum 404 e nenhum erro no console.
2. Temas claro e escuro, alternância e persistência entre páginas (chave `theme`).
3. Catálogo: 6 cartões, pesquisa sem acentos, filtros combinados, "Limpar filtros", mensagem de nenhum resultado, contador e link para `curriculo-aluno.html?id=...`. (O carrossel foi substituído pela grade na etapa "Catálogo pesquisável".)
4. Currículo: ID válido, inexistente, ausente e inativo (simulado só no navegador); "Salvar como PDF".
5. Chatbot: abrir, menu, uma resposta de cada ação (`openMaps`, `openCatalog`), voltar, finalizar, Escape, foco de volta ao botão.
6. Formulário: campos, nomes e endpoint inalterados (sem envio real).
7. Larguras de 1366, 768 e 390 px; `prefers-reduced-motion`.

## 5. Testes executados nesta auditoria

- **Leitura integral** dos 9 HTML, 10 CSS, 5 JS, JSON, README e `docs/refatoracao.md`.
- **Script estático** (Python, fora do projeto):
  - JSON válido, 6 estudantes ativos, IDs únicos e fotos existentes.
  - Referências locais: a única quebrada é `style.css`.
  - Os IDs consultados pelo JS existem no HTML.
  - Páginas sem link de entrada identificadas; nenhum arquivo duplicado.
  - 15 pares de cores medidos (12 abaixo do mínimo WCAG).
- **Varredura de classes CSS** contra HTML e JS: nenhuma classe sem uso.
- **Servidor HTTP local** com o projeto sob `/curriculos/` (simulando o GitHub Pages): registrou 404 apenas em `style.css` e `favicon.ico`.
- **Chrome headless** com perfis temporários:
  - Capturas das 9 páginas em claro/escuro, 1366 e 390 px (36 capturas).
  - Captura alta de `curriculo-aluno.html` e dois PDFs (claro/escuro).
  - Confirmados P0-1, P0-2, P0-3, P0-4, P1-1 e P1-2.
- **Nenhum arquivo do site foi alterado**, nenhum formulário foi enviado e nada foi publicado. As capturas ficaram na pasta temporária da sessão.

## 6. Limitações da validação

- Sem Git, não foi possível identificar com certeza as alterações locais; a evidência é só a data de modificação.
- **O PDF do headless saiu em coluna única**: o Chrome headless usa papel Carta com margens, e a largura útil (~739 px) ativa `@media (max-width: 760px)`. No diálogo real, com `@page A4 margin 0`, a largura é ~794 px e as duas colunas devem se manter. Porém, **se o usuário escolher margens padrão no diálogo, o mesmo colapso pode acontecer**. Testar manualmente em Chrome, Edge e Firefox (risco ligado à etapa 2).
- O "salto" das setas (P1-6) foi deduzido da cascata; o *hover* não foi exercitado interativamente.
- Não foram testados: leitor de tela real, teclado virtual em celular físico, Safari/iOS, recebimento real pelo Formspree, destinos externos (cursos, Maps, banner) e o site publicado no GitHub Pages.
- O console do navegador não foi capturado de forma confiável no modo headless; a ausência de erros JS se baseia no carregamento correto do conteúdo dinâmico (catálogo, currículos e modelos renderizaram).

## 7. Registro de etapas concluídas

### Etapa "Padronização do design" — 05/11/2026

**Objetivo:** uma só linguagem visual em todas as páginas, sem mudar funcionalidades.

**Organização final do CSS**

| Arquivo | Conteúdo |
| --- | --- |
| `css/styles.css` | Variáveis (cores institucionais, tema claro e escuro, fontes, espaçamentos, raios, sombras, larguras, transição), base e componentes reutilizáveis |
| `css/site-chrome.css` | Cabeçalho, menu, rodapé e botão de tema, com marcação única nas 9 páginas |
| `css/chatbot.css` | Nina, usando os mesmos tokens |
| `css/inicio.css`, `curriculo.css`, `oportunidades.css`, `vercurriculos.css`, `modelo-curriculos.css`, `dark_light.css` | Apenas o que é exclusivo de cada página |
| `css/curriculo-aluno.css` | Folha A4 com variáveis próprias (`--a4-*`) e bloco de impressão independente do tema e da largura |

**Mudanças de marcação:**
- Cabeçalho, rodapé e botão de tema idênticos nas 9 páginas.
- Removidas as classes `pagina-padrao`/`pagina-complementar`.
- Ícones de sol/lua em SVG.
- Títulos do rodapé passaram a `h2`.
- `<main>` adicionado em `quem-somos-nos.html`.
- Cabeçalho de página em Vagas e Certificados.
- Emojis removidos dos títulos "Novidades" e "Dicas".
- `type="button"` nos botões "Ver detalhes" (continuam sem ação, como antes).
- `curriculo-aluno.html` deixou de referenciar `style.css` e passou a carregar `css/chatbot.css`.

**Itens do plano resolvidos:**
- **Totalmente:**
  - P0-1 a P0-4;
  - P1-1, P1-2, P1-3, P1-4 e P1-6;
  - P2-1 e P2-2;
  - P2-3, apenas na parte do `<main>` e dos títulos do rodapé;
  - P2-10;
  - P3, na parte de CSS: variáveis únicas, foco único, um bloco `[hidden]`, um bloco de movimento reduzido e o fim dos seletores globais que vazavam.
- **Parcialmente:** P1-5. O menu ativo não usa mais texto branco sobre verde, e os textos verdes do site usam `--cpm-verde-texto` (5,89:1). Na **folha A4 o verde original `#62a294` foi mantido** de propósito, para não alterar o currículo impresso; trocar só com aprovação.
- **Pendentes:** P1-7 (formulário), P1-8 (links de certificados), P1-9 (tema sem piscar), P1-10 (títulos das abas), P2-4 a P2-9 e a duplicação em JavaScript.

**Diferenças visuais intencionais:**
- Menu com links discretos e sublinhado verde na página atual, no lugar dos botões-pílula.
- Texto corrido em fonte sem serifa do sistema; títulos continuam em Georgia.
- Chatbot com as cores do site, no lugar da paleta bege.
- Página de modelos com a faixa azul institucional, no lugar da paleta cinza e dos círculos decorativos.
- Folha A4 branca também no tema escuro.

**Testes executados:**
- Navegador: Chrome headless, servidor local sob `/curriculos/`.
- Roteiro automatizado com 105 verificações, todas aprovadas:
  - em cada uma das 9 páginas: CSS carregados, cabeçalho e rodapé padrão, logo 52×52 sem distorção, um `<main>`, página atual marcada e chatbot com CSS, abrindo, saudando com 10 opções e fechando com Escape;
  - tema: alternância, `localStorage.theme`, `aria-pressed` e persistência;
  - catálogo: 6 estudantes, nome legível no escuro, setas centralizadas, próximo/anterior circular, teclado e links;
  - currículo: ID válido, inexistente e ausente; folha branca e nome azul no escuro;
  - formulário: `action`, `method` e nomes dos campos idênticos, validação nativa, **sem envio**;
  - modelos: 6 cards, busca e lista vazia;
  - nenhum erro JavaScript capturado.
- Capturas das 9 páginas nos temas claro e escuro em 1366 px.
- Visualização em largura real de 390 px (em `<iframe>`) das páginas principais nos dois temas.
- Chatbot aberto com resposta nos dois temas.
- PDF gerado com o tema claro e com o escuro: ambos claros, A4, uma página, duas colunas, só o currículo.
- Nenhuma resposta 404 do site.

**Limitações:**
- O headless impõe janela mínima de 500 px, por isso a validação de 390 px foi feita em `<iframe>`.
- O *hover* não pode ser fotografado no headless; as cores de *hover* foram conferidas por cálculo de contraste.
- Não testados: Firefox, Safari, celular físico, leitor de tela, impressão pelo diálogo real do navegador (com margens escolhidas pelo usuário) e o site publicado no GitHub Pages.

### Etapa "Responsividade e acessibilidade (WCAG 2.2 AA)" — 05/11/2026

Detalhes em `docs/relatorio-acessibilidade.md`.

**Resolvidos nesta etapa:**
- **P1-5:** verde da folha A4 escurecido apenas no texto.
- **P1-7:** só a parte de acessibilidade (`autocomplete`, obrigatórios, dicas); o texto LGPD e o rótulo do botão continuam pendentes.
- **P1-8:** URL corrigida; o nome do card "Escola Virtual GOV" ainda precisa ser conferido.
- **P1-9 e P1-10.**
- **P2-5:** mensagens de erro.

**Arquivos novos:** `js/menu.js`, `js/tema-inicial.js` e `docs/relatorio-acessibilidade.md`.

**Resultado:** 0 violações axe-core; nenhuma rolagem horizontal de 320 a 1440 px; 54 testes de teclado real e 105 funcionais aprovados.

### Etapa "Chatbot Nina" — 05/11/2026

**O que mudou:**
- **Interface:** janela compacta e responsiva com cabeçalho "Nina — Assistente automática", botões "Recomeçar" e "Fechar", conversa rolável, autor identificado em cada mensagem e campo com rótulo.
- **Menu inicial:** 7 ações rápidas (criar, PDF, enviar ao catálogo, encontrar estudantes, vagas, cursos, projeto) e "Mais assuntos".
- **Respostas:** reescritas, curtas e sem despedida repetida, mantendo só as informações institucionais verificadas.
- **Reconhecimento:** sem acentos e sem maiúsculas, com sinônimos, padrões por palavras completas, pontuação, prioridade e sugestão em caso de empate.
- **Pergunta ambígua** ("currículo"): a Nina pergunta o que a pessoa quer fazer.
- **Pergunta desconhecida:** a Nina orienta e mostra o menu.

**Arquivos:**
- novo `js/nina-conteudo.js`;
- reescritos `js/chatbot.js` e `css/chatbot.css`;
- os 9 HTML passaram a carregar `js/nina-conteudo.js`;
- `curriculo.html` ganhou `id="formulario"`.

**Testes** (teclas e cliques reais, temas claro e escuro):
- 38 testes da Nina aprovados: 39 perguntas reconhecidas corretamente; destinos de todas as ações conferidos (página e âncora existentes); envios e cliques rápidos; foco, Escape, Recomeçar, link para a própria página e PDF na página do currículo; janela dentro da tela de 320×568 a 1440×900, inclusive celular deitado (568×320).
- axe-core com o chat aberto: 0 violações.
- Regressão: funcional 105/105, teclado real 54/54, rolagem horizontal 108/108 combinações e axe-core 0 violações em todas as páginas.
- Movimento reduzido: sem animação e sem indicador de digitação.

**Limitações:**
- O histórico não é mantido ao trocar de página.
- Não testado com leitor de tela real nem em celular físico.

### Etapa "Catálogo pesquisável" — 05/11/2026

**Objetivo:** transformar Ver Currículos em um catálogo fácil de pesquisar, filtrar e comparar, sem perder currículos, IDs ou links.

**O que mudou:**
- **Grade de cartões no lugar do carrossel.** Antes da troca, foi conferido que só `js/vercurriculos.js` e `css/vercurriculos.css` usavam o carrossel. A Nina e os menus apontam para `vercurriculos.html`, sem âncora. O carrossel da página de modelos é outro e não foi alterado. Cada cartão tem foto ou avatar, nome, título, área, até 3 competências (com "+N"), interesses e tipo de oportunidade (quando informados) e o botão "Ver currículo completo" (`curriculo-aluno.html?id=...`).
- **Pesquisa enquanto se digita** em nome, título, área, interesses, competências, formação (curso e instituição) e tipos de oportunidade. Ignora acentos e maiúsculas e aceita várias palavras em qualquer ordem.
- **Filtros combináveis:** área profissional, competência e tipo de oportunidade, com valores e contagem tirados do JSON. O filtro de oportunidade fica oculto enquanto nenhum estudante ativo tiver `tipos_oportunidade`. Quando uma competência é filtrada, ela aparece primeiro no cartão.
- **Estados:** carregamento, erro de JSON, nenhum estudante ativo (aviso próprio, que não é erro), nenhum resultado (com botão "Limpar filtros" que devolve o foco à pesquisa) e contador em `role="status"`, que, durante a digitação, só é anunciado depois de 400 ms.
- **Normalização compartilhada:** `normalizarTexto()` saiu de `js/modelo-curriculos.js` e foi para o novo `js/normalizar-texto.js`, carregado pelas duas páginas, sem duplicação.
- **JSON não foi alterado.** Os campos opcionais `interesses_profissionais` e `tipos_oportunidade` são lidos quando existirem (formato no README). Nenhum estudante recebeu valores.

**Arquivos:** `vercurriculos.html`, `js/vercurriculos.js` e `css/vercurriculos.css` (reescritos); `js/normalizar-texto.js` (novo); `js/modelo-curriculos.js` e `modelo-curriculos.html` (uso da função compartilhada); `README.md` e `CLAUDE.md`.

**Testes** (Chrome headless, site servido sob `/curriculos/`, roteiro fora do projeto): **95/95 aprovados**.
- Dados reais: 6 cartões, contador, opções de área (3) e de competência (21) vindas do JSON, links e IDs idênticos aos do JSON, 6 currículos individuais abertos pelos links, clique real abrindo o currículo.
- Pesquisa: "ingles" = "INGLÊS" (3 estudantes); habilidade com várias palavras ("logica de programação"); título; formação; área; nome; Enter não envia o formulário.
- Filtros: área sozinha; área + competência; área + competência + pesquisa; nenhum resultado (lista oculta, mensagem e contador); "Limpar filtros" nos dois botões.
- Dados **fictícios simulados só no navegador** ("Teste Ficticio …"): estudante inativo fora da lista, da pesquisa e das opções de filtro; estudante sem foto (avatar); foto inexistente (troca pelo avatar); estudante sem título, área, competências e campos opcionais (cartão com textos de apoio e presente em "Todos"); campos opcionais preenchidos (filtro de oportunidade aparece só com os valores cadastrados, interesse entra no filtro de área).
- Estados: JSON com erro HTTP 500, JSON inválido, todos inativos e carregamento lento.
- Temas claro e escuro × 1366, 768, 390 e 320 px: sem rolagem horizontal, campos e botões com altura ≥ 44 px, sem erros JS. axe-core 4.10.2 (WCAG 2.0–2.2 A/AA + boas práticas): 0 violações em 1366 e 390 px nos dois temas, com e sem a mensagem de nenhum resultado.
- Teclado real: ordem do Tab (pesquisa → filtros → limpar → cartões) e filtro alterado pelas setas no `<select>`.
- Regressão da página de modelos: 6 cards, busca sem acento, sem erros nem 404.

**Limitações:**
- Não testado com leitor de tela real, em Firefox/Safari nem em celular físico.
- O único 404 observado foi `/favicon.ico` (P2-7, já conhecido).
- A captura de página inteira não carrega as fotos com `loading="lazy"` fora da tela; elas carregam ao rolar.
- O formulário `curriculo.html` ainda não tem campos para interesses e tipo de oportunidade. Acrescentá-los (com novos `name`) depende de decisão da equipe e não foi feito.

### Etapa "Criador de currículo (estrutura e dados)" — 05/11/2026

**Objetivo:** transformar o formulário em um criador de currículo em seções, acessível e adequado a quem procura o primeiro emprego. Esta etapa não inclui a pré-visualização completa, os modelos Padrão/ATS nem a integração final com o Formspree.

**Arquitetura:**
- `js/curriculo-modelo.js` (novo, sem DOM, `window.CurriculoModelo`):
  - limites de tamanho e listas fixas;
  - `validarCurriculo()`, que devolve erros por caminho (`contato.email`, `experiencias.1.titulo`);
  - `validarFoto()`, `normalizarCurriculo()`, `paraFormspree()` e `paraCatalogo()`.
- `js/curriculo-formulario.js` (novo, `window.CriadorCurriculo`):
  - listas dinâmicas a partir de `<template>`;
  - erros junto aos campos e resumo com links;
  - foto com prévia local, rascunho opcional e envio protegido.
  - Expõe `obterCurriculo()`, `validar()`, `preencherFormulario()` e o evento `curriculo:alterado` para a próxima etapa.
- O objeto do currículo segue a ideia de `data/alunos-dados.json` (`contato`, `formacao[]`, `competencias[]`…), sem `id` nem `ativo`.

**Seções:**
1. Dados pessoais e contato.
2. Objetivo (área de interesse, tipos de oportunidade e texto).
3. Formação.
4. Habilidades (lista com nível opcional).
5. Experiências e projetos (opcional; tipos profissional, projeto escolar, voluntário e atividade).
6. Cursos e certificados (opcional).
7. Fotografia (opcional).

O índice no topo mostra Obrigatória/Opcional e passa a "Revisar" nas seções com erro. Não há CPF, RG, data de nascimento nem endereço.

**Formspree:**
- `action`, `method`, `_subject` e os 9 nomes antigos foram preservados; 7 nomes novos foram acrescentados (ver README).
- Só `#enviar-curriculo` envia; Enter em campo de texto não envia.
- A foto (campo sem `name`) nunca é transmitida.

**Privacidade:** nada é guardado sem clique. "Guardar rascunho neste navegador" é opcional, explicado e não inclui a foto. "Apagar rascunho e limpar formulário" pede confirmação. Ao reabrir a página, o rascunho só volta se a pessoa pedir.

**Mudanças de texto que pedem aprovação da equipe (P1-7):**
- O botão "Salvar currículo" passou a "Enviar currículo para a equipe", porque agora há também "Guardar rascunho".
- Aviso curto sobre envio, LGPD e foto, baseado nas informações já usadas pela Nina.
- "tudoooo" foi corrigido para "tudo" nas dicas.

**Outros arquivos:** `curriculo.html` (`<main>` reescrito), `css/curriculo.css` (reescrito), `css/styles.css` (tokens `--cor-erro` e `--cor-erro-fundo` com valores claro/escuro; `.obrigatorio` passou a usá-los), `README.md` e `CLAUDE.md`.

**Testes** (Chrome headless, `/curriculos/`; **Formspree sempre interceptado**, sem envio real; dados fictícios "Teste Ficticio"): **127/127 aprovados**.
- Estrutura: `action`/`method`/`_subject`, nomes antigos presentes e sem repetição; toda chave de `paraFormspree()` tem campo; foto sem `name`; um único botão de envio.
- Formulário vazio: nada enviado; resumo com foco e 10 erros; mensagem junto a cada campo; `aria-invalid`; 4 seções marcadas "Revisar"; link do resumo foca o campo.
- Campos inválidos: nome sem sobrenome ou com números; e-mail; telefone; LinkedIn de outro site; `javascript:` recusado; objetivo curto e acima de 400; curso acima de 120.
- Preservação: os valores permanecem após o erro. O erro some ao corrigir, sem novo envio. O link sem `https://` é completado e o telefone é formatado ao sair do campo.
- Listas: adicionar com foco no novo item; renumeração; rótulos ligados; IDs únicos; item incompleto bloqueia o envio; item em branco é ignorado; remoção pelo teclado com foco no vizinho e anúncio; limite de 10; habilidade com nível sem nome; lista sem habilidades.
- Estudante sem experiência e sem opcionais: um POST com os nomes antigos preenchidos, experiências e cursos vazios e sem foto.
- Envio completo: textos de experiências, cursos e habilidades; `obterCurriculo()` e `paraCatalogo()` no formato esperado.
- Foto: recusa de `.txt`, 6 MB, arquivo corrompido e 100×100; prévia `blob:` da válida; remoção com foco.
- Rascunho: nada guardado sem clique; guardado sem foto; chave `theme` intacta; não restaura sozinho; restaurar; apagar com confirmação; descartar pelo aviso.
- Teclado: ordem do Tab, Espaço nas caixas, Enter nos botões e setas no nível.
- Claro/escuro em 1366, 768, 390 e 320 px: sem rolagem horizontal, alvos ≥ 44 px e sem erros JS. axe-core: 0 violações em 1366 e 390 px nos dois temas, com erros e itens abertos na tela.
- Regressão: as outras 8 páginas sem erros nem 404.

**Limitações:**
- Não houve envio real ao Formspree; o formato do e-mail recebido pela equipe não foi visto.
- Não testado com leitor de tela real, Firefox/Safari, celular físico nem seletor de arquivos/câmera de celular.
- Sem JavaScript, as listas e a foto não funcionam (há aviso `<noscript>`); os campos fixos continuam com `required` nativo.

### Etapa "Simulador de entrevistas, remoção de vagas e avatar da Nina" — 05/11/2026

**1. Simulador de entrevistas (Nina)**
- **Arquivos:** `js/entrevista-perguntas.js` (dados) e `js/entrevista.js` (gerenciador de estados), integrados ao motor existente (`js/chatbot.js`), sem reescrevê-lo.
- **Fluxo:** apresentação ("Começar entrevista" / "Voltar ao menu") → modalidade (Jovem Aprendiz, Estágio ou Primeiro Emprego) → 5 perguntas, uma por vez, com faixa "Simulação: Estágio · Pergunta 2 de 5" e barra `<progress>` → orientação geral após cada resposta → "Próxima pergunta" (nunca avança sozinha) → conclusão com 5 recomendações e dica da modalidade → "Refazer", "Escolher outra modalidade" ou "Voltar ao menu principal". "Sair da entrevista" fica disponível em toda pergunta; "Recomeçar" também encerra a simulação.
- **Sem avaliação inventada:** as orientações são as mesmas para qualquer resposta. A única observação personalizada é objetiva: respostas com menos de 8 palavras recebem a sugestão de desenvolver a ideia.
- **Privacidade:** respostas só na memória da aba, apagadas ao concluir, sair ou recomeçar; nada é enviado nem gravado.
- **Menu inicial:** "Simular entrevista de emprego" (destaque: linha inteira com ícone), "Criar meu currículo", "Dicas para o primeiro emprego" (nova), "Cursos e certificados", "Conhecer o projeto" e "Mais assuntos" (agora com PDF, catálogo e estudantes).
- **Página inicial:** o card "Dicas para entrevistas — em breve" virou "Simulador de entrevistas", com um botão que abre a Nina direto na simulação. O botão só aparece com JavaScript.

**2. Remoção de "Ver Vagas"**
- **Menus e rodapés:** removidos das 8 páginas.
- **CSS:** regras `.vagas` retiradas de `css/oportunidades.css`, que agora atende só Certificados.
- **Nina:** saíram a intenção e o atalho "Procurar vagas". Quem pergunta por vagas recebe "O Curriculum CPM não divulga vagas", com atalhos para dicas e simulação. Textos de "Conhecer o projeto" e "Como o site funciona" atualizados.
- **Textos:** banner da página inicial ("treine para entrevistas") e um trecho de `quem-somos-nos.html` que descrevia o espaço de vagas.
- **`vagas.html`:** virou só um redirecionamento imediato para `index.html` (meta refresh, `noindex`, link visível), para links já publicados não darem 404.
- **Menu:** com 5 links, o limite em que o menu desce para baixo do logo passou de 1020 para 920 px (e de 1180 para 1080 px na página com "Salvar como PDF"), medido para não quebrar linha.
- **Mantidos:** conteúdo educativo sobre primeiro emprego, estágio e Jovem Aprendiz, e a novidade "Feira de Empregos 2026" (notícia, não consulta de vagas; continua pendente em P2-6).

**3. Avatar da Nina**
- **Arquivo:** `img/nina-avatar.svg`, um robô original (cabeça clara, visor azul institucional, olhos verde-água, antena e headset no verde do CPM), com fundo transparente sobre o círculo azul do CSS.
- **Onde aparece:** botão flutuante (60 px; volta ao ícone de balão se a imagem falhar), cabeçalho ("Nina" + "Assistente virtual") e cada mensagem da Nina.
- **Acessibilidade:** imagem decorativa (`alt=""`). O botão se chama "Conversar com a Nina, assistente virtual", com `aria-expanded`; as mensagens levam "Nina: " ou "Você: " em texto oculto.
- **Animações discretas:** abertura da janela, entrada das mensagens e leve subida do botão no hover. Todas ficam desligadas com movimento reduzido.

**Testes** (Chrome headless, `/curriculos/`; roteiro fora do projeto): **303/303 aprovados**.
- **Estático:** nenhuma referência a `vagas.html`, "Ver Vagas" ou `.vagas` em HTML/CSS/JS (exceto o redirecionamento); links e âncoras da Nina existem; itens de menu correspondem a intenções.
- **Em cada uma das 8 páginas:** menu e rodapé sem vagas; avatar carregado, quadrado e com `alt` vazio; nome do botão; cabeçalho; Escape com retorno do foco; sem erros, 404 ou requisições externas da Nina. `vagas.html` leva a `index.html`.
- **Respostas tradicionais:** saudação, menu inicial e destaque, "Mais assuntos" e 8 perguntas digitadas (criar, localização, PDF, vagas, dicas, turnos, cursos, projeto); pergunta desconhecida; links.
- **Simulador, nas 3 modalidades:** introdução, escolha da modalidade, as 5 perguntas certas com progresso e campo em modo resposta, orientação certa, aviso de resposta curta só quando curta, nenhum texto avaliativo, botões corretos, sem avanço automático (1,2 s de espera), texto digitado fora da hora, conclusão, campo e progresso restaurados, nada no `localStorage`, `sessionStorage` ou cookies, nenhuma requisição externa.
- **Navegação na simulação:** refazer, sair, voltar às respostas normais, pedido digitado ("quero simular uma entrevista"), voltar ao menu, recomeçar no meio, fechar e reabrir mantendo a pergunta, botão da página inicial.
- **Teclado real:** Enter abre, Shift+Tab até a opção com foco visível, escolhas com Enter, resposta digitada, Escape.
- **Movimento reduzido:** sem atraso nem animação.
- **Telas e temas:** claro/escuro em 1366×900, 390×844, 320×568 e 568×320 (deitado): janela dentro da tela, botão 60×60, sem rolagem horizontal, alvos ≥ 40 px, axe-core 0 violações (1366 e 390) com a simulação aberta.
- **Preservação:** alternância de tema e chave `theme`; PDF nos dois temas com a Nina oculta, folha branca, 1 página A4 (pdf-lib); "Salvar como PDF" chama `window.print`.
- **Regressão:** formulário 127/127 e catálogo 95/95.

**Limitações:**
- Não testado com leitor de tela real, Firefox/Safari nem celular físico.
- O redirecionamento de `vagas.html` foi testado localmente, não no GitHub Pages publicado.
- O banner externo da página inicial (P2-7) foi bloqueado nos testes.
- As perguntas e orientações da simulação são material educativo escrito nesta etapa e devem ser revisadas pela equipe e pela orientação.

### Etapa "Pré-visualização, PDF do criador e Nina em painel lateral" — 05/11/2026

**Pré-visualização e PDF**
- **Arquitetura:**
  - coleta e validação: `CriadorCurriculo` e `CurriculoModelo` (o formulário ganhou `mostrarErros()`);
  - construção: novo `js/curriculo-documento.js`, só DOM e `textContent`;
  - prévia e impressão: novo `js/curriculo-previa.js`.
- **Interface:** "Visualizar currículo" no fim do formulário. A prévia mostra a hora da atualização, atualiza sozinha com as mudanças e tem os botões "Salvar em PDF", "Atualizar prévia" e "Voltar e editar", além de um aviso de pendências com "Ver o que falta no formulário" e um texto explicando a janela de impressão.
- **Salvar em PDF:**
  1. Valida; com erros, não imprime e mostra os erros no formulário.
  2. Atualiza a prévia.
  3. Monta `#area-impressao` e espera a foto carregar.
  4. Chama `window.print()`.
  - O título da aba vira o nome sugerido do arquivo ("Currículo - Nome").
  - Ctrl+P também imprime o currículo preenchido.
  - `afterprint` desfaz a preparação.
- **CSS:** novo `css/curriculo-documento.css`, carregado só em `curriculo.html`. Visual da folha do currículo individual, com classes `cv-*` próprias. A4 com 14 mm de margem inferior, 12 mm superior a partir da 2ª página e 0 na 1ª; sem altura fixa nem `overflow: hidden`; quebras `break-inside: avoid` nos itens; sem sombra na impressão. Na tela, a folha passa para uma coluna por *container query*.
- **Nina:** a resposta sobre PDF passou a citar o criador.

**Nina em painel lateral (pedido adicional)**
- Deixou de ser uma janela flutuante. Agora é um `<aside>` fixo à direita, com a altura toda e largura de 320 a 380 px.
- Acima de 760 px, a página recebe um recuo e se ajusta ao espaço, e o botão de tema se desloca.
- Até 760 px, a Nina abre na parte de baixo da tela (cerca de 75% da altura).
- O botão flutuante some enquanto o painel está aberto. Na impressão, painel e recuo desaparecem.

**Testes** (Chrome 157 headless, `/curriculos/`; Formspree e endereços externos interceptados; dados fictícios): **80/80 aprovados**.
- Poucas informações, sem foto: só as seções preenchidas, sem elementos vazios, 1 página A4.
- Extenso (20 habilidades, 10 itens longos, 10 cursos): 4 páginas A4, todos os itens no texto do PDF e título e período de cada item na mesma página.
- Nome longo: sem estouro, inteiro no PDF.
- Links e acentos: acentos no texto do PDF e links clicáveis (`mailto`, LinkedIn, GitHub, projeto, certificado).
- Com foto: carregada antes da impressão, sem requisição externa.
- PDF: texto extraível (pdf.js) e sem menu, botões, rodapé ou Nina.
- Erros: PDF bloqueado, resumo com foco e dados preservados.
- Ctrl+P, funcionamento sem internet, tema escuro (folha branca), afterprint.
- Nada enviado ao Formspree, nenhum rascunho criado, JSON inalterado.
- **Currículos publicados:** a impressão dos 6 currículos é **idêntica pixel a pixel** à do último commit (pixelmatch), com o mesmo texto e o mesmo número de páginas; com a Nina aberta, o PDF sai sem recuo e sem a Nina.
- Painel da Nina em 1366, 1024, 390 e 568×320: posição, recuo, botão oculto, fechar devolvendo o foco e sem rolagem horizontal.
- axe-core: 0 violações com a prévia aberta (claro/escuro, 1366/390).
- Regressão: Nina 303/303, formulário 127/127, catálogo 95/95.

**Limitações:**
- **Edge não testado:** o Edge 156 instalado não inicia neste ambiente (nem em headless direto).
- A janela de impressão real (escolha de destino e margens pelo usuário) não pode ser automatizada: os PDFs foram gerados pelo mecanismo de impressão do Chrome com as mesmas regras `@media print`.
- Firefox/Safari, leitor de tela e celular físico não foram testados.
