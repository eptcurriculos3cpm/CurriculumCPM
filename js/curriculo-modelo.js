// Ativa verificações do JavaScript para ajudar a detectar erros de programação.
"use strict";

// =============================================================================
// Modelo de dados do Criador de Currículo (curriculo.html) — esquema versão 2.
// Só regras e dados: nenhuma função aqui lê ou altera a página.
// Usado pelo formulário (curriculo-formulario.js), pela prévia/PDF
// (curriculo-documento.js, curriculo-previa.js) e pela importação de JSON.
// Depende de normalizarTexto() (js/normalizar-texto.js), carregado antes.
//
// Formato do objeto "currículo" (inspirado em data/alunos-dados.json, sem os
// campos administrativos id e ativo, que só a equipe define):
// {
//   nome: "",
//   contato:      { email, cidade, telefone, linkedin, github, portfolio },
//   objetivo:     { areas: [""], tipos_oportunidade: [""], texto: "", resumo: "" },
//   formacao:     [{ curso, instituicao, periodo, situacao }],
//   habilidades:  { tecnicas: [""], comportamentais: [""] },
//   experiencias: [{ organizacao, cargo, periodo, descricao }],
//   projetos:     [{ nome, descricao, tecnologias, url }],
//   voluntariado: [{ instituicao, atividade, periodo }],
//   cursos:       [{ nome, instituicao, carga_horaria, ano, url }],
//   foto: null | { url, nome, tipo, tamanho, largura, altura }  (só local)
// }
// =============================================================================

