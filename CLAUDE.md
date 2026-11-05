# CLAUDE.md — Curriculum CPM

Site estático escolar (2º Desafio EPT-PR 2026, 3º Colégio da Polícia Militar do Paraná) que divulga currículos de estudantes. Publicado no GitHub Pages em `https://<usuario>.github.io/curriculos/` (repositório `eptcurriculos3cpm/curriculos`). Não há build, servidor de aplicação nem dependências.

Antes de qualquer alteração, leia `docs/plano-melhorias.md` (problemas, prioridades e testes por etapa) e `docs/refatoracao.md` (histórico da organização anterior).

## Regras permanentes

1. Preservar HTML, CSS e JavaScript puro.
2. Manter compatibilidade com GitHub Pages e caminhos relativos à subpasta `/curriculos/`. Nunca usar caminhos iniciados por `/` (ex.: `/css/...`); eles quebram no subcaminho.
3. Não introduzir React, Vue, Angular, bundlers, gerenciadores de pacotes ou dependências desnecessárias.
4. Preservar a identidade visual institucional (Modelo 2: azul `#043175`, azul profundo `#09234b`, azul de destaque `#3875c5`, fundo creme "amarelo antigo" `#faf4e3`, títulos em Georgia e textos em Inter/Arial; o verde `#62a294` fica só no avatar da Nina e nas folhas A4) e a logomarca `logo3cpm.png`. Não substituir, recortar nem recomprimir a logo sem autorização; se for preciso otimizar, criar um arquivo derivado e pedir aprovação.
5. Preservar a chave `theme` do `localStorage` (valores `"dark"`/`"light"`) e a classe `dark-mode` aplicada ao `<body>`.
6. Preservar o funcionamento do Formspree: `action="https://formspree.io/f/xeeykpoe"`, `method="POST"` e os atributos `name` dos campos (`nome_completo`, `email`, `linkedin`, `github`, `curso`, `ano`, `habilidades`, `experiencias`, `objetivo_profissional`, `_subject`).
7. Preservar o catálogo e as URLs `curriculo-aluno.html?id=...`. Os IDs do JSON são permanentes.
8. Preservar a impressão A4 com `window.print()` (botão `#botao-imprimir`) e o CSS de impressão (`@page`, `@media print`) em `css/curriculo-aluno.css`.
9. Não alterar dados pessoais, fotografias, IDs ou status (`ativo`) de estudantes sem autorização explícita. Isso vale para `data/alunos-dados.json` e para a pasta `fotos/`.
10. Nunca publicar automaticamente informações recebidas pelo formulário. A inclusão de estudantes no JSON é manual e depende do termo LGPD assinado.
11. Usar HTML semântico, acessibilidade WCAG 2.2 nível AA e código legível, com comentários em português no estilo já usado no projeto.
12. Preferir pequenas alterações verificáveis, sem reescrever o projeto inteiro. Uma etapa do plano por vez.
13. Não fazer commit ou push automaticamente sem autorização.
14. Não criar dados fictícios identificáveis como estudantes reais (nomes, fotos ou contatos plausíveis). Para testes, simular dados apenas no navegador e deixá-los evidentemente fictícios.
15. Registrar os testes realizados e as limitações de validação ao final de cada etapa (em `docs/plano-melhorias.md` ou no relatório da etapa).

## Mapa rápido

Todas as páginas carregam, nesta ordem: `css/styles.css`, `css/site-chrome.css`, `css/chatbot.css` e, por último, o CSS específico da página.

Scripts comuns a todas as páginas:
- `js/tema-inicial.js`, primeiro item do `<body>`, sem `defer`: aplica `dark-mode` antes do desenho.
- No fim do `<body>`, nesta ordem: `js/menu.js` (menu móvel), `js/nina-conteudo.js`, `js/entrevista-perguntas.js`, `js/entrevista.js`, `js/chatbot.js` e `js/main.js` (botão de tema).

