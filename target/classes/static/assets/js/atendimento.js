let carrinho = []; // Array de itens adicionados
let clienteAtual = null; // Cliente vinculado para NF

// ── Busca autocomplete ──
const campoBuscaProduto = document.getElementById('busca-produto');
const campoBuscaServico = document.getElementById('busca-servico');
const listaSugestoesProduto = document.getElementById('sugestoes-produto');
const listaSugestoesServico = document.getElementById('sugestoes-servico');
let timerBuscaProduto;
let timerBuscaServico;

function renderizarSugestoes(itens, container, tipo) {
  container.innerHTML = '';
  if (itens.length === 0) {
    container.innerHTML = '<a href="#" class="list-group-item list-group-item-action disabled">Nenhum item encontrado</a>';
    container.classList.remove('d-none');
    return;
  }

  itens.forEach(item => {
    const el = document.createElement('a');
    el.href = '#';
    el.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-center';
    el.innerHTML = `<span>${tipo === 'PRODUTO' ? '📦' : '🔧'} ${item.nome_exibicao}</span><span class="badge bg-secondary rounded-pill">${formatarMoeda(item.preco)}</span>`;
    el.addEventListener('click', (e) => {
      e.preventDefault();
      adicionarItem(item);
      if (tipo === 'PRODUTO') {
        campoBuscaProduto.value = '';
        listaSugestoesProduto.classList.add('d-none');
      } else {
        campoBuscaServico.value = '';
        listaSugestoesServico.classList.add('d-none');
      }
    });
    container.appendChild(el);
  });
  container.classList.remove('d-none');
}

function buscarItens(tipo, termo, container, campo) {
  clearTimeout(tipo === 'PRODUTO' ? timerBuscaProduto : timerBuscaServico);
  if (termo.length < 1) {
    container.innerHTML = '';
    container.classList.add('d-none');
    return;
  }

  const timer = tipo === 'PRODUTO' ? timerBuscaProduto : timerBuscaServico;
  const timeout = setTimeout(async () => {
    const resultados = tipo === 'PRODUTO'
      ? (await apiGet(`/produtos?nome=${termo}`)).map(p => ({ ...p, tipo: 'PRODUTO', nome_exibicao: p.nome, preco: p.preco_venda }))
      : (await apiGet(`/servicos?nome=${termo}`)).map(s => ({ ...s, tipo: 'SERVICO', nome_exibicao: s.nome, preco: s.preco_base }));

    renderizarSugestoes(resultados, container, tipo);
  }, 300);

  if (tipo === 'PRODUTO') timerBuscaProduto = timeout;
  else timerBuscaServico = timeout;
}

campoBuscaProduto.addEventListener('input', () => {
  buscarItens('PRODUTO', campoBuscaProduto.value.trim(), listaSugestoesProduto, campoBuscaProduto);
});

campoBuscaServico.addEventListener('input', () => {
  buscarItens('SERVICO', campoBuscaServico.value.trim(), listaSugestoesServico, campoBuscaServico);
});

// Fechar sugestões ao clicar fora
document.addEventListener('click', (e) => {
  if (!e.target.closest('#busca-produto') && !e.target.closest('#sugestoes-produto')) {
    listaSugestoesProduto.classList.add('d-none');
  }
  if (!e.target.closest('#busca-servico') && !e.target.closest('#sugestoes-servico')) {
    listaSugestoesServico.classList.add('d-none');
  }
});

// ── Adicionar item ao carrinho ──
function adicionarItem(item) {
  const existente = carrinho.find(i => i.id === item.id && i.tipo === item.tipo);
  if (existente) {
    existente.quantidade += 1;
  } else {
    carrinho.push({ ...item, quantidade: 1 });
  }
  atualizarTabela();
}

