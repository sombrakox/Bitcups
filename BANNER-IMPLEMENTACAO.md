# Banner cinematográfico BitCups

Banner atualizado em `src/routes/index.tsx` e `src/styles.css`.
Imagem de produtos: `src/assets/hero-bitcups-products.webp`, recortada da referência fornecida pelo usuário.
A logo permanece como imagem existente; textos e botões são HTML/React, e efeitos de arco e brilho são SVG/CSS animados por camadas.

## Testar
`npm ci` (se necessário), `npm run build`, `npm run start`.

Não inclui `.env`, `.git`, `node_modules` nem `dist`. Configure variáveis no ambiente de deploy. Não faça push sem testar.

A fotografia dos produtos é uma camada única recortada da referência, portanto os produtos não são individualmente animáveis sem arquivos recortados independentes.