Estrutura fixa do topo de cada página:
1. script de tema;
2. link "Pular para o conteúdo principal" (`href="#conteudo"`, ou `#pagina-curriculo` no currículo);
3. `.site-header`;
4. `<main id="conteudo">`.

| Página | CSS específico | JS |
| --- | --- | --- |
| `index.html` | inicio | chatbot, main |
| `curriculo.html` (criador de currículo, Formspree) | curriculo | curriculo-modelo, curriculo-formulario, chatbot, main |
| `vercurriculos.html` (catálogo: pesquisa, filtros e grade) | vercurriculos | normalizar-texto, vercurriculos, chatbot, main |
| `curriculo-aluno.html?id=` (currículo A4) | curriculo-aluno | curriculo-aluno, chatbot, main |
| `certificados.html` | oportunidades | chatbot, main |
| `quem-somos-nos.html` | — | chatbot, main |
| `modelo-curriculos.html` (sem link no menu) | modelo-curriculos | normalizar-texto, modelo-curriculos, chatbot, main |
| `dark_light.html` (sem link no menu) | dark_light | chatbot, main |

`vagas.html` não é mais uma página: a funcionalidade de vagas foi retirada e o arquivo só redireciona links antigos para `index.html` (sem CSS, JS, menu ou conteúdo). Não recriar páginas, links ou atalhos de vagas.

## Sistema visual (CSS)

- `css/styles.css`: **tokens** em `:root` (cores institucionais `--cpm-*`, cores de função `--cor-*`, fontes, espaçamentos `--esp-1…8`, raios, sombras, larguras, transição), valores do tema escuro em `body.dark-mode`, elementos base e componentes reutilizáveis (`.cabecalho-pagina`, `.botao`/`.botao-criar-curriculo`, `.botao-secundario`, `.card`, `.cards`, `.chip`, `.estado`/`.mensagem-estado`, `.texto-corrido`).
- `css/site-chrome.css`: cabeçalho `.site-header`, menu `.menu` (página atual por `aria-current="page"`), rodapé `.site-footer` e botão de tema. Marcação idêntica em todas as páginas; ao mudar o menu ou o rodapé, alterar os 8 HTML (menu com 5 links).
- `css/chatbot.css`: Nina, usando os mesmos tokens.
- CSS de página: apenas o que é exclusivo daquela página, sempre com `var(--…)`.
- Cores novas entram como token em `styles.css` (com valor claro e escuro), nunca como hexadecimal solto nas páginas. Conferir contraste AA nos dois temas.
- Estilos base usam `:where()` (especificidade zero) para que componentes possam sobrescrever sem `!important`.
- **Folha A4**: `css/curriculo-aluno.css` declara variáveis próprias `--a4-*` em `.pagina-a4`, com valores fixos, independentes do tema. Assim a folha é sempre branca e o PDF sai igual em qualquer tema. Regras de tela pequena ficam em `@media screen`, e `@media print` força duas colunas. Não ligar a folha aos tokens do site.
- `js/main.js` (tema) deve ser carregado por último; `js/chatbot.js` (Nina) reutiliza o `<button class="chatbot">` existente e cria o painel `#cb-panel`. Toda página que carrega `chatbot.js` precisa carregar `css/chatbot.css`.
- `data/alunos-dados.json` é lido com `fetch("data/alunos-dados.json")` por três scripts (catálogo, currículo individual, modelos). Fotos usam `fotos/...` relativo ao HTML da raiz. `ativo: false` oculta o estudante.
- `js/normalizar-texto.js` define `normalizarTexto()` (sem acentos, minúsculas), compartilhada pelo catálogo e pela página de modelos; não duplicar. O catálogo lê os campos opcionais `interesses_profissionais` e `tipos_oportunidade` (listas de texto); as opções dos filtros saem só do JSON. Nunca preencher esses campos sem informação do próprio estudante.

## Criador de currículo (`curriculo.html`)