// ── Renderizar tabela do carrinho ──
function atualizarTabela() {
  const tbody = document.getElementById('itens-atendimento');
  tbody.innerHTML = '';
  let total = 0;
  carrinho.forEach((item, index) => {
    const subtotal = item.quantidade * item.preco;
    total += subtotal;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><span class="badge ${item.tipo === 'PRODUTO' ? 'bg-primary' : 'bg-warning text-dark'}">${item.tipo === 'PRODUTO' ? 'Prod' : 'Serv'}</span></td>
      <td>${item.nome_exibicao}</td>
      <td>${formatarMoeda(item.preco)}</td>
      <td>
        <input type="number" class="form-control form-control-sm" style="width:70px" value="${item.quantidade}" min="1" data-index="${index}" onchange="alterarQuantidade(${index}, this.value)">
      </td>
      <td>${formatarMoeda(subtotal)}</td>
      <td><button class="btn btn-sm btn-outline-danger" onclick="removerItem(${index})"><i class="bi bi-trash"></i></button></td>
    `;
    tbody.appendChild(tr);
  });
  document.getElementById('total-atendimento').textContent = formatarMoeda(total);
}

function alterarQuantidade(index, novaQtd) {
  const qtd = parseInt(novaQtd);
  if (isNaN(qtd) || qtd < 1) return;
  carrinho[index].quantidade = qtd;
  atualizarTabela();
}

function removerItem(index) {
  carrinho.splice(index, 1);
  atualizarTabela();
}

// ── Finalizar atendimento ──
document.getElementById('btn-finalizar').addEventListener('click', async () => {
  if (carrinho.length === 0) {
    mostrarToast('Adicione pelo menos um item.', 'warning');
    return;
  }
  const formaPagamento = document.getElementById('forma-pagamento').value;
  if (!formaPagamento) {
    mostrarToast('Selecione a forma de pagamento.', 'warning');
    return;
  }

  const payload = {
    itens: carrinho.map(i => ({
      tipo: i.tipo,
      id: i.id,
      quantidade: i.quantidade,
      preco_unitario: i.preco
    })),
    forma_pagamento: formaPagamento,
    cliente_id: clienteAtual ? clienteAtual.id : null
  };

  try {
    const atendimento = await apiPost('/atendimentos', payload);
    mostrarToast(`Atendimento #${atendimento.id} finalizado com sucesso!`, 'success');
    carrinho = [];
    clienteAtual = null;
    document.getElementById('cliente-nf-info').classList.add('d-none');
    atualizarTabela();
  } catch (erro) {
    mostrarToast('Erro ao finalizar atendimento.', 'danger');
  }
});

// ── Vinculação rápida de cliente (NF) ──
document.getElementById('buscar-cliente').addEventListener('click', async () => {
  const cpf = document.getElementById('cpf-cliente').value.replace(/\D/g, '');
  if (cpf.length !== 11) {
    mostrarToast('Digite um CPF válido.', 'warning');
    return;
  }
  const clientes = await apiGet('/clientes');
  const cliente = clientes.find(c => c.cpf.replace(/\D/g, '') === cpf);
  if (cliente) {
    clienteAtual = cliente;
    document.getElementById('cliente-nf-info').classList.remove('d-none');
    document.getElementById('nome-cliente-nf').textContent = cliente.nome;
  } else {
    mostrarToast('Cliente não encontrado. Cadastre primeiro.', 'info');
  }
});

// ── Cadastro rápido de produto (modal) ──
document.getElementById('salvar-produto-rapido').addEventListener('click', async () => {
  const nome = document.getElementById('novo-produto-nome').value.trim();
  const codigo = document.getElementById('novo-produto-codigo').value.trim();
  const preco = parseFloat(document.getElementById('novo-produto-preco').value);
  const estoque = parseInt(document.getElementById('novo-produto-estoque').value);
  if (!nome || !codigo || isNaN(preco) || isNaN(estoque) || preco <= 0 || estoque < 0) {
    mostrarToast('Preencha todos os campos corretamente.', 'warning');
    return;
  }

  try {
    const novo = await apiPost('/produtos', { nome, codigo_catalogo: codigo, preco_venda: preco, estoque_atual: estoque });
    mostrarToast('Produto cadastrado com sucesso!', 'success');
    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalNovoProduto')).hide();
    adicionarItem({ ...novo, tipo: 'PRODUTO', nome_exibicao: novo.nome, preco: novo.preco_venda });
  } catch (erro) {
    mostrarToast('Erro ao cadastrar produto.', 'danger');
  }
});

// ── Cadastro rápido de serviço (modal) ──
document.getElementById('salvar-servico-rapido').addEventListener('click', async () => {
  const nome = document.getElementById('novo-servico-nome').value.trim();
  const preco = parseFloat(document.getElementById('novo-servico-preco').value);

  if (!nome || isNaN(preco) || preco <= 0) {
    mostrarToast('Preencha o nome e o preço do serviço.', 'warning');
    return;
  }

  try {
    const novo = await apiPost('/servicos', { nome, preco_base: preco });
    mostrarToast('Serviço cadastrado com sucesso!', 'success');
    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalNovoServico')).hide();
    adicionarItem({ ...novo, tipo: 'SERVICO', nome_exibicao: novo.nome, preco: novo.preco_base });
  } catch (erro) {
    mostrarToast('Erro ao cadastrar serviço.', 'danger');
  }
});

// Limpar modais ao fechar
document.getElementById('modalNovoProduto').addEventListener('hidden.bs.modal', function () {
  this.querySelectorAll('input').forEach(i => i.value = '');
});

document.getElementById('modalNovoServico').addEventListener('hidden.bs.modal', function () {
  this.querySelectorAll('input').forEach(i => i.value = '');
});