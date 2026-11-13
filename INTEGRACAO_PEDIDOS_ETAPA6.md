# BitCups — integração de orçamento no MySQL (Etapa 6)

O carrinho da vitrine original agora solicita nome e telefone, registra um orçamento na tabela `orders` com seus itens em `order_items`, e abre o WhatsApp com o identificador. A conta continua opcional. O pedido fica `awaiting_confirmation`, pois abrir o WhatsApp não comprova envio.

**Importante:** o catálogo original não possui preços confiáveis nem IDs numéricos correspondentes à tabela `products`. Por isso o pedido é registrado como **orçamento**, com total zero, sem cobrar ou afirmar preços. O painel de produtos MySQL ainda não está ligado à vitrine original. Os arquivos do formulário `/projeto` ainda são compartilhados pelo navegador/WhatsApp, não armazenados privadamente no servidor. Não anuncie essas funções como concluídas.

## Antes de publicar

1. Configurar MySQL 8+ e importar `database/schema.sql`.
2. Preencher `.env` localmente com banco, URL e SMTP; não publicar segredos.
3. Instalar dependências, executar `npm run build` e `npm start`.
4. Testar cadastro, login, recuperação de senha por SMTP, permissões de admin, carrinho e WhatsApp com MySQL real.
5. Revisar política LGPD, backups, retenção de dados, limites de uploads e segurança operacional.

Não foram executados testes de integração com MySQL ou SMTP neste ambiente.
