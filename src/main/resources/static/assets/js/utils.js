const AUTH_STORAGE_KEY = 'chave_mestra_usuario_logado';

// Formata valor monetário em Real
function formatarMoeda(valor) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
}

function getCurrentUser() {
  try {
    const usuario = localStorage.getItem(AUTH_STORAGE_KEY);
    return usuario ? JSON.parse(usuario) : null;
  } catch (error) {
    return null;
  }
}

function setCurrentUser(usuario) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(usuario));
}

function logoutCurrentUser() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  window.location.href = 'login.html';
}

function renderUserBadge() {
  const container = document.querySelector('.navbar .container-fluid');
  if (!container) return;

  let userBadge = document.getElementById('usuario-logado');
  if (!userBadge) {
    userBadge = document.createElement('div');
    userBadge.id = 'usuario-logado';
    userBadge.className = 'd-flex align-items-center ms-auto';
    container.appendChild(userBadge);
  }

  const usuario = getCurrentUser();
  if (!usuario) {
    userBadge.innerHTML = '';
    userBadge.classList.add('d-none');
    return;
  }

  userBadge.classList.remove('d-none');

  const nome = usuario.nome || 'Usuário';
  const cargo = usuario.cargo || usuario.email || 'Operador';
  const iniciais = nome.split(' ').map(parte => parte.charAt(0)).slice(0, 2).join('').toUpperCase();

  userBadge.innerHTML = `
    <div class="d-flex align-items-center gap-2 bg-light rounded-pill border px-3 py-2 shadow-sm">
      <div class="rounded-circle bg-dark text-white d-flex align-items-center justify-content-center" style="width: 34px; height: 34px; font-size: 0.75rem; font-weight: 700;">${iniciais}</div>
      <div class="d-flex flex-column align-items-start text-start">
        <span class="fw-semibold small text-dark">${nome}</span>
        <small class="text-muted">${cargo}</small>
      </div>
      <button type="button" class="btn btn-sm btn-outline-danger ms-2" id="btn-logout">
        <i class="bi bi-box-arrow-right me-1"></i>Sair
      </button>
    </div>
  `;

  const btnLogout = document.getElementById('btn-logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', logoutCurrentUser);
  }
}

// Exibe toast de notificação
function mostrarToast(mensagem, tipo = 'success') {
  const toastContainer = document.getElementById('toast-container');
  if (!toastContainer) return;
  const toastEl = document.createElement('div');
  toastEl.className = `toast align-items-center text-bg-${tipo} border-0`;
  toastEl.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${mensagem}</div>
      <button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>`;
  toastContainer.appendChild(toastEl);
  const toast = new bootstrap.Toast(toastEl, { autohide: true, delay: 3000 });
  toast.show();
}

// Data/hora atual formatada
function dataHoraAtual() {
  const agora = new Date();
  return agora.toLocaleString('pt-BR');
}

// Atualiza o relógio na navbar
function atualizarRelogio() {
  const el = document.getElementById('data-hora');
  if (el) el.textContent = dataHoraAtual();
}
setInterval(atualizarRelogio, 10000);
atualizarRelogio();

// Toggle sidebar (menu hambúrguer)
document.addEventListener('DOMContentLoaded', () => {
  const menuToggle = document.getElementById('menu-toggle');
  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      const sidebar = document.getElementById('sidebar-wrapper');
      if (sidebar) sidebar.classList.toggle('d-none');
    });
  }

  renderUserBadge();

  const caminhoAtual = window.location.pathname;
  const ePaginaLogin = /(^|\/)login\.html$/.test(caminhoAtual);

  if (!ePaginaLogin && !getCurrentUser()) {
    window.location.href = 'login.html';
    return;
  }

  if (ePaginaLogin && getCurrentUser()) {
    window.location.href = 'index.html';
  }
});