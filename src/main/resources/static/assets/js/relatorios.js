document.addEventListener('DOMContentLoaded', async () => {
  const btnRelatorio = document.getElementById('btn-gerar-relatorio');
  const filtroInicio = document.getElementById('filtro-inicio');
  const filtroFim = document.getElementById('filtro-fim');

  async function carregarRelatorio() {
    const inicio = filtroInicio.value;
    const fim = filtroFim.value;

    const resultado = await apiGet(`/relatorios${inicio || fim ? `?inicio=${inicio}&fim=${fim}` : ''}`);
    const totalEntradas = Number(resultado.total_entradas || 0);
    const totalSaidas = Number(resultado.total_saidas || 0);
    const saldo = Number(resultado.saldo || 0);

    document.getElementById('relatorio-entradas').textContent = formatarMoeda(totalEntradas);
    document.getElementById('relatorio-saidas').textContent = formatarMoeda(totalSaidas);
    document.getElementById('relatorio-saldo').textContent = formatarMoeda(saldo);
    document.getElementById('relatorio-atendimentos').textContent = resultado.atendimentos || 0;

    const tbody = document.getElementById('relatorio-tbody');
    const itens = resultado.itens || [];

    tbody.innerHTML = itens.length
      ? itens.map(item => `
        <tr>
          <td><span class="badge ${item.tipo === 'ENTRADA' ? 'bg-success' : 'bg-danger'}">${item.tipo === 'ENTRADA' ? 'Entrada' : 'Saída'}</span></td>
          <td>${item.categoria || '-'}</td>
          <td>${item.pessoa || '-'}</td>
          <td>${item.descricao}</td>
          <td>${(item.data_vencimento || '').slice(0, 10)}</td>
          <td class="fw-bold ${item.tipo === 'ENTRADA' ? 'text-success' : 'text-danger'}">${formatarMoeda(item.valor)}</td>
          <td><span class="badge ${item.status === 'PAGO' ? 'bg-success' : 'bg-warning text-dark'}">${item.status}</span></td>
        </tr>
      `).join('')
      : '<tr><td colspan="7" class="text-center text-muted">Nenhum dado encontrado para o período selecionado.</td></tr>';
  }

  btnRelatorio.addEventListener('click', carregarRelatorio);
  carregarRelatorio();
});
