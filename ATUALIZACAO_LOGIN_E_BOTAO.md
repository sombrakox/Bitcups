# BitCups — atualização visual do login e acesso no cabeçalho

## O que mudou
- Página `/login` reformulada com visual premium, responsivo e identidade BitCups.
- Formulário acessível, opção de visualizar/ocultar senha, indicação de carregamento e mensagens de erro.
- Links visíveis para cadastro, recuperação assistida de senha e compra sem conta.
- Botão **Entrar / Minha conta** no cabeçalho, inclusive em celulares.
- API de autenticação e banco MySQL preservados; nenhuma migração SQL é necessária nesta atualização.

## Instalação
1. Faça backup da pasta atual e do `.env`.
2. Extraia este ZIP para uma pasta nova.
3. Copie **somente** seu `.env` da versão anterior para a raiz desta versão (não envie a senha a terceiros).
4. Execute `npm install`, `npm run build` e `npm start`.
5. Abra `http://localhost:10000/login` e teste o botão do cabeçalho, cadastro e login.

## Validação
A integração com banco e a compilação completa devem ser verificadas no seu computador. Não foi possível executar o build neste ambiente sem instalar as dependências. O novo layout não altera os endpoints de autenticação existentes.