- **Modelos**: `CurriculoDocumento.MODELOS` (js/curriculo-documento.js) lista todos os modelos — Clássico Profissional, Primeiro Emprego/Jovem Aprendiz, Técnico/Tecnologia, Moderno Discreto, Visual com Foto e ATS — com nome, descrição, público, cor e fonte padrão e a função que monta a folha. Para um modelo novo, basta uma função e uma entrada na lista. O ATS (`criarClassico`, classe `.cv-classico`, `@page classico`) não recebe cor nem fonte e não deve ser alterado fora da etapa própria.
- **Personalização**: só as 6 cores de `CORES` e as 4 fontes de `FONTES`, aplicadas pelas variáveis `--curriculo-cor-destaque` e `--curriculo-fonte` na `.cv-folha` (nunca valor livre). Roboto é servida pelo site (`fonts/roboto`, licença OFL).
- **Prévia**: sempre visível; a folha mantém 210 mm e é reduzida por escala (`.previa-escala`, `.miniatura-escala`). Estado visual `{ modelo, cor, fonte }` em js/curriculo-previa.js, separado dos dados do formulário.

- **Prévia e PDF**: `js/curriculo-documento.js` (`CurriculoDocumento.criar(curriculo, { nivel })`) monta a folha só com DOM e `textContent`; `js/curriculo-previa.js` atualiza a prévia (`#previa`) e prepara a impressão: valida, atualiza, monta uma cópia em `#area-impressao` (filho do `<body>`), espera as imagens e chama `window.print()`. Não há download automático: é a janela de impressão do navegador.
- `css/curriculo-documento.css` (classes `cv-*`, `@page` A4 com 12/14 mm em cima/embaixo e 0 na primeira página) é carregado **só** por `curriculo.html`. Não ligar ao `css/curriculo-aluno.css` nem reaproveitar seus seletores: a impressão dos currículos publicados precisa continuar idêntica.
- Folha sem altura fixa e sem `overflow: hidden`: currículos longos continuam em várias páginas A4.

- **`js/curriculo-modelo.js`** (`window.CurriculoModelo`): só regras, sem DOM. Limites (`LIMITES`), listas fixas (tipos de oportunidade, níveis, tipos de experiência, regras da foto), `validarCurriculo(bruto)` → `[{ campo, mensagem }]`, `normalizarCurriculo()`, `paraFormspree()` e `paraCatalogo()`. Mudanças de regra entram aqui.
- **`js/curriculo-formulario.js`** (`window.CriadorCurriculo`): interface (listas dinâmicas por `<template>`, erros junto aos campos + resumo, foto, rascunho, envio). Pré-visualização, PDF e modelos devem usar `CriadorCurriculo.obterCurriculo()` e o evento `curriculo:alterado`, sem ler os campos diretamente.
- Campos ligam-se ao modelo por `data-campo` (caminho do dado, ex.: `contato.email`, `formacao.0.curso`). Novos campos precisam de `data-campo`, limite em `LIMITES` e, se forem enviados, chave em `paraFormspree()` com `<input name>` correspondente.
- Só `#enviar-curriculo` é `type="submit"`; todo outro botão é `type="button"`. Enter em campo de texto não envia. O envio passa por `validarCurriculo()` antes do POST.
- **Privacidade:** a foto (campo sem `name`) nunca é enviada nem guardada. Nada vai ao `localStorage` sem o clique em "Guardar rascunho" (chave `curriculo-cpm-rascunho`), e sempre há como apagar. Não pedir CPF, RG, nascimento ou endereço completo.

## Acessibilidade (WCAG 2.2 AA)

- **Menu móvel** (até 700 px): `<button class="menu-toggle">` com `aria-expanded`/`aria-controls="menu-principal"`. O menu fechado usa `display: none`. Sem JS, o botão fica `hidden` e o menu aparece completo. Não trocar o `<button>` por `div` com ARIA.
- **Botão de tema**: nome fixo "Modo escuro"; o estado fica em `aria-pressed`.
- **Alvos clicáveis**: mínimo 24×24 px (2.5.8); botões principais com 44 px.
- **Cores**: todo texto novo precisa de 4,5:1 (3:1 para bordas de campos, ícones e foco) nos dois temas. Na folha A4, texto verde usa `--a4-verde-texto`.
- **Rolagem horizontal**: não esconder com `overflow-x: hidden`; corrigir o elemento que estoura. Testar em 320 px.
- **Relatório da última verificação**: `docs/relatorio-acessibilidade.md`.

