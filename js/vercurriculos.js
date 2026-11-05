// Ativa verificações do JavaScript para ajudar a detectar erros de programação.
"use strict";

// Catálogo Ver Currículos: pesquisa, filtros combinados e grade de cartões.
// Depende de normalizarTexto(), definida em js/normalizar-texto.js (carregado antes).
// Tudo acontece no navegador: o JSON é lido uma vez e os cartões são apenas
// mostrados ou escondidos a cada pesquisa, sem nova consulta a servidor.

// Executa o código do catálogo sem expor suas variáveis aos outros scripts.
(() => {
  // Guarda os elementos do HTML que serão preenchidos ou controlados pelo JavaScript.
  const elementos = {
    carregamento: document.getElementById("estado-carregamento"),
    erro: document.getElementById("estado-erro"),
    semAlunos: document.getElementById("estado-sem-alunos"),
    catalogo: document.getElementById("catalogo"),
    formulario: document.getElementById("filtros"),
    busca: document.getElementById("busca"),
    area: document.getElementById("filtro-area"),
    competencia: document.getElementById("filtro-competencia"),
    oportunidade: document.getElementById("filtro-oportunidade"),
    campoOportunidade: document.getElementById("campo-oportunidade"),
    tecnica: document.getElementById("filtro-tecnica"),
    campoTecnica: document.getElementById("campo-tecnica"),
    comportamental: document.getElementById("filtro-comportamental"),
    campoComportamental: document.getElementById("campo-comportamental"),
    contador: document.getElementById("contador"),
    limpar: document.getElementById("limpar-filtros"),
    lista: document.getElementById("lista-alunos"),
    semResultados: document.getElementById("sem-resultados"),
    limparSemResultados: document.getElementById("limpar-sem-resultados")
  };

  // Quantas competências aparecem no cartão; as demais ficam no currículo completo.
  const COMPETENCIAS_NO_CARTAO = 3;
  // Espera (ms) antes de anunciar o contador enquanto a pessoa digita,
  // para o leitor de tela não ler um número a cada letra.
  const ATRASO_CONTADOR = 400;

  // Um item por estudante ativo: dados, cartão na tela e valores já normalizados.
  let itens = [];
  let temporizadorContador = 0;
  // Competência escolhida na última atualização (evita remontar etiquetas sem necessidade).
  let competenciaDestacada = "";

  // Usa o texto do JSON quando está preenchido; caso contrário, usa o texto de apoio.
  function texto(valor, fallback = "") {
    return typeof valor === "string" && valor.trim() ? valor.trim() : fallback;
  }

  // Lê um campo opcional que deve ser uma lista de textos (ex.: "tipos_oportunidade").
  // Se o campo não existir ou tiver outro formato, devolve uma lista vazia.
  function listaDeTextos(valor) {
    return Array.isArray(valor) ? valor.map((item) => texto(item)).filter(Boolean) : [];
  }

  // Desenha um avatar com iniciais caso a foto não exista ou não carregue.
  function avatarPadrao(nome) {
    const partes = texto(nome, "CV").split(/\s+/);
    let iniciais = "";
    // Usa as iniciais dos dois primeiros nomes para identificar o estudante sem foto.
    for (const parte of partes.slice(0, 2)) {
      iniciais += parte.charAt(0).toUpperCase();
    }
    // Protege os caracteres que têm significado especial dentro do SVG.
    iniciais = iniciais.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    // Monta a imagem de substituição em SVG, um desenho descrito com texto.
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect width="400" height="400" fill="#1565c0"/><circle cx="200" cy="150" r="78" fill="#fff" opacity=".15"/><path d="M55 400c18-110 72-165 145-165s127 55 145 165" fill="#fff" opacity=".15"/><text x="200" y="235" text-anchor="middle" fill="#fff" font-family="Arial" font-size="90" font-weight="700">${iniciais}</text></svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }

  // Cria um elemento com classe e texto, sem interpretar o conteúdo como HTML.
  function criar(tag, classe, conteudo) {
    const elemento = document.createElement(tag);
    if (classe) elemento.className = classe;
    if (conteudo) elemento.textContent = conteudo;
    return elemento;
  }

  // ---------------------------------------------------------------------------
  // Leitura dos dados de cada estudante (campos antigos e opcionais)
  // ---------------------------------------------------------------------------

  // O campo "area" pode reunir mais de uma área separada por "/",
  // como "Desenvolvimento de Sistemas / Atendimento". Os interesses profissionais
  // (campo opcional) também contam como área para o filtro.
  function areasDoAluno(aluno) {
    const doCampoArea = texto(aluno.area).split("/").map((parte) => parte.trim()).filter(Boolean);
    return [...doCampoArea, ...listaDeTextos(aluno.interesses_profissionais)];
  }

  // Nomes das competências, na ordem do JSON.
  function competenciasDoAluno(aluno) {
    if (!Array.isArray(aluno.competencias)) return [];
    return aluno.competencias.map((competencia) => texto(competencia?.nome)).filter(Boolean);
  }

  // Habilidades em tags (campos opcionais "habilidades_tecnicas" e "habilidades_comportamentais").
  // Registros antigos não têm esses campos: usam só "competencias".
  function habilidadesDoAluno(aluno) {
    return [...listaDeTextos(aluno.habilidades_tecnicas), ...listaDeTextos(aluno.habilidades_comportamentais)];
  }

  // Nome e descrição dos projetos, para a pesquisa.
  function projetosDoAluno(aluno) {
    if (!Array.isArray(aluno.projetos)) return [];
    return aluno.projetos.flatMap((projeto) => [texto(projeto?.nome), texto(projeto?.descricao)]).filter(Boolean);
  }

  // Curso e instituição de cada formação, para a pesquisa.
  function formacoesDoAluno(aluno) {
    if (!Array.isArray(aluno.formacao)) return [];
    return aluno.formacao.flatMap((formacao) => [texto(formacao?.curso), texto(formacao?.instituicao)]).filter(Boolean);
  }

  // Junta, já sem acentos e em minúsculas, tudo o que a pesquisa deve encontrar.
  function textoDePesquisa(aluno) {
    return normalizarTexto([
      texto(aluno.nome),
      texto(aluno.titulo),
      ...areasDoAluno(aluno),
      ...competenciasDoAluno(aluno),
      ...habilidadesDoAluno(aluno),
      ...formacoesDoAluno(aluno),
      ...projetosDoAluno(aluno),
      ...listaDeTextos(aluno.tipos_oportunidade)
    ].join(" | "));
  }

  // ---------------------------------------------------------------------------
  // Opções dos filtros (geradas a partir dos dados cadastrados)
  // ---------------------------------------------------------------------------

  // Reúne os valores de todos os estudantes sem repetição. "Inglês" e "ingles"
  // contam como o mesmo valor; o rótulo exibido é o primeiro encontrado no JSON.
  // Cada opção guarda quantos estudantes têm aquele valor.
  function opcoesUnicas(listasPorAluno) {
    const opcoes = new Map();
    for (const lista of listasPorAluno) {
      // Um estudante conta uma só vez, mesmo que repita o valor.
      const vistos = new Set();
      for (const rotulo of lista) {
        const chave = normalizarTexto(rotulo);
        if (!chave || vistos.has(chave)) continue;
        vistos.add(chave);
        if (!opcoes.has(chave)) opcoes.set(chave, { chave, rotulo, total: 0 });
        opcoes.get(chave).total += 1;
      }
    }
    // Ordem alfabética do português, ignorando acentos e maiúsculas.
    return [...opcoes.values()].sort((a, b) => a.rotulo.localeCompare(b.rotulo, "pt-BR", { sensitivity: "base" }));
  }

  // Acrescenta as opções ao <select>, mantendo a primeira ("Todas…").
  function preencherSelect(select, opcoes) {
    for (const opcao of opcoes) {
      const elemento = document.createElement("option");
      elemento.value = opcao.chave;
      elemento.textContent = `${opcao.rotulo} (${opcao.total})`;
      select.append(elemento);
    }
  }

  // ---------------------------------------------------------------------------
  // Cartão de cada estudante
  // ---------------------------------------------------------------------------

  // Acrescenta um par "rótulo: valor" à lista de dados do cartão.
  function adicionarDado(lista, rotulo, valor) {
    if (!valor) return;
    lista.append(criar("dt", "", rotulo), criar("dd", "", valor));
  }

  // Mostra até três competências. Quando o filtro de competência está ativo,
  // a competência escolhida vem primeiro, para ficar visível no cartão.
  function montarCompetencias(item, chaveDestacada) {
    const nomes = [...item.competencias];
    const posicao = chaveDestacada ? nomes.findIndex((nome) => normalizarTexto(nome) === chaveDestacada) : -1;
    if (posicao > 0) nomes.unshift(...nomes.splice(posicao, 1));

    const etiquetas = nomes.slice(0, COMPETENCIAS_NO_CARTAO).map((nome) => criar("li", "chip", nome));
    const restantes = nomes.length - COMPETENCIAS_NO_CARTAO;
    // Informa quantas competências ficaram de fora; o texto completo é lido pelo leitor de tela.
    if (restantes > 0) {
      const mais = criar("li", "chip-mais", `+${restantes}`);
      mais.append(criar("span", "visualmente-oculto", restantes === 1 ? " outra competência" : " outras competências"));
      etiquetas.push(mais);
    }
    item.listaCompetencias.replaceChildren(...etiquetas);
  }

  // Monta o cartão com foto, nome, título, área, competências e o link do currículo.
  function criarCartao(aluno, indice) {
    const nome = texto(aluno.nome, "Estudante");
    const idNome = `aluno-${indice}-nome`;
    const itemLista = criar("li", "item-aluno");
    const cartao = criar("article", "card cartao-aluno");
    cartao.setAttribute("aria-labelledby", idNome);

    // Foto relativa ao HTML da raiz; se faltar ou falhar, entra o avatar com iniciais.
    const foto = criar("img", "cartao-aluno-foto");
    const fotoFallback = avatarPadrao(nome);
    foto.src = texto(aluno.foto, fotoFallback);
    foto.alt = `Foto de ${nome}`;
    foto.width = 88;
    foto.height = 88;
    foto.loading = "lazy";
    foto.decoding = "async";
    // Troca uma foto que falhou pelo avatar, executando essa tentativa apenas uma vez.
    foto.addEventListener("error", () => { foto.src = fotoFallback; }, { once: true });

    const titulo = criar("h3", "cartao-aluno-nome", nome);
    titulo.id = idNome;
    const identificacao = criar("div", "cartao-aluno-identificacao");
    identificacao.append(titulo, criar("p", "cartao-aluno-titulo", texto(aluno.titulo, "Estudante")));
    const cabecalho = criar("div", "cartao-aluno-cabecalho");
    cabecalho.append(foto, identificacao);

    // Dados para comparar estudantes; campos vazios ou ausentes não aparecem.
    const dados = criar("dl", "cartao-aluno-dados");
    adicionarDado(dados, "Área", texto(aluno.area));
    adicionarDado(dados, "Formação", Array.isArray(aluno.formacao) ? texto(aluno.formacao[0]?.curso) : "");
    adicionarDado(dados, "Interesses", listaDeTextos(aluno.interesses_profissionais).join(", "));
    adicionarDado(dados, "Procura", listaDeTextos(aluno.tipos_oportunidade).join(", "));

    // Habilidades principais: as tags, quando existem; senão, as competências antigas.
    const competencias = habilidadesDoAluno(aluno).length ? habilidadesDoAluno(aluno) : competenciasDoAluno(aluno);
    const listaCompetencias = criar("ul", "cartao-aluno-competencias");
    listaCompetencias.setAttribute("aria-label", "Algumas competências");

    // O ID vai na URL para a outra página saber qual currículo deve carregar.
    const link = criar("a", "botao cartao-aluno-link", "Ver currículo");
    link.href = `curriculo-aluno.html?id=${encodeURIComponent(aluno.id)}`;
    // Completa o nome do link para quem usa leitor de tela ("… de Fulana").
    link.append(criar("span", "visualmente-oculto", ` de ${nome}`));

    cartao.append(cabecalho);
    if (dados.children.length) cartao.append(dados);
    if (competencias.length) cartao.append(listaCompetencias);
    cartao.append(link);
    itemLista.append(cartao);

    // Valores normalizados uma única vez, para a pesquisa ser rápida a cada letra.
    const item = {
      elemento: itemLista,
      listaCompetencias,
      competencias,
      pesquisa: textoDePesquisa(aluno),
      areas: new Set(areasDoAluno(aluno).map(normalizarTexto)),
      chavesCompetencias: new Set(competencias.map(normalizarTexto)),
      oportunidades: new Set(listaDeTextos(aluno.tipos_oportunidade).map(normalizarTexto)),
      tecnicas: new Set(listaDeTextos(aluno.habilidades_tecnicas).map(normalizarTexto)),
      comportamentais: new Set(listaDeTextos(aluno.habilidades_comportamentais).map(normalizarTexto))
    };
    montarCompetencias(item, "");
    return item;
  }

  // ---------------------------------------------------------------------------
  // Pesquisa, filtros e contador
  // ---------------------------------------------------------------------------

  // Escreve o contador; durante a digitação, espera a pessoa parar para anunciar.
  function atualizarContador(visiveis, filtrando, atraso) {
    const total = itens.length;
    let mensagem;
    if (!filtrando) {
      mensagem = total === 1 ? "1 currículo publicado." : `${total} currículos publicados.`;
    } else if (visiveis === 0) {
      mensagem = "Nenhum currículo encontrado.";
    } else {
      mensagem = `Mostrando ${visiveis} de ${total} ${total === 1 ? "currículo" : "currículos"}.`;
    }
    clearTimeout(temporizadorContador);
    if (atraso) {
      temporizadorContador = setTimeout(() => { elementos.contador.textContent = mensagem; }, atraso);
    } else {
      elementos.contador.textContent = mensagem;
    }
  }

  // Mostra só os estudantes que atendem a todos os critérios ao mesmo tempo.
  function aplicarFiltros(atrasoContador = 0) {
    // Cada palavra digitada precisa aparecer em algum campo, em qualquer ordem.
    const palavras = normalizarTexto(elementos.busca.value).split(/\s+/).filter(Boolean);
    const area = elementos.area.value;
    const competencia = elementos.competencia.value;
    const oportunidade = elementos.oportunidade.value;
    const tecnica = elementos.tecnica.value;
    const comportamental = elementos.comportamental.value;
    let visiveis = 0;

    for (const item of itens) {
      const corresponde =
        palavras.every((palavra) => item.pesquisa.includes(palavra)) &&
        // Filtro vazio ("Todas…") aceita todos, inclusive quem não tem o campo opcional.
        (!area || item.areas.has(area)) &&
        (!competencia || item.chavesCompetencias.has(competencia)) &&
        (!oportunidade || item.oportunidades.has(oportunidade)) &&
        (!tecnica || item.tecnicas.has(tecnica)) &&
        (!comportamental || item.comportamentais.has(comportamental));
      item.elemento.hidden = !corresponde;
      if (corresponde) visiveis += 1;
    }

    // Coloca a competência escolhida em primeiro lugar nos cartões.
    if (competencia !== competenciaDestacada) {
      competenciaDestacada = competencia;
      itens.forEach((item) => montarCompetencias(item, competencia));
    }

    elementos.lista.hidden = visiveis === 0;
    elementos.semResultados.hidden = visiveis > 0;
    atualizarContador(visiveis, Boolean(palavras.length || area || competencia || oportunidade || tecnica || comportamental), atrasoContador);
  }

  // Volta a pesquisa e os filtros ao estado inicial e mostra todos os estudantes.
  function limparFiltros() {
    // reset() volta cada <select> para a primeira opção ("Todas…") e esvazia a pesquisa.
    elementos.formulario.reset();
    aplicarFiltros();
  }

  // ---------------------------------------------------------------------------
  // Carregamento
  // ---------------------------------------------------------------------------

  // Busca os dados dos alunos no arquivo JSON, sem precisar de uma API.
  async function carregar() {
    // Tenta carregar e montar o catálogo; o catch abaixo trata as falhas.
    try {
      // fetch usa o endereço da página HTML como base para este caminho relativo.
      const resposta = await fetch("data/alunos-dados.json");
      if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
      // Converte o JSON recebido em um objeto que o JavaScript consegue consultar.
      const dados = await resposta.json();
      if (!Array.isArray(dados.alunos)) throw new TypeError('O JSON não contém o array "alunos".');
      // Alunos com ativo: false ou sem ID ficam fora da listagem e da pesquisa.
      const alunos = dados.alunos.filter((aluno) => aluno && aluno.ativo !== false && aluno.id);

      elementos.carregamento.hidden = true;
      // JSON válido, mas sem ninguém publicado: aviso próprio, que não é um erro.
      if (!alunos.length) {
        elementos.semAlunos.hidden = false;
        return;
      }

      // Cria os cartões na ordem do JSON.
      itens = alunos.map(criarCartao);
      elementos.lista.replaceChildren(...itens.map((item) => item.elemento));

      // As opções dos filtros saem só do que foi cadastrado no JSON.
      preencherSelect(elementos.area, opcoesUnicas(alunos.map(areasDoAluno)));
      preencherSelect(elementos.competencia, opcoesUnicas(alunos.map(competenciasDoAluno)));
      const oportunidades = opcoesUnicas(alunos.map((aluno) => listaDeTextos(aluno.tipos_oportunidade)));
      preencherSelect(elementos.oportunidade, oportunidades);
      // Sem nenhum tipo de oportunidade cadastrado, o filtro ficaria vazio; por isso fica oculto.
      elementos.campoOportunidade.hidden = oportunidades.length === 0;
      // Filtros de habilidades em tags: só aparecem quando algum estudante tem esses campos.
      const tecnicas = opcoesUnicas(alunos.map((aluno) => listaDeTextos(aluno.habilidades_tecnicas)));
      const comportamentais = opcoesUnicas(alunos.map((aluno) => listaDeTextos(aluno.habilidades_comportamentais)));
      preencherSelect(elementos.tecnica, tecnicas);
      preencherSelect(elementos.comportamental, comportamentais);
      elementos.campoTecnica.hidden = tecnicas.length === 0;
      elementos.campoComportamental.hidden = comportamentais.length === 0;

      elementos.catalogo.hidden = false;
      // Considera um texto que o navegador tenha mantido no campo ao voltar para a página.
      aplicarFiltros();
    // Se a busca falhar, troca o aviso de carregamento pela mensagem de erro.
    } catch (erro) {
      console.error("[Ver Currículos] Falha ao carregar estudantes:", erro);
      elementos.carregamento.hidden = true;
      elementos.catalogo.hidden = true;
      elementos.erro.hidden = false;
    }
  }

  // A pesquisa reage a cada letra; os filtros, a cada escolha.
  elementos.busca.addEventListener("input", () => aplicarFiltros(ATRASO_CONTADOR));
  [elementos.area, elementos.competencia, elementos.oportunidade, elementos.tecnica, elementos.comportamental].forEach((select) => {
    select.addEventListener("change", () => aplicarFiltros());
  });
  // Enter no campo de pesquisa não envia o formulário nem recarrega a página.
  elementos.formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();
    aplicarFiltros();
  });
  elementos.limpar.addEventListener("click", limparFiltros);
  // O botão da mensagem "nenhum resultado" some ao limpar; o foco vai para a pesquisa.
  elementos.limparSemResultados.addEventListener("click", () => {
    limparFiltros();
    elementos.busca.focus();
  });

  // Inicia a leitura dos estudantes depois de configurar os controles da página.
  carregar();
})();