(() => {
  // Identificação do arquivo exportado ("Exportar dados") e do rascunho.
  const ESQUEMA = "curriculum-cpm/curriculo";
  const VERSAO = 2;

  // Tamanho máximo de cada texto. Os índices das listas são ignorados:
  // "projetos.2.descricao" usa o limite de "projetos.descricao".
  const LIMITES = {
    nome: 100,
    "contato.email": 254,
    "contato.cidade": 80,
    "contato.telefone": 20,
    "contato.linkedin": 200,
    "contato.github": 200,
    "contato.portfolio": 200,
    "objetivo.areas": 120,
    "objetivo.texto": 400,
    "objetivo.resumo": 600,
    "formacao.curso": 120,
    "formacao.instituicao": 120,
    "formacao.periodo": 40,
    "formacao.situacao": 100,
    habilidade: 40,
    "experiencias.organizacao": 100,
    "experiencias.cargo": 100,
    "experiencias.periodo": 40,
    "experiencias.descricao": 500,
    "projetos.nome": 100,
    "projetos.descricao": 400,
    "projetos.tecnologias": 150,
    "projetos.url": 200,
    "voluntariado.instituicao": 100,
    "voluntariado.atividade": 150,
    "voluntariado.periodo": 40,
    "cursos.nome": 120,
    "cursos.instituicao": 100,
    "cursos.carga_horaria": 20,
    "cursos.ano": 4,
    "cursos.url": 200
  };

  // Objetivo profissional: pelo menos uma frase curta.
  const MINIMO_OBJETIVO = 30;
  // Quantidade máxima de itens em cada lista, para o currículo continuar enxuto.
  const MAX_ITENS = { experiencias: 10, projetos: 10, voluntariado: 6, cursos: 12, habilidades: 20 };
  // Campos de cada lista (a ordem é a do formulário).
  const CAMPOS_LISTA = {
    experiencias: ["organizacao", "cargo", "periodo", "descricao"],
    projetos: ["nome", "descricao", "tecnologias", "url"],
    voluntariado: ["instituicao", "atividade", "periodo"],
    cursos: ["nome", "instituicao", "carga_horaria", "ano", "url"]
  };

  // Valores fixos oferecidos no formulário (os mesmos usados no catálogo).
  const TIPOS_OPORTUNIDADE = ["Estágio", "Jovem aprendiz", "Primeiro emprego", "Trabalho efetivo", "Outras oportunidades"];
  // Sugestões de habilidades (tags); a pessoa também pode escrever outras.
  const SUGESTOES = {
    tecnicas: ["HTML", "CSS", "JavaScript", "Python", "Excel", "Git", "GitHub", "Banco de dados"],
    comportamentais: ["Comunicação", "Criatividade", "Organização", "Trabalho em equipe", "Resolução de problemas", "Proatividade"]
  };
  // Modelos de currículo (mesmos dados, aparências diferentes).
  const MODELOS = { moderno: "Moderno", classico: "Clássico" };

  // Fotografia: só fica no navegador; nunca vai para o Formspree, o rascunho ou o arquivo exportado.
  const FOTO = {
    tipos: ["image/jpeg", "image/png", "image/webp"],
    tamanhoMaximo: 5 * 1024 * 1024,
    ladoMinimo: 200
  };

  // ---------------------------------------------------------------------------
  // Funções auxiliares
  // ---------------------------------------------------------------------------

  // Texto sem espaços sobrando; qualquer outro tipo de valor vira texto vazio.
  function limpar(valor) {
    return typeof valor === "string" ? valor.replace(/\s+/g, " ").trim() : "";
  }

  // Igual a limpar(), mas mantém as quebras de linha dos textos longos.
  function limparTextoLongo(valor) {
    if (typeof valor !== "string") return "";
    return valor.split("\n").map((linha) => linha.replace(/[ \t]+/g, " ").trim()).join("\n").replace(/\n{3,}/g, "\n\n").trim();
  }

  function lista(valor) {
    return Array.isArray(valor) ? valor : [];
  }

  // Chave para comparar textos sem acentos e sem maiúsculas ("Inglês" = "ingles").
  function chave(texto) {
    return normalizarTexto(limpar(texto));
  }

  // Limite de um campo a partir do caminho, ignorando a posição na lista.
  function limiteDe(caminho) {
    if (/^habilidades\./.test(caminho)) return LIMITES.habilidade;
    return LIMITES[caminho.replace(/\.\d+(?=\.|$)/g, "")];
  }

  // Um item de lista sem nenhum valor preenchido é ignorado (linha em branco).
  function itemVazio(item) {
    return !item || Object.values(item).every((valor) => !limpar(String(valor ?? "")));
  }

  // Acrescenta "https://" quando a pessoa digitou só o domínio ("github.com/fulano").
  function completarUrl(valor) {
    const texto = limpar(valor);
    if (!texto || /^[a-z][a-z0-9+.-]*:/i.test(texto)) return texto;
    return `https://${texto.replace(/^\/+/, "")}`;
  }

  // Endereço da web válido (http ou https). Com "dominio", exige esse site.
  function urlValida(valor, dominio) {
    let url;
    try {
      url = new URL(completarUrl(valor));
    } catch {
      return false;
    }
    if (url.protocol !== "https:" && url.protocol !== "http:") return false;
    if (!url.hostname.includes(".")) return false;
    if (dominio) return url.hostname === dominio || url.hostname.endsWith(`.${dominio}`);
    return true;
  }

  // Só os dígitos do telefone, sem o código do país (55) quando ele foi digitado.
  function digitosTelefone(valor) {
    let digitos = limpar(valor).replace(/\D/g, "");
    if ((digitos.length === 12 || digitos.length === 13) && digitos.startsWith("55")) digitos = digitos.slice(2);
    return digitos;
  }

  // Formata o telefone brasileiro: (43) 99999-9999 ou (43) 3333-3333.
  function formatarTelefone(valor) {
    const d = digitosTelefone(valor);
    if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
    if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return limpar(valor);
  }

  // "Desenvolvimento web, Suporte técnico" vira ["Desenvolvimento web", "Suporte técnico"].
  function separarAreas(valor) {
    return limpar(valor).split(/[,;]/).map((parte) => parte.trim()).filter(Boolean);
  }

  // Remove repetições ignorando acentos e maiúsculas; mantém a primeira grafia.
  function semRepetir(textos) {
    const vistos = new Set();
    return textos.map(limpar).filter((texto) => {
      const k = chave(texto);
      if (!k || vistos.has(k)) return false;
      vistos.add(k);
      return true;
    });
  }

  function formatarTamanho(bytes) {
    return bytes >= 1024 * 1024
      ? `${(bytes / (1024 * 1024)).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} MB`
      : `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  // ---------------------------------------------------------------------------
  // Validação
  // ---------------------------------------------------------------------------

  // Confere o currículo como foi digitado (antes de normalizar) e devolve uma
  // lista de erros { campo, mensagem }. "campo" é o caminho do dado, por exemplo
  // "contato.email" ou "projetos.1.nome" (a posição conta a partir de 0,
  // incluindo linhas em branco, para o erro aparecer no item certo).
  function validarCurriculo(bruto = {}) {
    const erros = [];
    const anoAtual = new Date().getFullYear();

    function erro(campo, mensagem) {
      erros.push({ campo, mensagem });
    }

    // Regras comuns: obrigatório e tamanho máximo. Devolve o texto limpo,
    // ou "" quando já houve erro (para não acumular mensagens no mesmo campo).
    function texto(caminho, valor, mensagemObrigatorio, longo = false) {
      const limpo = longo ? limparTextoLongo(valor) : limpar(valor);
      const limite = limiteDe(caminho);
      if (!limpo) {
        if (mensagemObrigatorio) erro(caminho, mensagemObrigatorio);
        return "";
      }
      if (limite && limpo.length > limite) {
        erro(caminho, `Use no máximo ${limite} caracteres. Agora há ${limpo.length}.`);
        return "";
      }
      return limpo;
    }

    function url(caminho, valor, dominio, exemplo) {
      const limpo = texto(caminho, valor);
      if (limpo && !urlValida(limpo, dominio)) {
        erro(caminho, dominio
          ? `Use o endereço do seu perfil no ${exemplo.site}, como ${exemplo.url}.`
          : "Escreva um endereço completo, como https://site.com/pagina.");
      }
    }

    // Dados pessoais e contato.
    const nome = texto("nome", bruto.nome, "Informe seu nome completo.");
    if (nome) {
      if (!/^[\p{L}][\p{L}'’\- ]*$/u.test(nome)) erro("nome", "Use apenas letras, espaços, hífen ou apóstrofo.");
      else if (nome.split(" ").filter((parte) => parte.length > 1).length < 2) erro("nome", "Escreva nome e sobrenome.");
    }

    const contato = bruto.contato || {};
    const email = texto("contato.email", contato.email, "Informe seu e-mail.");
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@.]{2,}$/.test(email)) {
      erro("contato.email", "Escreva um e-mail válido, como nome.sobrenome@gmail.com.");
    }
    texto("contato.cidade", contato.cidade, "Informe a cidade e o estado.");
    const telefone = texto("contato.telefone", contato.telefone);
    if (telefone) {
      const digitos = digitosTelefone(telefone);
      if (!/^[1-9][0-9]\d{8,9}$/.test(digitos)) erro("contato.telefone", "Escreva o telefone com DDD, como (43) 99999-9999.");
    }
    url("contato.linkedin", contato.linkedin, "linkedin.com", { site: "LinkedIn", url: "https://www.linkedin.com/in/seu-nome" });
    url("contato.github", contato.github, "github.com", { site: "GitHub", url: "https://github.com/seu-usuario" });
    url("contato.portfolio", contato.portfolio);

    // Objetivo profissional.
    const objetivo = bruto.objetivo || {};
    texto("objetivo.areas", objetivo.areas, "Informe pelo menos uma área de interesse.");
    const tipos = lista(objetivo.tipos_oportunidade).map(limpar).filter(Boolean);
    if (!tipos.length) erro("objetivo.tipos_oportunidade", "Marque pelo menos um tipo de oportunidade.");
    else if (tipos.some((tipo) => !TIPOS_OPORTUNIDADE.includes(tipo))) erro("objetivo.tipos_oportunidade", "Escolha entre as opções da lista.");
    const textoObjetivo = texto("objetivo.texto", objetivo.texto, "Escreva seu objetivo profissional.", true);
    if (textoObjetivo && textoObjetivo.length < MINIMO_OBJETIVO) {
      erro("objetivo.texto", `Escreva pelo menos uma frase completa (mínimo de ${MINIMO_OBJETIVO} caracteres).`);
    }
    texto("objetivo.resumo", objetivo.resumo, "", true);

    // Formação principal (o formulário tem uma; a lista permite mais no futuro).
    lista(bruto.formacao).forEach((formacao, i) => {
      if (i > 0 && itemVazio(formacao)) return;
      const base = `formacao.${i}`;
      texto(`${base}.curso`, formacao?.curso, "Informe o curso.");
      texto(`${base}.instituicao`, formacao?.instituicao, "Informe a instituição de ensino.");
      texto(`${base}.periodo`, formacao?.periodo);
      texto(`${base}.situacao`, formacao?.situacao, "Informe se está cursando, a série ou a previsão de conclusão.");
    });
    if (!lista(bruto.formacao).length) erro("formacao.0.curso", "Informe o curso.");

    // Habilidades (tags): pelo menos uma no total.
    const habilidades = bruto.habilidades || {};
    const tecnicas = lista(habilidades.tecnicas).map(limpar).filter(Boolean);
    const comportamentais = lista(habilidades.comportamentais).map(limpar).filter(Boolean);
    if (!tecnicas.length && !comportamentais.length) erro("habilidades", "Escolha ou escreva pelo menos uma habilidade.");
    for (const [grupo, tags] of [["tecnicas", tecnicas], ["comportamentais", comportamentais]]) {
      if (tags.length > MAX_ITENS.habilidades) erro(`habilidades.${grupo}`, `Use no máximo ${MAX_ITENS.habilidades} habilidades neste grupo.`);
      if (tags.some((tag) => tag.length > LIMITES.habilidade)) erro(`habilidades.${grupo}`, `Cada habilidade pode ter até ${LIMITES.habilidade} caracteres.`);
    }

    // Experiências profissionais: opcionais; um item começado precisa de cargo e organização.
    lista(bruto.experiencias).forEach((item, i) => {
      if (itemVazio(item)) return;
      const base = `experiencias.${i}`;
      texto(`${base}.organizacao`, item.organizacao, "Informe a empresa ou organização.");
      texto(`${base}.cargo`, item.cargo, "Informe o cargo ou a atividade.");
      texto(`${base}.periodo`, item.periodo);
      texto(`${base}.descricao`, item.descricao, "", true);
    });

    // Projetos: opcionais; um item começado precisa de nome.
    lista(bruto.projetos).forEach((item, i) => {
      if (itemVazio(item)) return;
      const base = `projetos.${i}`;
      texto(`${base}.nome`, item.nome, "Escreva o nome do projeto ou remova este item.");
      texto(`${base}.descricao`, item.descricao, "", true);
      texto(`${base}.tecnologias`, item.tecnologias);
      url(`${base}.url`, item.url);
    });

    // Trabalho voluntário: opcional; um item começado precisa de instituição e atividade.
    lista(bruto.voluntariado).forEach((item, i) => {
      if (itemVazio(item)) return;
      const base = `voluntariado.${i}`;
      texto(`${base}.instituicao`, item.instituicao, "Informe a instituição.");
      texto(`${base}.atividade`, item.atividade, "Descreva a atividade.");
      texto(`${base}.periodo`, item.periodo);
    });

    // Cursos e certificados: opcionais; um item começado precisa de nome, instituição e ano.
    lista(bruto.cursos).forEach((item, i) => {
      if (itemVazio(item)) return;
      const base = `cursos.${i}`;
      texto(`${base}.nome`, item.nome, "Escreva o nome do curso ou remova este item.");
      texto(`${base}.instituicao`, item.instituicao, "Informe a instituição ou plataforma.");
      texto(`${base}.carga_horaria`, item.carga_horaria);
      const ano = limpar(item.ano);
      if (!ano) erro(`${base}.ano`, "Informe o ano de conclusão.");
      else if (!/^\d{4}$/.test(ano) || Number(ano) < 1950 || Number(ano) > anoAtual + 1) {
        erro(`${base}.ano`, `Escreva o ano com 4 algarismos, até ${anoAtual + 1}.`);
      }
      url(`${base}.url`, item.url);
    });

    return erros;
  }

  // Confere a foto escolhida. Recebe { nome, tipo, tamanho, largura, altura };
  // largura 0 significa que o navegador não conseguiu abrir a imagem.
  // Devolve a mensagem de erro ou "" quando a foto pode ser usada.
  function validarFoto(foto) {
    if (!foto) return "";
    if (!FOTO.tipos.includes(foto.tipo)) return "Escolha uma imagem JPG, PNG ou WebP.";
    if (foto.tamanho > FOTO.tamanhoMaximo) {
      return `A imagem tem ${formatarTamanho(foto.tamanho)}. Escolha uma de até ${formatarTamanho(FOTO.tamanhoMaximo)}.`;
    }
    if (!foto.largura || !foto.altura) return "Não foi possível abrir esta imagem. Escolha outro arquivo.";
    if (Math.min(foto.largura, foto.altura) < FOTO.ladoMinimo) {
      return `A imagem é pequena demais (${foto.largura}×${foto.altura} px). Use uma com pelo menos ${FOTO.ladoMinimo}×${FOTO.ladoMinimo} px.`;
    }
    return "";
  }

  // ---------------------------------------------------------------------------
  // Normalização
  // ---------------------------------------------------------------------------

  function normalizarLista(nome, bruto, tratar) {
    return lista(bruto[nome]).filter((item) => !itemVazio(item)).map(tratar);
  }

  // Devolve um currículo limpo: textos sem espaços sobrando, links completos,
  // telefone formatado, áreas separadas, tags sem repetição e itens em branco removidos.
  // Usar depois de validarCurriculo() não ter apontado erros.
  function normalizarCurriculo(bruto = {}) {
    const contato = bruto.contato || {};
    const objetivo = bruto.objetivo || {};
    const habilidades = bruto.habilidades || {};
    const tecnicas = semRepetir(lista(habilidades.tecnicas));
    const chavesTecnicas = new Set(tecnicas.map(chave));
    return {
      nome: limpar(bruto.nome),
      contato: {
        email: limpar(contato.email),
        cidade: limpar(contato.cidade),
        telefone: formatarTelefone(contato.telefone),
        linkedin: completarUrl(contato.linkedin),
        github: completarUrl(contato.github),
        portfolio: completarUrl(contato.portfolio)
      },
      objetivo: {
        areas: separarAreas(objetivo.areas),
        tipos_oportunidade: TIPOS_OPORTUNIDADE.filter((tipo) => lista(objetivo.tipos_oportunidade).includes(tipo)),
        texto: limparTextoLongo(objetivo.texto),
        resumo: limparTextoLongo(objetivo.resumo)
      },
      formacao: normalizarLista("formacao", bruto, (item) => ({
        curso: limpar(item.curso),
        instituicao: limpar(item.instituicao),
        periodo: limpar(item.periodo),
        situacao: limpar(item.situacao)
      })),
      habilidades: {
        tecnicas,
        // Uma mesma habilidade não aparece nos dois grupos.
        comportamentais: semRepetir(lista(habilidades.comportamentais)).filter((tag) => !chavesTecnicas.has(chave(tag)))
      },
      experiencias: normalizarLista("experiencias", bruto, (item) => ({
        organizacao: limpar(item.organizacao),
        cargo: limpar(item.cargo),
        periodo: limpar(item.periodo),
        descricao: limparTextoLongo(item.descricao)
      })),
      projetos: normalizarLista("projetos", bruto, (item) => ({
        nome: limpar(item.nome),
        descricao: limparTextoLongo(item.descricao),
        tecnologias: limpar(item.tecnologias),
        url: completarUrl(item.url)
      })),
      voluntariado: normalizarLista("voluntariado", bruto, (item) => ({
        instituicao: limpar(item.instituicao),
        atividade: limpar(item.atividade),
        periodo: limpar(item.periodo)
      })),
      cursos: normalizarLista("cursos", bruto, (item) => ({
        nome: limpar(item.nome),
        instituicao: limpar(item.instituicao),
        carga_horaria: limpar(item.carga_horaria),
        ano: limpar(item.ano),
        url: completarUrl(item.url)
      })),
      // A foto só existe no navegador; as conversões abaixo nunca a incluem.
      foto: bruto.foto && bruto.foto.url ? { ...bruto.foto } : null
    };
  }

  // ---------------------------------------------------------------------------
  // Versão 1 → versão 2 e importação segura
  // ---------------------------------------------------------------------------

  // Rascunhos e arquivos da versão 1 tinham "competencias" e uma lista única de
  // "experiencias" com um campo "tipo". Converte para o formato atual.
  function migrarV1(dados) {
    const v2 = { ...dados };
    if (Array.isArray(dados.competencias) && !dados.habilidades) {
      const sugestoesComportamentais = new Set(SUGESTOES.comportamentais.map(chave));
      const nomes = dados.competencias.map((c) => limpar(c?.nome)).filter(Boolean);
      v2.habilidades = {
        tecnicas: nomes.filter((n) => !sugestoesComportamentais.has(chave(n))),
        comportamentais: nomes.filter((n) => sugestoesComportamentais.has(chave(n)))
      };
    }
    if (Array.isArray(dados.experiencias) && dados.experiencias.some((e) => e && "tipo" in e)) {
      const antigas = dados.experiencias.filter(Boolean);
      v2.experiencias = antigas.filter((e) => e.tipo === "profissional")
        .map((e) => ({ organizacao: e.organizacao, cargo: e.titulo, periodo: e.periodo, descricao: e.descricao }));
      v2.projetos = [...lista(dados.projetos), ...antigas.filter((e) => e.tipo === "projeto" || e.tipo === "atividade")
        .map((e) => ({ nome: e.titulo, descricao: [e.organizacao, e.descricao].filter((t) => limpar(t)).join(" — "), tecnologias: "", url: e.url }))];
      v2.voluntariado = [...lista(dados.voluntariado), ...antigas.filter((e) => e.tipo === "voluntario")
        .map((e) => ({ instituicao: e.organizacao, atividade: [e.titulo, e.descricao].filter((t) => limpar(t)).join(" — "), periodo: e.periodo }))];
    }
    return v2;
  }

  // Copia SOMENTE os campos esperados, como texto, de dados de origem desconhecida
  // (arquivo importado ou rascunho). Propriedades extras são ignoradas; nada é
  // executado. Textos acima de 4 vezes o limite são cortados (os limites reais
  // são conferidos depois pela validação, que mostra o erro no campo).
  function sanitizarDados(origem) {
    if (!origem || typeof origem !== "object" || Array.isArray(origem)) throw new TypeError("O arquivo não contém um currículo.");
    const d = migrarV1(origem);
    const t = (valor, limite = 1000) => (typeof valor === "string" ? valor.slice(0, limite * 4) : "");
    const lim = (caminho) => limiteDe(caminho) || 200;
    const objeto = (valor) => (valor && typeof valor === "object" && !Array.isArray(valor) ? valor : {});
    const itens = (nome) => lista(d[nome]).slice(0, MAX_ITENS[nome] || 1).map((item) => {
      const fonte = objeto(item);
      const limpoItem = {};
      for (const campo of CAMPOS_LISTA[nome]) limpoItem[campo] = t(fonte[campo], lim(`${nome}.${campo}`));
      return limpoItem;
    });
    const contato = objeto(d.contato);
    const objetivo = objeto(d.objetivo);
    const habilidades = objeto(d.habilidades);
    const formacao = objeto(lista(d.formacao)[0]);
    const tags = (valor) => lista(valor).filter((v) => typeof v === "string").slice(0, MAX_ITENS.habilidades).map((v) => v.slice(0, LIMITES.habilidade * 4));
    return {
      nome: t(d.nome, LIMITES.nome),
      contato: {
        email: t(contato.email, lim("contato.email")),
        cidade: t(contato.cidade, lim("contato.cidade")),
        telefone: t(contato.telefone, lim("contato.telefone")),
        linkedin: t(contato.linkedin, lim("contato.linkedin")),
        github: t(contato.github, lim("contato.github")),
        portfolio: t(contato.portfolio, lim("contato.portfolio"))
      },
      objetivo: {
        // Aceita as áreas como texto (formulário) ou como lista (currículo normalizado).
        areas: Array.isArray(objetivo.areas) ? objetivo.areas.filter((a) => typeof a === "string").join(", ").slice(0, 480) : t(objetivo.areas, 120),
        tipos_oportunidade: lista(objetivo.tipos_oportunidade).filter((tipo) => TIPOS_OPORTUNIDADE.includes(tipo)),
        texto: t(objetivo.texto, LIMITES["objetivo.texto"]),
        resumo: t(objetivo.resumo, LIMITES["objetivo.resumo"])
      },
      formacao: [{
        curso: t(formacao.curso, 120),
        instituicao: t(formacao.instituicao, 120),
        periodo: t(formacao.periodo, 40),
        situacao: t(formacao.situacao, 100)
      }],
      habilidades: { tecnicas: tags(habilidades.tecnicas), comportamentais: tags(habilidades.comportamentais) },
      experiencias: itens("experiencias"),
      projetos: itens("projetos"),
      voluntariado: itens("voluntariado"),
      cursos: itens("cursos"),
      foto: null
    };
  }

  // Lê o texto de um arquivo exportado. Lança um erro com mensagem clara se o
  // arquivo não for um JSON válido do Curriculum CPM.
  function lerArquivoExportado(texto) {
    let conteudo;
    try {
      conteudo = JSON.parse(texto);
    } catch {
      throw new Error("O arquivo não é um JSON válido.");
    }
    if (!conteudo || conteudo.esquema !== ESQUEMA) throw new Error("O arquivo não foi exportado pelo Curriculum CPM.");
    if (!Number.isInteger(conteudo.versao) || conteudo.versao < 1 || conteudo.versao > VERSAO) {
      throw new Error("A versão deste arquivo não é compatível com o site.");
    }
    return sanitizarDados(conteudo.dados);
  }

  // Monta o conteúdo do arquivo "Exportar dados" (sem a foto).
  function criarArquivoExportado(bruto) {
    return JSON.stringify({
      esquema: ESQUEMA,
      versao: VERSAO,
      exportadoEm: new Date().toISOString(),
      dados: { ...bruto, foto: null }
    }, null, 2);
  }

  // ---------------------------------------------------------------------------
  // Conversões para o Formspree e para o catálogo
  // ---------------------------------------------------------------------------

  const juntar = (partes, separador = " — ") => partes.filter(Boolean).join(separador);

  // Campos enviados ao Formspree na solicitação de publicação. Os nomes antigos do
  // formulário foram mantidos (nome_completo, email, linkedin, github, curso, ano,
  // habilidades, experiencias, objetivo_profissional); "curriculo_json" leva os
  // dados estruturados para a equipe. A foto nunca entra aqui.
  function paraFormspree(curriculo) {
    const c = curriculo;
    const formacao = c.formacao[0] || {};
    return {
      nome_completo: c.nome,
      email: c.contato.email,
      cidade: c.contato.cidade,
      telefone: c.contato.telefone,
      linkedin: c.contato.linkedin,
      github: c.contato.github,
      portfolio: c.contato.portfolio,
      area_interesse: c.objetivo.areas.join(", "),
      tipos_oportunidade: c.objetivo.tipos_oportunidade.join(", "),
      objetivo_profissional: c.objetivo.texto,
      resumo_profissional: c.objetivo.resumo,
      curso: formacao.curso || "",
      instituicao: formacao.instituicao || "",
      periodo: formacao.periodo || "",
      ano: formacao.situacao || "",
      habilidades: juntar([
        c.habilidades.tecnicas.length ? `Técnicas: ${c.habilidades.tecnicas.join(", ")}` : "",
        c.habilidades.comportamentais.length ? `Comportamentais: ${c.habilidades.comportamentais.join(", ")}` : ""
      ], "\n"),
      experiencias: c.experiencias.map((e) => juntar([juntar([e.cargo, e.organizacao]) + (e.periodo ? ` (${e.periodo})` : ""), e.descricao], "\n")).join("\n\n"),
      projetos: c.projetos.map((p) => juntar([p.nome, p.descricao, p.tecnologias ? `Tecnologias: ${p.tecnologias}` : "", p.url], "\n")).join("\n\n"),
      voluntariado: c.voluntariado.map((v) => juntar([v.atividade, v.instituicao]) + (v.periodo ? ` (${v.periodo})` : "")).join("\n"),
      cursos_certificados: c.cursos.map((k) => juntar([juntar([k.nome, k.instituicao]) + ` (${juntar([k.ano, k.carga_horaria], ", ")})`, k.url], "\n")).join("\n\n"),
      curriculo_json: JSON.stringify(paraCatalogo(c), null, 2)
    };
  }

  // Rascunho de registro no formato de data/alunos-dados.json, para a equipe
  // conferir e completar manualmente. Não inclui id, ativo, turma, titulo nem
  // foto (decisões da equipe) e deixa e-mail e telefone de fora da publicação.
  function paraCatalogo(curriculo) {
    const c = curriculo;
    const tags = [...c.habilidades.tecnicas, ...c.habilidades.comportamentais];
    const links = [
      c.contato.github ? { tipo: "github", url: c.contato.github } : null,
      c.contato.portfolio ? { tipo: "portfolio", url: c.contato.portfolio } : null,
      c.contato.linkedin ? { tipo: "linkedin", url: c.contato.linkedin } : null
    ].filter(Boolean);
    return {
      nome: c.nome,
      area: c.objetivo.areas.join(" / "),
      contato: { cidade: c.contato.cidade, github: c.contato.github },
      sobre: c.objetivo.resumo || c.objetivo.texto,
      interesses_profissionais: [...c.objetivo.areas],
      tipos_oportunidade: [...c.objetivo.tipos_oportunidade],
      habilidades_tecnicas: [...c.habilidades.tecnicas],
      habilidades_comportamentais: [...c.habilidades.comportamentais],
      competencias: tags.map((nome) => ({ nome })),
      formacao: [
        ...c.formacao.map((f) => ({ curso: f.curso, instituicao: f.instituicao, periodo: juntar([f.periodo, f.situacao]) })),
        ...c.cursos.map((k) => ({ curso: k.nome, instituicao: k.instituicao, periodo: juntar([k.ano, k.carga_horaria], " · ") }))
      ],
      experiencias: [
        ...c.experiencias.map((e) => ({ cargo: e.cargo, empresa: e.organizacao, periodo: e.periodo, descricao: e.descricao })),
        ...c.voluntariado.map((v) => ({ cargo: v.atividade, empresa: `${v.instituicao} (trabalho voluntário)`, periodo: v.periodo, descricao: "" }))
      ],
      projetos: c.projetos.map((p) => ({ nome: p.nome, descricao: juntar([p.descricao, p.tecnologias ? `Tecnologias: ${p.tecnologias}` : ""]), url: p.url })),
      links
    };
  }

  // Disponibiliza as regras para os outros scripts, sem permitir alterações.
  window.CurriculoModelo = Object.freeze({
    ESQUEMA, VERSAO, LIMITES, MAX_ITENS, CAMPOS_LISTA, MINIMO_OBJETIVO, TIPOS_OPORTUNIDADE, SUGESTOES, MODELOS, FOTO,
    limiteDe, itemVazio, completarUrl, formatarTelefone, formatarTamanho, chave, semRepetir,
    validarCurriculo, validarFoto, normalizarCurriculo, sanitizarDados, lerArquivoExportado, criarArquivoExportado,
    paraFormspree, paraCatalogo
  });
})();
