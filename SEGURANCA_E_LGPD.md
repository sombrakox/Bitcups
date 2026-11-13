# BitCups — segurança e LGPD (etapa 3)

## Implementado
- Cadastro opcional e páginas /cadastro, /login, /conta, /termos, /privacidade.
- Senhas protegidas com scrypt e salt aleatório, sessões com tokens aleatórios e cookie HttpOnly/SameSite.
- Limites de tentativas em memória: até 8 requisições por e-mail e 20 por IP em janela de 15 minutos (login e cadastro); HTTP 429.
- Verificação de Origin para requisições POST com Origin; proteção complementar ao SameSite.
- Mensagens genéricas de falha de credenciais.

## Antes de publicar
- Testar integração MySQL real, criar migrações, implementar recuperação de senha e verificação de e-mail.
- Para múltiplas instâncias ou reinicializações, substituir rate limit em memória por limite centralizado no MySQL/Redis, com bloqueio progressivo e monitoramento.
- Revisar cookies Secure em produção atrás do proxy HTTPS, cabeçalhos de segurança, política de senhas e sessões.
- Confirmar identificação do controlador, prazos de retenção, prestadores, política de backup, exclusão e canal de direitos LGPD.
- Revisar Termos de Uso e Política de Privacidade com profissional habilitado; textos são preliminares.
- A API de autenticação funciona com `npm run build && npm start`, MySQL configurado e schema.sql aplicado. `npm run dev` não executa o servidor customizado de API.
- NÃO considerar concluídos painel administrativo, sincronização de carrinho, recuperação de senha, confirmação de e-mail ou testes de invasão.
