# Backend

## Visão geral

O backend fornece a API REST para autenticação, dashboard, categorias, transações e OCR.

## Camadas

- controllers: manipulação de requisições.
- routes: definição de endpoints.
- services: regras de negócios.
- middlewares: segurança e autenticação.
- database: camada de acesso e armazenamento em memória com preparação para PostgreSQL.

## Segurança

- JWT e refresh token.
- Hash de senha com bcrypt.
- Helmet, rate limit e CORS.
- Sanitização de entradas.
- Bloqueio progressivo após cinco falhas de login e logs de segurança sem credenciais.

## Execução

npm install
cp .env.example .env
npm run dev
