document.addEventListener('DOMContentLoaded', async () => {
  const tbody = document.getElementById('financeiro-tbody');
  const form = document.getElementById('formFinanceiro');
  const modal = document.getElementById('modalFinanceiro');
  const campoTipo = document.getElementById('financeiro-tipo');
  const campoPessoa = document.getElementById('financeiro-pessoa');

  function atualizarPessoaObrigatoria() {
    const tipo = campoTipo.value;
    const obrigatorio = tipo === 'SAIDA';
    campoPessoa.disabled = !obrigatorio;
    campoPessoa.required = obrigatorio;
    campoPessoa.value = obrigatorio ? (campoPessoa.value || 'CNPJ') : '';
    campoPessoa.closest('.mb-3').style.display = obrigatorio ? 'block' : 'none';
  }

  campoTipo.addEventListener('change', atualizarPessoaObrigatoria);

  async function carregarFinanceiro() {
    const itens = await apiGet('/financeiro');
    const entradas = itens.filter(item => item.tipo === 'ENTRADA').reduce((soma, item) => soma + Number(item.valor || 0), 0);
    const saidas = itens.filter(item => item.tipo === 'SAIDA').reduce((soma, item) => soma + Number(item.valor || 0), 0);
    const saldo = entradas - saidas;
    const pendentes = itens.filter(item => item.status !== 'PAGO').length;

    document.getElementById('total-entradas').textContent = formatarMoeda(entradas);
    document.getElementById('total-saidas').textContent = formatarMoeda(saidas);
    document.getElementById('saldo-financeiro').textContent = formatarMoeda(saldo);
    document.getElementById('pendencias-financeiro').textContent = pendentes;

    tbody.innerHTML = itens.map(item => `
      <tr>
        <td>
          <span class="badge ${item.tipo === 'ENTRADA' ? 'bg-success' : 'bg-danger'}">${item.tipo === 'ENTRADA' ? 'Entrada' : 'Saída'}</span>
        </td>
        <td>${item.categoria || '-'}</td>
        <td>${item.pessoa || '-'}</td>
        <td>${item.descricao}</td>
        <td>${new Date(item.data_vencimento).toLocaleDateString('pt-BR')}</td>
        <td class="fw-bold ${item.tipo === 'ENTRADA' ? 'text-success' : 'text-danger'}">${formatarMoeda(item.valor)}</td>
        <td><span class="badge ${item.status === 'PAGO' ? 'bg-success' : 'bg-warning text-dark'}">${item.status}</span></td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-primary me-2" data-editar="${item.id}"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-sm btn-outline-danger" data-excluir="${item.id}"><i class="bi bi-trash"></i></button>
        </td>
      </tr>
    `).join('');

    document.querySelectorAll('[data-editar]').forEach(botao => {
      botao.addEventListener('click', async () => {
        const item = itens.find(i => Number(i.id) === Number(botao.dataset.editar));
        if (!item) return;

        document.getElementById('financeiro-id').value = item.id;
        document.getElementById('financeiro-tipo').value = item.tipo;
        document.getElementById('financeiro-categoria').value = item.categoria;
        document.getElementById('financeiro-pessoa').value = item.pessoa || '';
        document.getElementById('financeiro-descricao').value = item.descricao;
        document.getElementById('financeiro-valor').value = item.valor;
        document.getElementById('financeiro-data').value = item.data_vencimento;
        document.getElementById('financeiro-status').value = item.status;

        atualizarPessoaObrigatoria();
        bootstrap.Modal.getOrCreateInstance(modal).show();
      });
    });

    document.querySelectorAll('[data-excluir]').forEach(botao => {
      botao.addEventListener('click', async () => {
        const id = Number(botao.dataset.excluir);
        if (!confirm('Deseja excluir esta movimentação?')) return;

        await apiDelete(`/financeiro/${id}`);
        mostrarToast('Movimentação excluída.', 'success');
        carregarFinanceiro();
      });
    });
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const id = document.getElementById('financeiro-id').value;
    const tipo = document.getElementById('financeiro-tipo').value;
    const pessoa = tipo === 'SAIDA' ? document.getElementById('financeiro-pessoa').value : '';
    const payload = {
      tipo,
      categoria: document.getElementById('financeiro-categoria').value.trim(),
      pessoa,
      descricao: document.getElementById('financeiro-descricao').value.trim(),
      valor: Number(document.getElementById('financeiro-valor').value),
      data_vencimento: document.getElementById('financeiro-data').value,
      status: document.getElementById('financeiro-status').value
    };

    if (tipo === 'SAIDA' && !payload.pessoa) {
      mostrarToast('Para saídas, informe se foi CNPJ ou CPF.', 'warning');
      return;
    }

    if (!payload.categoria || !payload.descricao || payload.valor <= 0 || !payload.data_vencimento) {
      mostrarToast('Preencha todos os campos corretamente.', 'warning');
      return;
    }

    if (id) {
      await apiPut(`/financeiro/${id}`, payload);
      mostrarToast('Movimentação atualizada.', 'success');
    } else {
      await apiPost('/financeiro', payload);
      mostrarToast('Movimentação cadastrada.', 'success');
    }

    bootstrap.Modal.getInstance(modal).hide();
    form.reset();
    atualizarPessoaObrigatoria();
    carregarFinanceiro();
  });

  modal.addEventListener('hidden.bs.modal', () => {
    form.reset();
    document.getElementById('financeiro-id').value = '';
    atualizarPessoaObrigatoria();
  });

  atualizarPessoaObrigatoria();
  carregarFinanceiro();
});
