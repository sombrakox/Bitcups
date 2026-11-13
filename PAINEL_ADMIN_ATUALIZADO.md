# BitCups — Painel administrativo atualizado

- Loja e login dos clientes mantidos.
- Login exclusivo do administrador: `/admin/login`. Usa a mesma autenticação do servidor e exige `role=admin`; a API também verifica a permissão.
- Dashboard com produtos, listagem, edição, desativação, pedidos e recuperação de senha assistida.
- Upload de imagens JPG, PNG e WebP de até 5 MB para `uploads/products/`. O arquivo é armazenado no disco do servidor e o caminho fica registrado no MySQL.

## Atenção à hospedagem

A pasta `uploads/` precisa de armazenamento **persistente e com backup** na hospedagem. Em serviços com disco efêmero, as imagens podem desaparecer após um novo deploy/reinício. Para produção, configurar volume persistente ou serviço de objetos (S3/R2/etc.) antes de publicar. Uploads são validados por tamanho, extensão e assinatura básica, mas não passam por processamento/antivírus; recomenda-se reprocessamento de imagens em produção.

## Instalação

1. Faça backup da versão estável e do `.env` configurado.
2. Extraia o ZIP em uma nova pasta.
3. Preencha o `.env` com as configurações reais do MySQL (não envie suas senhas).
4. Execute `npm install`, `npm run build`, `node --env-file=.env server-render.mjs`.
5. Acesse `http://localhost:10000/admin/login` com conta cujo `role` seja `admin`.

Não há alterações de esquema no banco. Produtos existentes são preservados.
