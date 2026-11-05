// Ativa verificações do JavaScript para ajudar a detectar erros de programação.
"use strict";

// =============================================================================
// Currículo individual (curriculo-aluno.html): contato intermediado com
// recrutadores e pedido de correção/retirada de dados.
//
// - "Tenho interesse neste candidato" só aparece quando o registro do JSON tem
//   "contato_intermediado": true (decisão da equipe, com autorização do estudante).
// - A mensagem vai para a EQUIPE (Formspree, mesmo endereço já usado pelo site,
//   identificada por "tipo_solicitacao" e pelo assunto). Nenhum dado pessoal do
//   estudante é exibido ou enviado ao recrutador.
// - Esta seção fica fora da folha A4: não aparece no PDF.
// Recebe os dados do currículo pelo evento "curriculo:carregado" (curriculo-aluno.js).
// =============================================================================
(() => {
  const secao = document.getElementById("contato-recrutador");
  if (!secao) return;
  const el = {
    bloco: document.getElementById("bloco-interesse"),
    abrir: document.getElementById("abrir-interesse"),
    form: document.getElementById("form-interesse"),
    enviar: document.getElementById("enviar-interesse"),
    estado: document.getElementById("estado-interesse"),
    correcao: document.getElementById("link-correcao")
  };
  let enviando = false;

  // Regras de cada campo: [id, mensagem quando vazio, validação extra].
  const CAMPOS = [
    ["interesse-nome", "Informe seu nome."],
    ["interesse-empresa", "Informe a empresa."],
    ["interesse-email", "Informe seu e-mail profissional.", (v) => (/^[^\s@]+@[^\s@]+\.[^\s@.]{2,}$/.test(v) ? "" : "Escreva um e-mail válido, como nome@empresa.com.br.")],
    ["interesse-mensagem", "Escreva uma mensagem.", (v) => (v.length < 20 ? "Escreva pelo menos 20 caracteres." : "")]
  ];

  function mostrarErro(campo, mensagem) {
    const idErro = `${campo.id}-erro`;
    let caixa = document.getElementById(idErro);
    if (!mensagem) {
      caixa?.remove();
      campo.removeAttribute("aria-invalid");
      campo.setAttribute("aria-describedby", (campo.getAttribute("aria-describedby") || "").replace(idErro, "").trim());
      if (!campo.getAttribute("aria-describedby")) campo.removeAttribute("aria-describedby");
      return;
    }
    if (!caixa) {
      caixa = document.createElement("p");
      caixa.id = idErro;
      caixa.className = "erro-interesse";
      campo.before(caixa);
      campo.setAttribute("aria-describedby", [idErro, campo.getAttribute("aria-describedby")].filter(Boolean).join(" "));
    }
    caixa.textContent = `Erro: ${mensagem}`;
    campo.setAttribute("aria-invalid", "true");
  }

  function validar() {
    let primeiro = null;
    for (const [id, vazio, extra] of CAMPOS) {
      const campo = document.getElementById(id);
      const valor = campo.value.trim();
      const mensagem = !valor ? vazio : extra ? extra(valor) : "";
      mostrarErro(campo, mensagem);
      if (mensagem && !primeiro) primeiro = campo;
    }
    return primeiro;
  }

  function mostrarEstado(mensagem, tipo = "") {
    el.estado.textContent = mensagem;
    el.estado.className = `estado-interesse${tipo ? ` estado-interesse--${tipo}` : ""}`;
  }

  async function enviar(evento) {
    evento.preventDefault();
    if (enviando) return;
    const invalido = validar();
    if (invalido) {
      invalido.focus();
      return;
    }
    enviando = true;
    el.enviar.disabled = true;
    el.enviar.textContent = "Enviando…";
    mostrarEstado("Enviando…");
    try {
      const resposta = await fetch(el.form.action, { method: "POST", body: new FormData(el.form), headers: { Accept: "application/json" } });
      if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
      el.enviar.textContent = "Interesse enviado";
      mostrarEstado("Recebemos seu interesse. A equipe do Curriculum CPM vai analisar a mensagem e encaminhar o contato ao estudante.", "sucesso");
    } catch (erro) {
      console.warn("[Interesse de recrutador] Falha no envio:", erro);
      el.enviar.disabled = false;
      el.enviar.textContent = "Tentar novamente";
      mostrarEstado("Não foi possível enviar agora. Verifique a conexão e tente novamente.", "erro");
    } finally {
      enviando = false;
      el.estado.focus();
    }
  }

  // Dados do currículo carregado: identifica a solicitação e o pedido de correção.
  document.addEventListener("curriculo:carregado", (evento) => {
    const { id, nome, contatoIntermediado } = evento.detail;
    secao.hidden = false;
    el.form.elements.namedItem("curriculo_id").value = id;
    el.form.elements.namedItem("curriculo_nome").value = nome;
    el.form.elements.namedItem("_subject").value = `Interesse de recrutador: ${nome} (${id})`;
    el.correcao.href = `mailto:eptcurriculos@gmail.com?subject=${encodeURIComponent(`Correção ou retirada de currículo: ${id}`)}`;
    el.bloco.hidden = !contatoIntermediado;
  });

  el.abrir.addEventListener("click", () => {
    const abrir = el.form.hidden;
    el.form.hidden = !abrir;
    el.abrir.setAttribute("aria-expanded", String(abrir));
    if (abrir) document.getElementById("interesse-nome").focus();
  });
  el.form.addEventListener("submit", enviar);
})();
