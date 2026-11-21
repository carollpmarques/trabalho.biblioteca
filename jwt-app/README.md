# jwt-app — Sistema de Biblioteca (front-end)

HTML + JavaScript puro (sem build). A API precisa estar rodando em `http://localhost:3000`.

## Como rodar
```bash
npx serve -l 5173 .
# ou use a extensão Live Server do VS Code (ajuste FRONT_URL no .env da API)
```
Abra `http://localhost:5173` e entre com o admin do seed (`admin@biblioteca.com` / `123456`).
Se a API estiver em outra URL, altere `API_URL` em `js/api.js`.

## Renovação automática do token (`js/api.js`)
- Toda chamada passa pela função `api()`, que envia `Authorization: Bearer <accessToken>`.
- Ao receber **401**, ela chama `POST /auth/refresh` **uma única vez** e repete a requisição original com o novo token.
- Se várias requisições derem 401 ao mesmo tempo, só sai **um** refresh: todas aguardam a mesma Promise (`refreshPromise`) e depois repetem.
- Se o refresh falhar, a sessão é limpa e o usuário volta para a tela de login.

## Onde os tokens ficam e os riscos
Os tokens ficam no `localStorage`. Risco: qualquer script rodando na página (ataque XSS) consegue ler e roubar os tokens. Mitigação aqui: todo texto vindo da API é escapado antes de ir para o HTML, o access token dura só 15 min e o refresh é rotacionado. A alternativa mais segura é o refresh em cookie `httpOnly` (desafio extra).

## Telas
Login · Dashboard (admin) · Empréstimos (novo, filtro por status, devolução com multa) · Livros (busca, filtros, categoria, vários autores, exemplares disponíveis) · Leitores (cadastro e histórico) · Categorias · Autores · Atendentes (admin: cadastro e ativar/desativar). Menus de admin são escondidos para atendentes, mas a API também bloqueia com 403.
