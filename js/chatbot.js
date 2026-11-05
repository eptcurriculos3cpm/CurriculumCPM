// =============================================================================
// Nina — motor do chatbot de regras do Curriculum CPM.
// Os textos, menus e intenções ficam em js/nina-conteudo.js (carregado antes).
// A simulação de entrevista fica em js/entrevista.js + js/entrevista-perguntas.js
// (também carregados antes); este arquivo só entrega a ela as funções da conversa.
// Seções: 1) reconhecimento  2) interface  3) ações de navegação
//         4) conversa  5) simulação de entrevista  6) abrir/fechar  7) eventos.
// Nenhum serviço externo é chamado; tudo roda no navegador.
// =============================================================================
(() => {
  "use strict";

  const C = window.NinaConteudo;
  const botaoChat = document.querySelector(".chatbot");
  if (!C || !botaoChat) return;

  // ---------------------------------------------------------------------------
  // 1. Reconhecimento de intenções
  // ---------------------------------------------------------------------------
  const IGNORAR = new Set(C.ignorar);

  // Minúsculas, sem acentos e sem pontuação: "Currículo!" -> "curriculo".
  function normalizar(texto) {
    return String(texto)
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function palavrasUteis(texto) {
    return normalizar(texto).split(" ").filter((p) => p && !IGNORAR.has(p));
  }

  // Converte cada padrão em uma lista de palavras; "*" no fim aceita continuações.
  const INTENCOES = C.intencoes.map((intencao) => {
    const vistos = new Set();
    const padroes = [];
    for (const padrao of intencao.padroes) {
      const termos = padrao.split(/\s+/).map((termo) => {
        const prefixo = termo.endsWith("*");
        return { base: normalizar(prefixo ? termo.slice(0, -1) : termo), prefixo };
      }).filter((t) => t.base && !IGNORAR.has(t.base));
      const chave = termos.map((t) => t.base + (t.prefixo ? "*" : "")).join(" ");
      if (termos.length && !vistos.has(chave)) {
        vistos.add(chave);
        padroes.push(termos);
      }
    }
    return { ...intencao, padroes };
  });
  const POR_ID = new Map(INTENCOES.map((i) => [i.id, i]));

  function termoPresente(termo, palavras) {
    return palavras.some((p) => (termo.prefixo ? p.startsWith(termo.base) : p === termo.base));
  }

  // Soma os pontos de cada padrão encontrado (todas as palavras presentes, em qualquer ordem).
  // Empates são resolvidos pela prioridade da intenção.
  function reconhecer(texto) {
    const palavras = palavrasUteis(texto);
    const ranking = INTENCOES.map((intencao) => ({
      intencao,
      pontos: intencao.padroes.reduce((soma, termos) =>
        soma + (termos.every((t) => termoPresente(t, palavras)) ? termos.length : 0), 0)
    }))
      .filter((r) => r.pontos > 0)
      .sort((a, b) => b.pontos - a.pontos || b.intencao.prioridade - a.intencao.prioridade);

    const melhor = ranking[0];
    if (!melhor) return { intencao: null, alternativa: null };
    // Se outra intenção empatou em pontos, ela vira uma sugestão extra.
    const empate = ranking.find((r) => r !== melhor && r.pontos === melhor.pontos && r.intencao.rotulo);
    return { intencao: melhor.intencao, alternativa: empate ? empate.intencao : null };
  }

  // ---------------------------------------------------------------------------
  // 2. Interface (construída uma vez; textos sempre inseridos com textContent)
  // ---------------------------------------------------------------------------
  const ICONES = {
    chat: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-5 4v-4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm3 6.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm5 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm5 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z"/></svg>',
    fechar: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m6.4 5 5.6 5.6L17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6L6.4 19 5 17.6l5.6-5.6L5 6.4 6.4 5Z"/></svg>',
    reiniciar: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 5a7 7 0 1 1-6.6 9.3l1.9-.6A5 5 0 1 0 12 7H9.4l2.3 2.3-1.4 1.4L5.6 6l4.7-4.7 1.4 1.4L9.4 5H12Z"/></svg>',
    enviar: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 20.5 21.5 12 3 3.5v6.6l12 1.9-12 1.9v6.6Z"/></svg>',
    seta: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m9.3 17.7 1.4 1.4 7.1-7.1-7.1-7.1-1.4 1.4L15 12l-5.7 5.7Z"/></svg>',
    entrevista: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9 3h6a2 2 0 0 1 2 2v2h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3V5a2 2 0 0 1 2-2Zm0 4h6V5H9v2Zm-5 4v8h16v-8h-6v2h-4v-2H4Z"/></svg>'
  };

  // Avatar da Nina (robô). É decorativo (alt vazio): o nome aparece em texto ao lado.
  function criarAvatar(classe, tamanho) {
    const caixa = criar("span", `cb-avatar ${classe}`.trim());
    caixa.setAttribute("aria-hidden", "true");
    const imagem = document.createElement("img");
    imagem.src = C.config.avatar;
    imagem.alt = "";
    imagem.width = tamanho;
    imagem.height = tamanho;
    imagem.decoding = "async";
    // Sem a imagem, mostra a inicial "N" no mesmo círculo.
    imagem.addEventListener("error", () => { caixa.textContent = "N"; }, { once: true });
    caixa.append(imagem);
    return caixa;
  }

  function criar(tag, classe, texto) {
    const el = document.createElement(tag);
    if (classe) el.className = classe;
    if (texto) el.textContent = texto;
    return el;
  }

  // Botão flutuante: reaproveita o <button class="chatbot"> existente em cada página.
  botaoChat.id = "cb-toggle";
  botaoChat.type = "button";
  // Nome fixo; aria-expanded informa se a janela está aberta.
  botaoChat.setAttribute("aria-label", "Conversar com a Nina, assistente virtual");
  botaoChat.setAttribute("aria-expanded", "false");
  botaoChat.setAttribute("aria-controls", "cb-panel");
  botaoChat.innerHTML = `<span class="cb-ic-fechar">${ICONES.fechar}</span>`;
  const avatarBotao = criarAvatar("cb-ic-abrir", 44);
  // No botão, se a imagem falhar, volta o ícone de balão de conversa.
  avatarBotao.querySelector("img").addEventListener("error", () => { avatarBotao.innerHTML = ICONES.chat; }, { once: true });
  botaoChat.prepend(avatarBotao);

  // Painel lateral fixo no lado direito (região complementar <aside>), não uma janela
  // sobreposta: em telas largas, a página encolhe para dar espaço a ele (css/chatbot.css).
  const painel = criar("aside", "cb-painel");
  painel.id = "cb-panel";
  painel.hidden = true;
  painel.setAttribute("aria-labelledby", "cb-titulo");
  painel.setAttribute("aria-describedby", "cb-subtitulo");
  painel.innerHTML = `
    <div class="cb-cabecalho">
      <div class="cb-identidade">
        <h2 id="cb-titulo" class="cb-titulo" tabindex="-1"></h2>
        <p id="cb-subtitulo" class="cb-subtitulo"></p>
      </div>
      <button type="button" class="cb-icone" data-cb="reiniciar" aria-label="Recomeçar conversa">${ICONES.reiniciar}</button>
      <button type="button" class="cb-icone" data-cb="fechar" aria-label="Fechar chat">${ICONES.fechar}</button>
    </div>
    <div class="cb-progresso" hidden>
      <p class="cb-progresso-texto" id="cb-progresso-texto"></p>
      <progress class="cb-progresso-barra" max="5" value="0" aria-labelledby="cb-progresso-texto"></progress>
    </div>
    <div class="cb-conversa" role="region" tabindex="0" aria-label="Conversa com a Nina">
      <div class="cb-mensagens" role="log" aria-live="polite" aria-relevant="additions"></div>
      <div class="cb-digitando" hidden><span></span><span></span><span></span></div>
      <div class="cb-opcoes" role="group" aria-label="Sugestões"></div>
    </div>
    <form class="cb-formulario" novalidate>
      <label class="visualmente-oculto" for="cb-input" id="cb-rotulo-campo">Digite sua pergunta para a Nina</label>
      <input id="cb-input" type="text" autocomplete="off" maxlength="200">
      <button type="submit" id="cb-send" class="cb-enviar" aria-label="Enviar pergunta">${ICONES.enviar}</button>
    </form>
    <p class="cb-nota"></p>`;
  document.body.append(painel);

  const el = {
    titulo: painel.querySelector(".cb-titulo"),
    conversa: painel.querySelector(".cb-conversa"),
    mensagens: painel.querySelector(".cb-mensagens"),
    digitando: painel.querySelector(".cb-digitando"),
    opcoes: painel.querySelector(".cb-opcoes"),
    formulario: painel.querySelector(".cb-formulario"),
    campo: painel.querySelector("#cb-input"),
    rotuloCampo: painel.querySelector("#cb-rotulo-campo"),
    enviar: painel.querySelector("#cb-send"),
    progresso: painel.querySelector(".cb-progresso"),
    progressoTexto: painel.querySelector(".cb-progresso-texto"),
    progressoBarra: painel.querySelector(".cb-progresso-barra")
  };
  painel.querySelector(".cb-cabecalho").prepend(criarAvatar("cb-avatar--cabecalho", 40));
  el.titulo.textContent = C.config.nome;
  painel.querySelector(".cb-subtitulo").textContent = C.config.subtitulo;
  painel.querySelector(".cb-nota").textContent = C.config.rodape;
  el.campo.placeholder = C.config.placeholder;

  const movimentoReduzido = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const toqueComoEntrada = () => window.matchMedia("(pointer: coarse)").matches;

  function rolarParaFim() {
    el.conversa.scrollTop = el.conversa.scrollHeight;
  }

  // Cada mensagem identifica o autor: na tela, pelo avatar e pela posição do balão;
  // no leitor de tela, pelo texto oculto "Nina: ..." ou "Você: ...".
  function adicionarMensagem(texto, autor) {
    const item = criar("div", `cb-msg cb-msg--${autor}`);
    const balao = criar("p", "cb-texto");
    balao.append(criar("span", "visualmente-oculto", autor === "bot" ? `${C.config.nome}: ` : "Você: "), texto);
    if (autor === "bot") item.append(criarAvatar("cb-avatar--mensagem", 28));
    item.append(balao);
    el.mensagens.append(item);
    rolarParaFim();
  }

  function limparOpcoes() {
    el.opcoes.replaceChildren();
  }

  // ---------------------------------------------------------------------------
  // 3. Ações de navegação
  // ---------------------------------------------------------------------------
  function curriculoAberto() {
    const pagina = document.getElementById("pagina-curriculo");
    return Boolean(document.getElementById("botao-imprimir") && pagina && !pagina.hidden);
  }

  // Link para a própria página: fecha o chat e leva o foco ao destino, sem recarregar.
  function irNaMesmaPagina(url) {
    fechar(false);
    const alvo = (url.hash && document.getElementById(decodeURIComponent(url.hash.slice(1))))
      || document.querySelector("main") || document.body;
    if (!alvo.hasAttribute("tabindex") && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(alvo.tagName)) alvo.setAttribute("tabindex", "-1");
    alvo.scrollIntoView({ behavior: movimentoReduzido() ? "auto" : "smooth", block: "start" });
    alvo.focus({ preventScroll: true });
  }

  function criarLink(acao) {
    const link = criar("a", "cb-opcao cb-opcao--link");
    link.href = acao.href;
    link.append(criar("span", "", acao.rotulo));
    if (acao.externo && !acao.href.startsWith("mailto:")) {
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.append(criar("span", "visualmente-oculto", " (abre em nova aba)"));
    }
    link.insertAdjacentHTML("beforeend", ICONES.seta);
    link.addEventListener("click", (evento) => {
      const url = new URL(link.href, window.location.href);
      if (url.origin === window.location.origin && url.pathname === window.location.pathname) {
        evento.preventDefault();
        irNaMesmaPagina(url);
      }
    });
    return link;
  }

  function criarBotao(rotulo, aoClicar, extra = "") {
    const botao = criar("button", `cb-opcao ${extra}`.trim(), rotulo);
    botao.type = "button";
    // Ignora cliques em opções que já foram substituídas (cliques muito rápidos).
    botao.addEventListener("click", (evento) => {
      if (botao.isConnected) aoClicar(evento);
    });
    return botao;
  }

  // Monta as opções exibidas abaixo da última resposta.
  function mostrarOpcoes(acoes, comVoltar) {
    limparOpcoes();
    for (const acao of acoes) {
      if (acao.tipo === "link") {
        el.opcoes.append(criarLink(acao));
      } else if (acao.tipo === "intencao") {
        el.opcoes.append(criarBotao(acao.rotulo, () => escolher(acao.rotulo, () => responderIntencao(POR_ID.get(acao.id)))));
      } else if (acao.tipo === "menu") {
        el.opcoes.append(criarBotao(acao.rotulo, () => escolher(acao.rotulo, () => mostrarMenu(acao.menu))));
      } else if (acao.tipo === "imprimir") {
        el.opcoes.append(criarBotao(acao.rotulo, () => {
          fechar(false);
          // Usa o mesmo botão "Salvar como PDF" da página (window.print()).
          setTimeout(() => document.getElementById("botao-imprimir").click(), 60);
        }, "cb-opcao--destaque"));
      } else if (acao.tipo === "entrevista") {
        // Só aparece quando os scripts da simulação foram carregados.
        if (entrevista) el.opcoes.append(criarBotaoEntrevista(acao));
      } else if (acao.tipo === "funcao") {
        // Etapas da simulação de entrevista (js/entrevista.js).
        el.opcoes.append(criarBotao(acao.rotulo, () => escolher(acao.rotulo, acao.executar), acao.estilo ? `cb-opcao--${acao.estilo}` : ""));
      }
    }
    if (comVoltar) {
      el.opcoes.append(criarBotao("Ver todos os assuntos", () => escolher("Ver todos os assuntos", () => mostrarMenu("inicial")), "cb-opcao--secundaria"));
    }
    rolarParaFim();
  }

  // Botão que inicia a simulação; no menu inicial ele ocupa a linha toda, com ícone.
  function criarBotaoEntrevista(acao) {
    const botao = criarBotao(acao.rotulo, () => escolher(acao.rotulo, () => entrevista.iniciar()),
      acao.destaque ? "cb-opcao--entrevista" : "cb-opcao--destaque");
    if (acao.destaque) botao.insertAdjacentHTML("afterbegin", ICONES.entrevista);
    return botao;
  }

  // Itens de menu do arquivo de conteúdo -> ações.
  function acoesDoMenu(nome) {
    return C.menus[nome].map((item) => {
      if (item.acao === "entrevista") return { tipo: "entrevista", rotulo: item.rotulo, destaque: item.destaque };
      if (item.menu) return { tipo: "menu", rotulo: item.rotulo, menu: item.menu };
      return { tipo: "intencao", rotulo: item.rotulo, id: item.id };
    });
  }

  // ---------------------------------------------------------------------------
  // 4. Conversa (fila para que cliques rápidos não embaralhem as respostas)
  // ---------------------------------------------------------------------------
  let fila = Promise.resolve();
  let geracao = 0; // muda ao recomeçar; respostas antigas pendentes são descartadas
  let iniciada = false;

  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

  function enfileirar(tarefa) {
    const minhaGeracao = geracao;
    fila = fila.then(() => (minhaGeracao === geracao ? tarefa(minhaGeracao) : null)).catch(() => {});
    return fila;
  }

  // Mostra "digitando", depois a resposta e as opções.
  async function falar(texto, acoes = [], comVoltar = false, g = geracao) {
    if (!movimentoReduzido()) {
      el.digitando.hidden = false;
      rolarParaFim();
      const { atrasoMin, atrasoMax } = C.config;
      await esperar(atrasoMin + Math.random() * (atrasoMax - atrasoMin));
      // Uma resposta de uma conversa já recomeçada não mexe na conversa nova.
      if (g !== geracao) return;
      el.digitando.hidden = true;
    }
    if (g !== geracao) return;
    adicionarMensagem(texto, "bot");
    mostrarOpcoes(acoes, comVoltar);
  }

  function responderIntencao(intencao, alternativa = null, g = geracao) {
    if (!intencao) return falar(C.config.naoEntendi, acoesDoMenu("inicial"), false, g);
    // "Quero simular uma entrevista" digitado também inicia a simulação.
    if (intencao.entrevista && entrevista) return entrevista.iniciar();
    if (intencao.menu) return falar(intencao.resposta, acoesDoMenu(intencao.menu), false, g);
    let { resposta, acoes = [] } = intencao;
    if (intencao.naPaginaDoCurriculo && curriculoAberto()) ({ resposta, acoes } = intencao.naPaginaDoCurriculo);
    const extras = alternativa ? [{ tipo: "intencao", rotulo: alternativa.rotulo, id: alternativa.id }] : [];
    return falar(resposta, [...acoes, ...extras], true, g);
  }

  function mostrarMenu(nome, g = geracao) {
    return falar(nome === "inicial" ? "Escolha um assunto:" : "Mais assuntos:", acoesDoMenu(nome), false, g);
  }

  // Clique em uma opção: registra a escolha como mensagem da pessoa e responde.
  // O foco vai para a área da conversa, de onde o Tab alcança as novas opções.
  function escolher(rotulo, responder) {
    limparOpcoes();
    el.conversa.focus({ preventScroll: true });
    enfileirar((g) => {
      if (g !== geracao) return null;
      adicionarMensagem(rotulo, "user");
      return responder();
    });
  }

  function enviarTexto(texto) {
    const pergunta = texto.trim();
    if (!pergunta) return;
    limparOpcoes();
    enfileirar((g) => {
      // Durante a simulação, o texto vai para a entrevista, não para o reconhecimento de intenções.
      if (entrevista && entrevista.emAndamento()) return entrevista.receberTexto(pergunta);
      adicionarMensagem(pergunta, "user");
      const { intencao, alternativa } = reconhecer(pergunta);
      return responderIntencao(intencao, alternativa, g);
    });
  }

  function saudar() {
    enfileirar((g) => falar(C.config.saudacao, acoesDoMenu("inicial"), false, g));
  }

  // Recomeçar também encerra uma simulação em andamento e apaga as respostas.
  function recomecar() {
    geracao += 1;
    fila = Promise.resolve();
    if (entrevista) entrevista.encerrar();
    el.digitando.hidden = true;
    el.mensagens.replaceChildren();
    limparOpcoes();
    el.campo.value = "";
    saudar();
    focoInicial();
  }

  // ---------------------------------------------------------------------------
  // 5. Simulação de entrevista (lógica em js/entrevista.js)
  // ---------------------------------------------------------------------------
  // Durante uma pergunta, o campo passa a receber a resposta (texto mais longo).
  function modoResposta(ativo) {
    el.campo.placeholder = ativo ? "Digite sua resposta" : C.config.placeholder;
    el.rotuloCampo.textContent = ativo ? "Digite sua resposta para a pergunta da entrevista" : "Digite sua pergunta para a Nina";
    el.campo.maxLength = ativo ? 600 : 200;
    el.enviar.setAttribute("aria-label", ativo ? "Enviar resposta" : "Enviar pergunta");
  }

  // Faixa "Simulação: Estágio · Pergunta 2 de 5" abaixo do cabeçalho; null a esconde.
  function progresso(dados) {
    el.progresso.hidden = !dados;
    if (!dados) return;
    el.progressoTexto.textContent = `Simulação: ${dados.modalidade} · Pergunta ${dados.atual} de ${dados.total}`;
    el.progressoBarra.max = dados.total;
    el.progressoBarra.value = dados.atual;
  }

  // Sem os scripts da simulação, a Nina continua funcionando só com as respostas tradicionais.
  let entrevista = null;
  if (window.NinaEntrevista) {
    entrevista = window.NinaEntrevista.criar({
      falar: (texto, acoes = []) => falar(texto, acoes),
      mostrarResposta: (texto) => adicionarMensagem(texto, "user"),
      mostrarMenu: () => mostrarMenu("inicial"),
      acoesMenuInicial: () => acoesDoMenu("inicial"),
      progresso,
      modoResposta,
      focarCampo: () => { if (aberto() && !toqueComoEntrada()) el.campo.focus({ preventScroll: true }); }
    });
  }

  // Abre a janela direto na simulação (botões da página com data-nina="entrevista").
  function abrirNaEntrevista() {
    iniciada = true; // dispensa a saudação padrão: a simulação já se apresenta
    abrir();
    limparOpcoes();
    enfileirar(() => entrevista.iniciar());
  }

  // ---------------------------------------------------------------------------
  // 6. Abrir e fechar
  // ---------------------------------------------------------------------------
  // Mouse/teclado: foco no campo. Toque: foco no título, para não abrir o teclado virtual sozinho.
  function focoInicial() {
    if (toqueComoEntrada()) el.titulo.focus({ preventScroll: true });
    else el.campo.focus({ preventScroll: true });
  }

  function aberto() {
    return !painel.hidden;
  }

  // A classe no <html> reserva o espaço do painel à direita da página (só em telas largas).
  function abrir() {
    painel.hidden = false;
    document.documentElement.classList.add("cb-aberto");
    botaoChat.classList.add("is-open");
    botaoChat.setAttribute("aria-expanded", "true");
    if (!iniciada) {
      iniciada = true;
      saudar();
    }
    focoInicial();
  }

  // O histórico é mantido ao fechar; "Recomeçar" limpa a conversa.
  function fechar(devolverFoco = true) {
    painel.hidden = true;
    document.documentElement.classList.remove("cb-aberto");
    botaoChat.classList.remove("is-open");
    botaoChat.setAttribute("aria-expanded", "false");
    if (devolverFoco) botaoChat.focus({ preventScroll: true });
  }

  // ---------------------------------------------------------------------------
  // 7. Eventos
  // ---------------------------------------------------------------------------
  botaoChat.addEventListener("click", () => (aberto() ? fechar() : abrir()));

  // Botões da página que levam à simulação ficam ocultos no HTML e só aparecem aqui,
  // quando a simulação está disponível (sem JavaScript, não haveria o que abrir).
  if (entrevista) {
    document.querySelectorAll('[data-nina="entrevista"]').forEach((botao) => {
      botao.hidden = false;
      botao.addEventListener("click", abrirNaEntrevista);
    });
  }
  painel.querySelector('[data-cb="fechar"]').addEventListener("click", () => fechar());
  painel.querySelector('[data-cb="reiniciar"]').addEventListener("click", recomecar);

  // Enter no campo envia (o <form> cuida disso, inclusive no teclado virtual).
  el.formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();
    const texto = el.campo.value;
    el.campo.value = "";
    enviarTexto(texto);
  });

  // Escape fecha quando o foco está no chat ou no botão que o abre.
  document.addEventListener("keydown", (evento) => {
    if (evento.key !== "Escape" || !aberto()) return;
    if (painel.contains(document.activeElement) || document.activeElement === botaoChat) {
      evento.preventDefault();
      fechar();
    }
  });
})();
