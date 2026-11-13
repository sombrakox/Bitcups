# Etapa 5 — Carrinho e favoritos com MySQL

Adicionadas tabelas `customer_cart` e `customer_favorites`, API autenticada em `/api/saved/cart` e `/api/saved/favorites`, e sincronização na inicialização do site para usuários logados. Visitantes continuam com armazenamento local.

## Preparação

1. Execute as instruções de `database/schema.sql` no MySQL (CREATE TABLE IF NOT EXISTS preserva as tabelas existentes).
2. Configure `.env` com as credenciais MySQL e execute `npm install`, `npm run build`, `npm start`.
3. Teste com conta cadastrada, adicione itens, recarregue e abra outra sessão.

## Limitações importantes

- A sincronização inicial mescla dados locais com os da conta; em dispositivos compartilhados, limpe os dados locais após logout.
- A sincronização do carrinho depende da sessão estar ativa quando a página for aberta; login feito sem recarregar pode exigir atualização.
- A API aceita IDs textuais da vitrine existente, não valida contra a lista de produtos no servidor.
- Ainda faltam integração do catálogo administrativo com a vitrine, checkout persistente, upload privado e testes com MySQL real.
- Não publique sem revisar privacidade, sessões e testes end-to-end.
