# BitCups — Etapa 2: API de cadastro opcional

Esta entrega adiciona ao servidor Node.js uma API real de autenticação com MySQL. **Não inclui ainda a interface visual de cadastro/login, painel administrativo, nem a integração dos pedidos.** A vitrine original foi preservada.

## Pré-requisitos
- Node.js compatível com o projeto (recomendado Node 24)
- MySQL 8+ em execução
- Banco e usuário MySQL configurados localmente

## Preparação
1. Importe `database/schema.sql` no MySQL (em banco novo). Se já importou o esquema da etapa 1, execute somente o `CREATE TABLE auth_sessions` do final do arquivo.
2. Configure as variáveis DB_HOST, DB_PORT, DB_NAME, DB_USER e DB_PASSWORD no ambiente do servidor. O arquivo `.env.example` é apenas um modelo: o servidor não carrega `.env` automaticamente.
3. No terminal da pasta BITCUPS: `npm install`, `npm run build`, `npm start`.
4. A API está disponível no mesmo endereço do site, normalmente `http://localhost:10000`.

## Endpoints disponíveis
- `POST /api/auth/register`: JSON `{ "name": "Nome", "email": "email@exemplo.com", "password": "senha com 12+ caracteres" }` — cadastra cliente (nunca administrador).
- `POST /api/auth/login`: JSON `{ "email": "email@exemplo.com", "password": "..." }`.
- `GET /api/auth/me`: retorna o usuário da sessão ou `null`.
- `POST /api/auth/logout`: encerra a sessão.

Senhas com scrypt e salt aleatório; token de sessão aleatório armazenado no banco apenas como hash SHA-256; cookie HttpOnly e SameSite=Lax (Secure em produção HTTPS). As consultas usam parâmetros MySQL.

## Antes de publicar
- Implementar limite de tentativas de login e recuperação de senha.
- Implementar interface de cadastro/login e testes automatizados com MySQL.
- Criar contas administrativas com rotina protegida, e controle de permissões por endpoint.
- Validar a persistência do armazenamento de arquivos e os backups da hospedagem.
- Não publicar dados reais até concluir revisão de segurança e privacidade.

## Cadastro opcional
Os visitantes continuam navegando e comprando pelo fluxo existente sem cadastro. A nova API será conectada à interface nas próximas etapas.
