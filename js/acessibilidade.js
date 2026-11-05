// Ativa verificações do JavaScript para ajudar a detectar erros de programação.
"use strict";

// =============================================================================
// Recursos complementares de acessibilidade (todas as páginas):
//  1) "A+": aumenta e restaura o tamanho do texto do site (não afeta a impressão);
//  2) VLibras: tradução para Libras do Governo Federal, carregada SÓ quando a
//     pessoa ativa (script oficial https://vlibras.gov.br/app/vlibras-plugin.js,
//     Widget 7.0.0). Fica à esquerda para não cobrir a Nina.
// As preferências ficam no localStorage ("tamanhoTexto" e "vlibras"); não são dados pessoais.
// O VLibras não substitui a acessibilidade do próprio site nem testes com leitores de tela.
// =============================================================================
(() => {
  const CHAVE_TEXTO = "tamanhoTexto";
  const CHAVE_VLIBRAS = "vlibras";
  const SCRIPT_VLIBRAS = "https://vlibras.gov.br/app/vlibras-plugin.js";

  function ler(chave) {
    try {
      return localStorage.getItem(chave);
    } catch {
      return null;
    }
  }

  function gravar(chave, valor) {
    try {
      localStorage.setItem(chave, valor);
    } catch {
      // Sem armazenamento, a escolha vale só para esta página.
    }
  }

  // 1. Tamanho do texto ----------------------------------------------------
  const botaoTexto = document.querySelector('[data-acessibilidade="texto"]');

  function aplicarTexto(ampliado, salvar) {
    document.documentElement.classList.toggle("texto-ampliado", ampliado);
    if (botaoTexto) botaoTexto.setAttribute("aria-pressed", String(ampliado));
    if (salvar) gravar(CHAVE_TEXTO, ampliado ? "ampliado" : "normal");
  }

  aplicarTexto(document.documentElement.classList.contains("texto-ampliado"), false);
  botaoTexto?.addEventListener("click", () => {
    aplicarTexto(!document.documentElement.classList.contains("texto-ampliado"), true);
  });

  // 2. VLibras ---------------------------------------------------------------
  const botaoVlibras = document.querySelector('[data-acessibilidade="vlibras"]');
  const estadoVlibras = document.getElementById("estado-vlibras");

  function informar(mensagem) {
    if (estadoVlibras) estadoVlibras.textContent = mensagem;
  }

  function carregarVlibras(anunciar) {
    if (document.getElementById("script-vlibras")) return;
    const script = document.createElement("script");
    script.id = "script-vlibras";
    script.src = SCRIPT_VLIBRAS;
    script.onload = () => {
      // Configuração oficial: chamada logo após o carregamento, antes da inicialização automática.
      try {
        new window.VLibras.Widget({ rootPath: "https://vlibras.gov.br/app", avatar: "random", position: "L" });
      } catch (erro) {
        console.warn("[VLibras] Configuração não aplicada:", erro);
      }
      if (anunciar) informar("VLibras ativado. O botão do VLibras aparece no lado esquerdo da tela.");
    };
    script.onerror = () => {
      script.remove();
      gravar(CHAVE_VLIBRAS, "inativo");
      botaoVlibras?.setAttribute("aria-pressed", "false");
      informar("Não foi possível carregar o VLibras. Verifique a conexão com a internet e tente de novo.");
    };
    document.body.append(script);
  }

  if (botaoVlibras) {
    const ativo = ler(CHAVE_VLIBRAS) === "ativo";
    botaoVlibras.setAttribute("aria-pressed", String(ativo));
    if (ativo) carregarVlibras(false);
    botaoVlibras.addEventListener("click", () => {
      if (botaoVlibras.getAttribute("aria-pressed") === "true") {
        gravar(CHAVE_VLIBRAS, "inativo");
        botaoVlibras.setAttribute("aria-pressed", "false");
        informar("VLibras desativado. Ele some ao recarregar ou trocar de página.");
        return;
      }
      gravar(CHAVE_VLIBRAS, "ativo");
      botaoVlibras.setAttribute("aria-pressed", "true");
      if (document.getElementById("script-vlibras")) {
        informar("VLibras ativado. O botão do VLibras aparece no lado esquerdo da tela.");
        return;
      }
      informar("Carregando o VLibras…");
      carregarVlibras(true);
    });
  }
})();
