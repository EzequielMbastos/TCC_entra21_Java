document.addEventListener('DOMContentLoaded', async () => {
  const chaveInput = document.getElementById('openrouter-key');
  const btnSalvarChave = document.getElementById('btn-salvar-chave');
  const btnLimparChave = document.getElementById('btn-limpar-chave');
  const formChat = document.getElementById('form-chat');
  const promptInput = document.getElementById('prompt-usuario');
  const chatMensagens = document.getElementById('chat-mensagens');
  const promptButtons = document.querySelectorAll('.prompt-chip');
  const btnVoz = document.getElementById('btn-voz');

  const STORAGE_KEY_OPENROUTER = 'chave_openrouter';
  const STORAGE_KEY_DB = 'chave_mestra_db_v1';
  let mediaRecorder = null;
  let gravacaoStream = null;
  let gravacaoChunks = [];
  let gravandoVoz = false;

  function carregarChave() {
    const chave = localStorage.getItem(STORAGE_KEY_OPENROUTER) || '';
    chaveInput.value = chave;
  }

  function salvarChave() {
    const chave = chaveInput.value.trim();
    if (!chave) {
      mostrarToast('Informe a chave da API antes de usar a IA.', 'warning');
      return;
    }
    localStorage.setItem(STORAGE_KEY_OPENROUTER, chave);
    mostrarToast('Chave salva com sucesso.', 'success');
  }

  function limparChave() {
    localStorage.removeItem(STORAGE_KEY_OPENROUTER);
    chaveInput.value = '';
    mostrarToast('Chave removida.', 'info');
  }

  function adicionarMensagem(texto, tipo = 'bot') {
    const el = document.createElement('div');
    el.className = `message ${tipo}`;
    el.textContent = texto;
    chatMensagens.appendChild(el);
    chatMensagens.scrollTop = chatMensagens.scrollHeight;
  }

  function deveAbrirDashboard(prompt) {
    const texto = String(prompt || '').toLowerCase();
    return /(grafico|gráfico|dashboard|dash|relatorio|relatório)/i.test(texto) || /visuais?/i.test(texto);
  }

  async function transcreverAudioParaTexto(blob) {
    const chave = localStorage.getItem(STORAGE_KEY_OPENROUTER);
    if (!chave) {
      mostrarToast('Cadastre a chave do OpenRouter antes de usar a transcrição por voz.', 'warning');
      return '';
    }

    const formData = new FormData();
    formData.append('file', blob, 'gravacao-ia.webm');
    formData.append('model', 'openai/whisper-1');
    formData.append('temperature', '0');

    try {
      const resposta = await fetch('https://openrouter.ai/api/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${chave}`
        },
        body: formData
      });

      if (!resposta.ok) {
        const erro = await resposta.text();
        throw new Error(`Transcrição falhou: ${erro}`);
      }

      const dados = await resposta.json();
      return dados.text || dados.transcript || '';
    } catch (error) {
      console.error('Erro ao transcrever áudio:', error);
      mostrarToast('Não foi possível converter a voz em texto. Verifique a chave e a conexão.', 'danger');
      return '';
    }
  }

  async function iniciarGravacaoVoz() {
    if (!('MediaRecorder' in window) || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      mostrarToast('Este navegador não suporta gravação de áudio. Use Chrome, Edge ou Firefox.', 'warning');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      gravacaoStream = stream;
      mediaRecorder = new MediaRecorder(stream);
      gravacaoChunks = [];

      mediaRecorder.ondataavailable = (evento) => {
        if (evento.data.size > 0) {
          gravacaoChunks.push(evento.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(gravacaoChunks, { type: mediaRecorder.mimeType || 'audio/webm' });
        const transcricao = await transcreverAudioParaTexto(blob);

        if (transcricao) {
          promptInput.value = transcricao;
          promptInput.focus();
          await processarPrompt(transcricao);
        } else {
          mostrarToast('Não foi possível identificar o áudio gravado.', 'warning');
        }

        if (gravacaoStream) {
          gravacaoStream.getTracks().forEach(track => track.stop());
        }

        gravacaoStream = null;
        mediaRecorder = null;
        gravandoVoz = false;
        btnVoz.classList.remove('listening');
        btnVoz.title = 'Usar voz';
        btnVoz.innerHTML = '<i class="bi bi-mic"></i>';
      };

      mediaRecorder.start();
      gravandoVoz = true;
      btnVoz.classList.add('listening');
      btnVoz.title = 'Gravando...';
      btnVoz.innerHTML = '<i class="bi bi-stop-circle"></i>';
    } catch (error) {
      console.error('Erro ao acessar microfone:', error);
      mostrarToast('Não foi possível acessar o microfone. Verifique a permissão do navegador.', 'warning');
    }
  }

  function pararGravacaoVoz() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
  }

  function abrirDashboardModal(contexto) {
    const dados = contexto?.dados || {};
    const produtos = Array.isArray(dados.produtos) ? dados.produtos : [];
    const servicos = Array.isArray(dados.servicos) ? dados.servicos : [];
    const clientes = Array.isArray(dados.clientes) ? dados.clientes : [];
    const financeiro = Array.isArray(dados.financeiro) ? dados.financeiro : [];

    const entradas = financeiro.filter(item => item.tipo === 'ENTRADA').reduce((soma, item) => soma + Number(item.valor || 0), 0);
    const saidas = financeiro.filter(item => item.tipo === 'SAIDA').reduce((soma, item) => soma + Number(item.valor || 0), 0);
    const saldo = entradas - saidas;
    const estoqueBaixo = produtos.filter(item => Number(item.estoque_atual || 0) <= 5).length;

    const resumo = document.getElementById('dashboard-ia-resumo');
    if (resumo) {
      resumo.innerHTML = `
        <div class="row g-2 text-center">
          <div class="col-md-3"><span class="badge bg-success-subtle text-success-emphasis px-3 py-2">Entradas: ${formatarMoeda(entradas)}</span></div>
          <div class="col-md-3"><span class="badge bg-danger-subtle text-danger-emphasis px-3 py-2">Saídas: ${formatarMoeda(saidas)}</span></div>
          <div class="col-md-3"><span class="badge bg-primary-subtle text-primary-emphasis px-3 py-2">Saldo: ${formatarMoeda(saldo)}</span></div>
          <div class="col-md-3"><span class="badge bg-warning-subtle text-warning-emphasis px-3 py-2">Estoque baixo: ${estoqueBaixo}</span></div>
        </div>
      `;
    }

    const canvas = document.getElementById('dashboard-ia-chart');
    if (canvas && window.dashboardChartInstance) {
      window.dashboardChartInstance.destroy();
    }

    if (canvas) {
      window.dashboardChartInstance = new Chart(canvas, {
        type: 'bar',
        data: {
          labels: ['Entradas', 'Saídas', 'Saldo', 'Estoque baixo'],
          datasets: [{
            label: 'Dashboard da loja',
            data: [entradas, saidas, saldo, estoqueBaixo],
            backgroundColor: ['#198754', '#dc3545', '#0d6efd', '#f4b740'],
            borderRadius: 8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: { beginAtZero: true }
          }
        }
      });
    }

    const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('modalDashboardIA'));
    modal.show();
  }

  function lerBancoLocal() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_DB);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (error) {
      console.warn('Não foi possível ler o banco local da loja:', error);
      return null;
    }
  }

  function limparTexto(valor) {
    return String(valor || '').replace(/\s+/g, ' ').trim();
  }

  function extrairLinhasTabela(selector) {
    const tabela = document.querySelector(selector);
    if (!tabela) return [];
    const linhas = Array.from(tabela.querySelectorAll('tr'));
    return linhas.map(linha => {
      const celulas = Array.from(linha.querySelectorAll('td, th'));
      return celulas.map(celula => limparTexto(celula.textContent));
    }).filter(c => c.length > 0);
  }

  function lerDadosDaPagina() {
    const dadosVisiveis = {
      produtos: [],
      servicos: [],
      clientes: [],
      financeiro: [],
      atendimentos: []
    };

    const produtos = extrairLinhasTabela('#produtos-tbody');
    dadosVisiveis.produtos = produtos.map((linha, index) => {
      if (linha.length >= 5) {
        return {
          id: index + 1,
          codigo_catalogo: linha[0],
          nome: linha[1],
          preco_venda: Number(String(linha[2]).replace(/[^\d,.-]/g, '').replace('.', '').replace(',', '.')) || 0,
          estoque_atual: Number(String(linha[3]).replace(/[^\d-]/g, '')) || 0,
          status: linha[4]
        };
      }
      return null;
    }).filter(Boolean);

    const servicos = extrairLinhasTabela('#servicos-tbody');
    dadosVisiveis.servicos = servicos.map((linha, index) => {
      if (linha.length >= 3) {
        return {
          id: index + 1,
          nome: linha[0],
          preco_base: Number(String(linha[1]).replace(/[^\d,.-]/g, '').replace('.', '').replace(',', '.')) || 0,
          status: linha[2]
        };
      }
      return null;
    }).filter(Boolean);

    const clientes = extrairLinhasTabela('#clientes-tbody');
    dadosVisiveis.clientes = clientes.map((linha, index) => {
      if (linha.length >= 4) {
        return {
          id: index + 1,
          nome: linha[0],
          cpf: linha[1],
          telefone: linha[2],
          endereco: linha[3]
        };
      }
      return null;
    }).filter(Boolean);

    const financeiroLinhas = extrairLinhasTabela('#financeiro-tbody');
    dadosVisiveis.financeiro = financeiroLinhas.map((linha, index) => {
      if (linha.length >= 7) {
        const valorTexto = linha[5] || '0';
        return {
          id: index + 1,
          tipo: linha[0].toLowerCase().includes('entrada') ? 'ENTRADA' : 'SAIDA',
          categoria: linha[1],
          pessoa: linha[2],
          descricao: linha[3],
          data_vencimento: linha[4],
          valor: Number(String(valorTexto).replace(/[^\d,.-]/g, '').replace('.', '').replace(',', '.')) || 0,
          status: linha[6]
        };
      }
      return null;
    }).filter(Boolean);

    return dadosVisiveis;
  }

  async function getContextoLoja() {
    const bancoLocal = lerBancoLocal();
    const dadosPagina = lerDadosDaPagina();

    const produtos = (bancoLocal?.produtos && bancoLocal.produtos.length)
      ? bancoLocal.produtos
      : dadosPagina.produtos;

    const servicos = (bancoLocal?.servicos && bancoLocal.servicos.length)
      ? bancoLocal.servicos
      : dadosPagina.servicos;

    const clientes = (bancoLocal?.clientes && bancoLocal.clientes.length)
      ? bancoLocal.clientes
      : dadosPagina.clientes;

    const financeiro = (bancoLocal?.financeiro && bancoLocal.financeiro.length)
      ? bancoLocal.financeiro
      : dadosPagina.financeiro;

    const atendimentos = (bancoLocal?.atendimentos && bancoLocal.atendimentos.length)
      ? bancoLocal.atendimentos
      : dadosPagina.atendimentos;

    return {
      timestamp: new Date().toISOString(),
      regras: [
        'Você é um assistente interno da loja Chave Mestra.',
        'Sua função é apenas analisar e explicar dados da loja.',
        'Não pode alterar cadastros, estoque, clientes, financeiro ou atendimentos.',
        'Só pode responder com observações, relatórios, gráficos e sugestões de interpretação.',
        'Se a pergunta pedir alteração, responda dizendo que você não pode alterar registros.'
      ],
      dados: {
        produtos: Array.isArray(produtos) ? produtos : [],
        servicos: Array.isArray(servicos) ? servicos : [],
        atendimentos: Array.isArray(atendimentos) ? atendimentos : [],
        financeiro: Array.isArray(financeiro) ? financeiro : [],
        clientes: Array.isArray(clientes) ? clientes : []
      }
    };
  }

  async function montarResumoLoja() {
    try {
      const contexto = await getContextoLoja();
      const { produtos = [], financeiro = [] } = contexto.dados || {};

      const entradas = financeiro.filter(item => item.tipo === 'ENTRADA').reduce((soma, item) => soma + Number(item.valor || 0), 0);
      const saidas = financeiro.filter(item => item.tipo === 'SAIDA').reduce((soma, item) => soma + Number(item.valor || 0), 0);
      const estoqueBaixo = produtos.filter(item => Number(item.estoque_atual || 0) <= 5).length;

      document.getElementById('ai-entradas').textContent = formatarMoeda(entradas);
      document.getElementById('ai-saidas').textContent = formatarMoeda(saidas);
      document.getElementById('ai-saldo').textContent = formatarMoeda(entradas - saidas);
      document.getElementById('ai-estoque-baixo').textContent = estoqueBaixo;

      const dadosGrafico = {
        labels: ['Entradas', 'Saídas', 'Estoque baixo'],
        datasets: [{
          label: 'Resumo da loja',
          data: [entradas, saidas, estoqueBaixo],
          backgroundColor: ['#1E3A5F', '#dc3545', '#DAA520'],
          borderRadius: 8
        }]
      };

      const ctx = document.getElementById('ai-chart');
      if (ctx && window.aiChartInstance) {
        window.aiChartInstance.destroy();
      }

      if (ctx) {
        window.aiChartInstance = new Chart(ctx, {
          type: 'bar',
          data: dadosGrafico,
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false }
            },
            scales: {
              y: { beginAtZero: true }
            }
          }
        });
      }

      return contexto.dados;
    } catch (error) {
      console.error('Erro ao montar resumo da loja:', error);
      return null;
    }
  }

  async function enviarParaOpenRouter(prompt) {
    const chave = localStorage.getItem(STORAGE_KEY_OPENROUTER);
    if (!chave) {
      mostrarToast('Cadastre a chave do OpenRouter antes de usar o assistente.', 'warning');
      return null;
    }

    const contexto = await getContextoLoja();
    const payload = {
      model: 'openai/gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Você é um assistente analítico da loja Chave Mestra. Responda apenas com dados da loja. Respeite estas regras: 1) Não pode alterar nada; 2) Não pode criar ou editar registros; 3) Só pode gerar análises, resumos, comparativos e gráficos; 4) Fale em português do Brasil; 5) Se for pedido alterar algo, recuse com explicação curta. Contexto da loja: ${JSON.stringify(contexto, null, 2)}`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7
    };

    try {
      const resposta = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${chave}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Chave Mestra Assistente IA'
        },
        body: JSON.stringify(payload)
      });

      if (!resposta.ok) {
        const erro = await resposta.text();
        throw new Error(`OpenRouter respondeu com erro: ${erro}`);
      }

      const dados = await resposta.json();
      return dados.choices?.[0]?.message?.content || 'Não foi possível gerar resposta.';
    } catch (error) {
      console.error(error);
      mostrarToast('Erro ao conectar com OpenRouter. Verifique a chave e a conexão.', 'danger');
      return null;
    }
  }

  async function processarPrompt(prompt) {
    const texto = String(prompt || '').trim();
    if (!texto) return;

    adicionarMensagem(texto, 'user');
    promptInput.value = '';

    const resposta = await enviarParaOpenRouter(texto);
    if (resposta) {
      adicionarMensagem(resposta, 'bot');
    }

    if (deveAbrirDashboard(texto)) {
      const contexto = await getContextoLoja();
      abrirDashboardModal(contexto);
    }
  }

  formChat.addEventListener('submit', async (event) => {
    event.preventDefault();
    const prompt = promptInput.value.trim();
    await processarPrompt(prompt);
  });

  promptButtons.forEach(botao => {
    botao.addEventListener('click', async () => {
      const texto = botao.dataset.prompt;
      await processarPrompt(texto);
    });
  });

  btnSalvarChave.addEventListener('click', salvarChave);
  btnLimparChave.addEventListener('click', limparChave);

  if (btnVoz) {
    btnVoz.addEventListener('click', () => {
      if (gravandoVoz) {
        pararGravacaoVoz();
        return;
      }

      iniciarGravacaoVoz();
    });
  }

  carregarChave();
  montarResumoLoja();
});
