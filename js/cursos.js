// Ativa verificações do JavaScript para ajudar a detectar erros de programação.
"use strict";

// =============================================================================
// Página Cursos (certificados.html): catálogo, filtros e trilhas de aprendizagem.
// Os dados ficam em data/cursos.json (só cursos conferidos nas páginas oficiais).
// Tudo é montado com createElement/textContent; os links externos abrem em nova aba.
// =============================================================================
(() => {
  const el = {
    estado: document.getElementById("estado-cursos"),
    erro: document.getElementById("erro-cursos"),
    legenda: document.getElementById("legenda-cursos"),
    verificacao: document.getElementById("verificacao-cursos"),
    secaoTrilhas: document.getElementById("trilhas"),
    trilhas: document.getElementById("lista-trilhas"),
    secaoCatalogo: document.getElementById("catalogo-cursos"),
    area: document.getElementById("filtro-area-curso"),
    plataforma: document.getElementById("filtro-plataforma"),
    certificado: document.getElementById("filtro-certificado"),
    limpar: document.getElementById("limpar-filtros-cursos"),
    formulario: document.getElementById("filtros-cursos"),
    contador: document.getElementById("contador-cursos"),
    lista: document.getElementById("lista-cursos"),
    plataformas: document.getElementById("lista-plataformas")
  };
  if (!el.lista) return;

  // Textos de cada condição de certificado (as mesmas da legenda).
  const CERTIFICADOS = {
    gratuito: "Curso e certificado gratuitos",
    pago: "Curso gratuito, certificado pago",
    condicoes: "Condições especiais",
    a_confirmar: "Certificado a confirmar"
  };

  let cursos = [];
  let plataformas = new Map();

  function criar(tag, classe, texto) {
    const elemento = document.createElement(tag);
    if (classe) elemento.className = classe;
    if (texto) elemento.textContent = texto;
    return elemento;
  }

  // Só endereços https viram link (os dados vêm de um arquivo do próprio site).
  function linkExterno(url, texto, complemento = "") {
    const a = criar("a", "", texto);
    if (/^https:\/\//i.test(url)) {
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener";
    }
    a.append(criar("span", "visualmente-oculto", `${complemento} (abre em nova aba)`));
    return a;
  }

  function seloCertificado(tipo) {
    return criar("span", `selo-certificado selo-certificado--${tipo}`, CERTIFICADOS[tipo] || CERTIFICADOS.a_confirmar);
  }

  // Cartão de um curso com área, instituição, modalidade, carga horária e certificado.
  function criarCartao(curso) {
    const plataforma = plataformas.get(curso.plataforma);
    const item = criar("li", "card cartao-curso");
    item.append(criar("h3", "", curso.nome), criar("p", "instituicao-curso", plataforma ? plataforma.nome : ""));
    const dados = criar("dl", "dados-curso");
    const dado = (rotulo, valor) => { if (valor) dados.append(criar("dt", "", rotulo), criar("dd", "", valor)); };
    dado("Área", curso.area);
    dado("Modalidade", curso.modalidade);
    dado("Carga horária", curso.carga_horaria);
    item.append(dados, seloCertificado(curso.certificado));
    item.append(linkExterno(curso.url, "Acessar curso", ` ${curso.nome}${plataforma ? ` na ${plataforma.nome}` : ""}`));
    return item;
  }

  // Trilhas: cada etapa aponta para cursos do catálogo ou para uma página do site.
  function criarTrilhas(trilhas) {
    const porId = new Map(cursos.map((curso) => [curso.id, curso]));
    el.trilhas.replaceChildren(...trilhas.map((trilha) => {
      const bloco = criar("article", "trilha card");
      bloco.append(criar("h3", "", trilha.nome));
      const etapas = criar("ol", "etapas-trilha");
      for (const etapa of trilha.etapas) {
        const item = criar("li", "etapa-trilha");
        item.append(criar("span", "titulo-etapa", etapa.titulo));
        const destinos = criar("ul", "destinos-etapa");
        for (const id of etapa.cursos || []) {
          const curso = porId.get(id);
          if (!curso) continue; // só conteúdos que existem no catálogo
          const li = criar("li");
          li.append(linkExterno(curso.url, curso.nome, ` (${plataformas.get(curso.plataforma)?.nome || ""})`));
          destinos.append(li);
        }
        if (etapa.pagina && /^[a-z0-9-]+\.html(#[a-z0-9-]+)?$/i.test(etapa.pagina.url)) {
          const li = criar("li");
          const a = criar("a", "", etapa.pagina.rotulo);
          a.href = etapa.pagina.url;
          li.append(a, " (no site)");
          destinos.append(li);
        }
        item.append(destinos);
        etapas.append(item);
      }
      bloco.append(etapas);
      return bloco;
    }));
  }

  function preencherSelect(select, valores) {
    for (const [valor, rotulo] of valores) {
      const opcao = criar("option", "", rotulo);
      opcao.value = valor;
      select.append(opcao);
    }
  }

  function aplicarFiltros() {
    const area = el.area.value;
    const plataforma = el.plataforma.value;
    const certificado = el.certificado.value;
    const visiveis = cursos.filter((c) => (!area || c.area === area) && (!plataforma || c.plataforma === plataforma) && (!certificado || c.certificado === certificado));
    el.lista.replaceChildren(...visiveis.map(criarCartao));
    el.contador.textContent = visiveis.length === cursos.length
      ? `${cursos.length} cursos no catálogo.`
      : visiveis.length ? `Mostrando ${visiveis.length} de ${cursos.length} cursos.` : "Nenhum curso com esses filtros.";
  }

  async function carregar() {
    try {
      const resposta = await fetch("data/cursos.json");
      if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
      const dados = await resposta.json();
      if (!Array.isArray(dados.cursos) || !Array.isArray(dados.plataformas)) throw new TypeError("Formato inesperado.");
      plataformas = new Map(dados.plataformas.map((p) => [p.id, p]));
      cursos = dados.cursos.filter((c) => c && c.id && c.nome && plataformas.has(c.plataforma));

      // Plataformas com a observação sobre certificados.
      el.plataformas.replaceChildren(...dados.plataformas.map((p) => {
        const li = criar("li");
        li.append(linkExterno(p.url, p.nome), criar("p", "observacao-plataforma", p.observacao));
        return li;
      }));

      const areas = [...new Set(cursos.map((c) => c.area))].sort((a, b) => a.localeCompare(b, "pt-BR"));
      preencherSelect(el.area, areas.map((a) => [a, a]));
      preencherSelect(el.plataforma, dados.plataformas.filter((p) => cursos.some((c) => c.plataforma === p.id)).map((p) => [p.id, p.nome]));
      preencherSelect(el.certificado, Object.entries(CERTIFICADOS).filter(([tipo]) => cursos.some((c) => c.certificado === tipo)));

      if (dados.verificado_em) {
        const data = new Date(`${dados.verificado_em}T12:00:00`);
        el.verificacao.textContent = `Informações conferidas nas páginas oficiais em ${data.toLocaleDateString("pt-BR")}. As condições podem mudar: confirme na plataforma antes de se inscrever.`;
      }
      criarTrilhas(Array.isArray(dados.trilhas) ? dados.trilhas : []);
      aplicarFiltros();
      el.estado.hidden = true;
      el.legenda.hidden = false;
      el.secaoTrilhas.hidden = false;
      el.secaoCatalogo.hidden = false;
    } catch (erro) {
      console.error("[Cursos] Falha ao carregar cursos:", erro);
      el.estado.hidden = true;
      el.erro.hidden = false;
    }
  }

  [el.area, el.plataforma, el.certificado].forEach((select) => select.addEventListener("change", aplicarFiltros));
  el.formulario.addEventListener("submit", (evento) => evento.preventDefault());
  el.limpar.addEventListener("click", () => {
    el.formulario.reset();
    aplicarFiltros();
  });
  carregar();
})();
