document.addEventListener('DOMContentLoaded', async () => {
  const tbody = document.getElementById('clientes-tbody');
  const buscaInput = document.getElementById('cliente-busca');
  const form = document.getElementById('formCliente');
  const modal = document.getElementById('modalCliente');

  async function carregarClientes() {
    const clientes = await apiGet('/clientes');
    const texto = (buscaInput.value || '').toLowerCase();
    const filtrados = clientes.filter(item => {
      return item.nome.toLowerCase().includes(texto) || String(item.cpf || '').toLowerCase().includes(texto);
    });

    tbody.innerHTML = filtrados.map(cliente => `
      <tr>
        <td>${cliente.nome}</td>
        <td>${cliente.cpf}</td>
        <td>${cliente.telefone}</td>
        <td>${cliente.endereco}</td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-primary me-2" data-editar="${cliente.id}"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-sm btn-outline-danger" data-excluir="${cliente.id}"><i class="bi bi-trash"></i></button>
        </td>
      </tr>
    `).join('');

    document.querySelectorAll('[data-editar]').forEach(botao => {
      botao.addEventListener('click', async () => {
        const cliente = filtrados.find(item => Number(item.id) === Number(botao.dataset.editar));
        if (!cliente) return;

        document.getElementById('cliente-id').value = cliente.id;
        document.getElementById('cliente-nome').value = cliente.nome;
        document.getElementById('cliente-cpf').value = cliente.cpf;
        document.getElementById('cliente-telefone').value = cliente.telefone;
        document.getElementById('cliente-endereco').value = cliente.endereco;

        bootstrap.Modal.getOrCreateInstance(modal).show();
      });
    });

    document.querySelectorAll('[data-excluir]').forEach(botao => {
      botao.addEventListener('click', async () => {
        const id = Number(botao.dataset.excluir);
        if (!confirm('Deseja excluir este cliente?')) return;

        await apiDelete(`/clientes/${id}`);
        mostrarToast('Cliente excluído com sucesso!', 'success');
        carregarClientes();
      });
    });
  }

  buscaInput.addEventListener('input', carregarClientes);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const id = document.getElementById('cliente-id').value;
    const payload = {
      nome: document.getElementById('cliente-nome').value.trim(),
      cpf: document.getElementById('cliente-cpf').value.trim(),
      telefone: document.getElementById('cliente-telefone').value.trim(),
      endereco: document.getElementById('cliente-endereco').value.trim()
    };

    if (!payload.nome || !payload.cpf || !payload.telefone || !payload.endereco) {
      mostrarToast('Preencha todos os campos.', 'warning');
      return;
    }

    if (id) {
      await apiPut(`/clientes/${id}`, payload);
      mostrarToast('Cliente atualizado.', 'success');
    } else {
      await apiPost('/clientes', payload);
      mostrarToast('Cliente cadastrado.', 'success');
    }

    bootstrap.Modal.getInstance(modal).hide();
    form.reset();
    carregarClientes();
  });

  modal.addEventListener('hidden.bs.modal', () => {
    form.reset();
    document.getElementById('cliente-id').value = '';
  });

  carregarClientes();
});
