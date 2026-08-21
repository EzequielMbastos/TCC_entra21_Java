const STORAGE_KEY = 'chave_mestra_db_v1';
const MOCK = true; // fallback apenas quando localStorage não estiver disponível

const MOCK_DATA = {
  produtos: [
    { id: 1, codigo_catalogo: 'CH001', nome: 'Chave Fiat P4', preco_venda: 25.00, estoque_atual: 15, ativo: true },
    { id: 2, codigo_catalogo: 'CH002', nome: 'Chave Tetra GM', preco_venda: 30.00, estoque_atual: 8, ativo: true },
    { id: 3, codigo_catalogo: 'PL001', nome: 'Pilha Alcalina AAA', preco_venda: 5.00, estoque_atual: 50, ativo: true },
    { id: 4, codigo_catalogo: 'TG001', nome: 'TAG de Estacionamento', preco_venda: 18.00, estoque_atual: 20, ativo: true },
    { id: 5, codigo_catalogo: 'CH003', nome: 'Chave Bruta Honda', preco_venda: 12.00, estoque_atual: 30, ativo: true }
  ],
  servicos: [
    { id: 1, nome: 'Cópia de Chave Simples', preco_base: 15.00, ativo: true },
    { id: 2, nome: 'Cópia de Chave Automotiva', preco_base: 40.00, ativo: true },
    { id: 3, nome: 'Abertura de Porta Residencial', preco_base: 80.00, ativo: true },
    { id: 4, nome: 'Abertura de Veículo', preco_base: 120.00, ativo: true }
  ],
  atendimentos: [
    {
      id: 1,
      data_abertura: '2026-08-07T09:15:00',
      status: 'FINALIZADO',
      forma_pagamento: 'PIX',
      valor_total: 85.00,
      cliente: { id: 1, nome: 'João Silva' },
      itens: [
        { tipo: 'PRODUTO', nome: 'Chave Fiat P4', quantidade: 2, preco_unitario: 25.00 },
        { tipo: 'SERVICO', nome: 'Cópia de Chave Automotiva', quantidade: 1, preco_unitario: 40.00 }
      ]
    }
  ],
  clientes: [
    { id: 1, nome: 'João Silva', cpf: '123.456.789-00', telefone: '(47) 99999-0000', endereco: 'Rua A, 123', ativo: true }
  ],
  financeiro: [
    { id: 1, tipo: 'SAIDA', categoria: 'Fornecedor', pessoa: 'CNPJ', descricao: 'Compra de material', valor: 250.00, data_vencimento: '2026-08-10', status: 'PENDENTE' },
    { id: 2, tipo: 'ENTRADA', categoria: 'Vendas', pessoa: '', descricao: 'Atendimento #1', valor: 85.00, data_vencimento: '2026-08-07', status: 'PAGO' }
  ]
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function storageAvailable() {
  return typeof localStorage !== 'undefined';
}

function getDefaultDatabase() {
  return clone(MOCK_DATA);
}

function ensureDatabase() {
  if (!storageAvailable()) {
    return getDefaultDatabase();
  }

  const raw = localStorage.getItem(STORAGE_KEY);
  const base = getDefaultDatabase();

  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(base));
    return clone(base);
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      produtos: Array.isArray(parsed.produtos) ? parsed.produtos : base.produtos,
      servicos: Array.isArray(parsed.servicos) ? parsed.servicos : base.servicos,
      atendimentos: Array.isArray(parsed.atendimentos) ? parsed.atendimentos : base.atendimentos,
      clientes: Array.isArray(parsed.clientes) ? parsed.clientes : base.clientes,
      financeiro: Array.isArray(parsed.financeiro) ? parsed.financeiro : base.financeiro
    };
  } catch (error) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(base));
    return clone(base);
  }
}

function saveDatabase(db) {
  if (!storageAvailable()) return db;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  return db;
}

function parseEndpoint(endpoint) {
  const [path, queryString = ''] = endpoint.split('?');
  return {
    path,
    query: new URLSearchParams(queryString)
  };
}

function getNextId(list) {
  return list.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
}

function mockGet(endpoint) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const { path, query } = parseEndpoint(endpoint);
      const termo = (query.get('nome') || '').toLowerCase();

      if (path === '/produtos') {
        const result = MOCK_DATA.produtos.filter(item => item.nome.toLowerCase().includes(termo));
        resolve(result);
        return;
      }

      if (path === '/servicos') {
        const result = MOCK_DATA.servicos.filter(item => item.nome.toLowerCase().includes(termo));
        resolve(result);
        return;
      }

      if (path === '/atendimentos') {
        resolve(MOCK_DATA.atendimentos);
        return;
      }

      if (path === '/clientes') {
        resolve(MOCK_DATA.clientes);
        return;
      }

      if (path === '/financeiro') {
        resolve(MOCK_DATA.financeiro);
        return;
      }

      if (path === '/relatorios') {
        const inicio = query.get('inicio');
        const fim = query.get('fim');
        const itens = MOCK_DATA.financeiro.filter(item => {
          if (!inicio && !fim) return true;
          const dataItem = item.data_vencimento || item.data_abertura;
          if (inicio && dataItem < inicio) return false;
          if (fim && dataItem > fim) return false;
          return true;
        });
        const totalEntradas = itens.filter(item => item.tipo === 'ENTRADA').reduce((s, i) => s + Number(i.valor || 0), 0);
        const totalSaidas = itens.filter(item => item.tipo === 'SAIDA').reduce((s, i) => s + Number(i.valor || 0), 0);
        resolve({
          total_entradas: totalEntradas,
          total_saidas: totalSaidas,
          saldo: totalEntradas - totalSaidas,
          atendimentos: MOCK_DATA.atendimentos.length,
          itens
        });
        return;
      }

      resolve([]);
    }, 100);
  });
}

