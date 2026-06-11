# Integração FrontUrna ↔ API (Modulo-Urna)

Nada foi alterado na API. Toda a integração está no frontend.

## Como rodar

1. Suba a API (Spring Boot, porta 8080): `mvnw spring-boot:run` na pasta Modulo-Urna.
2. Na pasta do FrontUrna: `npm install` e `npm run dev`.
3. Se a API estiver em outro endereço, crie um `.env` com `VITE_API_URL=http://endereco:porta`.

O Vite faz proxy de `/api` para o backend (vite.config.js), o que resolve o CORS sem mexer na API.

## Fluxo da urna

1. **Início**: o front carrega a eleição com status "Eleição aberta" (`GET /api/eleicoes`), uma urna dela (`GET /api/urnas/eleicao/{id}`) e os candidatos (`GET /api/candidato`). Se a eleição estiver fechada, aparece um aviso vermelho no topo.
2. **Identificação**: o mesário digita o título (ou CPF) do eleitor cadastrado no sistema administrativo. O front busca em `GET /api/eleitores` e verifica em `GET /api/controle-votos/{id}` se ele já votou. Só libera quem ainda não votou — essa é a ponte com o check-in do administrativo.
3. **Votação**: 5 cargos. Ao completar o número, o front mostra nome e partido do candidato (busca por número + cargo). Número inexistente = VOTO NULO; botão branco = VOTO EM BRANCO (ambos enviados com `candidato: null`).
4. **Registro**: cada voto vai em `POST /api/votos?eleitorId={id}`. A apuração é atualizada pelo próprio backend.
5. **Fim**: o eleitor termina marcado como "já votou" (ControleVoto) e a urna volta para o próximo eleitor.

## Detalhe importante (workaround)

O backend cria o ControleVoto ("já votou") no **primeiro** `POST /votos`, mas a urna envia 5 votos (um por cargo). Para não alterar a API, o front chama `DELETE /api/controle-votos/{eleitorId}` entre os votos intermediários e deixa o controle ativo só após o último voto. Resultado: os 5 votos entram e o eleitor é contabilizado como votante uma única vez.

## Pré-requisitos de dados (cadastrar no administrativo)

- Eleição com status exatamente "Eleição aberta" e datas (início/fim) englobando o dia da apresentação.
- Pelo menos 1 urna vinculada à eleição.
- Cargos com os nomes: Deputado Federal, Deputado Estadual, Senador, Governador, Presidente (é assim que o front casa candidato ↔ etapa).
- Candidatos com número de dígitos compatível: Dep. Federal 4, Dep. Estadual 5, Senador 3, Governador 2, Presidente 2.
- Eleitores com título/CPF cadastrados.
- Para a apuração somar, deve existir registro de Apuracao por candidato/eleição (o backend só incrementa, não cria).
