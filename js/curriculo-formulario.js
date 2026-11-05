// Ativa verificações do JavaScript para ajudar a detectar erros de programação.
"use strict";

// =============================================================================
// Interface do Criador de Currículo (curriculo.html).
// Regras, limites e conversões ficam em js/curriculo-modelo.js (carregado antes).
// Seções: 1) listas dinâmicas  2) habilidades (tags)  3) leitura e preenchimento
//         4) erros  5) foto  6) salvar progresso  7) exportar/importar
//         8) solicitar publicação  9) eventos e API.
// Nada é enviado nem guardado sem um clique explícito da pessoa.
// =============================================================================

(() => {
  const M = window.CurriculoModelo;
  const form = document.getElementById("form-curriculo");
  if (!M || !form) return;

  // Chave do progresso salvo (a chave "theme" do tema não é tocada).
  const CHAVE_RASCUNHO = "curriculo-cpm-rascunho";
  // Tamanho máximo do arquivo importado.
  const MAXIMO_IMPORTACAO = 1024 * 1024;

  const el = {
    resumo: document.getElementById("resumo-erros"),
    tituloResumo: document.getElementById("titulo-resumo-erros"),
    listaResumo: document.getElementById("lista-resumo-erros"),
    aviso: document.getElementById("aviso-formulario"),
    enviar: document.getElementById("enviar-curriculo"),
    estadoEnvio: document.getElementById("estado-envio"),
    autorizacao: document.getElementById("autorizacao"),
    foto: document.getElementById("foto"),
    previa: document.getElementById("previa-foto"),
    imagemPrevia: document.getElementById("imagem-previa"),
    infoFoto: document.getElementById("info-foto"),
    removerFoto: document.getElementById("remover-foto"),
    rascunhoEncontrado: document.getElementById("rascunho-encontrado"),
    dataRascunho: document.getElementById("data-rascunho"),
    restaurar: document.getElementById("restaurar-rascunho"),
    descartar: document.getElementById("descartar-rascunho"),
    guardar: document.getElementById("guardar-rascunho"),
    recuperar: document.getElementById("recuperar-rascunho"),
    apagar: document.getElementById("apagar-dados"),
    novo: document.getElementById("novo-curriculo"),
    estadoRascunho: document.getElementById("estado-rascunho"),
    exportar: document.getElementById("exportar-dados"),
    importar: document.getElementById("importar-dados"),
    arquivo: document.getElementById("arquivo-importar"),
    estadoArquivo: document.getElementById("estado-arquivo")
  };

  // Listas com itens que a pessoa adiciona e remove (todas opcionais, começam vazias).
  const LISTAS = {
    experiencias: { rotulo: "Experiência", final: "a" },
    projetos: { rotulo: "Projeto", final: "o" },
    voluntariado: { rotulo: "Trabalho voluntário", final: "o" },
    cursos: { rotulo: "Curso", final: "o" }
  };
  for (const [nome, lista] of Object.entries(LISTAS)) {
    lista.container = form.querySelector(`[data-lista="${nome}"]`);
    lista.modelo = document.getElementById(`modelo-${nome}`);
    lista.botao = form.querySelector(`[data-adicionar="${nome}"]`);
    lista.limite = form.querySelector(`[data-limite="${nome}"]`);
    lista.vazia = form.querySelector(`[data-vazia="${nome}"]`);
    lista.maximo = M.MAX_ITENS[nome];
  }
  // Caixas de erro fixas no HTML (erros da lista inteira, não de um campo).
  const CAIXAS_FIXAS = new Set(["erro-habilidades"]);

  let proximoId = 1;
  // Depois da primeira tentativa de envio, todos os erros passam a ser atualizados ao vivo.
  let tentouEnviar = false;
  // Foto escolhida: { url, nome, tipo, tamanho, largura, altura }. Só existe nesta aba.
  let foto = null;
  let temporizadorAlteracao = 0;
  let enviando = false;
  // Habilidades escolhidas (tags), na ordem em que foram adicionadas.
  const tags = { tecnicas: [], comportamentais: [] };
  const NOME_GRUPO = { tecnicas: "técnicas", comportamentais: "comportamentais" };

  // Mensagem curta para leitores de tela (adição, remoção, foto, rascunho).
  function anunciar(mensagem) {
    el.aviso.textContent = "";
    setTimeout(() => { el.aviso.textContent = mensagem; }, 50);
  }

  // Avisa outros scripts (a prévia) que os dados mudaram.
  function avisarAlteracao() {
    clearTimeout(temporizadorAlteracao);
    temporizadorAlteracao = setTimeout(() => form.dispatchEvent(new CustomEvent("curriculo:alterado")), 250);
  }

  // ---------------------------------------------------------------------------
  // 1. Listas dinâmicas (experiências, projetos, voluntariado e cursos)
  // ---------------------------------------------------------------------------

  // Dá IDs únicos ao item copiado do <template> e liga rótulos, dicas e contadores.
  function prepararItem(nomeLista, item) {
    const base = `${nomeLista}-${proximoId++}`;
    for (const controle of item.querySelectorAll("[data-campo]")) {
      const campo = controle.dataset.campo;
      controle.id = `${base}-${campo}`;
      const rotulo = item.querySelector(`label[data-para="${campo}"]`);
      if (rotulo) rotulo.htmlFor = controle.id;
      const descricoes = [];
      const dica = item.querySelector(`[data-dica="${campo}"]`);
      if (dica) {
        dica.id = `${controle.id}-dica`;
        descricoes.push(dica.id);
      }
      const contador = item.querySelector(`[data-contador-de="${campo}"]`);
      if (contador) {
        contador.id = `${controle.id}-contador`;
        descricoes.push(contador.id);
      }
      if (descricoes.length) controle.setAttribute("aria-describedby", descricoes.join(" "));
    }
  }

  // Renumera os itens e mostra ou esconde o botão de adicionar, o limite e o aviso de lista vazia.
  function atualizarLista(nomeLista) {
    const lista = LISTAS[nomeLista];
    const itens = [...lista.container.children];
    itens.forEach((item, i) => {
      item.querySelectorAll("[data-numero]").forEach((numero) => { numero.textContent = String(i + 1); });
    });
    const cheia = itens.length >= lista.maximo;
    lista.botao.hidden = cheia;
    lista.limite.hidden = !cheia;
    if (lista.vazia) lista.vazia.hidden = itens.length > 0;
  }

  // Cria um item; "dados" preenche os campos (rascunho ou arquivo importado).
  function adicionarItem(nomeLista, dados = {}, focar = false) {
    const lista = LISTAS[nomeLista];
    if (lista.container.children.length >= lista.maximo) return null;
    const item = lista.modelo.content.firstElementChild.cloneNode(true);
    prepararItem(nomeLista, item);
    for (const controle of item.querySelectorAll("[data-campo]")) {
      const valor = dados[controle.dataset.campo];
      if (typeof valor === "string") controle.value = valor;
    }
    lista.container.append(item);
    atualizarLista(nomeLista);
    item.querySelectorAll("textarea").forEach(atualizarContador);
    if (focar) {
      item.querySelector("[data-campo]").focus();
      anunciar(`${lista.rotulo} ${lista.container.children.length} adicionad${lista.final}.`);
      avisarAlteracao();
    }
    return item;
  }

  // Remove o item e leva o foco para o item seguinte, o anterior ou o botão de adicionar.
  function removerItem(item) {
    const nomeLista = item.parentElement.dataset.lista;
    const lista = LISTAS[nomeLista];
    const posicao = [...lista.container.children].indexOf(item);
    item.remove();
    atualizarLista(nomeLista);
    const vizinho = lista.container.children[posicao] || lista.container.children[posicao - 1];
    (vizinho ? vizinho.querySelector("[data-campo]") : lista.botao).focus();
    anunciar(`${lista.rotulo} ${posicao + 1} removid${lista.final}.`);
    if (tentouEnviar) exibirErros(M.validarCurriculo(lerFormulario()));
    avisarAlteracao();
  }

  function reiniciarLista(nomeLista, itens = []) {
    const lista = LISTAS[nomeLista];
    lista.container.replaceChildren();
    itens.slice(0, lista.maximo).forEach((dados) => adicionarItem(nomeLista, dados || {}));
    atualizarLista(nomeLista);
  }

  // ---------------------------------------------------------------------------
  // 2. Habilidades (tags)
  // ---------------------------------------------------------------------------

  const caixaTags = (grupo) => form.querySelector(`[data-tags="${grupo}"]`);
  const entradaTag = (grupo) => form.querySelector(`[data-tag-entrada="${grupo}"]`);

  // Botões de sugestão (alternância com aria-pressed), criados a partir do modelo.
  function criarSugestoes() {
    for (const grupo of Object.keys(tags)) {
      const caixa = form.querySelector(`[data-sugestoes="${grupo}"]`);
      caixa.replaceChildren(...M.SUGESTOES[grupo].map((valor) => {
        const botao = document.createElement("button");
        botao.type = "button";
        botao.className = "sugestao-tag";
        botao.dataset.sugestao = grupo;
        botao.dataset.valor = valor;
        botao.textContent = valor;
        botao.setAttribute("aria-pressed", "false");
        return botao;
      }));
    }
  }

  // Desenha as tags escolhidas e o estado das sugestões.
  function desenharTags(grupo) {
    caixaTags(grupo).replaceChildren(...tags[grupo].map((tag, indice) => {
      const item = document.createElement("li");
      item.className = "tag";
      const texto = document.createElement("span");
      texto.textContent = tag;
      const remover = document.createElement("button");
      remover.type = "button";
      remover.className = "remover-tag";
      remover.dataset.removerTag = grupo;
      remover.dataset.indice = String(indice);
      remover.setAttribute("aria-label", `Remover ${tag}`);
      remover.textContent = "×";
      item.append(texto, remover);
      return item;
    }));
    form.querySelectorAll(`[data-sugestao="${grupo}"]`).forEach((botao) => {
      botao.setAttribute("aria-pressed", String(tags[grupo].some((t) => M.chave(t) === M.chave(botao.dataset.valor))));
    });
  }

  // Acrescenta uma habilidade. Devolve "" ou a mensagem que explica por que não entrou.
  function adicionarTag(grupo, texto) {
    const limpo = String(texto).replace(/\s+/g, " ").trim();
    if (!limpo) return "Escreva a habilidade antes de adicionar.";
    if (limpo.length > M.LIMITES.habilidade) return `Use no máximo ${M.LIMITES.habilidade} caracteres.`;
    const k = M.chave(limpo);
    if (tags[grupo].some((t) => M.chave(t) === k)) return `"${limpo}" já está na lista.`;
    const outro = grupo === "tecnicas" ? "comportamentais" : "tecnicas";
    if (tags[outro].some((t) => M.chave(t) === k)) return `"${limpo}" já está em habilidades ${NOME_GRUPO[outro]}.`;
    if (tags[grupo].length >= M.MAX_ITENS.habilidades) return `Você chegou ao limite de ${M.MAX_ITENS.habilidades} habilidades ${NOME_GRUPO[grupo]}.`;
    tags[grupo].push(limpo);
    desenharTags(grupo);
    anunciar(`${limpo} adicionada às habilidades ${NOME_GRUPO[grupo]}.`);
    limparErro("habilidades");
    avisarAlteracao();
    return "";
  }

  function removerTag(grupo, indice, focar = true) {
    const [removida] = tags[grupo].splice(indice, 1);
    desenharTags(grupo);
    if (focar) {
      const botoes = caixaTags(grupo).querySelectorAll(".remover-tag");
      (botoes[indice] || botoes[indice - 1] || entradaTag(grupo)).focus();
    }
    anunciar(`${removida} removida.`);
    if (tentouEnviar) exibirErros(M.validarCurriculo(lerFormulario()));
    avisarAlteracao();
  }

  // Campo "Outra habilidade": adiciona e mostra o motivo, se não der.
  function adicionarDaEntrada(grupo) {
    const entrada = entradaTag(grupo);
    const mensagem = adicionarTag(grupo, entrada.value);
    if (mensagem) {
      mostrarErro(`habilidades.${grupo}`, mensagem);
      return;
    }
    limparErro(`habilidades.${grupo}`);
    entrada.value = "";
    entrada.focus();
  }

  // ---------------------------------------------------------------------------
  // 3. Leitura e preenchimento do formulário
  // ---------------------------------------------------------------------------

  // Caminho do dado de um controle, como "nome" ou "projetos.1.nome".
  function caminhoDe(controle) {
    const item = controle.closest(".item-lista");
    if (!item) return controle.dataset.campo;
    const container = item.parentElement;
    return `${container.dataset.lista}.${[...container.children].indexOf(item)}.${controle.dataset.campo}`;
  }

  function campoFixo(caminho) {
    return form.querySelector(`[data-campo="${caminho}"]`);
  }

  function lerLista(nomeLista) {
    return [...LISTAS[nomeLista].container.children].map((item) => {
      const dados = {};
      item.querySelectorAll("[data-campo]").forEach((controle) => { dados[controle.dataset.campo] = controle.value; });
      return dados;
    });
  }

  // Lê tudo o que foi digitado, sem alterar nada (formato "bruto" do modelo).
  function lerFormulario() {
    const valor = (caminho) => campoFixo(caminho)?.value ?? "";
    return {
      nome: valor("nome"),
      contato: {
        email: valor("contato.email"),
        cidade: valor("contato.cidade"),
        telefone: valor("contato.telefone"),
        linkedin: valor("contato.linkedin"),
        github: valor("contato.github"),
        portfolio: valor("contato.portfolio")
      },
      objetivo: {
        areas: valor("objetivo.areas"),
        tipos_oportunidade: [...form.querySelectorAll('[data-campo="objetivo.tipos_oportunidade"]:checked')].map((c) => c.value),
        texto: valor("objetivo.texto"),
        resumo: valor("objetivo.resumo")
      },
      formacao: [{
        curso: valor("formacao.0.curso"),
        instituicao: valor("formacao.0.instituicao"),
        periodo: valor("formacao.0.periodo"),
        situacao: valor("formacao.0.situacao")
      }],
      habilidades: { tecnicas: [...tags.tecnicas], comportamentais: [...tags.comportamentais] },
      experiencias: lerLista("experiencias"),
      projetos: lerLista("projetos"),
      voluntariado: lerLista("voluntariado"),
      cursos: lerLista("cursos"),
      foto: foto ? { ...foto } : null
    };
  }

  // Há algo preenchido? (para confirmar antes de substituir os dados)
  function temDados() {
    const bruto = { ...lerFormulario(), foto: null };
    return JSON.stringify(bruto).replace(/"[^"]*":/g, "").replace(/[\s"[\]{},:]/g, "").length > 0;
  }

  // Coloca dados no formulário (rascunho ou arquivo importado). Os dados passam
  // antes por CurriculoModelo.sanitizarDados(). A foto não é restaurada.
  function preencherFormulario(dadosOrigem = {}) {
    const dados = M.sanitizarDados(dadosOrigem);
    const definir = (caminho, valor) => { const c = campoFixo(caminho); if (c) c.value = valor; };
    definir("nome", dados.nome);
    for (const campo of ["email", "cidade", "telefone", "linkedin", "github", "portfolio"]) definir(`contato.${campo}`, dados.contato[campo]);
    definir("objetivo.areas", dados.objetivo.areas);
    form.querySelectorAll('[data-campo="objetivo.tipos_oportunidade"]').forEach((c) => { c.checked = dados.objetivo.tipos_oportunidade.includes(c.value); });
    definir("objetivo.texto", dados.objetivo.texto);
    definir("objetivo.resumo", dados.objetivo.resumo);
    for (const campo of ["curso", "instituicao", "periodo", "situacao"]) definir(`formacao.0.${campo}`, dados.formacao[0][campo]);
    for (const grupo of Object.keys(tags)) {
      tags[grupo] = M.semRepetir(dados.habilidades[grupo]).slice(0, M.MAX_ITENS.habilidades);
      desenharTags(grupo);
    }
    for (const nomeLista of Object.keys(LISTAS)) reiniciarLista(nomeLista, dados[nomeLista]);
    form.querySelectorAll("textarea").forEach(atualizarContador);
    avisarAlteracao();
  }

  // Volta o formulário ao estado inicial (não mexe no progresso salvo).
  function limparFormulario() {
    form.reset();
    for (const grupo of Object.keys(tags)) {
      tags[grupo] = [];
      desenharTags(grupo);
    }
    for (const nomeLista of Object.keys(LISTAS)) reiniciarLista(nomeLista);
    removerFoto(false);
    tentouEnviar = false;
    exibirErros([]);
    form.querySelectorAll("[data-alterado]").forEach((c) => { delete c.dataset.alterado; });
    form.querySelectorAll("textarea").forEach(atualizarContador);
    redefinirEnvio();
    avisarAlteracao();
  }

  // "120 de 400 caracteres" abaixo dos textos longos.
  function atualizarContador(textarea) {
    const contador = textarea.closest(".campo")?.querySelector(".contador-caracteres");
    if (!contador) return;
    const limite = M.limiteDe(caminhoDe(textarea));
    const quantidade = textarea.value.trim().length;
    contador.textContent = `${quantidade} de ${limite} caracteres`;
    contador.classList.toggle("excedido", quantidade > limite);
  }

  // ---------------------------------------------------------------------------
  // 4. Erros perto dos campos e resumo no topo
  // ---------------------------------------------------------------------------

  // Encontra o controle (ou grupo) correspondente ao caminho de um erro.
  function localizar(caminho) {
    if (caminho === "habilidades") {
      return { caixaFixa: "erro-habilidades", foco: form.querySelector("[data-sugestao]") };
    }
    const [nomeLista, indice, campo] = caminho.split(".");
    let controle;
    if (LISTAS[nomeLista] && campo) {
      controle = LISTAS[nomeLista].container.children[Number(indice)]?.querySelector(`[data-campo="${campo}"]`);
    } else if (nomeLista === "habilidades") {
      controle = entradaTag(indice);
    } else {
      controle = form.querySelector(`[data-campo-grupo="${caminho}"]`) || campoFixo(caminho);
    }
    if (!controle) return null;
    return { controle, foco: controle.matches("fieldset") ? controle.querySelector("input") : controle };
  }

  function idDoErro(controle) {
    return `${controle.id || controle.dataset.campoGrupo.replace(/\W/g, "-")}-erro`;
  }

  // Mostra a mensagem logo acima do campo e a liga ao campo por aria-describedby.
  function mostrarErro(caminho, mensagem) {
    const alvo = localizar(caminho);
    if (!alvo) return;
    if (alvo.caixaFixa) {
      const caixa = document.getElementById(alvo.caixaFixa);
      caixa.textContent = mensagem;
      caixa.hidden = false;
      return;
    }
    const { controle } = alvo;
    const campo = controle.matches(".campo") ? controle : controle.closest(".campo");
    const idErro = idDoErro(controle);
    let caixa = document.getElementById(idErro);
    if (!caixa) {
      caixa = document.createElement("p");
      caixa.className = "erro-campo";
      caixa.id = idErro;
      // Antes das opções (grupo), do rótulo que envolve a caixa (autorização), da linha da tag ou do próprio campo.
      (campo.querySelector(":scope > .opcoes") || controle.closest("label.opcao") || controle.closest(".linha-tag") || controle).before(caixa);
    }
    caixa.replaceChildren();
    const prefixo = document.createElement("span");
    prefixo.className = "visualmente-oculto";
    prefixo.textContent = "Erro: ";
    caixa.append(prefixo, mensagem);

    // Guarda a descrição original (dicas) para restaurá-la quando o erro sumir.
    if (controle.dataset.descricao === undefined) controle.dataset.descricao = controle.getAttribute("aria-describedby") || "";
    controle.setAttribute("aria-describedby", [idErro, controle.dataset.descricao].filter(Boolean).join(" "));
    const marcados = controle.matches("fieldset") ? controle.querySelectorAll("input") : [controle];
    marcados.forEach((c) => c.setAttribute("aria-invalid", "true"));
  }

  function limparErro(caminho) {
    const alvo = localizar(caminho);
    if (!alvo) return;
    if (alvo.caixaFixa) {
      document.getElementById(alvo.caixaFixa).hidden = true;
      return;
    }
    limparErroDoControle(alvo.controle);
  }

  function limparErroDoControle(controle) {
    document.getElementById(idDoErro(controle))?.remove();
    if (controle.dataset.descricao !== undefined) {
      if (controle.dataset.descricao) controle.setAttribute("aria-describedby", controle.dataset.descricao);
      else controle.removeAttribute("aria-describedby");
      delete controle.dataset.descricao;
    }
    const marcados = controle.matches("fieldset") ? controle.querySelectorAll("input") : [controle];
    marcados.forEach((c) => c.removeAttribute("aria-invalid"));
  }

  // Marca no índice as seções que têm erros ("Revisar").
  function atualizarSelos(erros) {
    const secoesComErro = new Set(erros.map((e) => localizar(e.campo)?.foco?.closest(".secao-form")?.id).filter(Boolean));
    document.querySelectorAll("[data-selo]").forEach((selo) => {
      if (!selo.dataset.original) selo.dataset.original = selo.textContent;
      const comErro = secoesComErro.has(selo.dataset.selo);
      selo.textContent = comErro ? "Revisar" : selo.dataset.original;
      selo.classList.toggle("selo-erro", comErro);
    });
  }

  // Redesenha todos os erros. Com "focarResumo", leva o foco para o resumo no topo.
  function exibirErros(erros, focarResumo = false) {
    form.querySelectorAll("[aria-invalid], [data-campo-grupo][data-descricao]").forEach((c) => {
      limparErroDoControle(c.closest("[data-campo-grupo]") || c);
    });
    form.querySelectorAll(".erro-campo").forEach((caixa) => {
      if (CAIXAS_FIXAS.has(caixa.id)) caixa.hidden = true;
      else caixa.remove();
    });
    // Um erro por campo: o primeiro encontrado é o mais importante.
    const vistos = new Set();
    const unicos = erros.filter((e) => !vistos.has(e.campo) && vistos.add(e.campo));
    unicos.forEach((e) => mostrarErro(e.campo, e.mensagem));
    atualizarSelos(unicos);

    el.resumo.hidden = unicos.length === 0;
    el.tituloResumo.textContent = unicos.length === 1
      ? "Revise 1 campo antes de enviar"
      : `Revise ${unicos.length} campos antes de enviar`;
    el.listaResumo.replaceChildren(...unicos.map((e) => {
      const item = document.createElement("li");
      const link = document.createElement("a");
      const foco = localizar(e.campo)?.foco;
      link.href = foco?.id ? `#${foco.id}` : "#formulario";
      link.textContent = e.mensagem;
      link.addEventListener("click", (evento) => {
        const destino = localizar(e.campo)?.foco;
        if (!destino) return;
        evento.preventDefault();
        destino.scrollIntoView({ block: "center" });
        destino.focus({ preventScroll: true });
      });
      item.append(link);
      return item;
    }));
    if (focarResumo && unicos.length) el.resumo.focus();
  }

  // Revalida um campo depois de editado. Antes da primeira tentativa de envio,
  // só mexe no próprio campo; depois dela, atualiza todos os erros.
  function revalidar(controle) {
    if (controle.type === "file") return;
    const caminho = caminhoDe(controle);
    if (caminho === "autorizacao") {
      if (controle.checked) limparErro("autorizacao");
      return;
    }
    const erros = M.validarCurriculo(lerFormulario());
    if (tentouEnviar) {
      exibirErros(erros);
      return;
    }
    const erro = erros.find((e) => e.campo === caminho);
    if (erro) mostrarErro(caminho, erro.mensagem);
    else limparErro(caminho);
  }

  // ---------------------------------------------------------------------------
  // 5. Fotografia (prévia local; nunca enviada, salva ou exportada)
  // ---------------------------------------------------------------------------

  // Lê largura e altura da imagem; falha se o arquivo não for uma imagem válida.
  function medirImagem(url) {
    return new Promise((resolver, rejeitar) => {
      const imagem = new Image();
      imagem.onload = () => resolver({ largura: imagem.naturalWidth, altura: imagem.naturalHeight });
      imagem.onerror = rejeitar;
      imagem.src = url;
    });
  }

  function removerFoto(focar = true) {
    if (foto) URL.revokeObjectURL(foto.url);
    foto = null;
    el.foto.value = "";
    el.imagemPrevia.removeAttribute("src");
    el.previa.hidden = true;
    limparErroDoControle(el.foto);
    if (focar) {
      el.foto.focus();
      anunciar("Foto removida.");
      avisarAlteracao();
    }
  }

  async function escolherFoto() {
    const arquivo = el.foto.files[0];
    if (foto) URL.revokeObjectURL(foto.url);
    foto = null;
    el.previa.hidden = true;
    limparErroDoControle(el.foto);
    if (!arquivo) return;

    const dados = { nome: arquivo.name, tipo: arquivo.type, tamanho: arquivo.size, largura: 0, altura: 0 };
    // Primeiro confere tipo e tamanho (sem abrir o arquivo); as medidas vêm depois.
    let mensagem = M.validarFoto({ ...dados, largura: M.FOTO.ladoMinimo, altura: M.FOTO.ladoMinimo });
    let url = "";
    if (!mensagem) {
      url = URL.createObjectURL(arquivo);
      try {
        Object.assign(dados, await medirImagem(url));
      } catch {
        // Mantém largura 0: validarFoto() informa que a imagem não pôde ser aberta.
      }
      mensagem = M.validarFoto(dados);
    }
    if (mensagem) {
      if (url) URL.revokeObjectURL(url);
      el.foto.value = "";
      mostrarErro("foto", mensagem);
      return;
    }
    foto = { ...dados, url };
    el.imagemPrevia.src = url;
    el.infoFoto.textContent = `${dados.nome} — ${M.formatarTamanho(dados.tamanho)}, ${dados.largura} × ${dados.altura} px`;
    el.previa.hidden = false;
    anunciar("Foto escolhida. A prévia aparece abaixo do campo.");
    avisarAlteracao();
  }

  // ---------------------------------------------------------------------------
  // 6. Salvar progresso neste dispositivo (só com clique; explicado na página)
  // ---------------------------------------------------------------------------

  // O armazenamento pode estar bloqueado; nesse caso, o rascunho só não fica disponível.
  function lerRascunho() {
    try {
      const salvo = JSON.parse(localStorage.getItem(CHAVE_RASCUNHO) || "null");
      return salvo && salvo.dados ? salvo : null;
    } catch {
      return null;
    }
  }

  function apagarRascunho() {
    try {
      localStorage.removeItem(CHAVE_RASCUNHO);
    } catch {
      // Sem acesso ao armazenamento, também não há rascunho guardado.
    }
  }

  function dataHora(iso) {
    const data = new Date(iso);
    return Number.isNaN(data.getTime()) ? "" : data.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  }

  function guardarRascunho() {
    // A foto nunca entra no progresso salvo.
    const dados = { ...lerFormulario(), foto: null };
    try {
      localStorage.setItem(CHAVE_RASCUNHO, JSON.stringify({ esquema: M.ESQUEMA, versao: M.VERSAO, salvoEm: new Date().toISOString(), dados }));
      el.estadoRascunho.textContent = `Progresso salvo em ${dataHora(new Date().toISOString())}. Ele só é atualizado quando você clicar em "Salvar progresso" de novo. Use "Apagar dados salvos" ao terminar.`;
    } catch {
      el.estadoRascunho.textContent = "Não foi possível salvar: este navegador bloqueou o armazenamento.";
    }
  }

  // Recupera o progresso salvo (confirma antes de substituir o que está na tela).
  function recuperarRascunho(focarNome = true) {
    const salvo = lerRascunho();
    if (!salvo) {
      el.estadoRascunho.textContent = "Não há progresso salvo neste dispositivo.";
      return;
    }
    if (temDados() && !window.confirm("Substituir o que está no formulário pelo progresso salvo?")) return;
    try {
      preencherFormulario(salvo.dados);
    } catch {
      el.estadoRascunho.textContent = "O progresso salvo está danificado e não pôde ser recuperado.";
      return;
    }
    el.rascunhoEncontrado.hidden = true;
    el.estadoRascunho.textContent = "Rascunho recuperado. A foto, se houver, precisa ser escolhida de novo.";
    if (focarNome) campoFixo("nome").focus();
    anunciar("Rascunho recuperado.");
  }

  function apagarDadosSalvos() {
    if (!lerRascunho()) {
      el.estadoRascunho.textContent = "Não há dados salvos neste dispositivo.";
      return;
    }
    if (!window.confirm("Apagar o progresso salvo neste navegador? O que está no formulário continua na tela.")) return;
    apagarRascunho();
    el.rascunhoEncontrado.hidden = true;
    el.estadoRascunho.textContent = "Dados salvos apagados deste dispositivo.";
  }

  function comecarNovo() {
    if (temDados() && !window.confirm("Começar um novo currículo? Tudo o que está no formulário será limpo. O progresso salvo, se houver, não é apagado.")) return;
    limparFormulario();
    el.estadoRascunho.textContent = "Formulário limpo. Você pode começar um novo currículo.";
    campoFixo("nome").focus();
  }

  // ---------------------------------------------------------------------------
  // 7. Exportar e importar dados (arquivo JSON, sem a foto)
  // ---------------------------------------------------------------------------

  function nomeDoArquivo() {
    const base = normalizarTexto(lerFormulario().nome).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    return `curriculo-${base || "rascunho"}.json`;
  }

  function exportarDados() {
    const texto = M.criarArquivoExportado(lerFormulario());
    const url = URL.createObjectURL(new Blob([texto], { type: "application/json;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = nomeDoArquivo();
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    el.estadoArquivo.textContent = `Arquivo "${link.download}" criado. Ele contém seus dados pessoais: guarde com cuidado.`;
  }

  // Lê o arquivo escolhido. Se algo falhar, o formulário continua como estava.
  async function importarArquivo() {
    const arquivo = el.arquivo.files[0];
    el.arquivo.value = "";
    if (!arquivo) return;
    try {
      if (arquivo.size > MAXIMO_IMPORTACAO) throw new Error("O arquivo tem mais de 1 MB e não parece ser um currículo exportado.");
      const dados = M.lerArquivoExportado(await arquivo.text());
      if (temDados() && !window.confirm("Substituir o que está no formulário pelos dados do arquivo?")) {
        el.estadoArquivo.textContent = "Importação cancelada. Nada foi alterado.";
        return;
      }
      preencherFormulario(dados);
      tentouEnviar = false;
      exibirErros([]);
      el.estadoArquivo.textContent = `Dados importados de "${arquivo.name}". Confira as informações; a foto precisa ser escolhida de novo.`;
      campoFixo("nome").focus();
    } catch (erro) {
      el.estadoArquivo.textContent = `Não foi possível importar: ${erro.message} Seus dados atuais foram mantidos.`;
    }
  }

  // ---------------------------------------------------------------------------
  // 8. Solicitar publicação (Formspree, só com autorização marcada)
  // ---------------------------------------------------------------------------

  const TEXTO_BOTAO_ENVIO = "Solicitar publicação";

  function mostrarEstadoEnvio(mensagem, tipo = "") {
    el.estadoEnvio.textContent = mensagem;
    el.estadoEnvio.className = `estado-envio${tipo ? ` estado-envio--${tipo}` : ""}`;
  }

  function redefinirEnvio() {
    enviando = false;
    el.enviar.disabled = false;
    el.enviar.textContent = TEXTO_BOTAO_ENVIO;
    mostrarEstadoEnvio("");
  }

  async function solicitarPublicacao(evento) {
    // O envio é feito pelo JavaScript (fetch): o navegador não troca de página.
    evento.preventDefault();
    if (enviando || (evento.submitter && evento.submitter !== el.enviar)) return;
    tentouEnviar = true;
    const bruto = lerFormulario();
    const erros = M.validarCurriculo(bruto);
    if (!el.autorizacao.checked) erros.push({ campo: "autorizacao", mensagem: "Para enviar, leia as informações e marque a autorização." });
    if (erros.length) {
      exibirErros(erros, true);
      mostrarEstadoEnvio("");
      return;
    }
    exibirErros([]);
    // Preenche os campos com os valores normalizados e envia o formulário inteiro.
    const dados = M.paraFormspree(M.normalizarCurriculo(bruto));
    for (const [nome, valor] of Object.entries(dados)) {
      const campo = form.elements.namedItem(nome);
      if (campo) campo.value = valor;
      else console.warn(`[Criar Currículo] Campo "${nome}" não existe no formulário.`);
    }
    enviando = true;
    el.enviar.disabled = true;
    el.enviar.textContent = "Enviando…";
    mostrarEstadoEnvio("Enviando sua solicitação…");
    el.estadoEnvio.focus();
    try {
      const resposta = await fetch(form.action, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } });
      if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
      // Sucesso: o botão continua desativado para evitar envios repetidos.
      el.enviar.textContent = "Solicitação enviada";
      mostrarEstadoEnvio("Recebemos sua solicitação! Nossa equipe analisará as informações antes de incluir seu currículo no catálogo.", "sucesso");
      enviando = false;
    } catch (erro) {
      console.warn("[Criar Currículo] Falha no envio:", erro);
      enviando = false;
      el.enviar.disabled = false;
      el.enviar.textContent = "Tentar novamente";
      mostrarEstadoEnvio("Não foi possível enviar agora. Verifique a conexão e tente novamente. Seus dados continuam no formulário.", "erro");
    }
  }

  // ---------------------------------------------------------------------------
  // 9. Eventos e inicialização
  // ---------------------------------------------------------------------------

  // A validação é feita pelo JavaScript; sem ele, o navegador ainda usa "required".
  form.noValidate = true;

  // Dá IDs às caixas de oportunidade para os links do resumo de erros.
  form.querySelectorAll('[data-campo="objetivo.tipos_oportunidade"]').forEach((caixa, i) => { caixa.id = `oportunidade-${i + 1}`; });

  criarSugestoes();
  for (const grupo of Object.keys(tags)) desenharTags(grupo);
  for (const nomeLista of Object.keys(LISTAS)) reiniciarLista(nomeLista);
  form.querySelectorAll("textarea").forEach(atualizarContador);

  // Cliques: adicionar/remover itens, sugestões e remoção de tags (delegação).
  form.addEventListener("click", (evento) => {
    const alvo = evento.target;
    const adicionar = alvo.closest("[data-adicionar]");
    if (adicionar) adicionarItem(adicionar.dataset.adicionar, {}, true);
    const remover = alvo.closest('[data-acao="remover"]');
    if (remover) removerItem(remover.closest(".item-lista"));
    const sugestao = alvo.closest("[data-sugestao]");
    if (sugestao) {
      const grupo = sugestao.dataset.sugestao;
      const indice = tags[grupo].findIndex((t) => M.chave(t) === M.chave(sugestao.dataset.valor));
      if (indice >= 0) removerTag(grupo, indice, false);
      else {
        const mensagem = adicionarTag(grupo, sugestao.dataset.valor);
        if (mensagem) mostrarErro(`habilidades.${grupo}`, mensagem);
      }
    }
    const removerTagBotao = alvo.closest("[data-remover-tag]");
    if (removerTagBotao) removerTag(removerTagBotao.dataset.removerTag, Number(removerTagBotao.dataset.indice));
    const adicionarTagBotao = alvo.closest("[data-tag-adicionar]");
    if (adicionarTagBotao) adicionarDaEntrada(adicionarTagBotao.dataset.tagAdicionar);
  });

  // Enter em um campo de texto não envia o formulário por acidente.
  // No campo "Outra habilidade", Enter adiciona a tag.
  form.addEventListener("keydown", (evento) => {
    if (evento.key !== "Enter") return;
    if (evento.target.matches("[data-tag-entrada]")) {
      evento.preventDefault();
      adicionarDaEntrada(evento.target.dataset.tagEntrada);
      return;
    }
    if (evento.target.matches("input:not([type=checkbox]):not([type=radio]):not([type=file]):not([type=submit]):not([type=button])")) {
      evento.preventDefault();
    }
  });

  form.addEventListener("input", (evento) => {
    const controle = evento.target;
    if (!controle.dataset.campo) return;
    controle.dataset.alterado = "1";
    if (controle.tagName === "TEXTAREA") atualizarContador(controle);
    // Um campo com erro é conferido a cada letra, para a mensagem sumir assim que for corrigido.
    const grupo = controle.closest("[data-campo-grupo]");
    if (controle.getAttribute("aria-invalid") === "true" || (grupo && controle.type === "checkbox") || controle.type === "checkbox") revalidar(controle);
    if (!controle.matches("[data-tag-entrada]")) avisarAlteracao();
  });

  // Ao sair de um campo editado: completa links, formata o telefone e confere o valor.
  form.addEventListener("focusout", (evento) => {
    const controle = evento.target;
    if (!controle.dataset?.campo || !controle.dataset.alterado || controle.type === "checkbox" || controle.matches("[data-tag-entrada]")) return;
    if (controle.type === "url" && controle.value.trim()) controle.value = M.completarUrl(controle.value);
    if (controle.type === "tel" && controle.value.trim()) controle.value = M.formatarTelefone(controle.value);
    revalidar(controle);
  });

  form.addEventListener("submit", solicitarPublicacao);
  el.foto.addEventListener("change", escolherFoto);
  el.removerFoto.addEventListener("click", () => removerFoto(true));
  el.guardar.addEventListener("click", guardarRascunho);
  el.recuperar.addEventListener("click", () => recuperarRascunho());
  el.apagar.addEventListener("click", apagarDadosSalvos);
  el.novo.addEventListener("click", comecarNovo);
  el.exportar.addEventListener("click", exportarDados);
  el.importar.addEventListener("click", () => el.arquivo.click());
  el.arquivo.addEventListener("change", importarArquivo);

  // Progresso salvo em outra visita: só é usado se a pessoa pedir.
  const rascunho = lerRascunho();
  if (rascunho) {
    el.dataRascunho.textContent = rascunho.salvoEm ? `Salvo em ${dataHora(rascunho.salvoEm)}.` : "";
    el.rascunhoEncontrado.hidden = false;
  }
  el.restaurar.addEventListener("click", () => recuperarRascunho());
  el.descartar.addEventListener("click", () => {
    apagarRascunho();
    el.rascunhoEncontrado.hidden = true;
    campoFixo("nome").focus();
    anunciar("Dados salvos apagados.");
  });

  // Ponto de acesso para a prévia, os modelos e o PDF:
  //   CriadorCurriculo.obterCurriculo() devolve o objeto normalizado (ver curriculo-modelo.js);
  //   o evento "curriculo:alterado" no formulário avisa quando algo mudou.
  window.CriadorCurriculo = Object.freeze({
    formulario: form,
    lerFormulario,
    obterCurriculo: () => M.normalizarCurriculo(lerFormulario()),
    validar: () => M.validarCurriculo(lerFormulario()),
    // Mostra os erros junto aos campos e leva o foco ao resumo (usado antes do PDF).
    // Devolve a lista de erros; vazia quando o currículo está completo.
    mostrarErros: () => {
      tentouEnviar = true;
      const erros = M.validarCurriculo(lerFormulario());
      exibirErros(erros, true);
      return erros;
    },
    preencherFormulario
  });
})();
