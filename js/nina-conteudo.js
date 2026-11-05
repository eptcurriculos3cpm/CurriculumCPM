// =============================================================================
// Conteúdo da Nina: textos, menus e intenções (somente dados, sem lógica).
// Para mudar uma resposta, edite apenas este arquivo. O motor fica em js/chatbot.js.
//
// A Nina é um chatbot de REGRAS: compara palavras da pergunta com as listas
// "padroes" abaixo. Não usa inteligência artificial nem serviços externos.
//
// Como os padrões funcionam (já sem acentos e em minúsculas):
//   "criar curriculo*"  -> todas as palavras precisam aparecer, em qualquer ordem;
//   "curriculo*"        -> o asterisco aceita continuações (curriculo, curriculos);
//   cada palavra do padrão vale 1 ponto; vence a intenção com mais pontos;
//   em empate, vence a de maior "prioridade".
// Ações:
//   { tipo: "link", rotulo, href }         -> link real para página do site;
//   { tipo: "intencao", rotulo, id }       -> botão que abre outra resposta;
//   { tipo: "menu", rotulo, menu }         -> botão que mostra um menu;
//   { tipo: "imprimir", rotulo }           -> salva o currículo aberto (só na página do currículo);
//   { tipo: "entrevista", rotulo }         -> inicia a simulação de entrevista (js/entrevista.js).
// No menu, { acao: "entrevista", rotulo, destaque: true } cria o botão da simulação.
// Uma intenção com "entrevista: true" também inicia a simulação.
// As perguntas e orientações da entrevista ficam em js/entrevista-perguntas.js.
// Informações institucionais: mantidas exatamente como verificadas pela equipe.
// =============================================================================
window.NinaConteudo = Object.freeze({
  config: {
    nome: "Nina",
    subtitulo: "Assistente virtual",
    // Imagem do robô (local, relativa aos HTML da raiz). Decorativa: o nome "Nina" aparece em texto.
    avatar: "img/nina-avatar.svg",
    saudacao: "Olá! Eu sou a Nina, assistente automática do Curriculum CPM. Escolha um assunto ou digite sua pergunta.",
    placeholder: "Digite sua pergunta",
    rodape: "Respostas automáticas. Outras dúvidas: eptcurriculos@gmail.com",
    naoEntendi: "Não encontrei uma resposta para isso. Tente outras palavras ou escolha um assunto abaixo. Se preferir, escreva para eptcurriculos@gmail.com.",
    tambem: "Também posso falar sobre:",
    // Intervalo (ms) do indicador "digitando"; com movimento reduzido, a resposta é imediata.
    atrasoMin: 350,
    atrasoMax: 650
  },

  // Menu inicial (botões de ação rápida) e menu secundário.
  menus: {
    inicial: [
      { acao: "entrevista", rotulo: "Simular entrevista de emprego", destaque: true },
      { id: "criar", rotulo: "Criar meu currículo" },
      { id: "dicas", rotulo: "Dicas para o primeiro emprego" },
      { id: "cursos", rotulo: "Cursos e certificados" },
      { id: "projeto", rotulo: "Conhecer o projeto" },
      { menu: "mais", rotulo: "Mais assuntos" }
    ],
    mais: [
      { id: "pdf", rotulo: "Baixar currículo em PDF" },
      { id: "enviar", rotulo: "Enviar currículo ao catálogo" },
      { id: "estudantes", rotulo: "Encontrar estudantes" },
      { id: "colegio", rotulo: "Sobre o 3º CPM" },
      { id: "tecnico", rotulo: "Curso técnico" },
      { id: "turnos", rotulo: "Turnos" },
      { id: "localizacao", rotulo: "Localização" },
      { id: "quantidade", rotulo: "Número de estudantes" },
      { id: "desafio", rotulo: "Desafio EPT" },
      { id: "contato", rotulo: "Contato da equipe" }
    ]
  },

  // Palavras ignoradas na comparação (artigos, preposições e similares).
  ignorar: ["o", "a", "os", "as", "um", "uma", "de", "do", "da", "dos", "das", "e", "em", "no", "na", "nos", "nas",
    "para", "pra", "pro", "por", "com", "que", "qual", "quais", "meu", "minha", "meus", "minhas", "me", "eu", "se",
    "ao", "aos", "voce", "vc", "tem", "ter", "ha", "sobre", "quero", "queria", "gostaria", "posso", "pode", "consigo",
    "como", "onde", "quando", "isso", "esse", "essa", "este", "esta", "ja", "mais", "muito", "favor", "porfavor"],

  intencoes: [
    {
      id: "pdf",
      prioridade: 90,
      rotulo: "Baixar currículo em PDF",
      padroes: ["pdf", "baix*", "download*", "imprim*", "impress*", "salv* curriculo*", "salv* arquivo"],
      // A resposta muda se a pessoa já está na página de um currículo carregado.
      resposta: "Você pode salvar um currículo em PDF de dois jeitos:\n• O seu: em Criar Currículo, preencha o formulário, clique em “Visualizar currículo” e depois em “Salvar em PDF”.\n• Um já publicado: abra-o em Talentos e use “Salvar como PDF”.\nNos dois casos abre a janela de impressão do navegador; em “Destino”, escolha “Salvar como PDF”. Nada é enviado.",
      acoes: [{ tipo: "link", rotulo: "Abrir Criar Currículo", href: "curriculo.html#formulario" },
              { tipo: "link", rotulo: "Abrir Talentos", href: "vercurriculos.html" }],
      naPaginaDoCurriculo: {
        resposta: "Você pode salvar este currículo agora. Na janela de impressão, escolha “Salvar como PDF”.",
        acoes: [{ tipo: "imprimir", rotulo: "Salvar este currículo em PDF" }]
      }
    },
    {
      id: "enviar",
      prioridade: 85,
      rotulo: "Enviar currículo ao catálogo",
      padroes: ["envi* curriculo*", "mand* curriculo*", "envi* catalogo", "entr* catalogo", "aparec* catalogo",
        "aparec* site", "public* curriculo*", "divulg* curriculo*", "cadastr*", "lgpd", "termo", "perfil publicado", "publicado"],
      resposta: "Para entrar no catálogo:\n1. Preencha o formulário em Criar Currículo.\n2. A equipe envia um e-mail com a confirmação dos dados e o termo da LGPD.\n3. Assine o termo e responda pelo mesmo e-mail.\n4. Depois disso, o seu perfil é publicado.\nNada é publicado automaticamente pelo formulário.",
      acoes: [{ tipo: "link", rotulo: "Ir para o formulário", href: "curriculo.html#formulario" }]
    },
    {
      id: "criar",
      prioridade: 80,
      rotulo: "Criar meu currículo",
      padroes: ["cri* curriculo*", "faz* curriculo*", "fac* curriculo*", "mont* curriculo*", "elabor* curriculo*",
        "escrev* curriculo*", "novo curriculo*", "preench*", "formulario", "dica* curriculo*"],
      resposta: "Na página Criar Currículo você encontra dicas e o formulário para preencher seus dados: contato, curso, habilidades, experiências e objetivo profissional.",
      acoes: [{ tipo: "link", rotulo: "Abrir Criar Currículo", href: "curriculo.html" },
              { tipo: "intencao", rotulo: "O que acontece depois do envio?", id: "enviar" }]
    },
    {
      id: "estudantes",
      prioridade: 75,
      rotulo: "Encontrar estudantes",
      padroes: ["ver curriculo*", "acess* curriculo*", "olhar curriculo*", "curriculo* aluno*", "curriculo* estudante*",
        "encontr* estudante*", "encontr* aluno*", "procur* estudante*", "procur* aluno*", "busc* estudante*", "busc* aluno*",
        "talento*", "catalogo", "perfis", "contrat*", "estagiari*", "recrut*", "sou empresa", "represent* empresa"],
      resposta: "Os currículos publicados estão em Talentos. Cada perfil mostra formação, competências e os contatos informados pelo estudante. Empresas podem escolher um perfil e entrar em contato por esses dados.",
      acoes: [{ tipo: "link", rotulo: "Abrir Talentos", href: "vercurriculos.html" }]
    },
    {
      id: "entrevista",
      prioridade: 95,
      rotulo: "Simular entrevista de emprego",
      padroes: ["entrevist*", "simul*", "treinar entrevista*", "praticar entrevista*", "processo* seletivo*", "recrutador*"],
      // Não tem resposta própria: inicia a simulação (textos em js/entrevista-perguntas.js).
      entrevista: true
    },
    {
      id: "dicas",
      prioridade: 70,
      rotulo: "Dicas para o primeiro emprego",
      padroes: ["primeiro emprego", "emprego*", "estagio*", "aprendiz", "trabalh*", "oportunidade*", "dica*", "mercado trabalho"],
      resposta: "Dicas para conseguir o primeiro emprego, estágio ou vaga de Jovem Aprendiz:\n• Tenha um currículo curto, de uma página, com contato atualizado.\n• Sem experiência profissional, destaque projetos da escola, cursos, voluntariado, grêmio e olimpíadas.\n• Pesquise a empresa antes de se candidatar e antes da entrevista.\n• Treine respostas para perguntas comuns de entrevista.\n• Faça cursos gratuitos para aprender e ter certificados.",
      acoes: [{ tipo: "entrevista", rotulo: "Simular entrevista" },
              { tipo: "link", rotulo: "Criar meu currículo", href: "curriculo.html" },
              { tipo: "link", rotulo: "Cursos gratuitos", href: "certificados.html" }]
    },
    {
      id: "semVagas",
      prioridade: 72,
      rotulo: "O site divulga vagas?",
      padroes: ["vaga*", "candidat*", "anuncio* emprego*", "procur* emprego*"],
      resposta: "O Curriculum CPM não divulga vagas. Aqui você pode preparar o currículo, treinar entrevistas comigo e encontrar cursos gratuitos para se preparar.",
      acoes: [{ tipo: "intencao", rotulo: "Dicas para o primeiro emprego", id: "dicas" },
              { tipo: "entrevista", rotulo: "Simular entrevista" }]
    },
    {
      id: "tecnico",
      prioridade: 66,
      rotulo: "Curso técnico",
      padroes: ["curso tecnico", "tecnico", "desenvolvimento sistema*", "integrado", "profissionalizante", "programacao",
        "disciplina*", "materia*", "grade curricular"],
      resposta: "O Curso Técnico Integrado em Desenvolvimento de Sistemas dura três anos. O estudante faz as disciplinas do Ensino Médio e, ao mesmo tempo, aulas técnicas de lógica de programação, criação de sistemas, desenvolvimento web e banco de dados.",
      acoes: [{ tipo: "intencao", rotulo: "Em qual turno?", id: "turnos" }]
    },
    {
      id: "cursos",
      prioridade: 65,
      rotulo: "Cursos e certificados",
      padroes: ["cursos", "curso* gratuito*", "curso* gratis", "curso* online", "certificad*", "capacitac*", "qualificac*", "aprender"],
      resposta: "Em Cursos há indicações de plataformas com cursos gratuitos, como Curso em Vídeo, Fundação Bradesco e Escola Virtual GOV.",
      acoes: [{ tipo: "link", rotulo: "Abrir Cursos", href: "certificados.html" }]
    },
    {
      id: "quantidade",
      prioridade: 60,
      rotulo: "Número de estudantes",
      padroes: ["quantos aluno*", "quantos estudante*", "quantidade aluno*", "quantidade estudante*", "numero aluno*",
        "numero estudante*", "matriculado*", "tamanho colegio"],
      resposta: "O colégio tem em torno de 770 a 780 alunos matriculados, entre Ensino Fundamental, Ensino Médio Regular e Ensino Médio Profissionalizante."
    },
    {
      id: "turnos",
      prioridade: 58,
      rotulo: "Turnos",
      padroes: ["turno*", "matutino", "vespertino", "noturno", "periodo*", "horario aula*", "aula* noite", "aula* manha",
        "aula* tarde", "manha", "tarde", "noite"],
      resposta: "O colégio funciona em três turnos:\n• Matutino: Ensino Médio regular.\n• Vespertino: Anos Finais (6º ao 9º ano).\n• Noturno: Ensino Médio integrado ao curso técnico de Desenvolvimento de Sistemas."
    },
    {
      id: "localizacao",
      prioridade: 57,
      rotulo: "Localização",
      padroes: ["onde fica", "fica onde", "endereco", "localizac*", "local", "chegar", "mapa", "maps", "rua", "avenida",
        "atendimento", "horario atendimento", "secretaria"],
      resposta: "O colégio fica na Av. Minas Gerais, 1295, região central de Cornélio Procópio. O atendimento é de segunda a sexta, das 7h às 18h.",
      acoes: [{ tipo: "link", rotulo: "Ver no Google Maps", href: "https://www.google.com/maps/search/?api=1&query=Av.%20Minas%20Gerais%2C%201295%2C%20Corn%C3%A9lio%20Proc%C3%B3pio%20-%20PR", externo: true }]
    },
    {
      id: "desafio",
      prioridade: 55,
      rotulo: "Desafio EPT",
      padroes: ["desafio*", "ept", "competicao", "concurso"],
      resposta: "O Desafio EPT (Educação Profissional e Tecnológica) incentiva estudantes de cursos técnicos a criar soluções para problemas reais. O Curriculum CPM foi criado no 2º Desafio EPT-PR 2026, com o tema “Ideias que inspiram, soluções que transformam”.",
      acoes: [{ tipo: "intencao", rotulo: "Quem criou o projeto?", id: "projeto" }]
    },
    {
      id: "projeto",
      prioridade: 52,
      rotulo: "Conhecer o projeto",
      padroes: ["projeto", "quem somos", "equipe", "quem fez", "quem criou", "criadora*", "alunas", "curriculum", "objetivo site",
        "proposta", "site"],
      resposta: "O Curriculum CPM foi criado por seis alunas da 2ª série E do curso técnico em Desenvolvimento de Sistemas do 3º CPM. A proposta é aproximar jovens das oportunidades: currículos, preparação para entrevistas e cursos gratuitos em um só lugar.",
      acoes: [{ tipo: "link", rotulo: "Abrir Sobre Nós", href: "quem-somos-nos.html" },
              { tipo: "intencao", rotulo: "O que é o Desafio EPT?", id: "desafio" }]
    },
    {
      id: "colegio",
      prioridade: 50,
      rotulo: "Sobre o 3º CPM",
      padroes: ["3 cpm", "terceiro cpm", "cpm", "colegio", "policia militar", "historia", "fundac*", "criado", "alberto carazzai", "escola"],
      resposta: "O 3º Colégio da Polícia Militar do Paraná foi criado pelo Decreto nº 11.334, de 15 de outubro de 2018, e começou suas atividades em 4 de fevereiro de 2019. Ele surgiu a partir do antigo Colégio Estadual Alberto Carazzai, em funcionamento desde 1970.",
      acoes: [{ tipo: "intencao", rotulo: "Onde fica?", id: "localizacao" },
              { tipo: "intencao", rotulo: "Quais são os turnos?", id: "turnos" }]
    },
    {
      id: "contato",
      prioridade: 45,
      rotulo: "Contato da equipe",
      padroes: ["contato", "email", "mail", "falar equipe", "duvida*", "suporte", "telefone", "whatsapp", "reclamac*", "sugest*"],
      resposta: "Você pode falar com a equipe do projeto pelo e-mail eptcurriculos@gmail.com.",
      acoes: [{ tipo: "link", rotulo: "Escrever e-mail", href: "mailto:eptcurriculos@gmail.com", externo: true }]
    },
    {
      id: "nina",
      prioridade: 44,
      rotulo: "Quem é a Nina",
      padroes: ["nina", "inteligencia artificial", "ia", "robo", "bot", "chatgpt", "quem e"],
      resposta: "Sou a Nina, uma assistente automática com respostas prontas sobre o Curriculum CPM. Não sou uma inteligência artificial generativa, então funciono melhor com perguntas diretas. Também conduzo uma simulação de entrevista, com perguntas e orientações preparadas pela equipe."
    },
    {
      id: "ajuda",
      prioridade: 40,
      rotulo: "Como o site funciona",
      padroes: ["funciona", "funciona site", "funcionalidade*", "fazer aqui", "usar site", "usar", "ajuda", "ajudar", "menu", "opc*", "inicio"],
      resposta: "No Curriculum CPM, estudantes criam e enviam currículos, e empresas encontram talentos do 3º CPM. O site também tem um simulador de entrevistas e indicações de cursos gratuitos. Escolha por onde começar:",
      menu: "inicial"
    },
    {
      id: "curriculo",
      prioridade: 30,
      padroes: ["curriculo*"],
      resposta: "O que você quer fazer com o currículo?",
      acoes: [{ tipo: "intencao", rotulo: "Criar meu currículo", id: "criar" },
              { tipo: "intencao", rotulo: "Enviar ao catálogo", id: "enviar" },
              { tipo: "intencao", rotulo: "Baixar em PDF", id: "pdf" },
              { tipo: "intencao", rotulo: "Ver currículos de estudantes", id: "estudantes" }]
    },
    {
      id: "obrigado",
      prioridade: 20,
      padroes: ["obrigad*", "obg", "valeu", "agradec*", "brigad*", "thanks"],
      resposta: "Por nada! Se surgir outra dúvida, é só perguntar."
    },
    {
      id: "tchau",
      prioridade: 15,
      padroes: ["tchau", "ate mais", "ate logo", "falou", "adeus", "encerrar", "sair"],
      resposta: "Até mais! Você pode abrir o chat de novo quando quiser."
    },
    {
      id: "saudacao",
      prioridade: 10,
      padroes: ["oi", "oie", "ola", "bom dia", "boa tarde", "boa noite", "ai", "opa", "hello", "hey"],
      resposta: "Olá! Como posso ajudar?",
      menu: "inicial"
    }
  ]
});
