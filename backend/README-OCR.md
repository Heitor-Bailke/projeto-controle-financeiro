# OCR

## Visão geral

O módulo OCR processa uploads de imagens de notas e extrai valores, datas, horários, estabelecimento e categoria sugerida para confirmação do usuário antes do cadastro.

## Implementação

- O backend aceita uma imagem em base64.
- A camada de serviço usa Tesseract para reconhecimento de texto.
- Em caso de falha, a resposta retorna dados heurísticos para manter o fluxo operacional.

## Produção

Em produção, recomenda-se substituir a implementação por uma API especializada, como Google Vision ou Azure AI Vision, mantendo a lógica encapsulada no backend.
