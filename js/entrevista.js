// =============================================================================
// Simulação de entrevista da Nina: gerenciador de estados (sem textos fixos).
// Perguntas e orientações: js/entrevista-perguntas.js (carregado antes).
// Interface: js/chatbot.js chama NinaEntrevista.criar(ui) e entrega as funções
// de conversa (falar, progresso, modo do campo...). Assim, a entrevista não
// se mistura com as respostas tradicionais da Nina.
//
// Fases:  inativa → apresentacao → modalidade → pergunta ⇄ orientacao → (fim) inativa
// As respostas ficam só na memória desta aba e são apagadas ao concluir,
// sair ou recomeçar. Nada é enviado nem gravado no navegador.
// =============================================================================
(() => {
  "use strict";

  const P = window.NinaEntrevistaPerguntas;
  if (!P) return;

  // Palavras com pelo menos uma letra ou número (sinais soltos não contam).
  function contarPalavras(texto) {
    return texto.trim().split(/\s+/).filter((parte) => /[\p{L}\p{N}]/u.test(parte)).length;
  }

  function criar(ui) {
    const estado = { fase: "inativa", modalidade: null, indice: 0, respostas: [] };
    // Opções da etapa atual, repetidas se a pessoa digitar fora da hora.
    let opcoesAtuais = [];

    // Botão da conversa que executa uma etapa da simulação.
    function acao(rotulo, executar, estilo = "") {
      return { tipo: "funcao", rotulo, executar, estilo };
    }

    function falar(texto, opcoes = []) {
      opcoesAtuais = opcoes;
      return ui.falar(texto, opcoes);
    }

    // Volta ao estado inicial e apaga as respostas da memória.
    function limpar() {
      estado.fase = "inativa";
      estado.modalidade = null;
      estado.indice = 0;
      estado.respostas = [];
      opcoesAtuais = [];
      ui.progresso(null);
      ui.modoResposta(false);
    }

    const total = () => estado.modalidade.perguntas.length;
    const perguntaAtual = () => P.perguntas[estado.modalidade.perguntas[estado.indice]];
    const opcaoSair = () => acao("Sair da entrevista", sair, "secundaria");
    const opcaoMenu = (rotulo = "Voltar ao menu") => acao(rotulo, voltarAoMenu, "secundaria");

    // 1. Apresentação da simulação.
    function iniciar() {
      limpar();
      estado.fase = "apresentacao";
      return falar(P.introducao, [acao("Começar entrevista", escolherModalidade, "destaque"), opcaoMenu()]);
    }

    // 2. Escolha da modalidade (Jovem Aprendiz, Estágio ou Primeiro Emprego).
    function escolherModalidade() {
      limpar();
      estado.fase = "modalidade";
      return falar(P.escolhaModalidade, [
        ...P.modalidades.map((m) => acao(m.rotulo, () => comecar(m.id))),
        opcaoMenu()
      ]);
    }

    // 3. Início: texto da modalidade e primeira pergunta.
    async function comecar(id) {
      limpar();
      estado.modalidade = P.modalidades.find((m) => m.id === id);
      if (!estado.modalidade) return escolherModalidade();
      await falar(estado.modalidade.abertura);
      // A conversa pode ter sido recomeçada durante a espera.
      if (estado.modalidade?.id !== id) return null;
      return perguntar();
    }

    // 4. Uma pergunta por vez; a Nina espera a resposta digitada.
    async function perguntar() {
      estado.fase = "pergunta";
      const numero = estado.indice + 1;
      ui.progresso({ modalidade: estado.modalidade.rotulo, atual: numero, total: total() });
      ui.modoResposta(true);
      await falar(`Pergunta ${numero} de ${total()}\n${perguntaAtual().texto}`, [opcaoSair()]);
      if (estado.fase === "pergunta") ui.focarCampo();
    }

    // 5. Resposta recebida: guarda na memória e mostra a orientação geral da pergunta.
    //    A Nina não avalia o conteúdo; só a quantidade de palavras é conferida.
    function responder(texto) {
      const id = estado.modalidade.perguntas[estado.indice];
      const pergunta = perguntaAtual();
      estado.respostas.push({ pergunta: id, texto });
      estado.fase = "orientacao";
      ui.modoResposta(false);
      ui.mostrarResposta(texto);

      const partes = [`${P.aposResposta}\n${pergunta.orientacao}`];
      const complemento = pergunta.porModalidade?.[estado.modalidade.id];
      if (complemento) partes.push(complemento);
      const palavras = contarPalavras(texto);
      if (palavras < P.minimoPalavras) {
        partes.push(P.respostaCurta.replace("{n}", String(palavras)).replace("{palavras}", palavras === 1 ? "palavra" : "palavras"));
      }
      const ultima = estado.indice + 1 >= total();
      return falar(partes.join("\n\n"), [acao(ultima ? "Ver resumo final" : "Próxima pergunta", proxima, "destaque"), opcaoSair()]);
    }

    // 6. Avança só quando a pessoa pede (depois de ler a orientação).
    function proxima() {
      estado.indice += 1;
      return estado.indice < total() ? perguntar() : concluir();
    }

    // 7. Conclusão: recomendações gerais; as respostas são apagadas.
    function concluir() {
      const modalidade = estado.modalidade;
      limpar();
      const c = P.conclusao;
      const texto = [
        c.mensagem,
        `${c.titulo}\n${c.recomendacoes.map((r) => `• ${r}`).join("\n")}`,
        modalidade.dicaFinal,
        c.privacidade
      ].join("\n\n");
      return falar(texto, [
        acao("Refazer entrevista", () => comecar(modalidade.id), "destaque"),
        acao("Escolher outra modalidade", escolherModalidade),
        opcaoMenu("Voltar ao menu principal")
      ]);
    }

    function sair() {
      limpar();
      return ui.falar(P.saida, ui.acoesMenuInicial());
    }

    function voltarAoMenu() {
      limpar();
      return ui.mostrarMenu();
    }

    // Texto digitado durante a simulação. Só é tratado como resposta na fase "pergunta".
    function receberTexto(texto) {
      if (estado.fase === "pergunta") return responder(texto);
      ui.mostrarResposta(texto);
      return ui.falar(P.usarBotoes, opcoesAtuais);
    }

    return Object.freeze({
      iniciar,
      receberTexto,
      emAndamento: () => estado.fase !== "inativa",
      // Usado por "Recomeçar": encerra sem mensagens.
      encerrar: limpar
    });
  }

  window.NinaEntrevista = Object.freeze({ criar });
})();