function mockPost(endpoint, data) {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (endpoint === '/produtos') {
        const novo = { id: getNextId(MOCK_DATA.produtos), ...data, ativo: true };
        MOCK_DATA.produtos.push(novo);
        resolve(novo);
        return;
      }

      if (endpoint === '/servicos') {
        const novo = { id: getNextId(MOCK_DATA.servicos), ...data, ativo: true };
        MOCK_DATA.servicos.push(novo);
        resolve(novo);
        return;
      }

      if (endpoint === '/clientes') {
        const novo = { id: getNextId(MOCK_DATA.clientes), ...data, ativo: true };
        MOCK_DATA.clientes.push(novo);
        resolve(novo);
        return;
      }

      if (endpoint === '/financeiro') {
        const novo = {
          id: getNextId(MOCK_DATA.financeiro),
          tipo: data.tipo || 'ENTRADA',
          categoria: data.categoria || 'Outros',
          pessoa: data.pessoa || '',
          descricao: data.descricao || '',
          valor: Number(data.valor || 0),
          data_vencimento: data.data_vencimento || new Date().toISOString().slice(0, 10),
          status: data.status || 'PENDENTE',
          observacao: data.observacao || ''
        };
        MOCK_DATA.financeiro.push(novo);
        resolve(novo);
        return;
      }

      if (endpoint === '/atendimentos') {
        const itens = Array.isArray(data.itens) ? data.itens : [];
        const total = itens.reduce((acc, item) => acc + Number(item.quantidade || 0) * Number(item.preco_unitario || 0), 0);
        const novo = {
          id: getNextId(MOCK_DATA.atendimentos),
          data_abertura: new Date().toISOString(),
          status: 'FINALIZADO',
          forma_pagamento: data.forma_pagamento,
          valor_total: total,
          cliente: data.cliente_id ? MOCK_DATA.clientes.find(c => Number(c.id) === Number(data.cliente_id)) || null : null,
          itens: itens.map(item => ({ ...item, nome: item.nome || '' }))
        };
        MOCK_DATA.atendimentos.push(novo);
        resolve(novo);
        return;
      }

      resolve({ id: Date.now(), ...data });
    }, 120);
  });
}

async function apiGet(endpoint) {
  if (!storageAvailable() && MOCK) {
    return mockGet(endpoint);
  }

  const db = ensureDatabase();
  const { path, query } = parseEndpoint(endpoint);
  const termo = (query.get('nome') || '').toLowerCase();

  if (path === '/produtos') {
    const lista = db.produtos.filter(item => item.ativo !== false && item.nome.toLowerCase().includes(termo));
    return lista;
  }

  if (path === '/servicos') {
    const lista = db.servicos.filter(item => item.ativo !== false && item.nome.toLowerCase().includes(termo));
    return lista;
  }

  if (path === '/clientes') {
    return db.clientes.filter(item => item.ativo !== false);
  }

  if (path === '/atendimentos') {
    return db.atendimentos;
  }

  if (path === '/financeiro') {
    return db.financeiro;
  }

  if (path === '/relatorios') {
    const inicio = query.get('inicio');
    const fim = query.get('fim');
    const itens = db.financeiro.filter(item => {
      if (!inicio && !fim) return true;
      const dataItem = item.data_vencimento || item.data_abertura || '';
      if (inicio && dataItem < inicio) return false;
      if (fim && dataItem > fim) return false;
      return true;
    });

    const totalEntradas = itens
      .filter(item => item.tipo === 'ENTRADA')
      .reduce((soma, item) => soma + Number(item.valor || 0), 0);

    const totalSaidas = itens
      .filter(item => item.tipo === 'SAIDA')
      .reduce((soma, item) => soma + Number(item.valor || 0), 0);

    return {
      total_entradas: totalEntradas,
      total_saidas: totalSaidas,
      saldo: totalEntradas - totalSaidas,
      atendimentos: db.atendimentos.length,
      itens
    };
  }

  return [];
}

