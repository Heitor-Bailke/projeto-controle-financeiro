# Fluxo Financeiro

Aplicação web moderna para controle financeiro pessoal, com foco em experiência visual, organização e produtividade. O projeto combina um painel financeiro elegante com autenticação segura, gestão de lançamentos, categorias, análise mensal e OCR para extração de dados de comprovantes.

## Visão geral

O Fluxo Financeiro foi pensado para oferecer uma experiência profissional e intuitiva para quem quer controlar gastos, receitas e metas de forma simples. A proposta é unir interface moderna, arquitetura organizada e recursos prontos para evolução.

## Funcionalidades principais

- Autenticação com JWT e refresh token
- Dashboard com resumo mensal
- Cadastro de despesas e receitas
- Organização por categorias
- Histórico de lançamentos
- Comparação entre meses
- Aba de insights financeiros
- OCR para leitura de comprovantes e notas
- Interface responsiva e visual moderna

## Stack tecnológica

### Frontend
- Angular
- TypeScript
- Reactive Forms
- Angular Router
- HttpClient

### Backend
- Node.js
- Express
- JWT
- bcrypt
- Helmet
- CORS
- Rate limiting
- Sanitização de entrada

### Banco e persistência
- Estrutura preparada para PostgreSQL
- Armazenamento local em memória para desenvolvimento e testes

## Arquitetura

O projeto foi organizado de forma modular, separando responsabilidades entre:

- Frontend: componentes, páginas, serviços e interceptors
- Backend: controllers, routes, services, middlewares, config e database
- Segurança: autenticação, tokens e validações
- OCR: camada preparada para integração com Tesseract e provedores de IA

## Estrutura do projeto

- backend/: API Node.js/Express
- frontend/: aplicação Angular
- backend/tests/: testes automatizados
- backend/services/: regras de negócio
- backend/controllers/: controle das rotas
- backend/routes/: definição das rotas
- backend/middlewares/: autenticação, segurança e tratamento de erros

## Requisitos

- Node.js 18+
- npm ou pnpm
- Navegador moderno

## Como rodar localmente

### 1. Backend

```bash
cd backend
npm install
node server.js
```

O backend ficará disponível em:
- http://localhost:3000

### 2. Frontend

```bash
cd frontend
npm install
npx ng serve --host 0.0.0.0 --port 4200
```

O frontend ficará disponível em:
- http://localhost:4200

## Variáveis de ambiente

Antes de iniciar, copie `backend/.env.example` para `backend/.env`. Preencha `JWT_SECRET` e `JWT_REFRESH_SECRET` com valores aleat?rios distintos de pelo menos 32 caracteres. Gere cada valor com `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Configure `DATABASE_URL` para usar PostgreSQL. Para Docker Compose, configure tamb?m os segredos JWT e `POSTGRES_PASSWORD` no `.env` da raiz. Nunca envie esses arquivos ao Git. N?o existe conta de demonstra??o autom?tica; cadastre sua conta na interface.

## Testes

```bash
cd backend
npm test
```

## Melhorias futuras

- Integração com PostgreSQL real
- Persistência definitiva de usuários e transações
- Migrações e seeds
- Dashboard com gráficos mais avançados
- Sincronização em nuvem
- Melhor integração com OCR por IA

## Status do projeto

Projeto em evolução, com interface funcional, fluxo de login e cadastro implementados, além de um painel financeiro completo para uso pessoal.

## Licença

Este projeto é destinado a fins educacionais e de demonstração.
