document.addEventListener('DOMContentLoaded', async () => {
  const atendimentos = await apiGet('/atendimentos');
  const produtos = await apiGet('/produtos');

  // Cards
  const hoje = new Date().toDateString();
  const atendimentosHoje = atendimentos.filter(a => new Date(a.data_abertura).toDateString() === hoje);
  const totalVendas = atendimentosHoje.reduce((acc, a) => acc + (a.valor_total || 0), 0);
  document.getElementById('vendas-dia').textContent = formatarMoeda(totalVendas);
  document.getElementById('qtd-atendimentos').textContent = atendimentosHoje.length;

  // Contas a pagar (mock básico)
  const contas = [
    { nome: 'Aluguel', valor: 2200, vencimento: '08/08/2026', status: 'Hoje' },
    { nome: 'Fornecedor de peças', valor: 1380, vencimento: '10/08/2026', status: 'Próximo' },
    { nome: 'Internet / Telefonia', valor: 290, vencimento: '12/08/2026', status: 'Próximo' }
  ];
  document.getElementById('contas-vencendo').textContent = contas.length;

  const listaContas = document.getElementById('lista-contas-pagar');
  listaContas.innerHTML = contas.map(conta => `
    <div class="alert-item">
      <div class="d-flex justify-content-between align-items-start gap-2">
        <div>
          <strong>${conta.nome}</strong>
          <div class="text-muted small">Vence: ${conta.vencimento}</div>
        </div>
        <span class="badge badge-status">${conta.status}</span>
      </div>
      <div class="mt-2 fw-bold text-danger">${formatarMoeda(conta.valor)}</div>
    </div>
  `).join('');

  // Estoque baixo (<= 5 unidades)
  const produtosBaixo = produtos.filter(p => p.estoque_atual <= 5);
  const baixo = produtosBaixo.length;
  document.getElementById('estoque-baixo').textContent = baixo;

  const listaEstoque = document.getElementById('lista-estoque-baixo');
  listaEstoque.innerHTML = produtosBaixo.length
    ? produtosBaixo.map(produto => `
        <div class="alert-item">
          <div class="d-flex justify-content-between align-items-start gap-2">
            <div>
              <strong>${produto.nome}</strong>
              <div class="text-muted small">${produto.categoria || 'Produto'}</div>
            </div>
            <span class="badge badge-warning">${produto.estoque_atual} und</span>
          </div>
        </div>
      `).join('')
    : '<p class="text-muted text-center mb-0">Nenhum item com estoque baixo.</p>';

  // Últimos atendimentos
  const ultimos = atendimentos.slice(-5).reverse();
  const container = document.getElementById('ultimos-atendimentos');
  container.innerHTML = ultimos.map(a => `
    <div class="d-flex justify-content-between border-bottom py-2">
      <div>
        <strong>#${a.id}</strong> - ${new Date(a.data_abertura).toLocaleString('pt-BR')}
        <span class="badge bg-secondary ms-2">${a.forma_pagamento}</span>
        ${a.cliente ? `<small class="text-muted ms-2">${a.cliente.nome}</small>` : ''}
      </div>
      <span class="fw-bold">${formatarMoeda(a.valor_total)}</span>
    </div>
  `).join('');
});