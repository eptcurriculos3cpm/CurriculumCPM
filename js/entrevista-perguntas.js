// =============================================================================
// Simulação de entrevista da Nina: textos, perguntas e orientações (somente dados).
// Para mudar uma pergunta ou dica, edite apenas este arquivo.
// A lógica (etapas da simulação) fica em js/entrevista.js.
//
// As orientações são GERAIS para cada pergunta: a Nina não analisa nem avalia
// o que a pessoa escreveu. Não escrever textos que pareçam uma correção
// personalizada ("sua resposta foi ótima", notas etc.).
//
// Cada modalidade lista 5 perguntas pelo identificador. Uma pergunta comum pode
// ter um complemento por modalidade em "porModalidade".
// =============================================================================
window.NinaEntrevistaPerguntas = Object.freeze({
  introducao: "Olá! Eu sou a Nina e vou ajudar você a se preparar para uma entrevista de emprego.\n\nVou fazer cinco perguntas comuns em processos seletivos. Responda como se estivesse conversando com um recrutador.\n\nDepois de cada resposta, mostro orientações para você melhorar sua preparação. Suas respostas não são guardadas nem enviadas.\n\nVamos começar?",
  escolhaModalidade: "Para qual tipo de oportunidade você quer treinar?",
  // Mostrada quando a resposta tem poucas palavras (critério objetivo: contagem de palavras).
  minimoPalavras: 8,
  respostaCurta: "Observação: sua resposta tem {n} {palavras}. Em uma entrevista, procure desenvolver a ideia em duas ou três frases e, se puder, dê um exemplo.",
  aposResposta: "Resposta registrada. Orientação para esta pergunta:",
  usarBotoes: "Durante a simulação, use os botões abaixo para continuar ou sair.",
  saida: "Simulação encerrada. As respostas foram descartadas.",

  conclusao: {
    mensagem: "Parabéns por concluir a simulação!\n\nPraticar entrevistas ajuda você a organizar suas ideias, melhorar sua comunicação e chegar mais preparado às oportunidades profissionais.",
    titulo: "Recomendações para a próxima entrevista:",
    recomendacoes: [
      "Clareza na comunicação: responda em duas ou três frases, com começo, meio e fim. Treine em voz alta antes.",
      "Postura profissional: chegue com antecedência, use roupa adequada ao ambiente, olhe para quem entrevista e deixe o celular no silencioso. Em entrevistas on-line, teste câmera, áudio e internet antes.",
      "Conhecimento sobre a empresa: pesquise o que ela faz e prepare uma pergunta para fazer no final.",
      "Experiências escolares: trabalhos em grupo, feiras, grêmio, olimpíadas e monitoria mostram responsabilidade e trabalho em equipe.",
      "Projetos e cursos: use-os como exemplos de competências. Diga o que você fez e o que aprendeu, como um site criado no curso técnico ou um certificado de curso gratuito."
    ],
    privacidade: "Suas respostas não foram guardadas nem enviadas. Para apagar esta conversa da tela, use o botão Recomeçar, no topo do chat."
  },

  modalidades: [
    {
      id: "aprendiz",
      rotulo: "Jovem Aprendiz",
      abertura: "Simulação para Jovem Aprendiz. O programa combina trabalho e formação, por isso as perguntas falam de aprendizado, responsabilidade e rotina de estudos.",
      perguntas: ["apresentacao", "aprendizMotivo", "pontosFortes", "equipe", "aprendizConciliar"],
      dicaFinal: "Para Jovem Aprendiz, mostre vontade de aprender e organização para conciliar escola e trabalho."
    },
    {
      id: "estagio",
      rotulo: "Estágio",
      abertura: "Simulação para Estágio. O estágio é uma etapa de aprendizado ligada ao seu curso, por isso as perguntas falam da sua área e do que você já estudou.",
      perguntas: ["apresentacao", "estagioArea", "estagioConhecimentos", "equipe", "boaEscolha"],
      dicaFinal: "Para estágio, ligue suas respostas ao que você aprende no curso e mostre o que quer desenvolver."
    },
    {
      id: "primeiro",
      rotulo: "Primeiro Emprego",
      abertura: "Simulação para Primeiro Emprego. As perguntas consideram que você ainda não tem experiência profissional, e isso não é um problema.",
      perguntas: ["apresentacao", "empresa", "pontosFortes", "equipe", "semExperiencia"],
      dicaFinal: "No primeiro emprego, valorize responsabilidades da escola e da vida pessoal que mostram compromisso."
    }
  ],

  perguntas: {
    apresentacao: {
      texto: "Conte um pouco sobre você e seus interesses profissionais.",
      orientacao: "Uma boa apresentação dura cerca de um minuto: diga seu nome, o que estuda e em que ano está, do que gosta e por que se interessa pela área. Fale do que tem relação com a oportunidade, sem entrar em assuntos pessoais.",
      porModalidade: {
        estagio: "Para estágio, cite o curso e uma disciplina ou atividade de que você gosta.",
        aprendiz: "Para Jovem Aprendiz, mostre interesse em aprender uma profissão."
      }
    },
    empresa: {
      texto: "Por que você deseja trabalhar nesta empresa?",
      orientacao: "Mostre que pesquisou a empresa: o que ela faz, seus produtos ou serviços e o que chamou sua atenção. Depois, ligue isso aos seus interesses. Evite respostas genéricas como \"porque preciso trabalhar\"."
    },
    pontosFortes: {
      texto: "Quais são seus principais pontos fortes?",
      orientacao: "Uma boa resposta apresenta suas habilidades e explica como você as utiliza. Você pode mencionar organização, criatividade ou facilidade para aprender, mas procure citar uma situação real que demonstre essas qualidades."
    },
    equipe: {
      texto: "Conte sobre uma situação em que precisou trabalhar em equipe ou resolver um problema.",
      orientacao: "Organize a resposta em três partes: a situação, o que você fez e o resultado. Trabalhos em grupo da escola, feiras, projetos, grêmio, esportes ou responsabilidades em casa são bons exemplos. Fale da sua parte, sem culpar colegas."
    },
    boaEscolha: {
      texto: "Por que você acredita que seria uma boa escolha para esta oportunidade?",
      orientacao: "Resuma, em poucas frases, o que você oferece: suas habilidades, sua vontade de aprender e o que já fez de concreto, como cursos e projetos. Ligue esses pontos ao que a empresa procura."
    },
    aprendizMotivo: {
      texto: "Por que você quer participar de um programa de Jovem Aprendiz nesta empresa?",
      orientacao: "Diga o que você quer aprender e por que essa empresa ou área chamou sua atenção. Mostre que entende que o programa une trabalho e formação e que você quer crescer com responsabilidade."
    },
    aprendizConciliar: {
      texto: "Como você pretende conciliar os estudos com o trabalho?",
      orientacao: "Mostre organização com exemplos concretos: como você divide o tempo hoje, se usa agenda ou lembretes e como cumpre prazos da escola. Deixe claro que os estudos continuam sendo prioridade."
    },
    estagioArea: {
      texto: "Por que você escolheu esta área e o que espera aprender no estágio?",
      orientacao: "Conte o que despertou seu interesse pela área e cite duas ou três coisas que quer aprender na prática. Mostre que vê o estágio como uma etapa de aprendizado, ligada ao seu curso."
    },
    estagioConhecimentos: {
      texto: "Que conhecimentos do seu curso você poderia aplicar aqui?",
      orientacao: "Cite conteúdos e ferramentas concretas que você estudou, como lógica de programação, HTML e CSS, banco de dados ou planilhas, e um trabalho em que os usou. Seja honesto sobre o seu nível e mostre vontade de aprender mais."
    },
    semExperiencia: {
      texto: "Você ainda não tem experiência profissional. Por que acredita que seria uma boa escolha para esta oportunidade?",
      orientacao: "Não ter experiência é normal no primeiro emprego. Fale de responsabilidades que mostram compromisso: frequência e pontualidade na escola, trabalhos em grupo, cursos, voluntariado ou ajuda em casa. Termine dizendo o que você quer aprender e como pode contribuir."
    }
  }
});