async function apiPost(endpoint, data) {
  if (!storageAvailable() && MOCK) {
    return mockPost(endpoint, data);
  }

  const db = ensureDatabase();

  if (endpoint === '/produtos') {
    const novo = {
      id: getNextId(db.produtos),
      codigo_catalogo: data.codigo_catalogo || '',
      nome: data.nome || '',
      preco_venda: Number(data.preco_venda || 0),
      estoque_atual: Number(data.estoque_atual || 0),
      ativo: true
    };
    db.produtos.push(novo);
    saveDatabase(db);
    return novo;
  }

  if (endpoint === '/servicos') {
    const novo = {
      id: getNextId(db.servicos),
      nome: data.nome || '',
      preco_base: Number(data.preco_base || 0),
      ativo: true
    };
    db.servicos.push(novo);
    saveDatabase(db);
    return novo;
  }

  if (endpoint === '/clientes') {
    const novo = {
      id: getNextId(db.clientes),
      nome: data.nome || '',
      cpf: data.cpf || '',
      telefone: data.telefone || '',
      endereco: data.endereco || '',
      ativo: true
    };
    db.clientes.push(novo);
    saveDatabase(db);
    return novo;
  }

  if (endpoint === '/financeiro') {
    const novo = {
      id: getNextId(db.financeiro),
      tipo: data.tipo || 'ENTRADA',
      categoria: data.categoria || 'Outros',
      pessoa: data.pessoa || '',
      descricao: data.descricao || '',
      valor: Number(data.valor || 0),
      data_vencimento: data.data_vencimento || new Date().toISOString().slice(0, 10),
      status: data.status || 'PENDENTE',
      observacao: data.observacao || ''
    };
    db.financeiro.push(novo);
    saveDatabase(db);
    return novo;
  }

  if (endpoint === '/atendimentos') {
    const itens = Array.isArray(data.itens) ? data.itens : [];

    itens.forEach(item => {
      if (item.tipo === 'PRODUTO') {
        const produto = db.produtos.find(p => Number(p.id) === Number(item.id));
        if (!produto) {
          throw new Error(`Produto não encontrado: ${item.id}`);
        }
        const quantidade = Number(item.quantidade || 0);
        if (quantidade > Number(produto.estoque_atual || 0)) {
          throw new Error(`Estoque insuficiente para ${produto.nome}`);
        }
      }
    });

    itens.forEach(item => {
      if (item.tipo === 'PRODUTO') {
        const produto = db.produtos.find(p => Number(p.id) === Number(item.id));
        if (produto) {
          produto.estoque_atual = Number(produto.estoque_atual || 0) - Number(item.quantidade || 0);
        }
      }
    });

    const cliente = data.cliente_id ? db.clientes.find(c => Number(c.id) === Number(data.cliente_id)) || null : null;
    const valor_total = itens.reduce((soma, item) => soma + Number(item.quantidade || 0) * Number(item.preco_unitario || 0), 0);

    const novo = {
      id: getNextId(db.atendimentos),
      data_abertura: new Date().toISOString(),
      status: 'FINALIZADO',
      forma_pagamento: data.forma_pagamento || 'DINHEIRO',
      valor_total,
      cliente: cliente ? { id: cliente.id, nome: cliente.nome } : null,
      itens: itens.map(item => ({
        tipo: item.tipo,
        id: item.id,
        nome: item.nome,
        quantidade: Number(item.quantidade || 0),
        preco_unitario: Number(item.preco_unitario || 0)
      }))
    };

    db.atendimentos.push(novo);
    saveDatabase(db);
    return novo;
  }

  return { id: Date.now(), ...data };
}

ensureDatabase();

async function apiPut(endpoint, data) {
  if (!storageAvailable() && MOCK) {
    return { id: Date.now(), ...data };
  }

  const db = ensureDatabase();
  const segments = endpoint.split('/').filter(Boolean);
  const [resource, rawId] = segments;
  const id = Number(rawId);

  if (!resource || !id) {
    throw new Error('Endpoint PUT inválido');
  }

  const tabela = resource === 'produtos' ? 'produtos'
    : resource === 'servicos' ? 'servicos'
    : resource === 'clientes' ? 'clientes'
    : resource === 'financeiro' ? 'financeiro'
    : null;

  if (!tabela) {
    throw new Error('Recurso não suportado');
  }

  const index = db[tabela].findIndex(item => Number(item.id) === id);
  if (index === -1) {
    throw new Error('Registro não encontrado');
  }

  db[tabela][index] = { ...db[tabela][index], ...data };
  saveDatabase(db);
  return db[tabela][index];
}

async function apiDelete(endpoint) {
  if (!storageAvailable() && MOCK) {
    return true;
  }

  const db = ensureDatabase();
  const segments = endpoint.split('/').filter(Boolean);
  const [resource, rawId] = segments;
  const id = Number(rawId);

  if (!resource || !id) {
    throw new Error('Endpoint DELETE inválido');
  }

  const tabela = resource === 'produtos' ? 'produtos'
    : resource === 'servicos' ? 'servicos'
    : resource === 'clientes' ? 'clientes'
    : resource === 'financeiro' ? 'financeiro'
    : null;

  if (!tabela) {
    throw new Error('Recurso não suportado');
  }

  const index = db[tabela].findIndex(item => Number(item.id) === id);
  if (index === -1) {
    throw new Error('Registro não encontrado');
  }

  db[tabela].splice(index, 1);
  saveDatabase(db);
  return true;
}