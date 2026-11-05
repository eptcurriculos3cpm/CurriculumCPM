# Relatório — responsividade e acessibilidade (WCAG 2.2 AA)

Etapa concluída em 05/11/2026. O design institucional, o carrossel, a Nina, o tema claro/escuro e o PDF A4 foram preservados.

## Problemas corrigidos

| Problema | Critério WCAG | Correção |
| --- | --- | --- |
| Menu ocupava até 3 linhas em celulares | 1.4.10 | Menu móvel recolhível (até 700 px, que inclui zoom de 200%). Botão "Menu" com `aria-expanded` e `aria-controls`; abre com clique, Enter e Espaço e fecha com Escape, devolvendo o foco ao botão. Fechado, os links não recebem foco. Sem JavaScript, o menu continua visível. |
| Sem atalho para pular o menu | 2.4.1 | Link "Pular para o conteúdo principal", primeiro item do Tab, visível ao receber foco. |
| `overflow-x: hidden` no `<body>` escondia possíveis estouros | 1.4.10 | Removido. Textos longos (e-mails, URLs) quebram linha, e os avisos de estado respeitam a margem lateral. |
| Indicadores do carrossel com 12 px | 2.5.8 | Área clicável de 24×24 px (o ponto visível continua pequeno). |
| Verde `#62a294` em textos da folha A4 (2,95:1) | 1.4.3 | Texto em `#3a7a6b` (5,03:1). Linhas e marcadores mantêm o verde original. |
| Rótulos da coluna azul do currículo (3,75:1 no topo do degradê) | 1.4.3 | `#e6eefa` (4,92:1 no ponto mais claro). |
| Foco laranja sobre a coluna azul (1,37:1) | 1.4.11 / 2.4.7 | Foco branco na coluna azul e azul-escuro na coluna branca. |
| Tema escuro aplicado depois de a página aparecer (pisca claro; cores em transição) | 1.4.3 | `js/tema-inicial.js` aplica o tema antes do primeiro desenho. A chave `theme` e a classe `dark-mode` não mudaram. |
| O botão de tema mudava o nome e o estado ao mesmo tempo | 4.1.2 | Nome fixo "Modo escuro" + `aria-pressed`. A preferência só é gravada quando a pessoa clica. `localStorage` bloqueado não quebra mais a página. |
| Títulos de aba repetidos ("Curriculum CPM") | 2.4.2 | Título próprio em cada página. |
| Campos sem finalidade identificável | 1.3.5 | `autocomplete="name"`, `"email"` e `"url"`. |
| Campos obrigatórios sem indicação visual | 3.3.2 | Asterisco com legenda no topo do formulário; dicas de formato do LinkedIn/GitHub ligadas por `aria-describedby`. Nomes dos campos e Formspree inalterados. |
| Três links "Acessar curso" iguais; um com URL quebrada | 2.4.4 | Texto oculto com o curso e "(abre em nova aba)". URL do MEC corrigida (removido `%22%3EAcessar`). |
| `aria-label` proibido em `<div>` sem papel | 4.1.2 | `role="group"` nos controles e indicadores; `role="region"` na lista rolável de modelos; rótulo inútil removido dos cartões. |
| Botões fixos (tema/Nina) podiam cobrir o elemento focado | 2.4.11 | `scroll-padding-bottom` mantém o elemento focado acima deles; espaço reservado no rodapé em celulares. |
| Mensagens de erro pediam "Live Server" ao visitante | 3.3.1 (clareza) | Orientação para recarregar e o e-mail de contato. |
| "Salvar como PDF" quebrava linha em 1024 px | 1.4.10 | Na página do currículo, o menu passa para baixo do logo até 1180 px. |

## Páginas verificadas

As 9 páginas (`index`, `curriculo`, `vercurriculos`, `curriculo-aluno?id=…`, `modelo-curriculos`, `vagas`, `certificados`, `quem-somos-nos`, `dark_light`), nos temas claro e escuro, em 320, 375, 430, 640, 683, 768, 1024 e 1440 px. As larguras de 640/683 px equivalem a zoom de 200% em telas de 1280/1366 px.

## Testes executados

Todos foram feitos no Chrome (headless), com o site servido localmente sob `/curriculos/`, como no GitHub Pages.

- **axe-core 4.10.2** (regras WCAG 2.0/2.1/2.2 A e AA + boas práticas), nas 9 páginas, em 375 e 1440 px, nos dois temas.
  - Início da etapa: 4 tipos de violação (contraste, área de toque, ARIA proibido).
  - Fim da etapa: **0 violações**.
  - Itens que o axe deixa para revisão manual foram conferidos por cálculo:
    - textos sobre o degradê do currículo;
    - etiquetas sobre fotos;
    - `textarea` (fundo não detectável).
- **Rolagem horizontal**: 9 páginas × 6 larguras × 2 temas medidos elemento por elemento (108 combinações), mais 9 páginas × 8 larguras com largura real de dispositivo. **Nenhum estouro.**
- **Teclado com teclas reais** (DevTools Protocol), 54 verificações nos dois temas, **todas aprovadas**:
  - menu móvel: Tab, Enter, Espaço, Escape e retorno do foco;
  - link de pular;
  - tema por Espaço;
  - carrossel: Enter, ← e → e indicadores; só o card visível recebe foco;
  - Nina: abrir, digitar, responder e Escape;
  - formulário: validação nativa bloqueando envio vazio, **sem envio real**;
  - `prefers-reduced-motion`.
- **Funcional da etapa anterior**: 105 verificações, todas aprovadas.
- **PDF** gerado com o tema escuro ativo: claro, A4, uma página, duas colunas, só o currículo.
- **Conferência visual** de capturas em 320, 375, 768 e 1024 px nos dois temas.

**Lighthouse não foi executado**: o computador não tem Node.js. Nenhuma pontuação foi calculada.

## Problemas pendentes

- Testar com leitor de tela real (NVDA no Windows, TalkBack/VoiceOver no celular), em Firefox e Safari, e em celular físico.
- Impressão pelo diálogo real do navegador com margens escolhidas pelo usuário (o CSS já força A4 em duas colunas).
- Ordem dos títulos em `curriculo.html`: o `h2` "Dicas" vem antes do `h1` do formulário. Não é violação, mas inverter a ordem muda o layout; decidir com a equipe.
- No currículo individual, o link "Pular" só tem destino quando o currículo carrega (nos estados de carregamento/erro, o aviso já aparece logo após o cabeçalho).
- Botões "Ver detalhes" das vagas continuam sem ação (como no original).
- Itens do plano que dependem da equipe: texto de privacidade/LGPD do formulário, e-mails de estudantes publicados no JSON e páginas `modelo-curriculos.html`/`dark_light.html` sem link no menu.
