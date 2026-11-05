// Menu móvel: em telas pequenas, o menu fica recolhido atrás do botão "Menu".
// O botão é um <button> nativo, então abre com clique, Enter e Espaço sem código extra.
// Sem JavaScript, o botão continua oculto e o menu aparece completo.
(() => {
  "use strict";

  const nav = document.querySelector(".site-nav");
  const botao = nav && nav.querySelector(".menu-toggle");
  const menu = nav && nav.querySelector(".menu");
  if (!botao || !menu) return;

  // Ativa o modo recolhível (o CSS só recolhe o menu quando esta classe existe).
  nav.classList.add("tem-menu-movel");
  botao.hidden = false;

  function definirAberto(aberto) {
    nav.classList.toggle("menu-aberto", aberto);
    botao.setAttribute("aria-expanded", String(aberto));
  }

  botao.addEventListener("click", () => {
    definirAberto(botao.getAttribute("aria-expanded") !== "true");
  });

  // Escape fecha o menu e devolve o foco ao botão, se o foco estava no menu.
  nav.addEventListener("keydown", (evento) => {
    if (evento.key !== "Escape" || botao.getAttribute("aria-expanded") !== "true") return;
    definirAberto(false);
    botao.focus();
  });

  // Ao voltar para uma tela larga, o menu fica sempre visível; reinicia o estado.
  window.matchMedia("(min-width: 701px)").addEventListener("change", (consulta) => {
    if (consulta.matches) definirAberto(false);
  });
})();
