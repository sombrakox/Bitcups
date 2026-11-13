# BitCups — Etapa 1: preparação do MySQL

Esta entrega **preserva o site original** e adiciona o esquema inicial de banco de dados.

## O que está pronto
- `database/schema.sql`: estrutura das tabelas de clientes, administradores (campo `role`), produtos, pedidos, itens, carrinho, favoritos, projetos, arquivos, banners e cupons.
- `.env.example`: modelo de configuração para a próxima etapa.

## O que AINDA NÃO está pronto
- O site ainda **não se conecta ao MySQL**; não há endpoints de cadastro/login, painel administrativo, uploads privados ou pedidos persistidos.
- O formulário de projeto original continua abrindo WhatsApp como antes.
- **Não coloque em produção como loja com cadastro** até integrar API, autenticação, controle de permissões, validação e testes.

## Como testar o site atual (Windows)
1. Extraia o ZIP.
2. Entre na pasta `BITCUPS` pelo terminal.
3. Execute `npm install`, depois `npm run build` e `npm start`.
4. Abra `http://localhost:10000`.

## Como preparar o banco (quando tiver MySQL 8+)
1. Instale o MySQL localmente ou obtenha as credenciais da hospedagem.
2. Execute o arquivo `database/schema.sql` pelo MySQL Workbench ou cliente SQL autorizado.
3. **Não publique `.env` nem compartilhe a senha do banco**.
4. Não use o usuário `root` na aplicação em produção; crie usuário com permissões limitadas.

## Próxima etapa
Integrar API Node.js, login com sessões seguras e painel administrador; depois catálogo, checkout e uploads privados. Manter cadastro opcional e carrinho WhatsApp.
