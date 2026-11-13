# BitCups — checklist obrigatório antes da publicação

Esta versão integra produtos criados pelo painel MySQL à vitrine, adiciona esses itens ao carrinho e registra pedidos com preço calculado pelo servidor para produtos cadastrados no banco. O catálogo original continua estático e seus orçamentos ficam sem preço até configuração.

## Configuração
1. Instale Node.js compatível com Vite 8, MySQL 8+ e um SMTP transacional.
2. Crie `.env` a partir de `.env.example` e configure domínio HTTPS, MySQL e SMTP. Nunca publique `.env`.
3. Importe `database/schema.sql` em um banco novo e execute `npm install`, `npm run build`, `npm run admin:create`, `npm start`.
4. Configure HTTPS, backups automáticos do MySQL, logs sem dados pessoais, política de retenção e monitoração.
5. Faça testes reais de cadastro, login, bloqueio de tentativas, recuperação de senha, logout, painel, cadastro/edição de produto, pedido e WhatsApp.

## Impedimentos conhecidos para publicar
- Não foi possível executar testes de integração com MySQL e SMTP reais neste ambiente.
- O envio de arquivos privados do projeto personalizado ainda não está integrado ao painel com armazenamento privado seguro.
- O catálogo legado usa imagens locais e não foi migrado integralmente para tabelas do banco.
- O limite de login em memória não é suficiente para múltiplas instâncias; exige Redis ou armazenamento persistente.
- Os documentos LGPD exigem revisão por responsável legal e preenchimento dos dados da empresa.
- O upload de imagem para produtos pelo painel ainda exige hospedagem/URL da imagem.

**Não publique dados reais de clientes antes de resolver os impedimentos acima.**
