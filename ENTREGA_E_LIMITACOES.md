# BitCups — implementação incremental de backend

## Incluído nesta versão
- Cadastro e login opcionais, sessão por cookie HttpOnly, logout.
- Solicitação de redefinição de senha por e-mail SMTP e link de 30 minutos, token de uso único, revogação de sessões.
- Limite de tentativas de login já existente e limite adicional para solicitação de recuperação (em memória; NÃO distribuído).
- Painel administrativo básico: cadastro/edição/desativação de produtos e alteração do status de pedidos.
- API de pedidos com cálculo de preço no servidor usando produtos cadastrados no MySQL.
- Esquema MySQL, exemplo de variáveis de ambiente, script de criação de administrador.

## AINDA NÃO FINALIZADO — NÃO PUBLICAR COMO LOJA PRONTA
- A vitrine original utiliza o catálogo JSON, e o checkout WhatsApp original NÃO está ligado à nova API de pedidos.
- Upload de imagens privadas, projetos personalizados, cupons, banners e carrinhos sincronizados ainda precisam de integração funcional e testes.
- Recuperação por e-mail exige SMTP real e domínio APP_URL configurados. O envio não foi testado em SMTP real.
- O limite de tentativas em memória não é persistente entre reinicializações nem compartilhado entre instâncias. Antes da produção, migrar para armazenamento compartilhado e adicionar limitação no proxy.
- Testes completos de build, banco de dados, e-mail, permissões e segurança ainda são necessários.
- Os termos legais são modelos e exigem revisão conforme o tratamento real dos dados e o controlador.

## Preparação local
1. Instale Node.js compatível com Vite 8 e MySQL 8+.
2. Crie o banco executando database/schema.sql.
3. Configure variáveis de ambiente no Windows ou no painel da hospedagem, seguindo .env.example.
4. Execute `npm install`, `npm run build` e `npm start`.
5. Configure SMTP e APP_URL; sem eles, o envio de recuperação não funcionará.
6. Execute `npm run admin:create` em um terminal com as variáveis de banco configuradas.
7. Teste login, cadastro, recuperação de senha, acesso ao painel e operações MySQL.

**Atenção:** não coloque senhas reais em arquivos enviados ao cliente ou em repositórios públicos.
