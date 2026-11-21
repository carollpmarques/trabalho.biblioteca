# jwt-api — Sistema de Biblioteca (back-end)

Node.js 20+ · Express 5 · Sequelize · SQLite · JWT (access + refresh token)

## Como instalar
```bash
npm install
cp .envex .env        # Windows: copy .envex .env
npm start             # SERVIDOR RODANDO http://localhost:3000
```
Se vier de uma versão antiga, **apague o `database.sqlite`** (o esquema mudou). Ele está no `.gitignore`.

## Variáveis de ambiente (.envex)
| Variável | Para que serve |
|---|---|
| `JWT_SECRET` | assina o access token |
| `JWT_REFRESH_SECRET` | assina o refresh token |
| `PORT` | porta da API (3000) |
| `FRONT_URL` | origem liberada no CORS (porta do front) |
| `ACCESS_EXPIRES` | validade do access token (`15m`; use `30s` para gravar o vídeo) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | admin criado pelo seed |

## Usuário admin (seed)
Criado automaticamente ao iniciar, se não existir nenhum admin: `admin@biblioteca.com` / `123456`.

## Decisões tomadas
- **Estrutura:** cada recurso em sua pasta (`auth/`, `user/`, `category/`, `author/`, `book/`, `reader/`, `loan/`, `report/`), todos com router → controller → service → model. `models/index.js` carrega os models e define as associações. `common/` guarda a classe de erro HTTP e o tratador de erros.
- **Associações** em `models/index.js`: Category 1:N Book, Book N:N Author (`BookAuthor`), Reader/Book/User 1:N Loan, User 1:N RefreshToken.
- **Tokens:** access token de 15 min (payload `id, name, email, isAdmin`); refresh token de 7 dias salvo na tabela `RefreshTokens`. O refresh é **rotacionado** a cada uso; se um refresh já revogado for reutilizado, **todos** os refresh tokens do usuário são revogados (detecção de roubo).
- **Logout:** revoga o refresh token. A tabela `logout_list` foi **removida**: o access token vive só 15 min e o refresh é revogado no banco, então a blacklist não é mais necessária.
- **401 x 403:** token ausente/inválido/expirado → 401 (o front renova); atendente em rota de admin → 403.
- **Bug do login corrigido:** o usuário é verificado antes de comparar a senha.
- **Atendente desativado** não faz login nem renova o token. O access token já emitido continua valendo até expirar (no máximo 15 min).
- **Empréstimo/devolução** usam `db.transaction`. `ATRASADO` é calculado na leitura (`dueDate < hoje` e sem `returnDate`). Multa: R$ 1,00 por dia de atraso, gravada em `fine` na devolução.
- **Exclusões:** categoria com livros, autor com livros e livro com empréstimo ativo retornam **409**.
- `POST /v1/user` agora é restrito a administradores.

## Rotas
Todas exigem `Authorization: Bearer <accessToken>`, exceto login, refresh e logout. (A) = só admin.

| Método | Rota |
|---|---|
| POST | `/v1/auth/login`, `/v1/auth/refresh`, `/v1/auth/logout` |
| GET | `/v1/auth/me` |
| GET/POST (A) | `/v1/user` · PUT/PATCH (A) `/v1/user/:id` · PATCH (A) `/v1/user/:id/active` |
| GET · POST/PUT/DELETE (A) | `/v1/categories`, `/v1/authors`, `/v1/books` |
| GET | `/v1/books?title=&categoryId=&authorId=&available=true` |
| GET/POST/PUT | `/v1/readers` · GET `/v1/readers/:id/loans` |
| POST | `/v1/loans` `{ bookId, readerId }` |
| PATCH | `/v1/loans/:id/return` |
| GET | `/v1/loans?status=ATIVO\|ATRASADO\|DEVOLVIDO` |
| GET (A) | `/v1/reports/dashboard` |

A coleção do Postman/Insomnia está em `biblioteca.postman_collection.json` (importe nos dois).
