// Ativa verificações do JavaScript para ajudar a detectar erros de programação.
"use strict";

// =============================================================================
// Construção do documento do currículo a partir do objeto do modelo de dados.
// Recebe o currículo NORMALIZADO (CurriculoModelo.normalizarCurriculo) e devolve
// um elemento <article class="cv-folha cv-..."> pronto para a prévia ou a impressão.
//
// MODELOS: lista única com todos os modelos (nome, descrição, público, padrões de
// cor e fonte e a função que monta o documento). Para acrescentar um modelo,
// basta criar a função e uma nova entrada na lista; a tela de escolha, a prévia
// e o PDF passam a oferecê-lo automaticamente.
//
// Todos os modelos usam exatamente os mesmos dados. Os dados do usuário entram
// sempre com textContent (nunca com innerHTML). Seções vazias não são criadas.
// Estilos: css/curriculo-documento.css (classes cv-*), isolados da folha de
// curriculo-aluno.html.
// =============================================================================
(() => {
  // Cores de destaque oferecidas (todas com contraste AA sobre branco e com texto branco).
  const CORES = [
    { id: "azul-marinho", nome: "Azul-marinho", valor: "#163D73" },
    { id: "azul-classico", nome: "Azul clássico", valor: "#2563EB" },
    { id: "verde-escuro", nome: "Verde escuro", valor: "#28745B" },
    { id: "vinho", nome: "Vinho", valor: "#812E48" },
    { id: "grafite", nome: "Grafite", valor: "#374151" },
    { id: "preto", nome: "Preto", valor: "#111111" }
  ];

  // Fontes oferecidas. Calibri tem substitutas; Roboto é servida pelo próprio site
  // (fonts/roboto), então funciona sem internet e aparece igual no PDF.
  const FONTES = [
    { id: "arial", nome: "Arial", pilha: "Arial, \"Helvetica Neue\", Helvetica, sans-serif" },
    { id: "calibri", nome: "Calibri", pilha: "Calibri, Carlito, \"Segoe UI\", Arial, sans-serif" },
    { id: "roboto", nome: "Roboto", pilha: "\"Roboto CPM\", Roboto, Arial, sans-serif" },
    { id: "georgia", nome: "Georgia", pilha: "Georgia, \"Times New Roman\", serif" }
  ];

  function criar(tag, classe, texto) {
    const elemento = document.createElement(tag);
    if (classe) elemento.className = classe;
    if (texto) elemento.textContent = texto;
    return elemento;
  }

  // Título com o nível certo para o lugar onde a folha aparece (h1 a h6).
  function titulo(nivel, classe, texto) {
    return criar(`h${Math.min(6, Math.max(1, nivel))}`, classe, texto);
  }

  // Link só para endereços http(s) ou mailto; qualquer outro valor vira texto simples.
  function link(href, texto) {
    if (!/^(https?:\/\/|mailto:)/i.test(href)) return criar("span", "", texto);
    const a = criar("a", "", texto);
    a.href = href;
    return a;
  }

  // Endereço mais curto para o papel: "https://www.linkedin.com/in/ana/" → "linkedin.com/in/ana".
  function urlLegivel(url) {
    return url.replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/$/, "");
  }

  const juntar = (partes, separador = " · ") => partes.filter(Boolean).join(separador);

  function secao(classe, nivel, nomeTitulo, ...conteudo) {
    const elemento = criar("section", classe);
    elemento.append(titulo(nivel, "", nomeTitulo), ...conteudo);
    return elemento;
  }

  function lista(classe, itens) {
    const ul = criar("ul", classe);
    ul.append(...itens);
    return ul;
  }

  // Item com título, linha de apoio, período, descrição, linha extra e link.
  function itemConteudo(nivel, dados) {
    const item = criar("li", "cv-item");
    item.append(titulo(nivel, "", dados.titulo));
    if (dados.subtitulo) item.append(criar("p", "cv-subtitulo", dados.subtitulo));
    if (dados.periodo) item.append(criar("p", "cv-periodo", dados.periodo));
    if (dados.descricao) item.append(criar("p", "cv-descricao", dados.descricao));
    if (dados.extra) item.append(criar("p", "cv-extra", dados.extra));
    if (dados.url) {
      const p = criar("p", "cv-link");
      p.append(link(dados.url, urlLegivel(dados.url)));
      item.append(p);
    }
    return item;
  }

  // Itens de cada lista no formato comum (usado por todos os modelos).
  const itens = {
    formacao: (c) => c.formacao.map((f) => ({ titulo: f.curso, subtitulo: f.instituicao, periodo: juntar([f.periodo, f.situacao]) })),
    experiencias: (c) => c.experiencias.map((e) => ({ titulo: e.cargo, subtitulo: e.organizacao, periodo: e.periodo, descricao: e.descricao })),
    projetos: (c) => c.projetos.map((p) => ({ titulo: p.nome, descricao: p.descricao, extra: p.tecnologias ? `Tecnologias: ${p.tecnologias}` : "", url: p.url })),
    voluntariado: (c) => c.voluntariado.map((v) => ({ titulo: v.atividade, subtitulo: v.instituicao, periodo: v.periodo })),
    cursos: (c) => c.cursos.map((k) => ({ titulo: k.nome, subtitulo: k.instituicao, periodo: juntar([k.ano, k.carga_horaria]), url: k.url }))
  };

  // Seção com lista de itens; não cria nada quando a lista está vazia.
  function secaoDeItens(c, chave, nomeTitulo, n, classe = "cv-secao") {
    const dados = Array.isArray(chave) ? chave.flatMap((k) => itens[k](c)) : itens[chave](c);
    if (!dados.length) return null;
    return secao(classe, n + 1, nomeTitulo, lista("cv-lista-conteudo", dados.map((d) => itemConteudo(n + 2, d))));
  }

  // Seção de texto corrido; não cria nada quando o texto está vazio.
  function secaoDeTexto(texto, nomeTitulo, n, classe = "cv-secao") {
    return texto ? secao(classe, n + 1, nomeTitulo, criar("p", "cv-texto", texto)) : null;
  }

  // Contatos preenchidos, cada um como [rótulo, elemento].
  function contatos(c) {
    const lista = [];
    if (c.contato.email) lista.push(["E-mail", link(`mailto:${c.contato.email}`, c.contato.email)]);
    if (c.contato.telefone) lista.push(["Telefone", criar("span", "", c.contato.telefone)]);
    if (c.contato.cidade) lista.push(["Cidade", criar("span", "", c.contato.cidade)]);
    if (c.contato.linkedin) lista.push(["LinkedIn", link(c.contato.linkedin, urlLegivel(c.contato.linkedin))]);
    if (c.contato.github) lista.push(["GitHub", link(c.contato.github, urlLegivel(c.contato.github))]);
    if (c.contato.portfolio) lista.push(["Portfólio", link(c.contato.portfolio, urlLegivel(c.contato.portfolio))]);
    return lista;
  }

  // Contatos em uma linha ("Rótulo: valor | ..."), com ou sem rótulos.
  function linhaDeContatos(c, classe, comRotulos = true, separador = " | ") {
    const linha = criar("p", classe);
    contatos(c).forEach(([rotulo, conteudo], i) => {
      if (i) linha.append(separador);
      if (comRotulos) linha.append(`${rotulo}: `);
      linha.append(conteudo);
    });
    return linha.childNodes.length ? linha : null;
  }

  // Habilidades como etiquetas (lista).
  function etiquetas(tags, classe = "cv-etiquetas") {
    return lista(classe, tags.map((tag) => criar("li", "cv-etiqueta", tag)));
  }

  // Na prévia de um formulário incompleto, o lugar do nome fica indicado (o PDF exige o nome).
  function tituloNome(c, nivel, classe) {
    return c.nome ? titulo(nivel, classe, c.nome) : titulo(nivel, `${classe} cv-pendente`, "Seu nome completo");
  }

  function folha(c, classes) {
    const elemento = criar("article", `cv-folha ${classes}`);
    elemento.setAttribute("aria-label", `Currículo de ${c.nome || "estudante"}`);
    return elemento;
  }

  // Acrescenta só as seções que existem (as funções acima devolvem null quando vazias).
  function anexar(pai, ...filhos) {
    pai.append(...filhos.filter(Boolean));
  }

  // ---------------------------------------------------------------------------
  // Modelo 1 — Clássico Profissional: uma coluna, tradicional, sem foto.
  // ---------------------------------------------------------------------------
  function criarProfissional(c, n) {
    const f = folha(c, "cv-coluna cv-profissional");
    const cabecalho = criar("header", "cv-identificacao");
    anexar(cabecalho, tituloNome(c, n, "cv-nome"), linhaDeContatos(c, "cv-contatos", false, "  •  "));
    f.append(cabecalho);
    const competencias = [];
    if (c.habilidades.tecnicas.length) competencias.push(criar("p", "cv-texto", `Técnicas: ${c.habilidades.tecnicas.join(", ")}`));
    if (c.habilidades.comportamentais.length) competencias.push(criar("p", "cv-texto", `Comportamentais: ${c.habilidades.comportamentais.join(", ")}`));
    anexar(f,
      secaoDeTexto(c.objetivo.texto, "Objetivo profissional", n),
      secaoDeTexto(c.objetivo.resumo, "Resumo profissional", n),
      secaoDeItens(c, "formacao", "Formação acadêmica", n),
      secaoDeItens(c, "experiencias", "Experiência profissional", n),
      secaoDeItens(c, "cursos", "Cursos e certificações", n),
      competencias.length ? secao("cv-secao", n + 1, "Competências", ...competencias) : null,
      secaoDeItens(c, ["projetos", "voluntariado"], "Projetos e atividades complementares", n)
    );
    return f;
  }

  // ---------------------------------------------------------------------------
  // Modelo 2 — Primeiro Emprego / Jovem Aprendiz: acolhedor, foco em formação,
  // competências, projetos escolares, cursos e voluntariado.
  // ---------------------------------------------------------------------------
  function criarPrimeiro(c, n) {
    const f = folha(c, "cv-coluna cv-primeiro");
    const cabecalho = criar("header", "cv-identificacao");
    anexar(cabecalho,
      tituloNome(c, n, "cv-nome"),
      c.objetivo.tipos_oportunidade.length ? criar("p", "cv-busca", `Em busca de: ${c.objetivo.tipos_oportunidade.join(", ")}`) : null,
      linhaDeContatos(c, "cv-contatos")
    );
    f.append(cabecalho);
    const competencias = [];
    if (c.habilidades.tecnicas.length) competencias.push(criar("p", "cv-rotulo-grupo", "Técnicas"), etiquetas(c.habilidades.tecnicas));
    if (c.habilidades.comportamentais.length) competencias.push(criar("p", "cv-rotulo-grupo", "Comportamentais"), etiquetas(c.habilidades.comportamentais));
    anexar(f,
      secaoDeTexto(c.objetivo.texto, "Objetivo profissional", n),
      secaoDeTexto(c.objetivo.resumo, "Apresentação pessoal", n),
      secaoDeItens(c, "formacao", "Formação acadêmica", n),
      competencias.length ? secao("cv-secao", n + 1, "Competências", ...competencias) : null,
      secaoDeItens(c, "projetos", "Projetos escolares", n),
      secaoDeItens(c, "cursos", "Cursos complementares", n),
      secaoDeItens(c, ["experiencias", "voluntariado"], "Experiências e atividades voluntárias", n)
    );
    return f;
  }

  // ---------------------------------------------------------------------------
  // Modelo 3 — Técnico / Tecnologia: competências técnicas e projetos em destaque.
  // ---------------------------------------------------------------------------
  function criarTecnico(c, n) {
    const f = folha(c, "cv-coluna cv-tecnico");
    const cabecalho = criar("header", "cv-identificacao");
    anexar(cabecalho,
      tituloNome(c, n, "cv-nome"),
      c.objetivo.areas.length ? criar("p", "cv-area", c.objetivo.areas.join(" · ")) : null,
      linhaDeContatos(c, "cv-contatos")
    );
    f.append(cabecalho);
    const competencias = [];
    if (c.habilidades.tecnicas.length) competencias.push(etiquetas(c.habilidades.tecnicas, "cv-etiquetas cv-etiquetas--tecnicas"));
    if (c.habilidades.comportamentais.length) competencias.push(criar("p", "cv-texto cv-comportamentais", `Comportamentais: ${c.habilidades.comportamentais.join(", ")}`));
    anexar(f,
      secaoDeTexto(c.objetivo.texto, "Objetivo profissional", n),
      secaoDeTexto(c.objetivo.resumo, "Resumo técnico", n),
      competencias.length ? secao("cv-secao", n + 1, "Competências técnicas", ...competencias) : null,
      secaoDeItens(c, "projetos", "Projetos desenvolvidos", n),
      secaoDeItens(c, "formacao", "Formação acadêmica e técnica", n),
      secaoDeItens(c, "cursos", "Cursos e certificações", n),
      secaoDeItens(c, "experiencias", "Experiência profissional", n),
      secaoDeItens(c, "voluntariado", "Trabalho voluntário", n)
    );
    return f;
  }

  // ---------------------------------------------------------------------------
  // Modelo 4 — Moderno Discreto: títulos numa coluna estreita à esquerda de cada
  // seção, linhas finas entre as seções e um único detalhe de cor.
  // ---------------------------------------------------------------------------
  function criarDiscreto(c, n) {
    const f = folha(c, "cv-coluna cv-discreto");
    const cabecalho = criar("header", "cv-identificacao");
    anexar(cabecalho,
      tituloNome(c, n, "cv-nome"),
      c.objetivo.areas.length ? criar("p", "cv-area", c.objetivo.areas.join(" · ")) : null,
      linhaDeContatos(c, "cv-contatos", false, "   ")
    );
    f.append(cabecalho);
    const competencias = [];
    if (c.habilidades.tecnicas.length) competencias.push(criar("p", "cv-texto", c.habilidades.tecnicas.join(" · ")));
    if (c.habilidades.comportamentais.length) competencias.push(criar("p", "cv-texto cv-comportamentais", c.habilidades.comportamentais.join(" · ")));
    anexar(f,
      secaoDeTexto(c.objetivo.texto, "Objetivo", n),
      secaoDeTexto(c.objetivo.resumo, "Perfil", n),
      secaoDeItens(c, "formacao", "Formação", n),
      secaoDeItens(c, "experiencias", "Experiência", n),
      secaoDeItens(c, "projetos", "Projetos", n),
      secaoDeItens(c, "cursos", "Cursos", n),
      secaoDeItens(c, "voluntariado", "Voluntariado", n),
      competencias.length ? secao("cv-secao", n + 1, "Competências", ...competencias) : null
    );
    return f;
  }

  // ---------------------------------------------------------------------------
  // Modelo 5 — Visual com Foto: o modelo de duas colunas já existente
  // (coluna lateral colorida com foto, contato e habilidades).
  // ---------------------------------------------------------------------------
  function criarVisual(c, n) {
    const f = folha(c, "cv-moderno");

    const lateral = criar("div", "cv-lateral");
    if (c.foto && c.foto.url) {
      const foto = criar("img", "cv-foto");
      foto.src = c.foto.url;
      foto.alt = `Foto de ${c.nome}`;
      lateral.append(foto);
    }
    const listaContatos = contatos(c).map(([rotulo, conteudo]) => {
      const li = criar("li", "cv-contato");
      li.append(criar("span", "cv-rotulo", rotulo), conteudo);
      return li;
    });
    if (listaContatos.length) lateral.append(secao("cv-secao-lateral", n + 1, "Contato", lista("cv-lista", listaContatos)));
    for (const [grupo, nome] of [["tecnicas", "Habilidades técnicas"], ["comportamentais", "Habilidades comportamentais"]]) {
      if (!c.habilidades[grupo].length) continue;
      const tags = c.habilidades[grupo].map((tag) => criar("li", "cv-competencia", tag));
      lateral.append(secao("cv-secao-lateral", n + 1, nome, lista("cv-lista", tags)));
    }

    const principal = criar("div", "cv-principal");
    const identificacao = criar("header", "cv-identificacao");
    if (c.objetivo.tipos_oportunidade.length) identificacao.append(criar("p", "cv-busca", c.objetivo.tipos_oportunidade.join(" · ")));
    identificacao.append(tituloNome(c, n, "cv-nome"));
    if (c.objetivo.areas.length) identificacao.append(criar("p", "cv-area", c.objetivo.areas.join(" · ")));
    principal.append(identificacao);
    anexar(principal,
      secaoDeTexto(c.objetivo.texto, "Objetivo profissional", n),
      secaoDeTexto(c.objetivo.resumo, "Sobre mim", n),
      secaoDeItens(c, "formacao", "Formação", n),
      secaoDeItens(c, "experiencias", "Experiência profissional", n),
      secaoDeItens(c, "projetos", "Projetos", n),
      secaoDeItens(c, "voluntariado", "Trabalho voluntário", n),
      secaoDeItens(c, "cursos", "Cursos e certificados", n)
    );

    // A coluna principal vem primeiro no HTML: o nome é o primeiro título (ordem correta
    // para leitores de tela e para o texto do PDF). O CSS mantém a coluna colorida à esquerda.
    f.append(principal, lateral);
    return f;
  }

  // ---------------------------------------------------------------------------
  // Modelo ATS (já existente; tem regras próprias e não recebe cor nem fonte).
  // Uma coluna, sem foto, sem ícones, títulos convencionais. Não alterar aqui:
  // a evolução do ATS é feita em etapa própria.
  // ---------------------------------------------------------------------------
  function criarClassico(c, n) {
    const folha = criar("article", "cv-folha cv-classico");
    folha.setAttribute("aria-label", `Currículo de ${c.nome || "estudante"}`);

    const cabecalho = criar("header", "cv-identificacao");
    cabecalho.append(tituloNome(c, n, "cv-nome"));
    // Contatos em texto corrido, separados por " | " (rótulo + valor, sem ícones).
    const linha = criar("p", "cv-contatos");
    contatos(c).forEach(([rotulo, conteudo], i) => {
      if (i) linha.append(" | ");
      linha.append(`${rotulo}: `, conteudo);
    });
    if (linha.childNodes.length) cabecalho.append(linha);
    folha.append(cabecalho);

    const objetivo = [];
    if (c.objetivo.areas.length) objetivo.push(criar("p", "cv-texto", `Área de interesse: ${c.objetivo.areas.join(", ")}`));
    if (c.objetivo.tipos_oportunidade.length) objetivo.push(criar("p", "cv-texto", `Oportunidade desejada: ${c.objetivo.tipos_oportunidade.join(", ")}`));
    if (c.objetivo.texto) objetivo.push(criar("p", "cv-texto", c.objetivo.texto));
    if (objetivo.length) folha.append(secao("cv-secao", n + 1, "Objetivo profissional", ...objetivo));

    for (const [chave, nome] of [["formacao", "Formação"], ["experiencias", "Experiência profissional"], ["projetos", "Projetos"], ["voluntariado", "Trabalho voluntário"], ["cursos", "Cursos e certificados"]]) {
      const dados = itens[chave](c);
      if (dados.length) folha.append(secao("cv-secao", n + 1, nome, lista("cv-lista-conteudo", dados.map((d) => itemConteudo(n + 2, d)))));
    }

    const habilidades = [];
    if (c.habilidades.tecnicas.length) habilidades.push(criar("p", "cv-texto", `Técnicas: ${c.habilidades.tecnicas.join(", ")}`));
    if (c.habilidades.comportamentais.length) habilidades.push(criar("p", "cv-texto", `Comportamentais: ${c.habilidades.comportamentais.join(", ")}`));
    if (habilidades.length) folha.append(secao("cv-secao", n + 1, "Habilidades", ...habilidades));
    return folha;
  }

  // ---------------------------------------------------------------------------
  // Lista de modelos (ordem de exibição na tela de escolha).
  //   personalizavel: false → o modelo usa cores e fonte próprias (caso do ATS).
  // ---------------------------------------------------------------------------
  const MODELOS = [
    { id: "classico", nome: "Clássico Profissional", descricao: "Tradicional e formal, em uma coluna, sem foto.", publico: "Vagas administrativas, comerciais e operacionais.", cor: "#111111", fonte: "georgia", personalizavel: true, criar: criarProfissional },
    { id: "primeiro", nome: "Primeiro Emprego / Jovem Aprendiz", descricao: "Simples e acolhedor, valoriza formação, competências, projetos e cursos.", publico: "Ensino Médio, Jovem Aprendiz e primeiro emprego.", cor: "#28745B", fonte: "roboto", personalizavel: true, criar: criarPrimeiro },
    { id: "tecnico", nome: "Técnico / Tecnologia", descricao: "Destaca competências técnicas, projetos, GitHub e portfólio.", publico: "Desenvolvimento de Sistemas, estágios e vagas iniciais em TI.", cor: "#2563EB", fonte: "roboto", personalizavel: true, criar: criarTecnico },
    { id: "discreto", nome: "Moderno Discreto", descricao: "Contemporâneo e elegante, com títulos à esquerda e linhas finas.", publico: "Quem quer um visual moderno, mas formal.", cor: "#163D73", fonte: "calibri", personalizavel: true, criar: criarDiscreto },
    { id: "visual", nome: "Visual com Foto", descricao: "Coluna lateral colorida com foto, contato e habilidades.", publico: "Quem quer destacar a foto e a identidade visual.", cor: "#163D73", fonte: "georgia", personalizavel: true, criar: criarVisual },
    { id: "ats", nome: "ATS (leitura por sistemas)", descricao: "Uma coluna, sem foto nem ícones, pensado para sistemas de seleção (não há garantia de compatibilidade com todos).", publico: "Inscrições em sites de vagas e plataformas de recrutamento.", personalizavel: false, criar: criarClassico }
  ];
  const POR_ID = new Map(MODELOS.map((m) => [m.id, m]));

  // Monta a folha. Opções:
  //   modelo: id da lista MODELOS (padrão "visual");
  //   nivel: nível do título com o nome (3 na prévia; 1 na impressão);
  //   cor / fonte: personalização (só nos modelos personalizáveis; padrão do modelo quando vazio).
  function criarDocumento(curriculo, { nivel = 2, modelo = "visual", cor = "", fonte = "" } = {}) {
    // Nomes antigos (antes dos cinco modelos): "moderno" → Visual com Foto; "classico" do ATS fica "ats".
    const definicao = POR_ID.get(modelo === "moderno" ? "visual" : modelo) || POR_ID.get("visual");
    const documento = definicao.criar(curriculo, nivel);
    documento.dataset.modelo = definicao.id;
    if (definicao.personalizavel) {
      // Só valores da lista: a cor e a fonte nunca vêm de texto livre.
      const corEscolhida = CORES.find((c) => c.valor === cor)?.valor || definicao.cor;
      const fonteEscolhida = FONTES.find((f) => f.id === fonte) || FONTES.find((f) => f.id === definicao.fonte);
      documento.style.setProperty("--curriculo-cor-destaque", corEscolhida);
      documento.style.setProperty("--curriculo-fonte", fonteEscolhida.pilha);
    }
    return documento;
  }

  window.CurriculoDocumento = Object.freeze({
    criar: criarDocumento,
    MODELOS: MODELOS.map(({ criar: _, ...dados }) => Object.freeze(dados)),
    CORES,
    FONTES
  });
})();
