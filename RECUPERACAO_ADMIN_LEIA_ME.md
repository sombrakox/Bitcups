# BitCups — Recuperação assistida pelo administrador

## Como ativar no seu computador

1. Faça backup da pasta BitCups e do banco antes de substituir arquivos.
2. Substitua a pasta do projeto pela versão deste ZIP, mas **preserve seu `.env` local** (não o compartilhe).
3. No Workbench (conexão root), execute `database/RECUPERACAO_ADMIN_MIGRACAO.sql` **uma vez**. Não execute novamente o esquema inteiro se já tem dados.
4. No `.env`, use `APP_URL=http://localhost:10000` para teste local. Em produção, configure a URL HTTPS real. Não é necessário SMTP para este fluxo.
5. Na pasta do projeto execute `npm install`, `npm run build`, `npm start`.
6. Crie um administrador com `npm run admin:create` (consulte o script; nunca compartilhe senhas). Entre em `/admin` e localize Recuperação de senha assistida.
7. Depois de confirmar a identidade do cliente **fora do sistema**, informe o e-mail cadastrado, marque a confirmação e gere um link. Envie somente ao titular por canal confiável.
8. O cliente abre o link em até 15 minutos, cria senha nova e faz login. Sessões anteriores são revogadas. O link é invalidado após uso.

## Segurança e limitações

- O sistema **não verifica a identidade automaticamente**. A verificação é uma responsabilidade operacional crítica: confirmar posse de um canal previamente cadastrado e/ou procedimento de atendimento documentado; não confiar apenas em nome, CPF, e-mail informado ou foto de documento enviada no mesmo chat.
- A API exige sessão de administrador; limita emissões a 10/h por administrador; armazena apenas hash do token e mantém auditoria de emissão sem salvar o link em banco.
- Quem tiver o link poderá trocar a senha até seu uso ou expiração. Não compartilhe em grupos nem tire prints.
- O administrador precisa existir com `role=admin`; não altere permissões de clientes sem autorização.
- **Não foi realizado teste integrado com seu MySQL local nem teste end-to-end de produção neste ambiente.** Faça homologação completa antes de publicar.
- Para produção, use HTTPS, revisão de segurança, proteção do painel com MFA, logs de acesso e processo de verificação de identidade formalizado.
- SMTP não é necessário para a recuperação assistida, mas outros recursos de e-mail exigiriam configuração separada.
