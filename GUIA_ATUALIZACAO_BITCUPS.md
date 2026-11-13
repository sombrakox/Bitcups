# BitCups — Guia de atualização

1. Faça backup da pasta e do banco MySQL. **Não substitua o .env configurado por um exemplo.**
2. Extraia o ZIP em uma pasta nova; copie apenas suas configurações reais de .env para ela.
3. Rode `npm install`, `npm run build` e `node --env-file=.env server-render.mjs`.
4. Entre em `/admin/login`, acesse Produtos e clique em **Importar produtos antigos para edição**. A importação é repetível sem duplicar imagens idênticas.
5. Produtos importados recebem preço R$ 0,00 quando o catálogo antigo não informava preços; revise antes de vender.
6. Cadastre produtos escolhendo categoria/subcategoria. Os itens aparecem junto dos antigos na vitrine. Excluir desativa e permite reativar.
7. Cliente autenticado envia projetos em `/projeto`; administrador acompanha em Projetos recebidos.
8. Para produção, configure `UPLOAD_DIR` apontando para armazenamento **persistente** fora da pasta substituída no deploy. Faça backup do MySQL e dos uploads. Se a hospedagem não oferecer persistência, NÃO publique uploads nela.
9. A recuperação de senha continua assistida pelo administrador, sem envio automático de e-mail.
10. Nunca publique `.env` no GitHub; o arquivo do ZIP contém apenas exemplos.
