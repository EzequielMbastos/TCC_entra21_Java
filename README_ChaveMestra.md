CHAVE MESTRA - Gestão de Lojas

Sistema web de gestão para lojas de pequeno e medio porte.
Cliente real: Loja de Chaves - Itajaí/SC.
Problema

O pequeno e medio lojista fica no limbo, pois empresas grandes não tem uma solução simples e compativel com esse tipo de negocio, o lojista perde tempo digitando notas fiscais, não enxerga de forma rápida o que está em falta no estoque, não centraliza os serviços feitos junto com as vendas de produtos e não tem alertas simples sobre contas a pagar.

Solução

Centralizar tudo em um sistema web simples: produtos e serviços no mesmo catálogo, registro único de atendimento (que pode ter venda de produto e serviço junto), entrada de nota fiscal por arquivo XML e painel com os alertas essenciais (estoque baixo e contas a vencer).
=========================================
Funcionalidades da primeira versão (MVP)

Login e senha para acessar o sistema.

1. Catálogo unificado (produtos e serviços), com cadastro, edição, tipo, preço, estoque e estoque mínimo.
2. Entrada de estoque via upload do XML da nota fiscal eletrônica, com extração automática dos itens.
3. Registro de atendimentos: um atendimento pode misturar serviços e produtos. Ao finalizar, o sistema baixa automaticamente a quantidade em estoque apenas para os itens que são produto.
4. Contas a pagar, com destaque para contas vencidas e próximas do vencimento.
5. Dashboard com: itens com estoque baixo, contas a vencer na semana, total de atendimentos e valor movimentado no mês, total a pagar pendente.
Funcionalidades do MVP

============================================
Entidades: 

Usuário: Terá os atributos de Login e Senha, a base para acessar o sistema.

Catálogo (Produtos/Serviços): entidade principal que represente tanto um produto quanto um serviço.

    Atributos Comuns: Um identificador único (ID), um nome, uma descrição, um preço, um tipo (para diferenciar se é Produto ou Serviço), uma flag ativo para controlar o que aparece no catálogo.

    Especificidades do Produto: Para os produtos, você precisará controlar a quantidade em estoque e definir um estoqueMinimo para os alertas.

    Relacionamento com Fornecedor: A entidade Fornecedor terá seus próprios dados (nome, CNPJ, contato), e se conectará ao produto que ela fornece.

Estoque (Movimentações): Essa entidade é essencial para rastrear o histórico de entradas e saídas de produtos. Sempre que um produto entra ou sai, você cria um registro aqui, evitando recalcular o estoque do zero a cada consulta. Ela se relaciona com a entidade Produto.

Nota Fiscal (NF-e): Essa entidade armazenará os metadados da nota fiscal (número, data de emissão, chave de acesso) e servirá como o registro da operação de compra que originou a entrada de mercadorias no estoque.

Atendimento: Esta é uma entidade central, pois une o atendimento ao cliente com a venda. Contem os detalhes do atendimento e se conecta tanto à tabela de Serviços (quando um serviço é prestado) quanto à tabela de Produtos (quando um produto é vendido). Ao finalizar, ela aciona a lógica para dar baixa no estoque.

Contas a Pagar: Uma entidade separada para gerenciar as finanças. Ela conterá informações como descricao, valor, dataVencimento, dataPagamento (que pode ser nula se ainda não foi paga) e um status (Pendente, Pago, Vencido). Para o dashboard, você usará a dataVencimento para gerar os alertas.

-----------------------------------------------------------------
Possiveis melhorias futuras (fora da entrega) :

Assistente IA (chat/voz) para perguntas sobre o negócio.

Alertas por WhatsApp.

Leitura de nota fiscal por imagem (OCR).

Funcionamento offline.
-----------------------------------------------------------------
Equipe

Ezequiel: Frontend, Backend, estrutura do banco, integração.

Elis: catálogo (produtos, serviços, categorias, fornecedores) - e telas.

Alex: atendimentos (registro e baixa de estoque) - frontend e telas.

Bruno: contas a pagar e dashboard - backend e telas.
