// Ativa verificações do JavaScript para ajudar a detectar erros de programação.
"use strict";

// =============================================================================
// Escolha do modelo, personalização, prévia em tempo real e "Salvar em PDF"
// do Criador de Currículo (curriculo.html).
//
// Partes (cada uma em seu arquivo):
//   dados e validação   → CriadorCurriculo (curriculo-formulario.js) + CurriculoModelo
//   montagem da folha   → CurriculoDocumento (curriculo-documento.js): MODELOS, CORES, FONTES
//   escolha, prévia, PDF → este arquivo
//
// Estado visual (separado dos dados): { modelo, cor, fonte }. Trocar o modelo, a cor
// ou a fonte nunca altera o conteúdo; cor e fonte vazias = padrão do modelo.
// O PDF é feito pela janela de impressão do navegador (window.print()): não há
// download automático, envio, cadastro nem acesso à internet.
// =============================================================================
(() => {
  const criador = window.CriadorCurriculo;
  const Documento = window.CurriculoDocumento;
  const M = window.CurriculoModelo;
  const el = {
    escolha: document.getElementById("escolha-modelo"),
    listaModelos: document.getElementById("lista-modelos"),
    visualizar: document.getElementById("visualizar-curriculo"),
    caixaVisualizar: document.getElementById("caixa-previa"),
    secao: document.getElementById("previa"),
    titulo: document.getElementById("titulo-previa"),
    estado: document.getElementById("estado-previa"),
    documento: document.getElementById("previa-documento"),
    escala: document.getElementById("previa-escala"),
    pendencias: document.getElementById("pendencias-previa"),
    textoPendencias: document.getElementById("texto-pendencias"),
    revisar: document.getElementById("revisar-erros"),
    pdf: document.getElementById("salvar-pdf"),
    atualizar: document.getElementById("atualizar-previa"),
    editar: document.getElementById("voltar-editar"),
    aviso: document.getElementById("aviso-previa"),
    tituloPersonalizar: document.getElementById("titulo-personalizar"),
    modeloAtual: document.getElementById("modelo-atual"),
    controles: document.getElementById("controles-personalizar"),
    cores: document.getElementById("opcoes-cores"),
    fonte: document.getElementById("fonte-curriculo"),
    avisoAts: document.getElementById("aviso-ats")
  };
  if (!criador || !Documento || !el.secao) return;

  // Estado visual do currículo (os dados ficam no formulário).
  const estado = { modelo: "visual", cor: "", fonte: "" };
  const definicao = () => Documento.MODELOS.find((m) => m.id === estado.modelo);
  const opcoesDocumento = (nivel) => ({ nivel, modelo: estado.modelo, cor: estado.cor, fonte: estado.fonte });

  let preparando = false;
  let tituloDaPagina = document.title;

  function anunciar(mensagem) {
    el.aviso.textContent = "";
    setTimeout(() => { el.aviso.textContent = mensagem; }, 50);
  }

  function horaAtual() {
    return new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }

  // ---------------------------------------------------------------------------
  // Escala: a folha tem sempre a largura A4 (210 mm) e é reduzida para caber.
  // ---------------------------------------------------------------------------
  function encaixar(caixa, escala) {
    const folha = escala.firstElementChild;
    if (!folha || !caixa.clientWidth) return;
    const fator = Math.min(1, caixa.clientWidth / folha.offsetWidth);
    escala.style.transform = `scale(${fator})`;
    caixa.style.height = `${Math.ceil(folha.offsetHeight * fator)}px`;
  }

  function encaixarTudo() {
    encaixar(el.documento, el.escala);
    el.listaModelos.querySelectorAll(".miniatura").forEach((caixa) => {
      const escala = caixa.firstElementChild;
      const folha = escala?.firstElementChild;
      if (!folha || !caixa.clientWidth) return;
      // Miniatura: só a primeira página (proporção A4), reduzida para a largura do cartão.
      const fator = caixa.clientWidth / folha.offsetWidth;
      escala.style.transform = `scale(${fator})`;
      caixa.style.height = `${Math.round(folha.offsetWidth * fator * 297 / 210)}px`;
    });
  }

  // ---------------------------------------------------------------------------
  // Miniaturas: o mesmo renderizador da prévia, com os dados da pessoa; antes de o
  // nome ser preenchido, com um exemplo genérico (sem dados de estudantes reais).
  // ---------------------------------------------------------------------------
  const EXEMPLO = {
    nome: "Seu Nome Completo",
    contato: { email: "seunome@email.com", cidade: "Sua cidade, UF", github: "github.com/seu-usuario" },
    objetivo: { areas: "Sua área de interesse", tipos_oportunidade: ["Estágio", "Jovem aprendiz"], texto: "Seu objetivo profissional em uma ou duas frases.", resumo: "Uma apresentação curta sobre você." },
    formacao: [{ curso: "Seu curso", instituicao: "Sua escola", periodo: "2025 – 2027", situacao: "Cursando" }],
    habilidades: { tecnicas: ["Habilidade 1", "Habilidade 2", "Habilidade 3"], comportamentais: ["Habilidade 4", "Habilidade 5"] },
    projetos: [{ nome: "Nome do projeto", descricao: "Descrição curta do projeto.", tecnologias: "Tecnologias usadas" }],
    cursos: [{ nome: "Nome do curso", instituicao: "Instituição", ano: "2025", carga_horaria: "20 horas" }],
    voluntariado: [{ instituicao: "Instituição", atividade: "Atividade voluntária", periodo: "2025" }]
  };

  function dadosDasMiniaturas() {
    const curriculo = criador.obterCurriculo();
    return curriculo.nome ? curriculo : M.normalizarCurriculo(EXEMPLO);
  }

  function criarCartoes() {
    el.listaModelos.replaceChildren(...Documento.MODELOS.map((modelo) => {
      const item = document.createElement("li");
      item.className = "cartao-modelo";
      item.dataset.modelo = modelo.id;

      // Miniatura decorativa (o nome e a descrição estão em texto logo abaixo).
      const miniatura = document.createElement("div");
      miniatura.className = "miniatura";
      miniatura.setAttribute("aria-hidden", "true");
      miniatura.inert = true;
      const escala = document.createElement("div");
      escala.className = "miniatura-escala";
      miniatura.append(escala);

      const titulo = document.createElement("h3");
      titulo.textContent = modelo.nome;
      const descricao = document.createElement("p");
      descricao.className = "descricao-modelo";
      descricao.textContent = modelo.descricao;
      const publico = document.createElement("p");
      publico.className = "publico-modelo";
      const rotulo = document.createElement("strong");
      rotulo.textContent = "Indicado para: ";
      publico.append(rotulo, modelo.publico);

      const acoes = document.createElement("div");
      acoes.className = "acoes-modelo";
      const ver = document.createElement("button");
      ver.type = "button";
      ver.className = "botao botao-secundario";
      ver.dataset.visualizar = modelo.id;
      ver.textContent = "Visualizar";
      const oculto = document.createElement("span");
      oculto.className = "visualmente-oculto";
      oculto.textContent = ` o modelo ${modelo.nome}`;
      ver.append(oculto);
      const escolher = document.createElement("button");
      escolher.type = "button";
      escolher.className = "botao";
      escolher.dataset.escolher = modelo.id;
      acoes.append(ver, escolher);

      item.append(miniatura, titulo, descricao, publico, acoes);
      return item;
    }));
    atualizarCartoes();
  }

  // Redesenha as miniaturas e marca o modelo escolhido.
  function atualizarCartoes() {
    const dados = dadosDasMiniaturas();
    el.listaModelos.querySelectorAll(".cartao-modelo").forEach((cartao) => {
      const id = cartao.dataset.modelo;
      const escolhido = id === estado.modelo;
      // A miniatura do modelo escolhido mostra a cor e a fonte escolhidas; as outras, os padrões.
      const opcoes = escolhido ? { nivel: 4, modelo: id, cor: estado.cor, fonte: estado.fonte } : { nivel: 4, modelo: id };
      cartao.querySelector(".miniatura-escala").replaceChildren(Documento.criar(dados, opcoes));
      cartao.classList.toggle("cartao-modelo--escolhido", escolhido);
      const botao = cartao.querySelector("[data-escolher]");
      botao.setAttribute("aria-pressed", String(escolhido));
      botao.textContent = escolhido ? "✓ Modelo escolhido" : "Escolher este modelo";
    });
    requestAnimationFrame(encaixarTudo);
  }

  // ---------------------------------------------------------------------------
  // Personalização (cores e fontes de listas fixas)
  // ---------------------------------------------------------------------------
  function criarControles() {
    el.cores.replaceChildren(...Documento.CORES.map((cor) => {
      const rotulo = document.createElement("label");
      rotulo.className = "opcao-cor";
      const entrada = document.createElement("input");
      entrada.type = "radio";
      entrada.name = "cor-curriculo";
      entrada.value = cor.valor;
      const amostra = document.createElement("span");
      amostra.className = "amostra-cor";
      amostra.setAttribute("aria-hidden", "true");
      amostra.style.setProperty("--amostra", cor.valor);
      const nome = document.createElement("span");
      nome.textContent = cor.nome;
      rotulo.append(entrada, amostra, nome);
      return rotulo;
    }));
    el.fonte.replaceChildren(...Documento.FONTES.map((fonte) => {
      const opcao = document.createElement("option");
      opcao.value = fonte.id;
      opcao.textContent = fonte.nome;
      return opcao;
    }));
  }

  // Mostra no painel a cor e a fonte em uso (as escolhidas ou as do modelo).
  function atualizarControles() {
    const modelo = definicao();
    el.modeloAtual.textContent = `Modelo: ${modelo.nome}`;
    el.controles.hidden = !modelo.personalizavel;
    el.avisoAts.hidden = modelo.personalizavel;
    if (!modelo.personalizavel) return;
    const cor = estado.cor || modelo.cor;
    el.cores.querySelectorAll("input").forEach((entrada) => { entrada.checked = entrada.value === cor; });
    el.fonte.value = estado.fonte || modelo.fonte;
  }

  // ---------------------------------------------------------------------------
  // Prévia
  // ---------------------------------------------------------------------------
  function atualizarPrevia() {
    el.escala.replaceChildren(Documento.criar(criador.obterCurriculo(), opcoesDocumento(3)));
    const erros = criador.validar();
    el.pendencias.hidden = erros.length === 0;
    el.textoPendencias.textContent = erros.length === 1
      ? "1 campo precisa de revisão antes de salvar o PDF."
      : `${erros.length} campos precisam de revisão antes de salvar o PDF.`;
    el.estado.textContent = `Atualizada às ${horaAtual()}. Mudanças no formulário e no visual aparecem aqui automaticamente.`;
    requestAnimationFrame(encaixarTudo);
    return erros;
  }

  // Leva a pessoa até a prévia (botões "Visualizar" e "Ir para a prévia").
  function irParaPrevia() {
    el.titulo.scrollIntoView({ block: "start" });
    el.titulo.focus({ preventScroll: true });
  }

  function escolherModelo(id, { focar = "" } = {}) {
    const modelo = Documento.MODELOS.find((m) => m.id === id);
    if (!modelo) return;
    if (estado.modelo !== id) {
      estado.modelo = id;
      // Cor e fonte voltam ao padrão do novo modelo (cada modelo tem sua identidade).
      estado.cor = "";
      estado.fonte = "";
    }
    atualizarControles();
    atualizarPrevia();
    atualizarCartoes();
    anunciar(`Modelo ${modelo.nome} aplicado à prévia.`);
    if (focar === "previa") irParaPrevia();
    if (focar === "personalizar") {
      el.tituloPersonalizar.scrollIntoView({ block: "start" });
      el.tituloPersonalizar.focus({ preventScroll: true });
    }
  }

  // Com erros, mostra-os no formulário; sem erros, volta ao índice das seções.
  function voltarParaEditar() {
    if (criador.validar().length) {
      criador.mostrarErros();
      return;
    }
    const indice = document.getElementById("titulo-secoes");
    indice.tabIndex = -1;
    indice.scrollIntoView({ block: "start" });
    indice.focus({ preventScroll: true });
  }

  // ---------------------------------------------------------------------------
  // Impressão
  // ---------------------------------------------------------------------------

  // Contêiner fora do <main>, filho direto do <body>: na impressão só ele aparece
  // (regras em css/curriculo-documento.css). Na tela fica sempre oculto.
  function areaDeImpressao() {
    let area = document.getElementById("area-impressao");
    if (!area) {
      area = document.createElement("div");
      area.id = "area-impressao";
      document.body.append(area);
    }
    return area;
  }

  function montarVersaoImprimivel(curriculo) {
    areaDeImpressao().replaceChildren(Documento.criar(curriculo, opcoesDocumento(1)));
    // O título da aba vira o nome sugerido do arquivo PDF (o original é guardado uma vez).
    if (!document.body.classList.contains("imprimindo-curriculo")) tituloDaPagina = document.title;
    document.body.classList.add("imprimindo-curriculo");
    document.title = `Currículo - ${curriculo.nome}`;
  }

  function desfazerVersaoImprimivel() {
    if (!document.body.classList.contains("imprimindo-curriculo")) return;
    document.body.classList.remove("imprimindo-curriculo");
    areaDeImpressao().replaceChildren();
    document.title = tituloDaPagina;
  }

  // Espera a foto e as fontes (ex.: Roboto) antes de imprimir, com limite de 3 segundos.
  function aguardarRecursos(raiz) {
    const imagens = [...raiz.querySelectorAll("img")].map((img) => (img.decode ? img.decode().catch(() => {}) : Promise.resolve()));
    const fontes = document.fonts ? document.fonts.ready : Promise.resolve();
    return Promise.race([Promise.all([...imagens, fontes]), new Promise((r) => setTimeout(r, 3000))]);
  }

  async function salvarPdf() {
    if (preparando) return;
    // 1. Campos obrigatórios: sem eles, nada de impressão; os erros aparecem no formulário.
    if (criador.validar().length) {
      atualizarPrevia();
      criador.mostrarErros();
      return;
    }
    preparando = true;
    try {
      // 2. Prévia atualizada.
      atualizarPrevia();
      // 3. Versão imprimível com os mesmos dados, modelo, cor e fonte.
      const curriculo = criador.obterCurriculo();
      montarVersaoImprimivel(curriculo);
      // 4. Foto e fontes carregadas antes de abrir a impressão.
      await aguardarRecursos(areaDeImpressao());
      // 5. Janela de impressão do navegador (a pessoa escolhe "Salvar como PDF").
      window.print();
    } finally {
      preparando = false;
    }
  }

  // Ctrl+P na página: imprime o currículo preenchido em vez do formulário.
  window.addEventListener("beforeprint", () => {
    if (document.body.classList.contains("imprimindo-curriculo")) return;
    const curriculo = criador.obterCurriculo();
    if (curriculo.nome) montarVersaoImprimivel(curriculo);
  });
  window.addEventListener("afterprint", desfazerVersaoImprimivel);

  // ---------------------------------------------------------------------------
  // Eventos e início
  // ---------------------------------------------------------------------------
  // O título do painel recebe o foco quando um modelo é escolhido.
  el.tituloPersonalizar.tabIndex = -1;
  criarControles();
  criarCartoes();
  atualizarControles();
  atualizarPrevia();
  el.escolha.hidden = false;
  el.caixaVisualizar.hidden = false;

  el.listaModelos.addEventListener("click", (evento) => {
    const ver = evento.target.closest("[data-visualizar]");
    if (ver) escolherModelo(ver.dataset.visualizar, { focar: "previa" });
    const escolher = evento.target.closest("[data-escolher]");
    if (escolher) escolherModelo(escolher.dataset.escolher, { focar: "personalizar" });
  });
  el.cores.addEventListener("change", (evento) => {
    estado.cor = evento.target.value;
    atualizarPrevia();
    atualizarCartoes();
    anunciar(`Cor ${evento.target.closest("label").textContent.trim()} aplicada.`);
  });
  el.fonte.addEventListener("change", () => {
    estado.fonte = el.fonte.value;
    atualizarPrevia();
    atualizarCartoes();
    anunciar(`Fonte ${el.fonte.selectedOptions[0].textContent} aplicada.`);
  });
  el.visualizar.addEventListener("click", () => {
    atualizarPrevia();
    irParaPrevia();
  });
  el.atualizar.addEventListener("click", () => {
    const erros = atualizarPrevia();
    anunciar(erros.length ? `Prévia atualizada. ${el.textoPendencias.textContent}` : "Prévia atualizada.");
  });
  el.editar.addEventListener("click", voltarParaEditar);
  el.revisar.addEventListener("click", () => criador.mostrarErros());
  el.pdf.addEventListener("click", salvarPdf);
  // Cada alteração do formulário atualiza a prévia e as miniaturas.
  criador.formulario.addEventListener("curriculo:alterado", () => {
    atualizarPrevia();
    atualizarCartoes();
  });
  // A escala acompanha a largura da tela (e a abertura do painel da Nina).
  if ("ResizeObserver" in window) new ResizeObserver(() => encaixarTudo()).observe(el.documento);
  window.addEventListener("resize", encaixarTudo);
  if (document.fonts) document.fonts.ready.then(encaixarTudo);

  // Para os próximos passos (ex.: ATS) e para testes.
  window.PreviaCurriculo = Object.freeze({
    atualizar: atualizarPrevia,
    salvarPdf,
    escolherModelo,
    estado: () => ({ ...estado })
  });
})();
