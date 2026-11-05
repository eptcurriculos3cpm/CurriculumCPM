// Ativa verificações do JavaScript para ajudar a detectar erros de programação.
"use strict";

// Função compartilhada pelas buscas do catálogo (vercurriculos.js) e da página
// de modelos (modelo-curriculos.js). Carregar este arquivo antes desses scripts.

// Retira acentos e diferenças de maiúsculas para facilitar a busca.
// Exemplo: "  Inglês Básico " vira "ingles basico".
function normalizarTexto(texto = "") {
  return texto
    .toString()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}
