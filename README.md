# Curriculum CPM

Plataforma criada por estudantes do Curso Técnico em Desenvolvimento de Sistemas do **3º Colégio da Polícia Militar do Paraná**, no 2º Desafio EPT-PR 2026.

**Site:** https://eptcurriculos3cpm.github.io/curriculos/

## Objetivos

- Ajudar estudantes do Ensino Médio e do Ensino Técnico a criar currículos profissionais, mesmo sem experiência de trabalho.
- Preparar para o primeiro emprego, Jovem Aprendiz e estágio, com guia, cursos gratuitos e simulação de entrevista.
- Divulgar, com autorização, os perfis dos estudantes para possíveis recrutadores.

## Funcionalidades

| Página | O que faz |
| --- | --- |
| **Início** (`index.html`) | Apresenta a plataforma, os passos para criar o currículo e as funcionalidades. |
| **Criar Currículo** (`curriculo.html`) | Formulário guiado, prévia em tempo real, 5 modelos + ATS, cor e fonte personalizáveis, PDF, progresso salvo no dispositivo, exportar/importar JSON e solicitação opcional de publicação. |
| **Talentos** (`vercurriculos.html`) | Catálogo de estudantes com pesquisa e filtros combináveis (área, competência, habilidades técnicas e comportamentais, tipo de oportunidade). |
| **Currículo individual** (`curriculo-aluno.html?id=...`) | Currículo publicado em folha A4, com "Salvar como PDF", links de portfólio, contato intermediado com recrutadores (quando autorizado) e pedido de correção ou retirada. |
| **Cursos** (`certificados.html`) | Cursos gratuitos conferidos nas páginas oficiais, com filtros, condição do certificado e trilhas de aprendizagem. |
| **Guia do Primeiro Emprego** (`guia-primeiro-emprego.html`) | Jovem Aprendiz, estágio, CLT, currículo sem experiência, preparação para entrevistas e perguntas frequentes, com fontes oficiais. |
| **Sobre Nós** (`quem-somos-nos.html`) | Apresentação da equipe e do projeto. |

Em todas as páginas:

- tema claro e escuro;
- botão **A+** para aumentar o texto;
- **VLibras** (tradução para Libras), carregado só se a pessoa ativar;
- **Nina**, assistente virtual de regras (sem IA), com simulação de entrevista de emprego;
- layout responsivo, do celular ao computador.

## Tecnologias utilizadas

