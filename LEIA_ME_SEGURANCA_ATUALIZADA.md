# BitCups — atualização do bloqueio de autenticação

Esta atualização substitui os contadores em memória da API de autenticação por contadores atômicos persistidos no MySQL. O bloqueio permanece após reiniciar o Node.js e é compartilhado entre processos que usam o mesmo banco.

## Importação no Workbench

Se ainda não importou as tabelas: execute `database/schema.sql` inteiro. Se já importou: execute somente `database/ATUALIZACAO_SEGURANCA.sql`. Não execute os dois sem necessidade.

## Limites

- Login: 20 requisições por IP e 8 por e-mail em 15 minutos.
- Recuperação: 12 solicitações por IP e 3 por e-mail em 1 hora; redefinição: 15 por IP em 1 hora.
- Identificadores armazenados em SHA-256, sem guardar e-mail/IP diretamente nesta tabela.

## Atenção

Os limites contam tentativas, inclusive válidas, como defesa básica; isso não substitui WAF, monitoramento, auditoria ou avaliação profissional de segurança. Para proteger contas contra abuso direcionado, considere limites progressivos e proteção de bot antes de produção. A identificação do IP utiliza o endereço da conexão, não cabeçalhos encaminhados não confiáveis; se houver proxy, configurar e validar uma cadeia de proxy confiável.

O arquivo `.env` deve conter credenciais reais do MySQL, SMTP e URL pública. Não publique segredos nem o diretório de uploads. A aplicação e a recuperação por e-mail ainda exigem testes de integração reais. O catálogo original e armazenamento privado de anexos precisam de auditoria antes da publicação. Este pacote NÃO é uma certificação de prontidão para produção.
