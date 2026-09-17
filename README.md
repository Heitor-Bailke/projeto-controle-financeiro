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