- HTML5, CSS3 e JavaScript puro, sem frameworks, sem etapa de compilação e sem dependências instaladas.
- JSON para os dados do catálogo (`data/alunos-dados.json`) e dos cursos (`data/cursos.json`).
- [Formspree](https://formspree.io) para receber as solicitações de publicação e o contato de recrutadores.
- GitHub Pages para a hospedagem.
- Fonte Roboto servida pelo próprio site (`fonts/roboto`, licença SIL OFL 1.1).
- VLibras, ferramenta oficial do Governo Federal, carregada do site oficial só quando ativada.

## Como executar localmente

Os dados são carregados com `fetch`, então o site precisa de um servidor HTTP. Abrir o arquivo HTML direto (`file://`) não funciona.

1. Clone ou baixe este repositório.
2. Abra um terminal na pasta do projeto.
3. Inicie um servidor local. Com Python, por exemplo:

   ```bash
   python -m http.server 8000
   ```

4. Acesse `http://localhost:8000` no navegador.

Outra opção é a extensão **Live Server** do VS Code: clique com o botão direito em `index.html` e escolha **Open with Live Server**.

## Como criar um currículo

1. Abra **Criar Currículo** e preencha as seções. Campos com `*` são obrigatórios; o restante é opcional. Não é preciso informar CPF, RG, data de nascimento nem endereço completo.
2. Adicione as **habilidades** tocando nas sugestões ou escrevendo outras. Repetições são recusadas automaticamente.
3. Experiência profissional, projetos, trabalho voluntário e cursos são **opcionais**. Seções vazias não aparecem no currículo.
4. Em **"Escolha o modelo do seu currículo"**, escolha um dos modelos:

   | Modelo | Indicado para |
   | --- | --- |
   | Clássico Profissional | Vagas administrativas, comerciais e operacionais |
   | Primeiro Emprego / Jovem Aprendiz | Ensino Médio, Jovem Aprendiz e primeiro emprego |
   | Técnico / Tecnologia | Desenvolvimento de Sistemas, estágios e vagas iniciais em TI |
   | Moderno Discreto | Quem quer um visual moderno, mas formal |
   | Visual com Foto | Quem quer destacar a foto e a identidade visual |
   | ATS (leitura por sistemas) | Sites de vagas e plataformas de recrutamento |

5. Em **"Personalize seu currículo"**, escolha uma das 6 cores e uma das 4 fontes (Arial, Calibri, Roboto ou Georgia). O ATS usa cor e fonte próprias.
6. A **prévia** ao lado (ou abaixo, no celular) mostra o resultado na hora. Trocar de modelo, cor ou fonte não apaga nenhum dado.

## Como salvar em PDF

Na prévia, clique em **Salvar em PDF**. O site confere os campos obrigatórios e abre a **janela de impressão do navegador**; em "Destino", escolha **Salvar como PDF**. Não há download automático: o arquivo é criado pelo próprio navegador.

- Se aparecerem a data e o endereço do site nas margens, desmarque **"Cabeçalhos e rodapés"**.
- O PDF sai em A4, com texto selecionável, sem menus nem botões. Currículos longos ocupam várias páginas.
- **Nada é enviado ou publicado** para gerar o PDF. Ele funciona até sem internet, depois que a página carregou.

Currículos já publicados também têm o botão **Salvar como PDF** na página individual.

## Salvar progresso e continuar depois

Por padrão, nada fica guardado: ao fechar ou recarregar a página, o que foi digitado se perde. Para continuar depois, há duas opções.

**No mesmo dispositivo:** use **Salvar progresso neste dispositivo**. Os dados ficam no navegador (`localStorage`, chave `curriculo-cpm-rascunho`). Atenção: **qualquer pessoa que use o mesmo dispositivo pode vê-los**, então não use em computadores compartilhados. Os botões **Recuperar rascunho**, **Apagar dados salvos** e **Começar novo currículo** ficam no mesmo lugar. O rascunho nunca é restaurado sozinho.

**Em outro computador (exportar/importar JSON):**

- **Exportar dados** baixa um arquivo `curriculo-seu-nome.json`, em UTF-8, com `esquema: "curriculum-cpm/curriculo"` e `versao: 2`. O arquivo contém dados pessoais: guarde-o com cuidado.
- **Importar dados** lê esse arquivo e confere várias coisas:
  - se é um JSON válido, do esquema e da versão certos, e com menos de 1 MB;
  - aproveita só os campos esperados, sempre como texto, e ignora qualquer propriedade extra (nenhum conteúdo é executado);
  - pede confirmação antes de substituir o que está na tela;
  - se algo falhar, mantém os dados atuais.
- Arquivos e rascunhos da versão 1 são convertidos automaticamente.

A **foto** nunca é salva, exportada nem enviada: ela fica só na prévia daquela aba.

## Como solicitar publicação no catálogo

Salvar o PDF e solicitar publicação são ações **independentes**. Não é preciso enviar nada para baixar o currículo.

1. No fim do formulário, em **Solicitar publicação no catálogo**, leia o aviso: o que é enviado, quem recebe, para quê, o que pode ser publicado e como pedir correção ou remoção.
2. Marque a autorização. Ela nunca vem marcada.
3. Clique em **Solicitar publicação**. O site valida os dados, mostra "Enviando…", bloqueia envios repetidos e confirma: *"Recebemos sua solicitação! Nossa equipe analisará as informações antes de incluir seu currículo no catálogo."*
4. Se houver falha de conexão ou erro do serviço, os dados continuam no formulário e o botão **Tentar novamente** aparece.

**Como o envio funciona:**

- Vai para o Formspree (`https://formspree.io/f/xeeykpoe`), que entrega a solicitação por e-mail à equipe (eptcurriculos@gmail.com).
- O envio é feito por `fetch`, com o cabeçalho `Accept: application/json`, sem sair da página.
- Mantém os nomes de campo antigos (`nome_completo`, `email`, `linkedin`, `github`, `curso`, `ano`, `habilidades`, `experiencias`, `objetivo_profissional`, `_subject`).
- Acrescenta `curriculo_json`, um rascunho já no formato do catálogo (sem e-mail, telefone e foto), e `tipo_solicitacao: publicacao_curriculo`.

**Para menores de 18 anos**, a caixa de autorização **não substitui** o termo de autorização (LGPD) assinado pelo responsável. A publicação depende desse termo e da avaliação da equipe.

> **Configuração do Formspree:** o envio pelo site exige que a proteção reCAPTCHA esteja **desligada** nas configurações do formulário no painel do Formspree. Confira isso antes da demonstração.

## Como incluir no catálogo um estudante aprovado

A publicação é **sempre manual**. Nada entra no catálogo automaticamente.

1. **Receber:** a solicitação chega por e-mail (assunto "Novo currículo enviado pelo site").
2. **Revisar:** confira os dados com o estudante e corrija o que for preciso.
3. **Conferir as autorizações:** a caixa marcada no formulário e, para menores de 18 anos, o termo LGPD assinado pelo responsável.
4. **Criar um ID** em minúsculas, sem acentos, com hífens (ex.: `nome-sobrenome`). O ID é permanente, porque vira o link `curriculo-aluno.html?id=...`.
5. **Adicionar ao `data/alunos-dados.json`** só os dados autorizados. O campo `curriculo_json` do e-mail já vem nesse formato: acrescente `id`, `ativo: true`, `titulo`, `turma` e `foto`. A foto vai em `fotos/`, enviada à parte pelo estudante.
6. **Validar:** abra o JSON em um validador e confira o estudante em **Talentos** e em `curriculo-aluno.html?id=...`, incluindo o **Salvar como PDF**.
7. **Publicar:** faça o commit e o envio ao GitHub depois da aprovação da equipe.

Campos do registro:

| Campo | Uso |
| --- | --- |
| `id`, `ativo` | Obrigatórios. `"ativo": false` esconde o estudante de todas as listagens, da pesquisa e do currículo individual. |
| `nome`, `titulo`, `turma`, `area`, `foto`, `sobre` | Identificação. A foto usa caminho relativo à raiz, como `"fotos/nome.png"`. |
| `contato` | `cidade`, `github`, `linkedin`. Evite publicar e-mail e telefone pessoais. Se houver `email` ou `telefone`, a página do currículo mostra "Oculto" e só exibe o dado quando o visitante clica em "Mostrar e-mail"/"Mostrar telefone" (o JSON continua público). CPF, RG e outros documentos nunca são exibidos e não devem entrar no JSON. |
| `competencias`, `formacao`, `experiencias`, `projetos` | Conteúdo do currículo. |
| `habilidades_tecnicas`, `habilidades_comportamentais` | Opcionais. Ativam os filtros de habilidades no catálogo. |
| `interesses_profissionais`, `tipos_oportunidade` | Opcionais. Entram no filtro de área e no de oportunidade. |
| `links` | Opcional: `[{ "tipo": "portfolio", "url": "https://..." }]`. Só links `http(s)` aparecem. |
| `contato_intermediado` | Opcional. `true` mostra "Tenho interesse neste candidato" (só com autorização do estudante). |

Use só informações fornecidas e autorizadas pelo estudante. **Nunca invente dados.**

**Correção ou retirada:** cada currículo publicado tem o link "Solicite correção ou retirada por e-mail". Para retirar alguém sem apagar o registro, use `"ativo": false`.

**Contato de recrutadores:** chega pelo mesmo endereço do Formspree, identificado pelo assunto "Interesse de recrutador: Nome (id)" e por `tipo_solicitacao: interesse_recrutador`. A equipe encaminha o contato ao estudante; os dados pessoais dele não são divulgados ao recrutador.

## Cursos (data/cursos.json)

A página Cursos lê `data/cursos.json`. Para cada curso, a condição do certificado (`certificado`) pode ser:

- `gratuito`: curso e certificado gratuitos;
- `pago`: curso gratuito, certificado pago;
- `condicoes`: condições especiais;
- `a_confirmar`: curso gratuito, mas a condição do certificado não foi confirmada.

Inclua **só cursos conferidos na página oficial**. Deixe `carga_horaria` vazio quando a página não informar e atualize `verificado_em` a cada conferência. As trilhas só podem usar cursos do catálogo ou páginas do próprio site. O site não emite certificados.

## Estrutura do projeto

```text
├── index.html                  # Página inicial
├── curriculo.html              # Criador de currículo (formulário, modelos, prévia, PDF)
├── vercurriculos.html          # Talentos: catálogo de estudantes
├── curriculo-aluno.html        # Currículo individual publicado (?id=...)
├── certificados.html           # Cursos e certificados
├── guia-primeiro-emprego.html  # Guia do Primeiro Emprego
├── quem-somos-nos.html         # Sobre Nós
├── modelo-curriculos.html      # Página auxiliar (sem link no menu)
├── dark_light.html             # Página auxiliar sobre os temas (sem link no menu)
├── vagas.html                  # Só redireciona links antigos para a página inicial
├── logo3cpm.png                # Logomarca do 3º CPM
├── css/
│   ├── styles.css              # Variáveis (cores, fontes, espaços), temas, base e componentes
│   ├── site-chrome.css         # Cabeçalho, menu, controles (A+ e tema) e rodapé
│   ├── chatbot.css             # Nina (painel lateral)
│   ├── inicio.css              # Página inicial
│   ├── curriculo.css           # Criador: formulário, escolha de modelo, personalização, prévia
│   ├── curriculo-documento.css # Folha dos modelos (prévia e impressão A4), só em curriculo.html
│   ├── curriculo-aluno.css     # Currículo individual e sua impressão
│   ├── vercurriculos.css       # Catálogo
│   ├── oportunidades.css       # Página Cursos
│   ├── guia.css                # Guia do Primeiro Emprego
│   ├── modelo-curriculos.css   # Página auxiliar de modelos
│   └── dark_light.css          # Página auxiliar sobre os temas
├── js/
│   ├── tema-inicial.js         # Aplica tema e tamanho do texto antes de a página aparecer
│   ├── main.js                 # Botão de tema
│   ├── acessibilidade.js       # Botão A+ e VLibras sob demanda
│   ├── menu.js                 # Menu recolhível no celular
│   ├── normalizar-texto.js     # Comparação sem acentos e maiúsculas
│   ├── curriculo-modelo.js     # Dados do currículo: validação, normalização, JSON, Formspree (sem DOM)
│   ├── curriculo-formulario.js # Formulário: listas, habilidades, erros, foto, progresso, envio
│   ├── curriculo-documento.js  # Modelos: lista MODELOS, cores, fontes e montagem da folha
│   ├── curriculo-previa.js     # Escolha do modelo, personalização, prévia e "Salvar em PDF"
│   ├── vercurriculos.js        # Catálogo: pesquisa e filtros
│   ├── curriculo-aluno.js      # Currículo individual
│   ├── interesse-recrutador.js # Contato intermediado e pedido de correção
│   ├── cursos.js               # Página Cursos
│   ├── nina-conteudo.js        # Respostas da Nina (editar aqui)
│   ├── entrevista-perguntas.js # Perguntas da simulação de entrevista (editar aqui)
│   ├── entrevista.js           # Etapas da simulação de entrevista
│   ├── chatbot.js              # Motor da Nina
│   └── modelo-curriculos.js    # Página auxiliar de modelos
├── data/
│   ├── alunos-dados.json       # Estudantes publicados (público!)
│   └── cursos.json             # Cursos, plataformas e trilhas
├── fonts/roboto/               # Fonte Roboto local e licença
├── img/nina-avatar.svg         # Avatar da Nina
├── fotos/                      # Fotos dos estudantes publicados
└── docs/                       # Plano de melhorias, relatórios e histórico
```

Para manter o projeto, consulte também o `CLAUDE.md`, com as regras do projeto e o mapa de arquivos, e o `docs/plano-melhorias.md`, com o histórico das etapas e os testes.

## Privacidade e dados

- O site é estático. **Tudo em `data/` é público**, inclusive para quem não usa o site. Não coloque ali solicitações pendentes, e-mails ou telefones pessoais, nem dados sem autorização.
- O criador de currículo funciona no navegador. Nada é enviado sem o clique em **Solicitar publicação** com a autorização marcada.
- Não há senhas, tokens nem chaves privadas no código. O endereço do Formspree é público por natureza.
- Preferências guardadas no navegador: `theme` (tema), `tamanhoTexto` (A+), `vlibras` e, se ativado, `@vlibras-widget`, gravada pelo próprio VLibras. O rascunho do currículo só é guardado com o clique em "Salvar progresso".
- **Ponto de atenção para a equipe:** o `data/alunos-dados.json` atual publica e-mails pessoais de estudantes. Avalie com a orientação se eles devem continuar públicos.

## Publicação no GitHub Pages

1. Envie os arquivos ao repositório `eptcurriculos3cpm/curriculos`, mantendo os HTML na raiz e as pastas `css/`, `js/`, `data/`, `fonts/`, `img/` e `fotos/` junto deles.
2. Em **Settings → Pages**, publique a partir do branch principal, na pasta raiz.
3. O site fica em `https://eptcurriculos3cpm.github.io/curriculos/`. Todos os caminhos internos são relativos, então funcionam nesse subendereço.

Não há instalação de pacotes nem etapa de compilação. Confira no site publicado: as páginas, o catálogo, um currículo individual com PDF e um envio de teste do formulário, combinado com a equipe.

## Contribuições com ferramentas de IA

Parte das melhorias foi desenvolvida com auxílio do **Claude Code** (Anthropic), sob orientação e revisão da equipe:

- auditoria e plano de melhorias;
- padronização visual e o redesign "Modelo 2";
- acessibilidade (WCAG 2.2 AA);
- catálogo pesquisável;
- criador de currículo com prévia, PDF, os cinco modelos e a personalização;
- exportação e importação JSON e a solicitação de publicação;
- painel e simulação de entrevista da Nina;
- Guia do Primeiro Emprego;
- página de cursos com fontes verificadas;
- recursos A+ e VLibras.

As informações legais do Guia e os dados dos cursos foram conferidos em fontes oficiais (Planalto, Ministério do Trabalho e Emprego, MEC, Enap e plataformas dos cursos) em 05/11/2026, e precisam ser revisadas pela equipe e pela orientação. Os textos da simulação de entrevista também devem ser revisados.

## Testes realizados

Testes automatizados no Chrome, com o site servido sob `/curriculos/` (como no GitHub Pages), dados fictícios e o Formspree sempre simulado:

- **Páginas:** temas claro e escuro, larguras de 320 a 1440 px, sem rolagem horizontal, 0 violações no axe-core (WCAG 2.2 AA) e navegação por teclado.
- **Catálogo:** pesquisa sem acentos, filtros combinados, estudantes inativos e sem foto, links dos currículos individuais.
- **Criador:** formulário vazio e inválido, listas, habilidades sem duplicatas, progresso salvo, os seis modelos com cores e fontes, PDF em A4 de uma e de várias páginas, texto selecionável, nada cortado.
- **Formspree:** autorização obrigatória, sucesso, bloqueio de envio duplicado, erro do serviço e falta de conexão com "Tentar novamente", e conferência de que o formulário real existe e aceita envios do site publicado (sem envio real).
- **Currículos publicados:** a impressão dos 6 foi comparada pixel a pixel com a versão anterior, idêntica (antes da última etapa de modelos).
- **Nina:** respostas, simulação de entrevista e painel lateral.

**Ainda não testado:**

- um envio real ao Formspree;
- Edge (não abriu no ambiente de teste), Firefox e Safari;
- leitor de tela real;
- celular físico;
- a janela de impressão real de cada navegador;
- o site publicado no GitHub Pages.

A bateria completa de testes deve ser repetida após a etapa dos cinco modelos.

## Contato

E-mail: eptcurriculos@gmail.com
