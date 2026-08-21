document.addEventListener('DOMContentLoaded', async () => {
  const tbody = document.getElementById('servicos-tbody');
  const buscaInput = document.getElementById('servico-busca');
  const form = document.getElementById('formServico');
  const modal = document.getElementById('modalServico');

  async function carregarServicos() {
    const servicos = await apiGet('/servicos');
    const texto = (buscaInput.value || '').toLowerCase();
    const filtrados = servicos.filter(item => item.nome.toLowerCase().includes(texto));

    tbody.innerHTML = filtrados.map(servico => `
      <tr>
        <td>${servico.nome}</td>
        <td>${formatarMoeda(servico.preco_base)}</td>
        <td><span class="badge bg-success">Ativo</span></td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-primary me-2" data-editar="${servico.id}"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-sm btn-outline-danger" data-excluir="${servico.id}"><i class="bi bi-trash"></i></button>
        </td>
      </tr>
    `).join('');

    document.querySelectorAll('[data-editar]').forEach(botao => {
      botao.addEventListener('click', async () => {
        const servico = filtrados.find(item => Number(item.id) === Number(botao.dataset.editar));
        if (!servico) return;

        document.getElementById('servico-id').value = servico.id;
        document.getElementById('servico-nome').value = servico.nome;
        document.getElementById('servico-preco').value = servico.preco_base;

        bootstrap.Modal.getOrCreateInstance(modal).show();
      });
    });

    document.querySelectorAll('[data-excluir]').forEach(botao => {
      botao.addEventListener('click', async () => {
        const id = Number(botao.dataset.excluir);
        if (!confirm('Deseja excluir este serviço?')) return;

        await apiDelete(`/servicos/${id}`);
        mostrarToast('Serviço excluído com sucesso!', 'success');
        carregarServicos();
      });
    });
  }

  buscaInput.addEventListener('input', carregarServicos);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const id = document.getElementById('servico-id').value;
    const payload = {
      nome: document.getElementById('servico-nome').value.trim(),
      preco_base: Number(document.getElementById('servico-preco').value)
    };

    if (!payload.nome || payload.preco_base <= 0) {
      mostrarToast('Preencha corretamente os campos do serviço.', 'warning');
      return;
    }

    if (id) {
      await apiPut(`/servicos/${id}`, payload);
      mostrarToast('Serviço atualizado.', 'success');
    } else {
      await apiPost('/servicos', payload);
      mostrarToast('Serviço cadastrado.', 'success');
    }

    bootstrap.Modal.getInstance(modal).hide();
    form.reset();
    carregarServicos();
  });

  modal.addEventListener('hidden.bs.modal', () => {
    form.reset();
    document.getElementById('servico-id').value = '';
  });

  carregarServicos();
});
