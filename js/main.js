// Busca o botão usado para alternar as cores da página.
const themeToggle = document.querySelector('.theme-toggle');
// O CSS reconhece esta classe para aplicar as cores do modo escuro.
const darkModeClass = 'dark-mode';

// Lê e grava a preferência sem interromper a página se o armazenamento estiver bloqueado.
function lerTemaSalvo() {
  try {
    return localStorage.getItem('theme');
  } catch (erro) {
    return null;
  }
}

function salvarTema(valor) {
  try {
    localStorage.setItem('theme', valor);
  } catch (erro) {
    // Sem armazenamento disponível, o tema vale apenas para esta página.
  }
}

// Aplica o tema e informa o estado ao leitor de tela.
// O nome do botão ("Modo escuro") é fixo; aria-pressed indica se está ligado.
function setTheme(isDark, salvar) {
  document.body.classList.toggle(darkModeClass, isDark);
  themeToggle.setAttribute('aria-pressed', String(isDark));
  if (salvar) salvarTema(isDark ? 'dark' : 'light');
}

// Só configura a troca de tema se o botão existir nesta página.
if (themeToggle) {
  // A escolha salva tem prioridade sobre o tema configurado no dispositivo.
  // Sem escolha salva, segue o sistema e não grava nada (a preferência do sistema continua valendo).
  const savedTheme = lerTemaSalvo();
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  setTheme(savedTheme ? savedTheme === 'dark' : prefersDark, false);

  // O clique inverte o tema que está sendo mostrado agora e grava a escolha.
  themeToggle.addEventListener('click', () => {
    setTheme(!document.body.classList.contains(darkModeClass), true);
  });
}
