# BitCups — Atualização da vitrine e do carrinho

## Alterações
- Textos de apresentação, Instagram e contato atualizados.
- Sete categorias principais com subcategorias solicitadas; a oitava seção é **Mais vendidos**, calculada pelas quantidades registradas em `order_items` de pedidos não cancelados. Sem pedidos registrados, ela ficará vazia.
- Carrinho com CPF/CNPJ, empresa opcional, endereço completo e observações. Os dados seguem para o WhatsApp e são gravados no banco em `order_customer_details`.
- Produtos existentes no MySQL são preservados; categorias antigas conhecidas são mapeadas para a nova organização na vitrine. Produtos sem categoria reconhecida devem ser recategorizados pelo administrador para aparecer na vitrine.

## ANTES do deploy
1. Faça backup do MySQL e do projeto atual.
2. No MySQL Workbench, conectado ao banco de produção, execute **migration-order-customer-details.sql** uma única vez. Sem isso, o checkout novo não registrará pedidos.
3. Não copie `.env` ou credenciais para o repositório. Configure as variáveis de ambiente no painel da hospedagem.
4. Faça o deploy e teste cadastro, login, painel, vitrine, carrinho e registro de pedido com dados de teste. Confirme no banco que os detalhes foram gravados.
5. Teste o comportamento dos produtos antigos e recategorize os que não aparecerem.

## Segurança e limitações
- O ZIP foi preparado sem `.env`, `.git`, `node_modules`, `dist` e uploads.
- CPF/CNPJ são dados pessoais: restrinja acesso ao banco, faça backup seguro, ajuste a política de privacidade e defina retenção/exclusão apropriadas.
- Validação atual de CPF/CNPJ verifica a quantidade de dígitos, não os dígitos verificadores.
- A compilação Linux **não pôde ser concluída neste ambiente** porque as dependências do ZIP foram instaladas no Windows e faltam binários nativos Linux (`lightningcss`). O TypeScript foi verificado; persistem erros preexistentes em `MotionSurface.tsx` e `SiteHeader.tsx`.
- Não foi realizado teste integrado com o banco de produção. Não substitua a versão em produção sem fazer os testes descritos.