## Chatbot Nina

- **Somente regras**: sem IA, sem API e sem serviço externo. Nunca descrevê-la como IA generativa.
- **`js/nina-conteudo.js`**: só dados (configuração, menus, intenções, padrões, respostas e ações). Para mudar uma resposta, editar aqui.
- **`js/chatbot.js`**: motor (normalização, pontuação, interface, fila de respostas, navegação, eventos).
- **Simulação de entrevista**: `js/entrevista-perguntas.js` (só dados: introdução, modalidades Jovem Aprendiz/Estágio/Primeiro Emprego, 5 perguntas cada, orientações e conclusão) e `js/entrevista.js` (gerenciador de estados `inativa → apresentacao → modalidade → pergunta ⇄ orientacao`). O `chatbot.js` entrega à entrevista só funções de interface (`falar`, `progresso`, `modoResposta`…); durante a simulação, o texto digitado vai para a entrevista, não para as intenções. As orientações são **gerais por pergunta**: nunca escrever avaliação, nota ou elogio sobre a resposta (o único critério objetivo é a contagem de palavras). As respostas ficam só na memória e são apagadas ao concluir, sair ou recomeçar.
- **Avatar**: `img/nina-avatar.svg` (robô original, fundo transparente sobre círculo azul do CSS), caminho em `NinaConteudo.config.avatar`. É decorativo (`alt=""`, `aria-hidden`); o nome "Nina" fica em texto.
- **Padrões**: palavras sem acento e em minúsculas; todas precisam aparecer (em qualquer ordem); `*` aceita continuações; cada palavra vale 1 ponto; empate é decidido por `prioridade`. Evitar padrões de uma palavra genérica (ex.: "como", "site" sozinho em intenções importantes).
- **Ações**: só apontar para páginas e âncoras que existem (ex.: `curriculo.html#formulario`). Não oferecer funções que o site não tem. O PDF só existe para currículos publicados (botão "Salvar como PDF" em `curriculo-aluno.html`).
- **Informações do colégio**: usar somente as verificadas, que já estão nas respostas (decreto, datas, turnos, endereço, horário, número de alunos, curso técnico, equipe, Desafio EPT).
- **Painel lateral**: a Nina abre num `<aside>` fixo à direita, com toda a altura e largura `--cb-largura` (320–380 px). Em telas acima de 760 px, `html.cb-aberto` reserva esse espaço (`padding-right` no `<body>`) para não cobrir a página. Até 760 px, ela ocupa a parte de baixo da tela. O botão flutuante some enquanto o painel está aberto. Na impressão, painel e recuo desaparecem.
- **Acessibilidade**: região complementar (`<aside>`) com `aria-labelledby`; mensagens em `role="log"`; opções fora da região viva; Escape fecha e devolve o foco; com movimento reduzido, sem animação e sem atraso.

## Como testar

- Servir por HTTP (o `fetch` não funciona em `file://`). Para simular o GitHub Pages, servir a pasta sob o prefixo `/curriculos/`, por exemplo com `python -m http.server` a partir de uma pasta-pai chamada `curriculos`, ou com um servidor que mapeie esse prefixo.
- Conferir no mínimo: as 8 páginas nos temas claro e escuro, em 1366 px e 390 px; catálogo com os 6 estudantes; `curriculo-aluno.html` com ID válido, inválido e ausente; impressão/PDF pelo diálogo real do navegador nos dois temas; chatbot abrindo, respondendo e fechando com Escape; simulação de entrevista do início ao fim; console sem erros e sem respostas 404.
- Nunca enviar o formulário para o Formspree real em testes automatizados; interceptar o envio ou testar só a validação nativa.
- Ferramentas e capturas de teste ficam fora do projeto (pasta temporária); não viram dependência do site.
