# Bugfix: lançamento não atualizava o dashboard

## Problema

Ao salvar um novo lançamento, o valor não estava sendo refletido corretamente no dashboard. O usuário conseguia salvar a transação, mas o painel continuava mostrando valores zerados ou desatualizados.

## Causa raiz

A falha estava relacionada ao fluxo de comunicação entre o frontend e o backend em ambiente de desenvolvimento. O frontend rodava em uma origem local diferente da API, e o backend estava bloqueando as requisições por CORS.

Isso fazia com que o cadastro do lançamento não chegasse corretamente ao backend, impedindo a atualização do dashboard.

## Como foi resolvido

Foram feitos os seguintes ajustes:

- Ajuste no middleware de segurança do backend para aceitar origens locais do Angular em desenvolvimento
- Validação do fluxo de CORS para permitir comunicação entre:
  - frontend: http://localhost:4200
  - backend: http://localhost:3000
- Adição de testes automatizados para garantir que o comportamento continue funcionando

## Arquivos impactados

- backend/middlewares/security.js
- backend/tests/security.test.js

## Verificação

A correção foi validada com:

```bash
cd backend
npm test
```

Resultado: todos os testes passaram, incluindo a validação do fluxo de CORS.

## Resultado final

Após a correção, ao cadastrar um lançamento o dashboard passou a refletir corretamente:

- saldo do mês
- total gasto
- total recebido
- economia
- últimos lançamentos
