document.addEventListener('DOMContentLoaded', async () => {
  const tbody = document.getElementById('produtos-tbody');
  const buscaInput = document.getElementById('produto-busca');
  const form = document.getElementById('formProduto');
  const modal = document.getElementById('modalProduto');

  async function carregarProdutos() {
    const produtos = await apiGet('/produtos');
    const texto = (buscaInput.value || '').toLowerCase();

    const filtrados = produtos.filter(item => {
      return item.nome.toLowerCase().includes(texto) || String(item.codigo_catalogo || '').toLowerCase().includes(texto);
    });

    tbody.innerHTML = filtrados.map(produto => `
      <tr>
        <td>${produto.codigo_catalogo}</td>
        <td>${produto.nome}</td>
        <td>${formatarMoeda(produto.preco_venda)}</td>
        <td>${produto.estoque_atual}</td>
        <td>
          <span class="badge ${produto.estoque_atual <= 5 ? 'bg-warning text-dark' : 'bg-success'}">
            ${produto.estoque_atual <= 5 ? 'Estoque baixo' : 'Disponível'}
          </span>
        </td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-primary me-2" data-editar="${produto.id}"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-sm btn-outline-danger" data-excluir="${produto.id}"><i class="bi bi-trash"></i></button>
        </td>
      </tr>
    `).join('');

    document.querySelectorAll('[data-editar]').forEach(botao => {
      botao.addEventListener('click', async () => {
        const produto = filtrados.find(item => Number(item.id) === Number(botao.dataset.editar));
        if (!produto) return;

        document.getElementById('produto-id').value = produto.id;
        document.getElementById('produto-codigo').value = produto.codigo_catalogo;
        document.getElementById('produto-nome').value = produto.nome;
        document.getElementById('produto-preco').value = produto.preco_venda;
        document.getElementById('produto-estoque').value = produto.estoque_atual;

        const instance = bootstrap.Modal.getOrCreateInstance(modal);
        instance.show();
      });
    });

    document.querySelectorAll('[data-excluir]').forEach(botao => {
      botao.addEventListener('click', async () => {
        const id = Number(botao.dataset.excluir);
        if (!confirm('Deseja excluir este produto?')) return;

        await apiDelete(`/produtos/${id}`);
        mostrarToast('Produto excluído com sucesso!', 'success');
        carregarProdutos();
      });
    });
  }

  buscaInput.addEventListener('input', carregarProdutos);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const id = document.getElementById('produto-id').value;
    const payload = {
      codigo_catalogo: document.getElementById('produto-codigo').value.trim(),
      nome: document.getElementById('produto-nome').value.trim(),
      preco_venda: Number(document.getElementById('produto-preco').value),
      estoque_atual: Number(document.getElementById('produto-estoque').value)
    };

    if (!payload.codigo_catalogo || !payload.nome || payload.preco_venda <= 0 || payload.estoque_atual < 0) {
      mostrarToast('Preencha os campos corretamente.', 'warning');
      return;
    }

    if (id) {
      await apiPut(`/produtos/${id}`, payload);
      mostrarToast('Produto atualizado.', 'success');
    } else {
      await apiPost('/produtos', payload);
      mostrarToast('Produto cadastrado.', 'success');
    }

    bootstrap.Modal.getInstance(modal).hide();
    form.reset();
    carregarProdutos();
  });

  modal.addEventListener('hidden.bs.modal', () => {
    form.reset();
    document.getElementById('produto-id').value = '';
  });

  carregarProdutos();
});
